import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'GST Invoice Checker <noreply@invoicecheck.in>', // Update with verified domain
            to: [email],
            subject: 'Welcome to InvoiceCheck.in! 🚀',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #2563EB;">Welcome to InvoiceCheck!</h1>
                    <p>Hi ${name || 'there'},</p>
                    <p>Thanks for signing up. You're now ready to start validating GST invoices and preventing costly errors.</p>
                    
                    <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Getting Started</h3>
                        <ol>
                            <li>Go to your <strong>Dashboard</strong></li>
                            <li>Click "Buy More Checks" to get credits</li>
                            <li>Upload your first invoice</li>
                        </ol>
                    </div>

                    <p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                           style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                           Go to Dashboard
                        </a>
                    </p>
                    
                    <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                        Need help? Reply to this email or contact support.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Welcome email failed:', error);
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Welcome email error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
