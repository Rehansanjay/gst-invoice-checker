'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertTriangle, Calculator, Share2, ShieldCheck, ArrowRight,
    XCircle, CheckCircle2, Info, Lightbulb, BookOpen,
    User, Briefcase, ChevronDown, ChevronRight, FileText,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type CalcResult = {
    interest: number;
    penalty: number;
    total: number;
    lawRef: string;
    note: string;
    sellerNote: string;
};

type Scenario = { violationType: string; taxLiability: string; delayDays: string; };

// ── Scenario presets ──────────────────────────────────────────────────────────
const WRONG_SCENARIO: Scenario = { violationType: 'wrong_tax_type', taxLiability: '85000', delayDays: '60' };
const RIGHT_SCENARIO: Scenario = { violationType: 'late_filing', taxLiability: '85000', delayDays: '0' };

// ── Core calculation ──────────────────────────────────────────────────────────
function runCalculation(tax: number, days: number, violationType: string): CalcResult {
    let interest = 0, penalty = 0, lawRef = '', note = '', sellerNote = '';

    if (violationType === 'late_filing') {
        interest = (tax * 0.18 * days) / 365;
        penalty = Math.min(50 * days, 5000);
        lawRef = 'Section 50 (Interest) + Section 47 (Late Fee) — CGST Act 2017';
        note = 'Interest at 18% p.a. on unpaid tax from due date. Late fee ₹50/day (₹25 CGST + ₹25 SGST), capped at ₹5,000.';
        sellerNote = 'You filed your GST return late. The government charges a daily fee plus interest on unpaid tax.';
    } else if (violationType === 'wrong_tax_type') {
        penalty = Math.max(tax * 0.10, 10000);
        interest = (tax * 0.18 * Math.max(days, 90)) / 365;
        lawRef = 'Section 73 — CGST Act 2017 (non-fraud short payment)';
        note = 'Wrong tax type (e.g. IGST on intrastate supply) = short payment. Penalty 10% of tax, min ₹10,000. Interest from original due date.';
        sellerNote = 'You used the wrong tax category (e.g. charged national tax instead of state tax on a local delivery). The government treats this as if you underpaid.';
    } else if (violationType === 'missing_hsn') {
        penalty = Math.max(10000, tax * 0.10);
        interest = 0;
        lawRef = 'Section 122 — CGST Act 2017 (incorrect invoice)';
        note = 'Missing/incorrect HSN code can attract penalty under Section 122. Min ₹10,000 or 10% of tax. Mandatory per Notification 78/2020-CT.';
        sellerNote = 'Your invoice is missing the product classification code (HSN). This is mandatory and its absence can attract a fine.';
    } else if (violationType === 'itc_mismatch') {
        penalty = tax;
        interest = (tax * 0.18 * days) / 365;
        lawRef = 'Section 16(2) + Section 17(5) — CGST Act 2017 (ineligible ITC reversal)';
        note = 'Incorrectly claimed ITC must be reversed with 18% interest. One of the most common audit triggers.';
        sellerNote = 'You claimed a tax credit you were not eligible for. You must repay it with interest — this is one of the most common reasons businesses get GST notices.';
    }

    return { interest, penalty, total: interest + penalty, lawRef, note, sellerNote };
}

// ── Voluntary disclosure savings (DRC-03) ─────────────────────────────────────
function getVoluntaryDiscount(tax: number, violationType: string, payNow: boolean) {
    // Section 73 (non-fraud): 100% waiver before SCN, 25% post-SCN
    // Section 74 (fraud): 15% before SCN adjudication
    const isSection74 = violationType === 'itc_mismatch'; // treat as higher risk
    const basePenalty = Math.max(tax * 0.10, 10000);

    if (payNow) {
        return { penalty: 0, saving: basePenalty, note: isSection74 ? 'Pay via DRC-03 before SCN order — 15% of penalty (Section 74(5))' : 'Pay via DRC-03 before SCN issues — 100% penalty waiver (Section 73(5))' };
    }
    const reduced = isSection74 ? basePenalty * 0.85 : basePenalty * 0.75;
    const saving = basePenalty - reduced;
    return { penalty: reduced, saving, note: isSection74 ? 'After SCN, pay before order — 25% waiver (Section 74(8))' : 'Pay after SCN but before order — 25% waiver (Section 73(8))' };
}

// ────────────────────────────────────────────────────────────────────────────
// Inner component (needs useSearchParams → must be wrapped in Suspense)
// ────────────────────────────────────────────────────────────────────────────
function GstPenaltyCalculatorInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const audience = searchParams.get('audience') === 'ca' ? 'ca' : 'seller';

    // Calculator state
    const [taxLiability, setTaxLiability] = useState('');
    const [delayDays, setDelayDays] = useState('');
    const [violationType, setViolationType] = useState('late_filing');
    const [result, setResult] = useState<null | CalcResult>(null);
    const [activeScenario, setActiveScenario] = useState<'wrong' | 'right' | null>(null);

    // CA-specific state
    const [caSection, setCaSection] = useState<'73' | '74' | '74A'>('73');
    const [payNow, setPayNow] = useState(true);
    const [showDrcCalc, setShowDrcCalc] = useState(false);
    const [showScnTracker, setShowScnTracker] = useState(false);
    const [defaultDate, setDefaultDate] = useState('');

    const switchAudience = (to: 'ca' | 'seller') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('audience', to);
        router.push(`?${params.toString()}`);
    };

    const calculate = (tax = parseFloat(taxLiability) || 0, days = parseInt(delayDays) || 0, vType = violationType) => {
        if (tax <= 0) return;
        setResult(runCalculation(tax, days, vType));
    };

    const loadScenario = (scenario: Scenario, which: 'wrong' | 'right') => {
        setViolationType(scenario.violationType);
        setTaxLiability(scenario.taxLiability);
        setDelayDays(scenario.delayDays);
        setActiveScenario(which);
        const r = runCalculation(parseFloat(scenario.taxLiability), parseInt(scenario.delayDays), scenario.violationType);
        setResult(r);
        setTimeout(() => document.getElementById('calc-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const shareWhatsApp = () => {
        if (!result) return;
        const t = encodeURIComponent(
            `⚠️ GST Penalty Estimate\nTax: ₹${Number(taxLiability).toLocaleString('en-IN')}\nDelay: ${delayDays} days\n` +
            `Interest: ₹${result.interest.toFixed(2)}\nPenalty: ₹${result.penalty.toFixed(2)}\n` +
            `TOTAL: ₹${result.total.toFixed(2)}\n\nCalculated at InvoiceCheck.in`
        );
        window.open(`https://wa.me/?text=${t}`, '_blank');
    };

    const copyCitation = () => {
        if (!result) return;
        const text = `${result.lawRef} — Tax: ₹${taxLiability}, Interest: ₹${result.interest.toFixed(2)}, Penalty: ₹${result.penalty.toFixed(2)}, Total Exposure: ₹${result.total.toFixed(2)}`;
        navigator.clipboard.writeText(text);
    };

    const violationTypes = [
        { value: 'late_filing', label: audience === 'ca' ? 'Late GSTR-3B Filing' : 'Filed GST Return Late', caLabel: 'Section 50 + 47' },
        { value: 'wrong_tax_type', label: audience === 'ca' ? 'Wrong Tax Type (IGST vs CGST/SGST)' : 'Used Wrong Tax Category (Local vs National)', caLabel: 'Section 73 / 74' },
        { value: 'missing_hsn', label: audience === 'ca' ? 'Missing / Incorrect HSN Code' : 'Invoice Missing Product Code (HSN)', caLabel: 'Section 122' },
        { value: 'itc_mismatch', label: audience === 'ca' ? 'Ineligible ITC Claim' : 'Claimed Tax Credit Incorrectly', caLabel: 'Section 16(2)' },
    ];

    const tax = parseFloat(taxLiability) || 0;
    const drcData = showDrcCalc && tax > 0 ? getVoluntaryDiscount(tax, violationType, payNow) : null;

    // SCN deadline calc
    const scnDeadline = (() => {
        if (!defaultDate) return null;
        const d = new Date(defaultDate);
        const years = caSection === '74' ? 5 : caSection === '74A' ? 3.5 : 3;
        const scnMonths = caSection === '74' ? 6 : 3;
        const limitDate = new Date(d);
        limitDate.setFullYear(limitDate.getFullYear() + years);
        const scnDate = new Date(limitDate);
        scnDate.setMonth(scnDate.getMonth() - scnMonths);
        return { limitDate, scnDate };
    })();

    return (
        <div className="container mx-auto px-4 py-16 max-w-3xl">

            {/* Hero */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    Free Tool — No Signup Required
                </div>
                <h1 className="text-4xl font-bold mb-3">GST Penalty Calculator</h1>
                <p className="text-muted-foreground max-w-xl mx-auto text-base">
                    Estimate your GST interest and penalty exposure under Sections 47, 50, 73 and 122 of the CGST Act 2017.
                </p>
            </div>

            {/* ── AUDIENCE TOGGLE ─────────────────────────────────────────── */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
                    <button
                        onClick={() => switchAudience('seller')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${audience === 'seller'
                                ? 'bg-white shadow text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <User className="w-4 h-4" /> Regular Seller
                    </button>
                    <button
                        onClick={() => switchAudience('ca')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${audience === 'ca'
                                ? 'bg-indigo-600 shadow text-white'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" /> CA / Tax Pro
                        {audience === 'ca' && (
                            <span className="bg-indigo-400/40 text-white text-xs px-1.5 py-0.5 rounded font-medium">Pro Mode</span>
                        )}
                    </button>
                </div>
            </div>
            {audience === 'ca' && (
                <p className="text-center text-xs text-muted-foreground -mt-5 mb-7">
                    📎 Bookmark: <span className="font-mono text-indigo-600">/gst-penalty-calculator?audience=ca</span>
                </p>
            )}

            {/* ── INFO BOX ────────────────────────────────────────────────── */}
            {audience === 'seller' ? (
                /* SELLER INFO BOX — simple, jargon-free */
                <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/60 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Info className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="font-bold text-blue-900 text-base">How to use this — and why check before filing</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <p className="text-xs font-bold text-slate-800">Know your risk first</p>
                            </div>
                            <p className="text-xs text-muted-foreground">A single wrong tax category or missing product code can silently create a fine of <strong>₹10,000+</strong> — before you even get a notice.</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                <p className="text-xs font-bold text-slate-800">Check before you submit</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Run this calculator <strong>before you submit your GST return</strong>. If the exposure is high, validate your invoice first.</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <p className="text-xs font-bold text-slate-800">Based on real law</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Results show the exact government rule that applies so you know it's not a guess.</p>
                        </div>
                    </div>
                    <div className="border-t border-blue-100 pt-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">How to use — 3 steps</p>
                        <ol className="space-y-2">
                            {[
                                ['What went wrong?', 'Pick the option that matches your situation — e.g. "Filed GST Return Late" or "Used Wrong Tax Category".'],
                                ['How much GST is on the invoice?', 'Enter the rupee amount of GST (not the total invoice amount — just the tax portion).'],
                                ['How late are you?', 'Type the number of days past the deadline. If you filed on time, enter 0.'],
                            ].map(([title, desc], i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                    <span className="w-5 h-5 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    <span><strong>{title}</strong> — {desc}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            ) : (
                /* CA INFO BOX — technical, section references */
                <div className="mb-8 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h2 className="font-bold text-indigo-900 text-base">CA / Tax Pro Reference Panel</h2>
                        </div>
                        <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-medium">Technical Mode</span>
                    </div>

                    {/* Section 73 / 74 / 74A selector */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Which provision applies?</p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {([
                                { id: '73', label: 'Sec 73', sub: 'Non-fraud · 3 yr limit' },
                                { id: '74', label: 'Sec 74', sub: 'Fraud/wilful · 5 yr limit' },
                                { id: '74A', label: 'Sec 74A', sub: 'New provision · 42 months' },
                            ] as const).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setCaSection(s.id)}
                                    className={`rounded-lg border p-2 text-left transition-all ${caSection === s.id ? 'border-indigo-500 bg-indigo-100' : 'border-indigo-200 hover:border-indigo-400 bg-white'}`}
                                >
                                    <p className={`text-xs font-bold ${caSection === s.id ? 'text-indigo-800' : 'text-slate-700'}`}>{s.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                                </button>
                            ))}
                        </div>
                        <div className="bg-white border border-indigo-100 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                            {caSection === '73' && <><p><strong>Section 73</strong> — Genuine error/oversight. SCN must be issued 3 months before limitation expiry. Penalty: 10% of tax (min ₹10,000). <strong>100% penalty waiver</strong> if paid via DRC-03 before SCN.</p></>}
                            {caSection === '74' && <><p><strong>Section 74</strong> — Fraud/wilful misstatement. Higher scrutiny. Penalty: 100% of tax. <strong>15% waiver</strong> if paid before SCN order (Section 74(5)); 25% waiver after SCN but before order (74(8)).</p></>}
                            {caSection === '74A' && <><p><strong>Section 74A</strong> — New unified provision (effective FY 2024-25 onwards under Finance Act 2024). Limitation: 42 months. Consolidates fraud and non-fraud into single proceeding. SCN must issue 6 months before limit expiry.</p></>}
                        </div>
                    </div>

                    {/* Voluntary Disclosure DRC-03 */}
                    <button
                        onClick={() => setShowDrcCalc(!showDrcCalc)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 mb-2 hover:text-indigo-900"
                    >
                        {showDrcCalc ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        DRC-03 Voluntary Disclosure Savings Calculator
                    </button>
                    {showDrcCalc && (
                        <div className="bg-white border border-indigo-100 rounded-lg p-3 mb-3">
                            <p className="text-xs text-muted-foreground mb-2">Based on tax liability entered in the calculator below.</p>
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setPayNow(true)} className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all ${payNow ? 'bg-green-100 border-green-400 text-green-800' : 'border-slate-200 text-slate-500'}`}>Pay via DRC-03 Now</button>
                                <button onClick={() => setPayNow(false)} className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-all ${!payNow ? 'bg-amber-100 border-amber-400 text-amber-800' : 'border-slate-200 text-slate-500'}`}>Wait for SCN</button>
                            </div>
                            {tax > 0 ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-bold text-green-800 mb-1">
                                        Penalty: ₹{drcData?.penalty.toFixed(2)} &nbsp;|&nbsp; You save: ₹{drcData?.saving.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-green-700">{drcData?.note}</p>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic">Enter tax liability in the calculator below first.</p>
                            )}
                        </div>
                    )}

                    {/* SCN Timeline Tracker */}
                    <button
                        onClick={() => setShowScnTracker(!showScnTracker)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                        {showScnTracker ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        SCN Deadline Tracker
                    </button>
                    {showScnTracker && (
                        <div className="bg-white border border-indigo-100 rounded-lg p-3 mt-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Date of default / original due date</label>
                            <Input type="date" value={defaultDate} onChange={e => setDefaultDate(e.target.value)} className="text-xs h-8 mb-2" />
                            {scnDeadline ? (
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between bg-amber-50 border border-amber-100 rounded px-3 py-2">
                                        <span className="text-amber-700 font-medium">Last date for SCN</span>
                                        <span className="font-bold text-amber-800">{scnDeadline.scnDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between bg-red-50 border border-red-100 rounded px-3 py-2">
                                        <span className="text-red-700 font-medium">Limitation expiry</span>
                                        <span className="font-bold text-red-800">{scnDeadline.limitDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic">Enter a date to calculate deadlines.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── SCENARIO CARDS ────────────────────────────────────────────── */}
            <div className="mb-8">
                <p className="text-sm font-semibold text-center text-muted-foreground mb-4 uppercase tracking-wide">See it in action — click an example</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ❌ Wrong */}
                    <div onClick={() => loadScenario(WRONG_SCENARIO, 'wrong')} className={`cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${activeScenario === 'wrong' ? 'border-red-400 bg-red-50 shadow-md' : 'border-red-200 bg-red-50/40 hover:border-red-400'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                            <span className="font-bold text-red-800">❌ Wrong Filing</span>
                            {activeScenario === 'wrong' && <span className="ml-auto text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">Loaded</span>}
                        </div>
                        <div className="space-y-1.5 mb-4 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Violation</span><span className="font-medium text-red-700">Wrong Tax Type</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tax Liability</span><span className="font-medium">₹85,000</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Delay</span><span className="font-medium">60 days overdue</span></div>
                        </div>
                        <div className="bg-red-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-semibold text-red-700">Estimated Exposure</span>
                            <span className="text-lg font-black text-red-800">₹{runCalculation(85000, 60, 'wrong_tax_type').total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <p className="text-xs text-red-600 mt-2">Used IGST on intrastate supply — treated as short payment under {audience === 'ca' ? 'Section 73' : 'GST Act'}.</p>
                    </div>

                    {/* ✅ Correct */}
                    <div onClick={() => loadScenario(RIGHT_SCENARIO, 'right')} className={`cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-md ${activeScenario === 'right' ? 'border-green-400 bg-green-50 shadow-md' : 'border-green-200 bg-green-50/40 hover:border-green-400'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            <span className="font-bold text-green-800">✅ Correct Filing</span>
                            {activeScenario === 'right' && <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">Loaded</span>}
                        </div>
                        <div className="space-y-1.5 mb-4 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Filing</span><span className="font-medium text-green-700">Correct CGST+SGST applied</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tax Liability</span><span className="font-medium">₹85,000</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Delay</span><span className="font-medium text-green-700">Filed on time ✓</span></div>
                        </div>
                        <div className="bg-green-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-xs font-semibold text-green-700">Estimated Exposure</span>
                            <span className="text-lg font-black text-green-800">₹0</span>
                        </div>
                        <p className="text-xs text-green-600 mt-2">Correct tax type, filed on time — zero interest, zero penalty. This is the goal.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">or enter your own details below</span>
                    <div className="flex-1 h-px bg-border" />
                </div>
            </div>

            {/* ── CALCULATOR ──────────────────────────────────────────────── */}
            <Card className="p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Calculate Your Exposure
                </h2>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {audience === 'ca' ? 'Type of Violation' : 'What went wrong?'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {violationTypes.map(v => (
                                <button
                                    key={v.value}
                                    onClick={() => { setViolationType(v.value); setResult(null); setActiveScenario(null); }}
                                    className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-colors flex justify-between items-center ${violationType === v.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-input hover:border-primary/50 text-muted-foreground'}`}
                                >
                                    <span>{v.label}</span>
                                    {audience === 'ca' && <span className="text-[10px] font-mono text-indigo-500 shrink-0 ml-2">{v.caLabel}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {audience === 'ca' ? 'Tax Liability / ITC Amount (₹)' : 'How much GST is on the invoice? (₹)'}
                        </label>
                        <Input type="number" placeholder="e.g. 50000" value={taxLiability} onChange={e => { setTaxLiability(e.target.value); setResult(null); setActiveScenario(null); }} />
                        {audience === 'seller' && <p className="text-xs text-muted-foreground mt-1">Just the tax amount, not the full invoice total. E.g. if GST is 18% and the invoice is ₹1,00,000 — enter ₹18,000.</p>}
                    </div>
                    {violationType !== 'missing_hsn' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {audience === 'ca'
                                    ? `Delay in Days ${violationType === 'itc_mismatch' ? '(since ITC claimed)' : '(from original due date)'}`
                                    : 'How many days late? (enter 0 if on time)'}
                            </label>
                            <Input type="number" placeholder="e.g. 30" value={delayDays} onChange={e => { setDelayDays(e.target.value); setResult(null); setActiveScenario(null); }} />
                        </div>
                    )}
                    <Button onClick={() => calculate()} className="w-full" size="lg">
                        <Calculator className="w-4 h-4 mr-2" /> Calculate Penalty
                    </Button>
                </div>
            </Card>

            {/* ── RESULT ───────────────────────────────────────────────────── */}
            {result && (
                <Card id="calc-result" className={`p-6 mb-6 animate-in fade-in duration-300 ${result.total === 0 ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                    {result.total === 0 ? (
                        <>
                            <h3 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> ✅ Zero Penalty Exposure</h3>
                            <p className="text-green-700 text-sm mb-4">No interest or penalty applies. {audience === 'seller' ? 'Filing on time with the correct tax category means zero financial exposure.' : 'No Section 47/50 exposure. Filed within due date — no demand notice risk.'}</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Estimated Penalty Exposure</h3>
                            <div className="space-y-3 mb-5">
                                {result.interest > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-red-100">
                                        <span className="text-sm text-red-700">{audience === 'ca' ? 'Interest (Section 50 @ 18% p.a.)' : 'Interest charged by Government'}</span>
                                        <span className="font-bold text-red-800">₹{result.interest.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center py-2 border-b border-red-100">
                                    <span className="text-sm text-red-700">{audience === 'ca' ? (violationType === 'late_filing' ? 'Late Fee (Section 47)' : 'Penalty') : 'Fine / Late fee'}</span>
                                    <span className="font-bold text-red-800">₹{result.penalty.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 bg-red-100 rounded-lg px-3">
                                    <span className="font-bold text-red-900">Total Exposure</span>
                                    <span className="text-2xl font-black text-red-900">₹{result.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Context note — different for each audience */}
                    <div className="bg-white border border-slate-100 rounded-lg p-3 mb-4">
                        {audience === 'ca' ? (
                            <>
                                <p className="text-xs font-semibold text-slate-600 mb-1">📖 Law Reference</p>
                                <p className="text-xs text-slate-500">{result.lawRef}</p>
                                <p className="text-xs text-slate-500 mt-1">{result.note}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs font-semibold text-slate-600 mb-1">💡 What this means</p>
                                <p className="text-xs text-slate-500">{result.sellerNote}</p>
                                <p className="text-xs text-slate-400 mt-1">Technical ref: {result.lawRef}</p>
                            </>
                        )}
                    </div>

                    {/* CA actions */}
                    {audience === 'ca' && result.total > 0 && (
                        <div className="flex gap-2 mb-3">
                            <Button variant="outline" size="sm" onClick={copyCitation} className="flex-1 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <FileText className="w-3.5 h-3.5" /> Copy Legal Citation
                            </Button>
                            <Button variant="outline" size="sm" onClick={shareWhatsApp} className="flex-1 text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50">
                                <Share2 className="w-3.5 h-3.5" /> Share via WhatsApp
                            </Button>
                        </div>
                    )}

                    {/* Seller share */}
                    {audience === 'seller' && result.total > 0 && (
                        <Button variant="outline" onClick={shareWhatsApp} className="w-full border-red-200 text-red-700 hover:bg-red-50 mb-3">
                            <Share2 className="w-4 h-4 mr-2" /> Share with my CA on WhatsApp
                        </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">Estimate only — actual liability may vary. {audience === 'ca' ? 'Rule 142 applies for e-assessment proceedings.' : 'Consult a CA for final assessment.'}</p>
                </Card>
            )}

            {/* CTA */}
            <Card className="p-6 border-green-200 bg-green-50/40">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-green-900 mb-1">
                            {audience === 'ca' ? 'Validate Client Invoices — ₹99/check or Bulk Plans' : 'Prevent This Entirely — ₹99/check'}
                        </h3>
                        <p className="text-sm text-green-800 mb-4">
                            {audience === 'ca'
                                ? 'Catch wrong tax types, invalid HSN codes, and ITC eligibility issues before your client files. 15-rule engine, results in 30 seconds. Bulk plans available for CA firms.'
                                : 'Catch wrong tax category, missing product codes, and calculation errors before you file. Our 15-rule GST validation checks every invoice in under 30 seconds.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/check">
                                <Button className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto">
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    {audience === 'ca' ? 'Check a Client Invoice' : 'Check My Invoice Now — ₹99'}
                                </Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline" className="border-green-300 text-green-800 w-full sm:w-auto">
                                    {audience === 'ca' ? 'View CA Bulk Plans' : 'View Bulk Plans'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>

            {/* FAQ */}
            <div className="mt-12 space-y-6">
                <h2 className="text-2xl font-bold">Common GST Penalty Questions</h2>
                {[
                    { q: 'What is the GST late filing penalty in India?', a: 'Under Section 47, the late fee is ₹50/day (₹25 CGST + ₹25 SGST), max ₹5,000. Section 50 adds 18% p.a. interest on unpaid tax.' },
                    { q: 'What happens if I use IGST instead of CGST+SGST?', a: 'Wrong tax type on intrastate supply = short payment. Section 73 attracts 10% penalty (min ₹10,000) + 18% interest from due date.' },
                    { q: 'Is HSN code mandatory on GST invoices?', a: 'Yes. Notification 78/2020-CT mandates 4-digit HSN for turnover ≤₹5 Cr and 6-digit for >₹5 Cr. Missing HSN = penalty under Section 122.' },
                    { q: 'What is Section 73 penalty vs Section 74?', a: 'Section 73 — genuine error: 10% of tax or ₹10,000 (higher). Section 74 — fraud: 100% of tax evaded. Pay DRC-03 under Section 73 before SCN for 100% penalty waiver.' },
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

// ── Export with Suspense (required for useSearchParams in App Router) ──────────
export default function GstPenaltyCalculator() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading calculator…</div></div>}>
            <GstPenaltyCalculatorInner />
        </Suspense>
    );
}
