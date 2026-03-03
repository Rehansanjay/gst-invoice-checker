import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 10 login attempts per IP per 15 minutes ──────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const rl = checkRateLimit(ip, '/api/auth/login', { limit: 10, windowMs: 15 * 60 * 1000 })
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            )
        }

        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password,
        })

        if (error) {
            console.error('Login error:', error.message)

            // Give user-friendly error messages
            if (error.message === 'Email not confirmed') {
                return NextResponse.json(
                    {
                        error: 'Please confirm your email first. Check your inbox for a confirmation link.',
                        code: 'EMAIL_NOT_CONFIRMED',
                    },
                    { status: 401 }
                )
            }

            if (error.message === 'Invalid login credentials') {
                return NextResponse.json(
                    { error: 'Incorrect email or password. Please try again.' },
                    { status: 401 }
                )
            }

            return NextResponse.json(
                { error: error.message },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
            },
        })

    } catch (error) {
        console.error('Login server error:', error)
        return NextResponse.json(
            { error: 'Login failed. Please try again.' },
            { status: 500 }
        )
    }
}
