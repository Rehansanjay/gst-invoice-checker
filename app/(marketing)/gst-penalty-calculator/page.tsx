'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calculator, Share2, ShieldCheck, ArrowRight, XCircle, CheckCircle2, Info, Lightbulb, BookOpen } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type CalcResult = {
    interest: number;
    penalty: number;
    total: number;
    lawRef: string;
    note: string;
};

type Scenario = {
    label: string;
    violationType: string;
    taxLiability: string;
    delayDays: string;
};

// ── Pre-built example scenarios ───────────────────────────────────────────────
const WRONG_SCENARIO: Scenario = {
    label: 'Wrong Filing',
    violationType: 'wrong_tax_type',
    taxLiability: '85000',
    delayDays: '60',
};

const RIGHT_SCENARIO: Scenario = {
    label: 'Correct Filing',
    violationType: 'late_filing',
    taxLiability: '85000',
    delayDays: '0',
};

// ── Core calculation (pure function) ─────────────────────────────────────────
function runCalculation(tax: number, days: number, violationType: string): CalcResult {
    let interest = 0;
    let penalty = 0;
    let lawRef = '';
    let note = '';

    if (violationType === 'late_filing') {
        interest = (tax * 0.18 * days) / 365;
        penalty = Math.min(50 * days, 5000);
        lawRef = 'Section 50 (Interest) + Section 47 (Late Fee) of CGST Act 2017';
        note = 'Interest at 18% p.a. on unpaid tax from due date. Late fee ₹50/day (₹25 CGST + ₹25 SGST), capped at ₹5,000.';
    } else if (violationType === 'wrong_tax_type') {
        penalty = Math.max(tax * 0.10, 10000);
        interest = (tax * 0.18 * Math.max(days, 90)) / 365;
        lawRef = 'Section 73 of CGST Act 2017 — Tax not paid / short paid (non-fraud)';
        note = 'Wrong tax type (e.g. IGST instead of CGST+SGST) = short payment. Penalty 10% of tax, min ₹10,000. Interest from original due date.';
    } else if (violationType === 'missing_hsn') {
        penalty = Math.max(10000, tax * 0.10);
        interest = 0;
        lawRef = 'Section 122 of CGST Act — Penalty for issuing incorrect invoice';
        note = 'Missing/incorrect HSN code can attract penalty under Section 122. Min ₹10,000 or 10% of tax.';
    } else if (violationType === 'itc_mismatch') {
        penalty = tax;
        interest = (tax * 0.18 * days) / 365;
        lawRef = 'Section 16(2) + Section 17(5) of CGST Act — Ineligible ITC reversal';
        note = 'Incorrectly claimed ITC must be reversed with 18% interest. One of the most common audit triggers.';
    }

    return { interest, penalty, total: interest + penalty, lawRef, note };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GstPenaltyCalculator() {
    const [taxLiability, setTaxLiability] = useState('');
    const [delayDays, setDelayDays] = useState('');
    const [violationType, setViolationType] = useState('late_filing');
    const [result, setResult] = useState<null | CalcResult>(null);
    const [activeScenario, setActiveScenario] = useState<'wrong' | 'right' | null>(null);

    const calculate = (
        tax = parseFloat(taxLiability) || 0,
        days = parseInt(delayDays) || 0,
        vType = violationType,
    ) => {
        if (tax <= 0) return;
        setResult(runCalculation(tax, days, vType));
    };

    const loadScenario = (scenario: Scenario, which: 'wrong' | 'right') => {
        setViolationType(scenario.violationType);
        setTaxLiability(scenario.taxLiability);
        setDelayDays(scenario.delayDays);
        setActiveScenario(which);
        const tax = parseFloat(scenario.taxLiability);
        const days = parseInt(scenario.delayDays);
        setResult(runCalculation(tax, days, scenario.violationType));
        // Scroll to result
        setTimeout(() => document.getElementById('calc-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
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
                </p>
            </div>

            {/* ── HOW TO USE + WHY ────────────────────────────────────────── */}
            <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/60 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="font-bold text-blue-900 text-base">How to use this calculator — and why it matters</h2>
                </div>

                {/* Why you need it */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <p className="text-xs font-bold text-slate-800">Know your risk first</p>
                        </div>
                        <p className="text-xs text-muted-foreground">A single wrong tax type or missed HSN code can silently expose you to ₹10,000+ in penalties — <strong>before</strong> you even know something is wrong.</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            <p className="text-xs font-bold text-slate-800">Use before filing</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Run this calculator <strong>before you submit your GSTR-1 or GSTR-3B</strong>. If the penalty is significant, validate your invoices first using our checker.</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <p className="text-xs font-bold text-slate-800">Based on real law</p>
                        </div>
                        <p className="text-xs text-muted-foreground">All calculations follow <strong>Sections 47, 50, 73 &amp; 122</strong> of the CGST Act 2017. Results include the exact law reference so you understand what applies.</p>
                    </div>
                </div>

                {/* 3-step how to use */}
                <div className="border-t border-blue-100 pt-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">How to use — 3 steps</p>
                    <ol className="space-y-2">
                        <li className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5">1</span>
                            <span><strong>Pick the violation type</strong> that best matches your situation — late filing, wrong tax type, missing HSN, or incorrect ITC claim.</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5">2</span>
                            <span><strong>Enter your tax liability</strong> (the GST amount on the invoice or return) and how many days delayed.</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5">3</span>
                            <span><strong>Click Calculate</strong> — you'll see interest, penalty, total exposure, and the exact section of law that applies.</span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* ── TWO EXAMPLE SCENARIOS ───────────────────────────────────────── */}
            <div className="mb-8">
                <p className="text-sm font-semibold text-center text-muted-foreground mb-4 uppercase tracking-wide">
                    See it in action — click an example
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* ❌ Wrong Filing */}
                    <div
                        onClick={() => loadScenario(WRONG_SCENARIO, 'wrong')}
                        className={`cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${activeScenario === 'wrong'
                            ? 'border-red-400 bg-red-50 shadow-md'
                            : 'border-red-200 bg-red-50/40 hover:border-red-400'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                            <span className="font-bold text-red-800">❌ Wrong Filing</span>
                            {activeScenario === 'wrong' && (
                                <span className="ml-auto text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">Loaded</span>
                            )}
                        </div>
                        <div className="space-y-1.5 mb-4 text-sm text-red-700">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Violation</span>
                                <span className="font-medium">Wrong Tax Type (IGST)</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Liability</span>
                                <span className="font-medium">₹85,000</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delay</span>
                                <span className="font-medium">60 days overdue</span>
                            </div>
                        </div>
                        {/* Preview of what the penalty will be */}
                        <div className="bg-red-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-semibold text-red-700">Estimated Exposure</span>
                            <span className="text-lg font-black text-red-800">
                                ₹{(() => {
                                    const r = runCalculation(85000, 60, 'wrong_tax_type');
                                    return r.total.toLocaleString('en-IN', { maximumFractionDigits: 0 });
                                })()}
                            </span>
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                            Used IGST on an intrastate supply — treated as short payment under Section 73.
                        </p>
                    </div>

                    {/* ✅ Correct Filing */}
                    <div
                        onClick={() => loadScenario(RIGHT_SCENARIO, 'right')}
                        className={`cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${activeScenario === 'right'
                            ? 'border-green-400 bg-green-50 shadow-md'
                            : 'border-green-200 bg-green-50/40 hover:border-green-400'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            <span className="font-bold text-green-800">✅ Correct Filing</span>
                            {activeScenario === 'right' && (
                                <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">Loaded</span>
                            )}
                        </div>
                        <div className="space-y-1.5 mb-4 text-sm text-green-700">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Filing</span>
                                <span className="font-medium">Correct CGST+SGST applied</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Liability</span>
                                <span className="font-medium">₹85,000</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delay</span>
                                <span className="font-medium text-green-700">Filed on time ✓</span>
                            </div>
                        </div>
                        <div className="bg-green-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-semibold text-green-700">Estimated Exposure</span>
                            <span className="text-lg font-black text-green-800">₹0</span>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                            Correct tax type, filed on time — zero interest, zero penalty. This is the goal.
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">or enter your own details below</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            </div>

            {/* ── CALCULATOR ─────────────────────────────────────────────────── */}
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
                                    onClick={() => { setViolationType(v.value); setResult(null); setActiveScenario(null); }}
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
                            onChange={(e) => { setTaxLiability(e.target.value); setResult(null); setActiveScenario(null); }}
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
                                onChange={(e) => { setDelayDays(e.target.value); setResult(null); setActiveScenario(null); }}
                            />
                        </div>
                    )}

                    <Button onClick={() => calculate()} className="w-full" size="lg">
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Penalty
                    </Button>
                </div>
            </Card>

            {/* ── RESULT ──────────────────────────────────────────────────────── */}
            {result && (
                <Card
                    id="calc-result"
                    className={`p-6 mb-6 animate-in fade-in duration-300 ${result.total === 0
                        ? 'border-green-200 bg-green-50/40'
                        : 'border-red-200 bg-red-50/40'
                        }`}
                >
                    {result.total === 0 ? (
                        <>
                            <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> ✅ Zero Penalty Exposure
                            </h3>
                            <p className="text-green-700 text-sm mb-4">
                                No interest or penalty applies. Filing on time with the correct tax type = zero
                                financial exposure. Keep it this way by <strong>validating invoices before submission</strong>.
                            </p>
                        </>
                    ) : (
                        <>
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
                        </>
                    )}

                    <div className="bg-white border border-slate-100 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-1">📖 Law Reference</p>
                        <p className="text-xs text-slate-500">{result.lawRef}</p>
                        <p className="text-xs text-slate-500 mt-1">{result.note}</p>
                    </div>

                    {result.total > 0 && (
                        <Button
                            variant="outline"
                            onClick={shareOnWhatsApp}
                            className="w-full border-red-200 text-red-700 hover:bg-red-50 mb-2"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share with my CA on WhatsApp
                        </Button>
                    )}

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
