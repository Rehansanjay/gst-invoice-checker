import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate Limiting ─────────────────────────────────────────────────────
// Uses Upstash Redis in production (persists across cold starts).
// Falls back to in-memory if UPSTASH env vars not set (safe for local dev).
// ─────────────────────────────────────────────────────────────────────
let ratelimit: any = null

async function initRatelimit() {
    if (ratelimit) return ratelimit
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Ratelimit } = await import('@upstash/ratelimit')
        const { Redis } = await import('@upstash/redis')
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, '1 m'),
            analytics: true,
        })
    }
    return ratelimit
}

// In-memory fallback store (dev only — resets on cold start)
const _store = new Map<string, { count: number; resetAt: number }>()
function inMemoryCheck(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = _store.get(key)
    if (!entry || now > entry.resetAt) {
        _store.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }
    if (entry.count >= limit) return false
    entry.count++
    return true
}

// Routes to rate-limit and their limits
const RATE_LIMITED_ROUTES: Record<string, { limit: number; windowMs: number }> = {
    '/api/quick-check': { limit: 5, windowMs: 60_000 },
    '/api/payment': { limit: 5, windowMs: 60_000 },
    '/api/process-check': { limit: 10, windowMs: 60_000 },
    '/api/auth/login': { limit: 5, windowMs: 60_000 },       // brute-force protection
    '/api/auth/signup': { limit: 3, windowMs: 60_000 },      // spam account prevention
    '/api/validate': { limit: 5, windowMs: 60_000 },         // free check abuse
    '/api/preview-check': { limit: 10, windowMs: 60_000 },   // free preview abuse
    '/api/email-report': { limit: 3, windowMs: 60_000 },     // email bombing prevention
    '/api/emails/welcome': { limit: 3, windowMs: 60_000 },   // email bombing prevention
    '/api/upload': { limit: 5, windowMs: 60_000 },           // storage abuse
    '/api/ocr-extract': { limit: 5, windowMs: 60_000 },      // OCR API quota abuse
    '/api/download-report': { limit: 10, windowMs: 60_000 }, // resource abuse
}

// Next.js 16: renamed from `middleware` → `proxy`, file: proxy.ts
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── Rate Limiting ────────────────────────────────────────────────
    const routeConfig = RATE_LIMITED_ROUTES[pathname]
    if (routeConfig) {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1'

        const limiter = await initRatelimit()
        let allowed = true
        let retryAfter = 60

        if (limiter) {
            // Upstash Redis path (production)
            const { success, reset } = await limiter.limit(`${pathname}:${ip}`)
            allowed = success
            retryAfter = reset ? Math.ceil((reset - Date.now()) / 1000) : 60
        } else {
            // In-memory fallback (local dev)
            allowed = inMemoryCheck(`${pathname}:${ip}`, routeConfig.limit, routeConfig.windowMs)
        }

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(routeConfig.limit),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            )
        }
    }
    // ─────────────────────────────────────────────────────────────────

    const response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '' })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()

    const protectedPaths = ['/dashboard', '/history', '/settings', '/report']
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))

    // No session + protected route → redirect to login
    if (isProtected && !session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Has session + auth pages → redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/history/:path*',
        '/settings/:path*',
        '/report/:path*',
        '/login',
        '/signup',
        '/api/:path*',  // rate-limit ALL API routes
    ]
}
