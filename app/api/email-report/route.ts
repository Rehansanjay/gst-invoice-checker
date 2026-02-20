import { NextRequest, NextResponse } from 'next/server';
import { sendEmailReport } from '@/lib/emailService';
import { ValidationResult } from '@/types';

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

        await sendEmailReport(email, result, checkId);

        return NextResponse.json({ success: true, message: `Report sent to ${email}` });

    } catch (error: any) {
        console.error('Email report error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
