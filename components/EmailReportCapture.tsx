'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Email capture for the free tools.
 *
 * Framed as delivery rather than a gate: the result is already on screen, and
 * this offers to send it. A practitioner who has just learned that 3 of their
 * 40 invoices will be rejected genuinely wants that list in their inbox to work
 * from, so asking here is useful rather than extractive — and it is the only
 * point at which an otherwise anonymous free user can choose to identify
 * themselves.
 */
export default function EmailReportCapture({
    source,
    summary,
    heading,
    subheading,
}: {
    source: 'bulk' | 'check';
    summary: unknown;
    heading?: string;
    subheading?: string;
}) {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSending(true);
        try {
            // Pass through attribution if the visitor arrived on a tagged link,
            // so we can tell which channel actually produces leads.
            const params = new URLSearchParams(window.location.search);

            const res = await fetch('/api/lead-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    email: email.trim(),
                    summary,
                    utm_source: params.get('utm_source') || undefined,
                    utm_campaign: params.get('utm_campaign') || undefined,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Could not send the email.');
                return;
            }
            setSent(true);
            toast.success('Sent — check your inbox.');
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                <p className="font-semibold text-emerald-900">Sent to {email}</p>
                <p className="text-sm text-emerald-800">
                    If it does not arrive in a couple of minutes, check your spam folder.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="mb-4 flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                <div>
                    <h3 className="font-bold text-slate-900">
                        {heading ?? 'Email me this report'}
                    </h3>
                    <p className="text-sm text-slate-600">
                        {subheading ?? 'Send the results to your inbox so you can work through them.'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
                <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.com"
                    className="flex-1"
                    aria-label="Email address"
                />
                <Button type="submit" disabled={sending} className="sm:w-40">
                    {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending</> : 'Send it'}
                </Button>
            </form>

            <p className="mt-3 text-xs text-slate-400">
                We use this to send the report and, occasionally, GST filing reminders.
                No spam, and you can unsubscribe from any email.
            </p>
        </div>
    );
}
