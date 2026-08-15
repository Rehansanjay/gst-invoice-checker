import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { reminderForToday, formatDueDate, todayIST, type DeadlineWindow } from '@/lib/gstDeadlines';
import { unsubscribeUrl } from '@/lib/unsubscribe';

/**
 * Monthly GST filing reminder.
 *
 * Two changes from the original: the deadlines are derived from the calendar
 * instead of three hardcoded March 2026 dates (which have passed, leaving the
 * job permanently inert), and captured leads are included alongside registered
 * users — the whole point of collecting them.
 *
 * Every send carries a working one-click unsubscribe, and any lead who has
 * used it is excluded. Reminders were consented to at capture time: the form
 * states we send the report and occasional filing reminders.
 */

function getResend() { return new Resend(process.env.RESEND_API_KEY!); }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://invoicecheck.in';

function buildReminderEmail(email: string, w: DeadlineWindow, dueDate: string): string {
  const critical = w.urgency === 'critical';
  const accent = critical ? '#C44B3F' : '#B8860B';
  const unsub = unsubscribeUrl(email, APP_URL);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;line-height:1.6;color:#281E15;max-width:640px;margin:0 auto;padding:24px;">

  <div style="border-left:4px solid ${accent};background:#F5F0EA;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
    <h1 style="margin:0 0 4px;font-size:20px;color:${accent};">
      ${critical ? `${w.return} is due tomorrow` : `${w.return} is due in ${w.daysLeft} days`}
    </h1>
    <p style="margin:0;color:#52402F;">Due ${dueDate}</p>
  </div>

  <p style="color:#52402F;">
    Before you generate the return, it is worth checking the invoices going into it.
    A wrong tax head or a short HSN code is rejected on upload, and fixing it afterwards
    means an amendment next month rather than an edit today.
  </p>

  <p style="margin:24px 0;">
    <a href="${APP_URL}/bulk?utm_source=deadline-reminder&utm_campaign=${w.return.toLowerCase()}"
       style="display:inline-block;background:#9E542F;color:#FAF8F6;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
      Check your batch before filing
    </a>
  </p>

  <p style="color:#52402F;font-size:14px;">
    Upload a Tally, Zoho or GSTR-1 export and see which invoices will be rejected — free, up to 100 at a time.
  </p>

  <hr style="border:none;border-top:1px solid #E8E0D8;margin:32px 0 16px;">
  <p style="font-size:12px;color:#9E8A78;">
    You are receiving this because you used the free checker at InvoiceCheck.in.<br>
    <a href="${unsub}" style="color:#9E8A78;">Unsubscribe from filing reminders</a><br><br>
    General information about Indian GST, not tax advice. Confirm due dates on
    <a href="https://www.gst.gov.in/" style="color:#9E8A78;">gst.gov.in</a> or with your CA.
  </p>
</body></html>`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = todayIST();
  const window = reminderForToday(today);

  if (!window) {
    return NextResponse.json({
      message: `No reminder due today (${today.toISOString().split('T')[0]} IST). Reminders fire 3 days and 1 day before the 11th and the 20th.`,
      sent: 0,
    });
  }

  const dueDate = formatDueDate(today, window.dueDay);
  const supabase = getSupabase();
  const recipients = new Set<string>();

  // Registered, confirmed users.
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('email')
    .eq('email_confirmed', true);

  if (usersError) console.error('Failed to fetch profiles:', usersError.message);
  for (const u of users ?? []) if (u.email) recipients.add(String(u.email).toLowerCase());

  // Captured leads who have not unsubscribed. Tolerates the leads migration
  // not being applied yet — the job still serves registered users.
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('email')
    .is('unsubscribed_at', null);

  if (leadsError) {
    console.error('Failed to fetch leads (is the leads migration applied?):', leadsError.message);
  }
  for (const l of leads ?? []) if (l.email) recipients.add(String(l.email).toLowerCase());

  const list = [...recipients];
  if (list.length === 0) {
    return NextResponse.json({ message: 'No recipients', sent: 0, return: window.return });
  }

  let sent = 0;
  const errors: string[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < list.length; i += BATCH_SIZE) {
    const batch = list.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (email) => {
      try {
        await getResend().emails.send({
          from: 'InvoiceCheck.in <noreply@invoicecheck.in>',
          to: email,
          subject: window.urgency === 'critical'
            ? `${window.return} is due tomorrow — check your invoices first`
            : `${window.return} due in ${window.daysLeft} days — check your invoices first`,
          html: buildReminderEmail(email, window, dueDate),
          // Lets mail clients offer unsubscribe in their own UI, which keeps
          // us out of spam folders far better than a link in the footer alone.
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl(email, APP_URL)}>` },
        });
        sent++;
      } catch (err: unknown) {
        errors.push(`${email}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }));
    if (i + BATCH_SIZE < list.length) await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Deadline reminder (${window.return}, ${window.daysLeft}d) sent to ${sent}/${list.length}`);

  return NextResponse.json({
    return: window.return,
    dueDate,
    daysLeft: window.daysLeft,
    total: list.length,
    sent,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
