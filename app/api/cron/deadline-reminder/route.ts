import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Deadline dates for GSTR-3B (March 2026 filing season)
const DEADLINES = [
    { date: '2026-03-15', label: '5 days left', daysLeft: 5, urgency: 'moderate' as const },
    { date: '2026-03-18', label: '2 days left', daysLeft: 2, urgency: 'high' as const },
    { date: '2026-03-19', label: 'TOMORROW', daysLeft: 1, urgency: 'critical' as const },
];

function getTodayIST(): string {
    // IST = UTC+5:30
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    return ist.toISOString().split('T')[0];
}

function buildReminderEmail(email: string, daysLeft: number, urgency: 'moderate' | 'high' | 'critical'): string {
    const urgencyConfig = {
        moderate: { emoji: '📅', color: '#f59e0b', bg: '#fffbeb', label: 'Filing Deadline Coming Up' },
        high: { emoji: '⚠️', color: '#f97316', bg: '#fff7ed', label: 'GSTR-3B Due in 2 Days' },
        critical: { emoji: '🔴', color: '#ef4444', bg: '#fef2f2', label: 'GSTR-3B Due TOMORROW!' },
    };
    const cfg = urgencyConfig[urgency];

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; background: #f9fafb; }
    .container { background: white; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1e40af; padding: 28px 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; }
    .header p { color: #bfdbfe; margin: 6px 0 0; font-size: 14px; }
    .urgency-banner { background: ${cfg.bg}; border-left: 4px solid ${cfg.color}; padding: 16px 24px; margin: 0; }
    .urgency-banner h2 { color: ${cfg.color}; margin: 0 0 4px; font-size: 20px; }
    .urgency-banner p { color: #374151; margin: 0; }
    .body { padding: 28px 32px; }
    .deadline-box { background: #f1f5f9; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .deadline-box .date { font-size: 28px; font-weight: 800; color: ${cfg.color}; }
    .deadline-box .label { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .checklist { background: #f9fafb; border-radius: 8px; padding: 16px 24px; margin: 20px 0; }
    .checklist h3 { margin: 0 0 12px; font-size: 15px; color: #374151; }
    .checklist li { margin: 8px 0; font-size: 14px; color: #374151; }
    .button { display: block; width: fit-content; margin: 0 auto; padding: 14px 32px; background: #1e40af; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
    .footer { text-align: center; padding: 20px 32px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }
    .footer a { color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ InvoiceCheck.in</h1>
      <p>GST Invoice Validation</p>
    </div>

    <div class="urgency-banner">
      <h2>${cfg.emoji} ${cfg.label}</h2>
      <p>GSTR-3B filing deadline: <strong>March 20, 2026</strong> — ${daysLeft === 1 ? 'that\'s tomorrow' : `${daysLeft} days from today`}.</p>
    </div>

    <div class="body">
      <p>Hi there,</p>
      <p>
        The GSTR-3B filing deadline for February 2026 is <strong>March 20, 2026</strong>.
        ${urgency === 'critical'
            ? 'This is your last chance to validate invoices before the deadline.'
            : 'Make sure your invoices are validated before you file.'}
      </p>

      <div class="deadline-box">
        <div class="date">March 20, 2026</div>
        <div class="label">GSTR-3B Due Date — ${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining</div>
      </div>

      <div class="checklist">
        <h3>📋 Pre-filing checklist:</h3>
        <ul>
          <li>✅ Verify all invoice GSTINs are valid and match GSTN records</li>
          <li>✅ Confirm correct tax type: IGST (inter-state) vs CGST+SGST (intra-state)</li>
          <li>✅ Check HSN/SAC codes are present and correctly categorised</li>
          <li>✅ Validate ITC claims against GSTR-2B auto-populated data</li>
          <li>✅ Confirm Place of Supply matches the billing address</li>
        </ul>
      </div>

      <p style="text-align:center; margin: 24px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/check" class="button">
          Validate My Invoices Now →
        </a>
      </p>

      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        A single wrong tax type or missing HSN code can attract <strong>₹10,000+ in penalties</strong>
        under Section 73/122 of the CGST Act 2017.
      </p>
    </div>

    <div class="footer">
      <p>
        You're receiving this because you have an InvoiceCheck.in account.<br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Unsubscribe from reminders</a> · 
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy">Privacy Policy</a>
      </p>
      <p>© ${new Date().getFullYear()} InvoiceCheck.in · Not professional tax advice</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
    // Security: Verify this is called by Vercel Cron (or with our secret in dev)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = getTodayIST();
    const deadline = DEADLINES.find(d => d.date === today);

    if (!deadline) {
        return NextResponse.json({
            message: `No reminder scheduled for today (${today}). Scheduled dates: ${DEADLINES.map(d => d.date).join(', ')}`,
            sent: 0,
        });
    }

    // Fetch all verified registered users
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('email_confirmed', true);

    if (usersError) {
        console.error('Failed to fetch users:', usersError);
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
        return NextResponse.json({ message: 'No users to notify', sent: 0 });
    }

    // Send reminders in batches of 10 (Resend rate limit safe)
    let sent = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        await Promise.all(
            batch.map(async (user) => {
                try {
                    await resend.emails.send({
                        from: 'InvoiceCheck.in <reminders@invoicecheck.in>',
                        to: user.email,
                        subject: `${deadline.daysLeft === 1 ? '🔴 TOMORROW' : `⚠️ ${deadline.daysLeft} days left`} — GSTR-3B filing deadline`,
                        html: buildReminderEmail(user.email, deadline.daysLeft, deadline.urgency),
                    });
                    sent++;
                } catch (err: any) {
                    errors.push(`${user.email}: ${err.message}`);
                }
            })
        );
        // Small delay between batches to stay within rate limits
        if (i + BATCH_SIZE < users.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`Deadline reminder sent to ${sent}/${users.length} users for ${today}`);

    return NextResponse.json({
        date: today,
        deadline: deadline.label,
        daysLeft: deadline.daysLeft,
        total: users.length,
        sent,
        errors: errors.length > 0 ? errors : undefined,
    });
}
