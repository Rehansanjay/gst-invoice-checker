import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
    const isProtected = protectedPaths.some(
        path => request.nextUrl.pathname.startsWith(path)
    )

    // No session + protected route → redirect to login
    if (isProtected && !session) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Has session + auth pages → redirect to dashboard
    if (session && (
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup'
    )) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/history/:path*', '/settings/:path*', '/report/:path*', '/login', '/signup']
}
