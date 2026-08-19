import type { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

export const metadata: Metadata = {
    title: 'Unsubscribe — InvoiceCheck.in',
    robots: { index: false, follow: false },
};

// Performs a write, so it must never be statically rendered or cached.
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ email?: string; token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
    const { email, token } = await searchParams;

    let state: 'ok' | 'invalid' | 'error' = 'invalid';

    if (email && token && verifyUnsubscribeToken(email, token)) {
        const address = email.trim().toLowerCase();
        try {
            const { error } = await supabaseAdmin
                .from('leads')
                .update({ unsubscribed_at: new Date().toISOString() })
                .eq('email', address);

            // A missing row is still success from the reader's point of view —
            // they asked not to be emailed and they will not be.
            state = error ? 'error' : 'ok';
            if (error) console.error('Unsubscribe update failed:', error.message);
        } catch (err) {
            console.error('Unsubscribe threw:', err);
            state = 'error';
        }
    }

    return (
        <div className="container mx-auto px-4 py-24">
            <div
                className="mx-auto max-w-lg rounded-2xl p-8 text-center"
                style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
            >
                {state === 'ok' && (
                    <>
                        <h1 className="mb-3 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            You&apos;re unsubscribed
                        </h1>
                        <p style={{ color: 'var(--warm-charcoal-soft)' }}>
                            We won&apos;t send filing reminders to <strong>{email}</strong> again. You can
                            still use the checker any time — nothing else changes.
                        </p>
                    </>
                )}

                {state === 'invalid' && (
                    <>
                        <h1 className="mb-3 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            This link isn&apos;t valid
                        </h1>
                        <p style={{ color: 'var(--warm-charcoal-soft)' }}>
                            It may have been altered or truncated by your email client. Forward the email
                            to <a href="mailto:mailtoinvoicecheck@gmail.com" className="underline">mailtoinvoicecheck@gmail.com</a>{' '}
                            and we&apos;ll remove you manually.
                        </p>
                    </>
                )}

                {state === 'error' && (
                    <>
                        <h1 className="mb-3 text-2xl font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            Something went wrong
                        </h1>
                        <p style={{ color: 'var(--warm-charcoal-soft)' }}>
                            We couldn&apos;t process that just now. Email{' '}
                            <a href="mailto:mailtoinvoicecheck@gmail.com" className="underline">mailtoinvoicecheck@gmail.com</a>{' '}
                            and we&apos;ll remove you by hand.
                        </p>
                    </>
                )}

                <Link
                    href="/"
                    className="mt-8 inline-block rounded-lg px-5 py-2.5 font-semibold"
                    style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                >
                    Back to InvoiceCheck.in
                </Link>
            </div>
        </div>
    );
}
