'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    const isSection74 = violationType === 'itc_mismatch'; 
    const basePenalty = Math.max(tax * 0.10, 10000);

    if (payNow) {
        return { penalty: 0, saving: basePenalty, note: isSection74 ? 'Pay via DRC-03 before SCN order — 15% of penalty (Section 74(5))' : 'Pay via DRC-03 before SCN issues — 100% penalty waiver (Section 73(5))' };
    }
    const reduced = isSection74 ? basePenalty * 0.85 : basePenalty * 0.75;
    const saving = basePenalty - reduced;
    return { penalty: reduced, saving, note: isSection74 ? 'After SCN, pay before order — 25% waiver (Section 74(8))' : 'Pay after SCN but before order — 25% waiver (Section 73(8))' };
}

// ────────────────────────────────────────────────────────────────────────────
// Inner component
// ────────────────────────────────────────────────────────────────────────────
function GstPenaltyCalculatorInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const audience = searchParams.get('audience') === 'ca' ? 'ca' : 'seller';

    const [taxLiability, setTaxLiability] = useState('');
    const [delayDays, setDelayDays] = useState('');
    const [violationType, setViolationType] = useState('late_filing');
    const [result, setResult] = useState<null | CalcResult>(null);
    const [activeScenario, setActiveScenario] = useState<'wrong' | 'right' | null>(null);

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
        <div className="min-h-screen py-16" style={{ background: 'var(--warm-bg)' }}>
            <div className="container mx-auto px-4 max-w-3xl">

                {/* Hero */}
                <div className="text-center mb-10 scroll-reveal">
                    <span className="pill-badge mb-5 text-[12px] hover-glow-border cursor-default" style={{ background: '#FCE8E8', borderColor: '#F5C6C6', color: '#C53030' }}>
                        <AlertTriangle className="w-3 h-3 fill-current" />
                        Free Tool — No Signup Required
                    </span>
                    <h1 className="text-[2.5rem] sm:text-[3rem] font-heading font-bold mb-4 leading-tight" style={{ color: 'var(--warm-charcoal)' }}>
                        GST Penalty Calculator
                    </h1>
                    <p className="text-[1.125rem]" style={{ color: 'var(--warm-text-secondary)' }}>
                        Estimate your GST interest and penalty exposure under Sections 47, 50, 73 and 122 of the CGST Act 2017.
                    </p>
                </div>

                {/* ── AUDIENCE TOGGLE ─────────────────────────────────────────── */}
                <div className="flex justify-center mb-10 scroll-reveal">
                    <div className="inline-flex rounded-2xl p-1.5 shadow-inner" style={{ background: 'rgba(250, 248, 246, 0.5)', border: '1px solid var(--warm-border)' }}>
                        <button
                            onClick={() => switchAudience('seller')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all ${audience === 'seller'
                                    ? 'bg-white shadow-md'
                                    : 'hover:bg-white/50'
                                }`}
                            style={{ color: audience === 'seller' ? 'var(--warm-charcoal)' : '#B8A895' }}
                        >
                            <User className="w-4 h-4" /> Regular Seller
                        </button>
                        <button
                            onClick={() => switchAudience('ca')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold transition-all ${audience === 'ca'
                                    ? 'shadow-md'
                                    : 'hover:bg-white/50'
                                }`}
                            style={{ 
                                background: audience === 'ca' ? 'var(--warm-charcoal)' : 'transparent',
                                color: audience === 'ca' ? 'white' : '#B8A895'
                            }}
                        >
                            <Briefcase className="w-4 h-4" /> CA / Tax Pro
                            {audience === 'ca' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--warm-cream)' }}>Pro</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── INFO BOX ────────────────────────────────────────────────── */}
                {audience === 'seller' ? (
                    <div className="warm-card p-6 mb-10 border-l-4 scroll-reveal" style={{ borderLeftColor: 'var(--warm-accent)' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF3E2' }}>
                                <Info className="w-5 h-5" style={{ color: 'var(--warm-accent)' }} />
                            </div>
                            <h2 className="font-bold text-lg font-heading" style={{ color: 'var(--warm-charcoal)' }}>How to use this — and why check before filing</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'var(--warm-border)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4" style={{ color: '#D4A017' }} />
                                    <p className="text-[13px] font-bold" style={{ color: 'var(--warm-charcoal)' }}>Know your risk</p>
                                </div>
                                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>A single wrong tax category can silently create a fine of <strong>₹10,000+</strong>.</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'var(--warm-border)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4" style={{ color: 'var(--warm-accent)' }} />
                                    <p className="text-[13px] font-bold" style={{ color: 'var(--warm-charcoal)' }}>Check before submit</p>
                                </div>
                                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>Run this calculator <strong>before you submit</strong>. If exposure is high, validate first.</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'var(--warm-border)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4" style={{ color: 'var(--warm-charcoal)' }} />
                                    <p className="text-[13px] font-bold" style={{ color: 'var(--warm-charcoal)' }}>Based on real law</p>
                                </div>
                                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>Results show the exact government rule that applies.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="warm-card p-6 mb-10 scroll-reveal" style={{ background: 'var(--warm-charcoal)', border: 'none', color: 'white' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                    <Briefcase className="w-5 h-5" style={{ color: 'var(--warm-cream)' }} />
                                </div>
                                <h2 className="font-bold text-lg font-heading" style={{ color: 'white' }}>CA / Tax Pro Reference Panel</h2>
                            </div>
                        </div>

                        {/* Section 73 / 74 / 74A selector */}
                        <div className="mb-6">
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#B8A895' }}>Which provision applies?</p>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {([
                                    { id: '73', label: 'Sec 73', sub: 'Non-fraud · 3 yr limit' },
                                    { id: '74', label: 'Sec 74', sub: 'Fraud/wilful · 5 yr limit' },
                                    { id: '74A', label: 'Sec 74A', sub: 'New provision · 42m' },
                                ] as const).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setCaSection(s.id)}
                                        className="rounded-xl border p-3 text-left transition-all"
                                        style={{
                                            background: caSection === s.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            borderColor: caSection === s.id ? 'var(--warm-accent)' : 'rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <p className="text-[13px] font-bold mb-0.5" style={{ color: caSection === s.id ? 'var(--warm-cream)' : 'white' }}>{s.label}</p>
                                        <p className="text-[11px]" style={{ color: '#9E8A78' }}>{s.sub}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voluntary Disclosure DRC-03 */}
                        <button
                            onClick={() => setShowDrcCalc(!showDrcCalc)}
                            className="flex items-center gap-2 text-[13px] font-bold hover:opacity-80 transition-opacity mb-4"
                            style={{ color: 'var(--warm-cream)' }}
                        >
                            {showDrcCalc ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            DRC-03 Voluntary Disclosure Calculator
                        </button>
                        {showDrcCalc && (
                            <div className="rounded-xl p-4 mb-6 border" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setPayNow(true)} className="flex-1 text-[12px] py-2.5 rounded-lg border font-bold transition-all" style={{ background: payNow ? '#FEF3E2' : 'transparent', borderColor: payNow ? 'var(--warm-accent)' : 'rgba(255,255,255,0.1)', color: payNow ? 'var(--warm-charcoal)' : 'white' }}>Pay via DRC-03</button>
                                    <button onClick={() => setPayNow(false)} className="flex-1 text-[12px] py-2.5 rounded-lg border font-bold transition-all" style={{ background: !payNow ? '#FEF3E2' : 'transparent', borderColor: !payNow ? 'var(--warm-accent)' : 'rgba(255,255,255,0.1)', color: !payNow ? 'var(--warm-charcoal)' : 'white' }}>Wait for SCN</button>
                                </div>
                                {tax > 0 ? (
                                    <div className="rounded-lg p-3 border" style={{ background: 'rgba(126, 200, 155, 0.1)', borderColor: 'rgba(126, 200, 155, 0.3)' }}>
                                        <p className="text-[13px] font-bold mb-1" style={{ color: '#7EC89B' }}>
                                            Penalty: ₹{drcData?.penalty.toFixed(2)} &nbsp;|&nbsp; You save: ₹{drcData?.saving.toFixed(2)}
                                        </p>
                                        <p className="text-[11px]" style={{ color: '#B8A895' }}>{drcData?.note}</p>
                                    </div>
                                ) : (
                                    <p className="text-[11px] italic" style={{ color: '#9E8A78' }}>Enter tax liability in the calculator below first.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── SCENARIO CARDS ────────────────────────────────────────────── */}
                <div className="mb-10 scroll-reveal">
                    <p className="text-[12px] font-bold text-center uppercase tracking-widest mb-5" style={{ color: 'var(--warm-text-secondary)' }}>See it in action — click an example</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* ❌ Wrong */}
                        <div onClick={() => loadScenario(WRONG_SCENARIO, 'wrong')} className="warm-card cursor-pointer rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: activeScenario === 'wrong' ? '#E53E3E' : 'var(--warm-border)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                <span className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>Wrong Filing</span>
                            </div>
                            <div className="space-y-2 mb-5 text-[13px]">
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Violation</span><span className="font-bold" style={{ color: '#E53E3E' }}>Wrong Tax Type</span></div>
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Tax Liability</span><span className="font-bold" style={{ color: 'var(--warm-charcoal)' }}>₹85,000</span></div>
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Delay</span><span className="font-bold" style={{ color: 'var(--warm-charcoal)' }}>60 days overdue</span></div>
                            </div>
                            <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: '#FFF5F5' }}>
                                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#C53030' }}>Exposure</span>
                                <span className="text-xl font-black font-heading" style={{ color: '#9B2C2C' }}>₹{runCalculation(85000, 60, 'wrong_tax_type').total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        {/* ✅ Correct */}
                        <div onClick={() => loadScenario(RIGHT_SCENARIO, 'right')} className="warm-card cursor-pointer rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: activeScenario === 'right' ? '#38A169' : 'var(--warm-border)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <span className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>Correct Filing</span>
                            </div>
                            <div className="space-y-2 mb-5 text-[13px]">
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Filing</span><span className="font-bold" style={{ color: '#38A169' }}>Correct CGST+SGST</span></div>
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Tax Liability</span><span className="font-bold" style={{ color: 'var(--warm-charcoal)' }}>₹85,000</span></div>
                                <div className="flex justify-between"><span style={{ color: 'var(--warm-text-secondary)' }}>Delay</span><span className="font-bold" style={{ color: '#38A169' }}>Filed on time ✓</span></div>
                            </div>
                            <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: '#F0FFF4' }}>
                                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#2F855A' }}>Exposure</span>
                                <span className="text-xl font-black font-heading" style={{ color: '#22543D' }}>₹0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-divider" />

                {/* ── CALCULATOR ──────────────────────────────────────────────── */}
                <div className="warm-card p-8 mb-10 scroll-reveal">
                    <h2 className="text-[1.5rem] font-bold font-heading mb-6 flex items-center gap-3" style={{ color: 'var(--warm-charcoal)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: 'var(--warm-border)' }}>
                            <Calculator className="w-5 h-5" style={{ color: 'var(--warm-accent)' }} />
                        </div>
                        Calculate Your Exposure
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[14px] font-bold mb-3" style={{ color: 'var(--warm-charcoal)' }}>
                                {audience === 'ca' ? 'Type of Violation' : 'What went wrong?'}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {violationTypes.map(v => (
                                    <button
                                        key={v.value}
                                        onClick={() => { setViolationType(v.value); setResult(null); setActiveScenario(null); }}
                                        className="text-left text-[14px] px-4 py-3 rounded-xl border transition-all flex justify-between items-center"
                                        style={{ 
                                            background: violationType === v.value ? 'white' : 'transparent',
                                            borderColor: violationType === v.value ? 'var(--warm-accent)' : 'var(--warm-border)',
                                            color: violationType === v.value ? 'var(--warm-charcoal)' : 'var(--warm-text-secondary)',
                                            boxShadow: violationType === v.value ? '0 4px 12px rgba(212, 160, 23, 0.1)' : 'none',
                                            fontWeight: violationType === v.value ? 'bold' : '500'
                                        }}
                                    >
                                        <span>{v.label}</span>
                                        {audience === 'ca' && <span className="text-[10px] font-mono shrink-0 ml-2" style={{ color: 'var(--warm-accent)' }}>{v.caLabel}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[14px] font-bold mb-3" style={{ color: 'var(--warm-charcoal)' }}>
                                {audience === 'ca' ? 'Tax Liability / ITC Amount (₹)' : 'How much GST is on the invoice? (₹)'}
                            </label>
                            <Input type="number" placeholder="e.g. 50000" className="h-12 text-[15px] rounded-xl bg-white border" style={{ borderColor: 'var(--warm-border)' }} value={taxLiability} onChange={e => { setTaxLiability(e.target.value); setResult(null); setActiveScenario(null); }} />
                        </div>
                        
                        {violationType !== 'missing_hsn' && (
                            <div>
                                <label className="block text-[14px] font-bold mb-3" style={{ color: 'var(--warm-charcoal)' }}>
                                    {audience === 'ca'
                                        ? `Delay in Days ${violationType === 'itc_mismatch' ? '(since ITC claimed)' : '(from original due date)'}`
                                        : 'How many days late? (enter 0 if on time)'}
                                </label>
                                <Input type="number" placeholder="e.g. 30" className="h-12 text-[15px] rounded-xl bg-white border" style={{ borderColor: 'var(--warm-border)' }} value={delayDays} onChange={e => { setDelayDays(e.target.value); setResult(null); setActiveScenario(null); }} />
                            </div>
                        )}
                        
                        <button onClick={() => calculate()} className="w-full btn-warm-primary magnetic-btn h-14 text-[16px] flex items-center justify-center gap-2 mt-4">
                            <Calculator className="w-5 h-5" /> Calculate Penalty
                        </button>
                    </div>
                </div>

                {/* ── RESULT ───────────────────────────────────────────────────── */}
                {result && (
                    <div id="calc-result" className="warm-card p-8 mb-10 animate-in fade-in duration-500 shadow-xl" style={{ border: `2px solid ${result.total === 0 ? '#48BB78' : '#F56565'}` }}>
                        {result.total === 0 ? (
                            <>
                                <h3 className="text-[1.5rem] font-bold font-heading mb-3 flex items-center gap-3" style={{ color: '#2F855A' }}>
                                    <CheckCircle2 className="w-7 h-7" /> Zero Penalty Exposure
                                </h3>
                                <p className="text-[15px] font-medium" style={{ color: '#276749' }}>No interest or penalty applies. {audience === 'seller' ? 'Filing on time with the correct tax category means zero financial exposure.' : 'No Section 47/50 exposure. Filed within due date — no demand notice risk.'}</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-[1.5rem] font-bold font-heading mb-6 flex items-center gap-3" style={{ color: '#C53030' }}>
                                    <AlertTriangle className="w-6 h-6" /> Estimated Penalty Exposure
                                </h3>
                                <div className="space-y-4 mb-6">
                                    {result.interest > 0 && (
                                        <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: '#FED7D7' }}>
                                            <span className="text-[15px] font-medium" style={{ color: '#C53030' }}>{audience === 'ca' ? 'Interest (Section 50 @ 18% p.a.)' : 'Interest charged by Government'}</span>
                                            <span className="font-bold text-[16px]" style={{ color: '#9B2C2C' }}>₹{result.interest.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: '#FED7D7' }}>
                                        <span className="text-[15px] font-medium" style={{ color: '#C53030' }}>{audience === 'ca' ? (violationType === 'late_filing' ? 'Late Fee (Section 47)' : 'Penalty') : 'Fine / Late fee'}</span>
                                        <span className="font-bold text-[16px]" style={{ color: '#9B2C2C' }}>₹{result.penalty.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-4 rounded-xl px-5 mt-2" style={{ background: '#FFF5F5' }}>
                                        <span className="font-bold text-[16px] uppercase tracking-wider" style={{ color: '#9B2C2C' }}>Total Exposure</span>
                                        <span className="text-[2rem] font-black font-heading" style={{ color: '#742A2A' }}>₹{result.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="bg-white rounded-xl p-4 mb-6 border shadow-sm" style={{ borderColor: 'var(--warm-border)' }}>
                            {audience === 'ca' ? (
                                <>
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--warm-text-secondary)' }}>Law Reference</p>
                                    <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--warm-charcoal)' }}>{result.lawRef}</p>
                                    <p className="text-[13px]" style={{ color: 'var(--warm-text-secondary)' }}>{result.note}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--warm-text-secondary)' }}>What this means</p>
                                    <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--warm-charcoal)' }}>{result.sellerNote}</p>
                                    <p className="text-[12px] mt-2" style={{ color: '#9E8A78' }}>Technical ref: {result.lawRef}</p>
                                </>
                            )}
                        </div>

                        {audience === 'ca' && result.total > 0 && (
                            <div className="flex gap-3 mb-4">
                                <button onClick={copyCitation} className="flex-1 btn-warm-secondary h-12 text-[13px] bg-white flex justify-center items-center gap-2">
                                    <FileText className="w-4 h-4" /> Copy Citation
                                </button>
                                <button onClick={shareWhatsApp} className="flex-1 h-12 rounded-xl text-[13px] font-bold border flex justify-center items-center gap-2 hover:opacity-80 transition-opacity" style={{ background: '#FFF5F5', borderColor: '#FEB2B2', color: '#C53030' }}>
                                    <Share2 className="w-4 h-4" /> Share via WhatsApp
                                </button>
                            </div>
                        )}

                        {audience === 'seller' && result.total > 0 && (
                            <button onClick={shareWhatsApp} className="w-full h-12 rounded-xl text-[14px] font-bold border flex justify-center items-center gap-2 hover:opacity-80 transition-opacity mb-4" style={{ background: '#FFF5F5', borderColor: '#FEB2B2', color: '#C53030' }}>
                                <Share2 className="w-4 h-4" /> Share with my CA on WhatsApp
                            </button>
                        )}

                        <p className="text-[12px] text-center" style={{ color: '#9E8A78' }}>Estimate only — actual liability may vary. {audience === 'ca' ? 'Rule 142 applies for e-assessment proceedings.' : 'Consult a CA for final assessment.'}</p>
                    </div>
                )}

                {/* ── CTA ──────────────────────────────────────────────────────── */}
                <div className="rounded-3xl p-8 scroll-reveal" style={{ background: 'var(--warm-accent)', color: 'white' }}>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h3 className="text-[1.5rem] font-bold font-heading mb-2">
                                {audience === 'ca' ? 'Validate Client Invoices — ₹99/check' : 'Prevent This Entirely — ₹99/check'}
                            </h3>
                            <p className="text-[15px] opacity-90 mb-6">
                                {audience === 'ca'
                                    ? 'Catch wrong tax types, invalid HSN codes, and ITC eligibility issues before your client files. 15-rule engine, results in 30 seconds.'
                                    : 'Catch wrong tax category, missing product codes, and calculation errors before you file. Our 15-rule GST validation checks every invoice in under 30 seconds.'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                <Link href="/check">
                                    <button className="h-12 px-6 rounded-xl text-[15px] font-bold w-full sm:w-auto transition-transform hover:scale-[1.02]" style={{ background: 'white', color: 'var(--warm-charcoal)' }}>
                                        {audience === 'ca' ? 'Check a Client Invoice' : 'Check My Invoice Now'}
                                    </button>
                                </Link>
                                <Link href="/pricing">
                                    <button className="h-12 px-6 rounded-xl text-[15px] font-bold w-full sm:w-auto border transition-colors hover:bg-white/10" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                                        {audience === 'ca' ? 'View CA Bulk Plans' : 'View Bulk Plans'}
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── Export with Suspense ──────────
export default function GstPenaltyCalculator() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--warm-bg)' }}><div className="animate-pulse font-heading text-xl" style={{ color: 'var(--warm-text-secondary)' }}>Loading calculator…</div></div>}>
            <GstPenaltyCalculatorInner />
        </Suspense>
    );
}
