import { NextRequest, NextResponse } from 'next/server';
import { sendEmailReport } from '@/lib/emailService';
import { ValidationResult } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, result, checkId } = body as {
            email: string;
            result: ValidationResult;
            checkId: string;
        };

        if (!email || !result || !checkId) {
            return NextResponse.json({ error: 'Missing required fields: email, result, checkId' }, { status: 400 });
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // Security: Verify email ownership
        const supabase = await createSupabaseServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // Logged-in users can only send to their own email
            if (email !== session.user.email) {
                return NextResponse.json({ error: 'Can only send reports to your own email' }, { status: 403 });
            }
        } else {
            // Guest: verify email matches the check's guest_email
            const { data: check } = await supabaseAdmin
                .from('checks')
                .select('guest_email')
                .eq('id', checkId)
                .maybeSingle();

            if (!check || check.guest_email !== email) {
                return NextResponse.json({ error: 'Unauthorized email recipient' }, { status: 403 });
            }
        }

        await sendEmailReport(email, result, checkId);

        return NextResponse.json({ success: true, message: `Report sent to ${email}` });

    } catch (error: any) {
        console.error('Email report error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
