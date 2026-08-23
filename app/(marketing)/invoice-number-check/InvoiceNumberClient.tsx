'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, AlertTriangle } from 'lucide-react';
import {
    readInvoiceNumber,
    PROBLEM_DETAIL,
    MAX_INVOICE_NUMBER_LENGTH,
    type InvoiceNumberRead,
} from '@/lib/invoiceNumber';

/**
 * Checks as you type, entirely in the browser.
 *
 * No API call, because there is nothing to protect and nothing to measure that
 * is worth a round trip — the rule is a length and a character set. Someone
 * arriving from "check invoice number online" gets an answer before they have
 * finished reading the page, which is the whole point of the query.
 */
export default function InvoiceNumberClient() {
    const [value, setValue] = useState('');
    const result: InvoiceNumberRead | null = value ? readInvoiceNumber(value) : null;

    const overLimit = result ? result.length > MAX_INVOICE_NUMBER_LENGTH : false;

    return (
        <div className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}>
            <label htmlFor="invno" className="block text-sm font-semibold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                Paste an invoice number
            </label>
            <input
                id="invno"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="INV/2026-27/00412"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg px-4 py-3 text-lg outline-none font-mono"
                style={{
                    background: 'white',
                    border: `1.5px solid ${result ? (result.valid ? 'var(--warm-success)' : 'var(--warm-danger)') : 'var(--warm-border)'}`,
                    color: 'var(--warm-charcoal)',
                }}
            />

            <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--warm-text-secondary)' }}>
                <span>Letters, numbers, hyphen and slash only</span>
                <span
                    className="tabular-nums font-semibold"
                    style={{ color: overLimit ? 'var(--warm-danger)' : 'var(--warm-text-secondary)' }}
                >
                    {result ? result.length : 0} / {MAX_INVOICE_NUMBER_LENGTH}
                </span>
            </div>

            {result && (
                <div className="mt-5">
                    {result.valid ? (
                        <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: '#F2F9F5', border: '1px solid #C8E6D4' }}>
                            <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warm-success)' }} />
                            <div>
                                <p className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>
                                    Nothing wrong with the format
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                    It is within sixteen characters and uses only permitted characters.
                                    Rule 46(b) also requires the number to be <strong>consecutive</strong> and{' '}
                                    <strong>unique within the financial year</strong> — neither of which can be
                                    checked from a single number in isolation.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {result.problems.map((p) => (
                                <div
                                    key={p}
                                    className="flex items-start gap-3 rounded-xl p-4"
                                    style={{ background: '#FDF3F2', border: '1px solid #F0D4D0' }}
                                >
                                    <X className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warm-danger)' }} />
                                    <div>
                                        <p className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>
                                            {PROBLEM_DETAIL[p].title}
                                        </p>
                                        <p className="text-sm mt-1" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                            {PROBLEM_DETAIL[p].detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/*
                      The honest limit of a single-field checker, stated where
                      someone might otherwise walk away thinking the invoice is
                      clear. The number can be perfect and the invoice still be
                      rejected on tax head, HSN or arithmetic.
                    */}
                    <div className="mt-4 flex items-start gap-3 rounded-xl p-4" style={{ background: 'var(--warm-bg-alt)' }}>
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--warm-accent)' }} />
                        <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            This checks the number, and only the number. An invoice with a perfectly
                            formed number is still rejected for the wrong tax head, a short HSN code or
                            tax that does not reconcile.{' '}
                            <Link href="/check" className="font-semibold underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                                Run the whole invoice
                            </Link>{' '}
                            — free, no account.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
