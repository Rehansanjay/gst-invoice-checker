import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
    try {
        // ── Rate Limit: 5 signups per IP per hour ────────────────────
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'
        const rl = checkRateLimit(ip, '/api/auth/signup', { limit: 5, windowMs: 60 * 60 * 1000 })
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many signup attempts. Please try again later.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            )
        }

        const { email, password, fullName } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
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

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    full_name: fullName || '',
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
            },
        })

        if (error) {
            console.error('Signup error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
            // Email confirmation is ON - user needs to check email
            return NextResponse.json({
                success: true,
                requiresConfirmation: true,
                message: 'Please check your email to confirm your account',
            })
        }

        // Email confirmation is OFF - user is signed in immediately
        return NextResponse.json({
            success: true,
            requiresConfirmation: false,
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
        })

    } catch (error) {
        console.error('Signup server error:', error)
        return NextResponse.json(
            { error: 'Signup failed. Please try again.' },
            { status: 500 }
        )
    }
}
