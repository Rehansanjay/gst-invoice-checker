'use client';

/**
 * Early-access sign-up for a product that is not built yet (see
 * lib/earlyAccess.ts). Asks two things beyond the email, both required: a
 * sizing question, and whether the stated price is worth it. The price
 * answer is the point; it is what decides whether to build.
 */

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { EARLY_ACCESS, PRICE_ANSWERS, type EarlyAccessProduct, type PriceAnswer } from '@/lib/earlyAccess';
import { track } from '@/lib/analytics';

const PRICE_LABELS: Record<PriceAnswer, string> = {
    yes: 'Yes',
    maybe: 'Maybe',
    no: 'No, too much',
};

function Choice({ name, options, labels, value, onChange }: {
    name: string;
    options: readonly string[];
    labels?: Record<string, string>;
    value: string | null;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
            {options.map((o) => (
                <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={value === o}
                    onClick={() => onChange(o)}
                    className="px-3.5 py-2 rounded-lg text-[14px] font-medium border transition-colors"
                    style={value === o
                        ? { background: 'var(--warm-charcoal)', color: 'var(--warm-cream)', borderColor: 'var(--warm-charcoal)' }
                        : { background: '#fff', color: 'var(--warm-charcoal)', borderColor: 'var(--warm-border)' }}
                >
                    {labels ? labels[o] : o}
                </button>
            ))}
        </div>
    );
}

export default function EarlyAccessForm({ product, from }: { product: EarlyAccessProduct; from: string }) {
    const config = EARLY_ACCESS[product];
    const [email, setEmail] = useState('');
    const [size, setSize] = useState<string | null>(null);
    const [wouldPay, setWouldPay] = useState<PriceAnswer | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!size || !wouldPay) {
            setError('Please answer both questions. They are how we decide whether to build this.');
            return;
        }
        setSending(true);
        try {
            const res = await fetch('/api/lead-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: product,
                    email: email.trim(),
                    summary: { size, wouldPay },
                    utm_source: from,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Could not sign you up. Please check the email and try again.');
                return;
            }
            track('early_access_signup', { product, size, would_pay: wouldPay, from });
            setDone(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (done) {
        return (
            <div className="flex gap-3 items-start p-5 rounded-xl" style={{ background: 'var(--warm-cream-dark)' }}>
                <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: 'var(--warm-success)' }} />
                <div>
                    <p className="font-semibold" style={{ color: 'var(--warm-text)' }}>You&apos;re on the list.</p>
                    <p className="text-[14px] mt-1" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        We&apos;ve emailed you a confirmation. Nothing is charged, and we&apos;ll ask before anything is.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <div>
                <p className="text-[14px] font-semibold mb-2" style={{ color: 'var(--warm-text)' }}>
                    {config.sizeQuestion}
                </p>
                <Choice name={config.sizeQuestion} options={config.sizeOptions} value={size} onChange={setSize} />
            </div>
            <div>
                <p className="text-[14px] font-semibold mb-2" style={{ color: 'var(--warm-text)' }}>
                    Would {config.priceLabel} be worth it to you?
                </p>
                <Choice
                    name="Would you pay"
                    options={PRICE_ANSWERS}
                    labels={PRICE_LABELS}
                    value={wouldPay}
                    onChange={(v) => setWouldPay(v as PriceAnswer)}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor={`${product}-email`} className="sr-only">Email</label>
                <input
                    id={`${product}-email`}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@business.com"
                    autoComplete="email"
                    className="flex-1 px-4 py-3 rounded-lg border text-[15px] outline-none focus:ring-2"
                    style={{ borderColor: 'var(--warm-border)', background: '#fff', color: 'var(--warm-text)' }}
                />
                <button type="submit" disabled={sending} className="btn-warm-primary px-5 py-3 text-[15px] inline-flex items-center justify-center gap-2">
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Get early access
                </button>
            </div>
            {error && <p className="text-[13.5px]" style={{ color: 'var(--warm-danger)' }}>{error}</p>}
            <p className="text-[12.5px]" style={{ color: 'var(--warm-text-secondary)' }}>
                Not built yet. Signing up costs nothing and commits you to nothing.
            </p>
        </form>
    );
}
