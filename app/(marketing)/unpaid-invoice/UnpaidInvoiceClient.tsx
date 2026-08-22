'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Info, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

/**
 * The four-field calculator.
 *
 * Deliberately not a CSV upload. The parser from /bulk exists and reusing it
 * was tempting, but someone chasing one late client has an invoice and a date,
 * not a purchase register — asking for a file loses them at the door.
 *
 * COPY RULE FOR THIS FILE
 *
 * Every string states a fact or a computation. None states a legal position.
 * "Interest computed to date" is a fact; "you are entitled to" is advice, and
 * advice is reserved to enrolled advocates under s.29 of the Advocates Act.
 * The distinction is not decorative — it is why this page can exist.
 */

interface Rest {
    periodStart: string;
    periodEnd: string;
    days: number;
    fullMonth: boolean;
    ratePercent: string;
    opening: string;
    interest: string;
    closing: string;
}

interface Success {
    ok: true;
    interestStartsOn: string;
    computedTo: string;
    daysOverdue: number;
    principal: string;
    interest: string;
    total: string;
    monthlyAccrual: string;
    schedule: Rest[];
    notes: string[];
    udyam: { normalised: string; wellFormed: boolean; stateName: string | null };
    rate: {
        bankRatePercent: string | null;
        statutoryPercent: string | null;
        sourceUrl: string | null;
        checkedOn: string | null;
        stale: boolean;
    };
    maxAgreedDays: number;
}

type Outcome = Success | { ok: false; reason: string };

const NOTE_TEXT: Record<string, string> = {
    EMPTY: 'You did not enter a Udyam number. The MSMED Act delayed-payment provisions run to registered micro and small enterprises, so registration affects what the figures below mean for you.',
    MALFORMED: 'The number entered does not match the Udyam format UDYAM-XX-00-0000000. Worth checking against your registration certificate.',
    UNRECOGNISED_STATE: 'We do not recognise the state code in that number. It may be a typo, or our list may be incomplete — the number is otherwise correctly formatted.',
};

export default function UnpaidInvoiceClient() {
    const [amount, setAmount] = useState('');
    const [acceptanceDate, setAcceptanceDate] = useState('');
    const [writtenAgreement, setWrittenAgreement] = useState(false);
    const [agreedDays, setAgreedDays] = useState('45');
    const [udyam, setUdyam] = useState('');
    const [stillUnpaid, setStillUnpaid] = useState(true);
    const [paidOn, setPaidOn] = useState('');
    const [busy, setBusy] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [showSchedule, setShowSchedule] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rupees = Number(amount);
        if (!Number.isFinite(rupees) || rupees <= 0) {
            toast.error('Enter the invoice amount in rupees.');
            return;
        }
        if (!acceptanceDate) {
            toast.error('Enter the date the work was accepted.');
            return;
        }

        setBusy(true);
        setOutcome(null);
        try {
            const res = await fetch('/api/unpaid-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountRupees: rupees,
                    acceptanceDate,
                    writtenAgreement,
                    agreedDays: writtenAgreement ? Number(agreedDays) : undefined,
                    paidOn: stillUnpaid ? null : (paidOn || null),
                    udyam: udyam || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not compute that.');
                return;
            }
            setOutcome(data);
            setShowSchedule(false);
        } catch {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const label = 'block text-sm font-semibold mb-1.5';
    const field = 'w-full rounded-lg px-3.5 py-2.5 text-base outline-none transition';
    const fieldStyle = {
        background: 'var(--warm-cream)',
        border: '1.5px solid var(--warm-border)',
        color: 'var(--warm-charcoal)',
    };

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            {/* ── Form ───────────────────────────────────────────────── */}
            <form
                onSubmit={submit}
                className="rounded-xl p-6 h-fit"
                style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}
            >
                <div className="space-y-5">
                    <div>
                        <label htmlFor="amount" className={label} style={{ color: 'var(--warm-charcoal)' }}>
                            Invoice amount
                        </label>
                        <div className="relative">
                            <span
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base"
                                style={{ color: 'var(--warm-text-secondary)' }}
                            >
                                ₹
                            </span>
                            <input
                                id="amount" type="number" inputMode="decimal" min="1" step="0.01"
                                value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder="300000" required
                                className={`${field} pl-8`} style={fieldStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="accepted" className={label} style={{ color: 'var(--warm-charcoal)' }}>
                            Date the work was accepted
                        </label>
                        <input
                            id="accepted" type="date" value={acceptanceDate}
                            onChange={(e) => setAcceptanceDate(e.target.value)} required
                            className={field} style={fieldStyle}
                        />
                        <p className="mt-1.5 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                            When the goods or services were accepted or deemed accepted — not the invoice date, if they differ.
                        </p>
                    </div>

                    <div>
                        <span className={label} style={{ color: 'var(--warm-charcoal)' }}>
                            Is there a written agreement on payment terms?
                        </span>
                        <div className="flex gap-2">
                            {[
                                { v: false, t: 'No' },
                                { v: true, t: 'Yes' },
                            ].map(({ v, t }) => (
                                <button
                                    key={t} type="button" onClick={() => setWrittenAgreement(v)}
                                    className="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition"
                                    style={{
                                        background: writtenAgreement === v ? 'var(--warm-accent)' : 'var(--warm-cream)',
                                        color: writtenAgreement === v ? '#FAF8F6' : 'var(--warm-charcoal)',
                                        border: '1.5px solid ' + (writtenAgreement === v ? 'var(--warm-accent)' : 'var(--warm-border)'),
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {writtenAgreement ? (
                            <div className="mt-3">
                                <label htmlFor="agreed" className="block text-xs font-medium mb-1" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                    Days allowed by the agreement
                                </label>
                                <input
                                    id="agreed" type="number" min="0" max="365" value={agreedDays}
                                    onChange={(e) => setAgreedDays(e.target.value)}
                                    className={field} style={fieldStyle}
                                />
                                <p className="mt-1.5 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                                    Section 15 caps this at 45 days. A longer agreed period is read down to 45.
                                </p>
                            </div>
                        ) : (
                            <p className="mt-1.5 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                                Without a written agreement the period is 15 days from acceptance.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="udyam" className={label} style={{ color: 'var(--warm-charcoal)' }}>
                            Your Udyam number <span className="font-normal" style={{ color: 'var(--warm-text-secondary)' }}>— optional</span>
                        </label>
                        <input
                            id="udyam" type="text" value={udyam}
                            onChange={(e) => setUdyam(e.target.value)}
                            placeholder="UDYAM-KA-03-0001234"
                            className={field} style={fieldStyle}
                        />
                        <p className="mt-1.5 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                            Checked for format only. We do not verify it against the Udyam portal.
                        </p>
                    </div>

                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setStillUnpaid(!stillUnpaid)}
                            className="text-xs underline underline-offset-2"
                            style={{ color: 'var(--warm-accent)' }}
                        >
                            {stillUnpaid ? 'It has since been paid' : 'It is still unpaid'}
                        </button>
                        {!stillUnpaid && (
                            <input
                                type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)}
                                className={`${field} mt-2`} style={fieldStyle}
                                aria-label="Date paid"
                            />
                        )}
                    </div>

                    <Button type="submit" disabled={busy} className="w-full btn-warm-primary">
                        {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Computing</> : 'Compute the interest'}
                    </Button>
                </div>
            </form>

            {/* ── Result ─────────────────────────────────────────────── */}
            {/*
              min-w-0 is load-bearing. A grid item defaults to min-width:auto,
              so it refuses to shrink below its widest content — and the
              schedule table carries a 520px min-width. Without this the table
              pushed the whole grid to 690px on a 375px screen, dragging the
              form off-screen with it. The table scrolls in its own box; the
              page must not.
            */}
            <div className="min-w-0">
                {!outcome && (
                    <div
                        className="rounded-xl p-8 text-center h-full flex flex-col justify-center"
                        style={{ background: 'var(--warm-cream)', border: '1px dashed var(--warm-border)' }}
                    >
                        <p style={{ color: 'var(--warm-text-secondary)' }}>
                            Enter the invoice details and the computation appears here — the interest accrued
                            under section 16, month by month, and what it is adding each month.
                        </p>
                    </div>
                )}

                {outcome && !outcome.ok && (
                    <div className="rounded-xl p-6" style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}>
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warm-accent)' }} />
                            <div>
                                <h2 className="font-bold mb-1" style={{ color: 'var(--warm-charcoal)' }}>Not computed</h2>
                                <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>{outcome.reason}</p>
                            </div>
                        </div>
                    </div>
                )}

                {outcome && outcome.ok && (
                    <div className="space-y-4">
                        <div className="rounded-xl p-6" style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}>
                            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--warm-accent)' }}>
                                Computed to {outcome.computedTo}
                            </p>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <div className="text-xs mb-1" style={{ color: 'var(--warm-text-secondary)' }}>Invoice amount</div>
                                    <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--warm-charcoal)' }}>₹{outcome.principal}</div>
                                </div>
                                <div>
                                    <div className="text-xs mb-1" style={{ color: 'var(--warm-text-secondary)' }}>Interest accrued</div>
                                    <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--warm-accent)' }}>₹{outcome.interest}</div>
                                </div>
                                <div>
                                    <div className="text-xs mb-1" style={{ color: 'var(--warm-text-secondary)' }}>Total</div>
                                    <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--warm-charcoal)' }}>₹{outcome.total}</div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ borderTop: '1px solid var(--warm-border)', color: 'var(--warm-charcoal-soft)' }}>
                                <span>Interest runs from <strong>{outcome.interestStartsOn}</strong></span>
                                <span><strong>{outcome.daysOverdue}</strong> days</span>
                                {outcome.rate.statutoryPercent && (
                                    <span>At <strong>{outcome.rate.statutoryPercent}%</strong> — three times the Bank Rate of {outcome.rate.bankRatePercent}%</span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl p-5 flex items-start gap-3" style={{ background: 'var(--warm-bg-alt)', border: '1px solid var(--warm-border)' }}>
                            <TrendingUp className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warm-accent)' }} />
                            <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                At the current balance and rate, this adds about{' '}
                                <strong style={{ color: 'var(--warm-charcoal)' }}>₹{outcome.monthlyAccrual}</strong> a month,
                                compounding with monthly rests.
                            </p>
                        </div>

                        {outcome.notes.length > 0 && (
                            <div className="rounded-xl p-5" style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}>
                                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--warm-text-secondary)' }}>
                                    Worth checking
                                </h3>
                                <ul className="space-y-2">
                                    {outcome.notes.map((n) => (
                                        <li key={n} className="text-sm flex gap-2" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                            <span style={{ color: 'var(--warm-accent)' }}>•</span>
                                            {NOTE_TEXT[n] ?? n}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--warm-border)' }}>
                            <button
                                type="button"
                                onClick={() => setShowSchedule(!showSchedule)}
                                className="w-full px-5 py-3 text-left text-sm font-semibold flex justify-between items-center"
                                style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal)' }}
                                aria-expanded={showSchedule}
                            >
                                Month-by-month computation ({outcome.schedule.length} {outcome.schedule.length === 1 ? 'period' : 'periods'})
                                <span style={{ color: 'var(--warm-accent)' }}>{showSchedule ? 'Hide' : 'Show'}</span>
                            </button>
                            {showSchedule && (
                                <div className="overflow-x-auto" style={{ background: 'var(--warm-cream)' }}>
                                    <table className="w-full text-sm" style={{ minWidth: '520px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--warm-border)' }}>
                                                {['Period', 'Days', 'Rate', 'Opening', 'Interest', 'Closing'].map((h) => (
                                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                                                        style={{ color: 'var(--warm-text-secondary)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {outcome.schedule.map((s) => (
                                                <tr key={s.periodStart} style={{ borderBottom: '1px solid var(--warm-border-light)' }}>
                                                    <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--warm-charcoal)' }}>
                                                        {s.periodStart} → {s.periodEnd}
                                                        {!s.fullMonth && (
                                                            <span className="ml-1.5 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>part</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--warm-charcoal-soft)' }}>{s.days}</td>
                                                    <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--warm-charcoal-soft)' }}>{s.ratePercent}%</td>
                                                    <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--warm-charcoal-soft)' }}>₹{s.opening}</td>
                                                    <td className="px-4 py-2.5 tabular-nums font-medium" style={{ color: 'var(--warm-accent)' }}>₹{s.interest}</td>
                                                    <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--warm-charcoal)' }}>₹{s.closing}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="px-4 py-3 text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                                        A part period at the end is charged pro-rata rather than compounded. Rounded to
                                        whole paise at each monthly rest, because the interest capitalises.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="text-xs space-y-2" style={{ color: 'var(--warm-text-secondary)' }}>
                            {outcome.rate.sourceUrl && (
                                <p>
                                    Bank Rate {outcome.rate.bankRatePercent}% taken from the{' '}
                                    <a href={outcome.rate.sourceUrl} target="_blank" rel="noopener noreferrer"
                                        className="underline underline-offset-2 inline-flex items-center gap-0.5"
                                        style={{ color: 'var(--warm-accent)' }}>
                                        Reserve Bank of India <ExternalLink className="h-3 w-3" />
                                    </a>
                                    , checked on {outcome.rate.checkedOn}.
                                    {outcome.rate.stale && ' This has not been re-checked recently and the rate may have moved.'}
                                </p>
                            )}
                            <p>
                                This is a computation, not advice on your legal position. What you do next is
                                for you to decide, taking your own advice if you need it. Where a reference is
                                made to the Facilitation Council, it is filed at{' '}
                                <a href="https://odr.msme.gov.in" target="_blank" rel="noopener noreferrer"
                                    className="underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                                    odr.msme.gov.in
                                </a>{' '}
                                — the MSME Samadhaan portal stopped accepting new filings on 15 October 2025.
                            </p>
                            <p>
                                Checking GST invoices instead? <Link href="/bulk" className="underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>Run a batch through the compliance check</Link>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
