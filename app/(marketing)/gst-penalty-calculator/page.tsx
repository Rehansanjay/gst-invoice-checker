'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calculator, Share2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function GstPenaltyCalculator() {
    const [taxLiability, setTaxLiability] = useState('');
    const [delayDays, setDelayDays] = useState('');
    const [violationType, setViolationType] = useState('late_filing');
    const [result, setResult] = useState<null | {
        interest: number;
        penalty: number;
        total: number;
        lawRef: string;
        note: string;
    }>(null);

    const calculate = () => {
        const tax = parseFloat(taxLiability) || 0;
        const days = parseInt(delayDays) || 0;

        if (tax <= 0) return;

        let interest = 0;
        let penalty = 0;
        let lawRef = '';
        let note = '';

        if (violationType === 'late_filing') {
            // Section 50: 18% p.a. interest on unpaid tax
            interest = (tax * 0.18 * days) / 365;
            // Section 47: Late fee ₹50/day (₹25 CGST + ₹25 SGST), max ₹5,000
            penalty = Math.min(50 * days, 5000);
            lawRef = 'Section 50 (Interest) + Section 47 (Late Fee) of CGST Act 2017';
            note = 'Interest is charged at 18% per annum on unpaid tax from the due date. Late fee is ₹50/day (₹25 CGST + ₹25 SGST), capped at ₹5,000.';
        } else if (violationType === 'wrong_tax_type') {
            // Section 73: Penalty for short payment (not fraud) = 10% of tax, min ₹10,000
            penalty = Math.max(tax * 0.10, 10000);
            interest = (tax * 0.18 * Math.max(days, 90)) / 365;
            lawRef = 'Section 73 of CGST Act 2017 — Tax not paid / short paid (non-fraud)';
            note = 'Wrong tax type (e.g. IGST instead of CGST+SGST) results in short payment. Penalty is 10% of tax due, minimum ₹10,000. Interest from the original due date.';
        } else if (violationType === 'missing_hsn') {
            // Rule 86B / Notification: Penalty for wrong invoice = ₹10,000 per invoice or tax evaded
            penalty = Math.max(10000, tax * 0.10);
            interest = 0;
            lawRef = 'Section 122 of CGST Act — Penalty for issuing incorrect invoice';
            note = 'Missing or incorrect HSN code on invoice can attract penalty under Section 122. Minimum ₹10,000 or 10% of tax, whichever is higher.';
        } else if (violationType === 'itc_mismatch') {
            // Section 16(2): ITC reversal + 18% interest
            penalty = tax; // full ITC reversal
            interest = (tax * 0.18 * days) / 365;
            lawRef = 'Section 16(2) + Section 17(5) of CGST Act — Ineligible ITC reversal';
            note = 'Incorrectly claimed ITC must be reversed with 18% interest. This is one of the most common audit triggers.';
        }

        setResult({ interest, penalty, total: interest + penalty, lawRef, note });
    };

    const shareOnWhatsApp = () => {
        if (!result) return;
        const text = encodeURIComponent(
            `⚠️ GST Penalty Estimate\n` +
            `Tax Liability: ₹${Number(taxLiability).toLocaleString('en-IN')}\n` +
            `Delay: ${delayDays} days\n` +
            `Interest: ₹${result.interest.toFixed(2)}\n` +
            `Penalty/Late Fee: ₹${result.penalty.toFixed(2)}\n` +
            `Total Exposure: ₹${result.total.toFixed(2)}\n\n` +
            `Calculated at InvoiceCheck.in — Prevent this by validating your invoice before filing.`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const violationTypes = [
        { value: 'late_filing', label: 'Late GST Filing' },
        { value: 'wrong_tax_type', label: 'Wrong Tax Type (IGST vs CGST/SGST)' },
        { value: 'missing_hsn', label: 'Missing / Incorrect HSN Code' },
        { value: 'itc_mismatch', label: 'Incorrect ITC Claim' },
    ];

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">
            {/* SEO Hero */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    Free Tool — No Signup Required
                </div>
                <h1 className="text-4xl font-bold mb-4">GST Penalty Calculator</h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Estimate your GST interest and penalty exposure under Sections 47, 50, 73, and 122 of the CGST Act 2017.
                    Free, instant, no login needed.
                </p>
            </div>

            {/* Calculator */}
            <Card className="p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Calculate Your Exposure
                </h2>

                <div className="space-y-5">
                    {/* Violation Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Type of Violation</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {violationTypes.map((v) => (
                                <button
                                    key={v.value}
                                    onClick={() => { setViolationType(v.value); setResult(null); }}
                                    className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${violationType === v.value
                                            ? 'border-primary bg-primary/10 text-primary font-medium'
                                            : 'border-input hover:border-primary/50 text-muted-foreground'
                                        }`}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tax Liability */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tax Liability / ITC Amount (₹)
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g. 50000"
                            value={taxLiability}
                            onChange={(e) => { setTaxLiability(e.target.value); setResult(null); }}
                        />
                    </div>

                    {/* Delay Days */}
                    {violationType !== 'missing_hsn' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Delay in Days {violationType === 'itc_mismatch' ? '(since ITC claimed)' : '(from due date)'}
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g. 30"
                                value={delayDays}
                                onChange={(e) => { setDelayDays(e.target.value); setResult(null); }}
                            />
                        </div>
                    )}

                    <Button onClick={calculate} className="w-full" size="lg">
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Penalty
                    </Button>
                </div>
            </Card>

            {/* Result */}
            {result && (
                <Card className="p-6 border-red-200 bg-red-50/40 mb-6 animate-in fade-in duration-300">
                    <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Estimated Penalty Exposure</h3>

                    <div className="space-y-3 mb-5">
                        {result.interest > 0 && (
                            <div className="flex justify-between items-center py-2 border-b border-red-100">
                                <span className="text-sm text-red-700">Interest (Section 50 @ 18% p.a.)</span>
                                <span className="font-bold text-red-800">₹{result.interest.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-red-100">
                            <span className="text-sm text-red-700">
                                {violationType === 'late_filing' ? 'Late Fee (Section 47)' : 'Penalty'}
                            </span>
                            <span className="font-bold text-red-800">₹{result.penalty.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-red-100 rounded-lg px-3">
                            <span className="font-bold text-red-900">Total Exposure</span>
                            <span className="text-2xl font-black text-red-900">₹{result.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-white border border-red-100 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-1">📖 Law Reference</p>
                        <p className="text-xs text-slate-500">{result.lawRef}</p>
                        <p className="text-xs text-slate-500 mt-1">{result.note}</p>
                    </div>

                    <Button variant="outline" onClick={shareOnWhatsApp} className="w-full border-red-200 text-red-700 hover:bg-red-50 mb-2">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share with my CA on WhatsApp
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        This is an estimate based on standard rates. Actual liability may vary. Consult a CA for final assessment.
                    </p>
                </Card>
            )}

            {/* CTA to main product */}
            <Card className="p-6 border-green-200 bg-green-50/40">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-green-900 mb-1">Prevent This Entirely — ₹99/check</h3>
                        <p className="text-sm text-green-800 mb-4">
                            Catch wrong tax types, invalid HSN codes, and calculation errors <strong>before</strong> you file.
                            Our 15-rule GST validation engine checks every invoice against the CGST Act — in under 30 seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/check">
                                <Button className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Check My Invoice Now — ₹99
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline" className="border-green-300 text-green-800 w-full sm:w-auto">
                                    View Bulk Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Common Questions — SEO content */}
            <div className="mt-12 space-y-6">
                <h2 className="text-2xl font-bold">Common GST Penalty Questions</h2>

                {[
                    {
                        q: 'What is the GST late filing penalty in India?',
                        a: 'Under Section 47 of CGST Act, the late fee is ₹50/day (₹25 CGST + ₹25 SGST), subject to a maximum of ₹5,000. Additionally, Section 50 charges 18% per annum interest on unpaid tax from the due date.',
                    },
                    {
                        q: 'What happens if I use IGST instead of CGST+SGST?',
                        a: 'Using the wrong tax type is treated as short payment. Under Section 73, this attracts a penalty of 10% of the tax amount (minimum ₹10,000) plus 18% interest. The buyer also cannot claim ITC correctly, causing reconciliation issues in GSTR-2B.',
                    },
                    {
                        q: 'Is HSN code mandatory on GST invoices?',
                        a: 'Yes. As per Notification 78/2020-CT, HSN codes are mandatory: 4-digit for turnover up to ₹5 Cr, 6-digit for above ₹5 Cr, effective from April 1, 2021. Missing HSN can attract penalty under Section 122.',
                    },
                    {
                        q: 'What is Section 73 penalty vs Section 74?',
                        a: 'Section 73 applies to genuine errors (non-fraud): 10% of tax or ₹10,000, whichever is higher. Section 74 applies when fraud is established: 100% of tax evaded. Always resolve notices under Section 73 where possible.',
                    },
                ].map((faq, i) => (
                    <div key={i} className="border-b border-border pb-4">
                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
