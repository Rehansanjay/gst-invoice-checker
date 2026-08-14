'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useScrollReveal } from '@/lib/useScrollReveal';
import {
  CheckCircle2, Clock, ArrowRight, Zap, ShieldCheck,
  Calculator, FileCheck, ArrowUpRight,
  Sparkles, BadgeCheck, Scale, FileWarning, Receipt,
  Building2, CheckCircle, AlertCircle, RefreshCcw,
  ChevronDown, ArrowRightCircle, Target, Database, FileText, Timer
} from 'lucide-react';
import Link from 'next/link';
import GetStartedModal from '@/components/GetStartedModal';
import LoggedInHome from '@/components/LoggedInHome';

/* ── 1. Premium Hero Mockup ──────────────────────────── */
function HeroMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#FDFCFB', border: '1px solid var(--warm-border)' }}>
      {/* Browser Header */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center px-5 gap-2" style={{ background: 'rgba(250, 248, 246, 0.95)', borderBottom: '1px solid var(--warm-border)', backdropFilter: 'blur(10px)' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: '#E8E0D8' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#E8E0D8' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#E8E0D8' }} />
      </div>

      <div className="pt-20 px-6 pb-6 h-full flex flex-col justify-center">
        <div className="space-y-4">
          {[
            { label: 'GSTIN Verified', delay: '0s' },
            { label: 'Tax Types Matching', delay: '0.1s' },
            { label: 'HSN Code Valid', delay: '0.2s' },
            { label: 'Totals Accurately Calculated', delay: '0.3s' },
            { label: 'Ready for Safe Submission', delay: '0.4s' }
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm"
              style={{
                border: '1px solid var(--warm-border)',
                animation: `checkSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${item.delay} both`
              }}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F4FAF6' }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--warm-success)' }} />
              </div>
              <div className="h-2 w-32 rounded-full" style={{ background: 'var(--warm-bg-alt)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 3. Interactive Feature Tabs ───────────────────────── */
function InteractiveFeatureTabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: 'Identity Verification',
      icon: <Target className="w-4 h-4" />,
      desc: 'Validating GSTIN formats, active status, and supplier/buyer mismatches.',
      checks: ['15-digit GSTIN format', 'Live Government Portal Status', 'Distinct Supplier/Buyer match']
    },
    {
      id: 1,
      title: 'Tax & Compliance',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Ensuring correct tax types based on Place of Supply and HSN rules.',
      checks: ['IGST vs CGST/SGST routing', 'HSN Code validity', 'Reverse Charge (RCM) applicability']
    },
    {
      id: 2,
      title: 'Math Accuracy',
      icon: <Calculator className="w-4 h-4" />,
      desc: 'Recalculating every line item to ensure sub-totals match tax rates exactly.',
      checks: ['Line item recalculation', 'Tax rate verification per HSN', 'Invoice total rounding checks']
    }
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div className="space-y-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'hover-glow-border shadow-lg' : 'hover:bg-warm-bg-alt'}`}
            style={{
              background: activeTab === tab.id ? 'white' : 'transparent',
              border: `1px solid ${activeTab === tab.id ? 'var(--warm-border)' : 'transparent'}`
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: activeTab === tab.id ? '#FEF3E2' : 'var(--warm-bg-alt)', color: activeTab === tab.id ? 'var(--warm-accent)' : 'var(--warm-charcoal)' }}>
                {tab.icon}
              </div>
              <h3 className="text-[1.15rem] font-bold font-heading" style={{ color: 'var(--warm-charcoal)' }}>{tab.title}</h3>
            </div>
            <p className="text-[14px] leading-relaxed ml-11" style={{ color: 'var(--warm-text-secondary)' }}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="relative h-[320px] rounded-3xl p-8 overflow-hidden shadow-xl" style={{ background: 'var(--warm-charcoal)' }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{ background: 'radial-gradient(circle at top right, var(--warm-accent), transparent 70%)' }} />

        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-8 transition-all duration-500 flex flex-col justify-center ${activeTab === tab.id ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 z-0'}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(250, 248, 246, 0.1)', color: 'var(--warm-cream)' }}>
              {tab.icon}
            </div>
            <h4 className="text-2xl font-heading mb-4" style={{ color: 'var(--warm-cream)' }}>{tab.title} Auditing</h4>
            <ul className="space-y-4">
              {tab.checks.map((check, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warm-accent)' }} />
                  <span className="text-[15px]" style={{ color: '#B8A895' }}>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. FAQ Accordion ──────────────────────────────────── */
function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is my invoice data secure?',
      a: 'Free checks are processed in memory and never written to our database — nothing about that invoice is kept. If you pay for a full report, we do store the invoice details, because that is what lets you re-open, download and email the report afterwards. We never sell your data or use it to train AI models, and you can ask us to delete a stored check at any time. Our Privacy Policy sets out exactly what is kept and for how long.'
    },
    {
      q: 'Why use this instead of a CA?',
      a: 'CAs charge upwards of ₹500 per invoice check and usually take 24-48 hours. InvoiceCheck.in runs the exact same statutory validation algorithms in 15 seconds for a fraction of the cost, giving you instant clarity.'
    },
    {
      q: 'What if the government GST portal is down?',
      a: 'We use highly redundant caching and alternate API gateways. If the primary portal is completely inaccessible, we still run 10 offline heuristic checks (math, structural rules) and flag the portal-dependent checks for later review.'
    },
    {
      q: 'Does this integrate with Tally or Zoho?',
      a: 'Not directly yet. We are building our API to plug directly into major ERPs. For now, you can instantly check any generated invoice PDF before you upload it to your buyer marketplace.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-2xl overflow-hidden hover-glow-border" style={{ background: 'white', border: '1px solid var(--warm-border)' }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full px-6 py-5 flex items-center justify-between text-left"
          >
            <span className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>{faq.q}</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} style={{ color: 'var(--warm-text-secondary)' }} />
          </button>
          <div className={`accordion-content ${openIndex === i ? 'open' : ''}`}>
            <div className="accordion-inner">
              <div className="px-6 pb-6 text-[14.5px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>
                {faq.a}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────── */
export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const scrollRef = useScrollReveal();

  if (!loading && user) {
    return <LoggedInHome />;
  }

  return (
    <div ref={scrollRef} className="min-h-screen flex flex-col" style={{ background: 'var(--warm-bg)' }}>
      <GetStartedModal open={showModal} onClose={() => setShowModal(false)} />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--warm-charcoal)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle, #9E542F 0%, transparent 70%)' }} />
          <div className="absolute -bottom-48 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #C4B5A3 0%, transparent 70%)' }} />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 md:py-28 lg:py-36">
            {/* Copy */}
            <div className="max-w-xl">
              <div className="hero-animate-1 mb-8">
                <span className="pill-badge text-xs hover-glow-border cursor-default" style={{
                  background: 'rgba(250, 248, 246, 0.06)',
                  borderColor: 'rgba(250, 248, 246, 0.12)',
                  color: '#C4B5A3',
                }}>
                  <Sparkles className="w-3 h-3" style={{ color: '#D4A056' }} />
                  Trusted by Indian sellers &amp; CA firms
                </span>
              </div>

              <h1 className="hero-animate-2 text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] leading-[1.05] mb-6 font-heading" style={{ color: 'var(--warm-cream)' }}>
                Validate Your GST Invoices{' '}
                <span style={{ color: 'var(--warm-accent)' }}>in 15 Seconds</span>
              </h1>

              <p className="hero-animate-3 text-[1.125rem] sm:text-xl leading-[1.6] mb-10 font-sans" style={{ color: '#B8A895' }}>
                11-point compliance check that catches errors before marketplaces reject your invoices. Save time, protect your cashflow, skip the CA.
              </p>

              <div className="hero-animate-4 flex flex-col sm:flex-row gap-3 mb-10">
                <button
                  onClick={() => user ? router.push('/dashboard') : setShowModal(true)}
                  className="btn-warm-primary magnetic-btn text-[15px] px-7 py-3.5 flex items-center justify-center gap-2"
                >
                  {user ? 'Go to Dashboard' : 'Start Checking — Free'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-warm-secondary magnetic-btn text-[15px] px-7 py-3.5"
                  style={{ borderColor: 'rgba(250, 248, 246, 0.15)', color: 'var(--warm-cream)' }}
                >
                  See How It Works
                </button>
              </div>

              <div className="hero-animate-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                {[
                  { icon: <BadgeCheck className="w-[15px] h-[15px]" style={{ color: '#7EC89B' }} />, text: 'GST Act Compliant' },
                  { icon: <ShieldCheck className="w-[15px] h-[15px]" style={{ color: '#7EC89B' }} />, text: '11 Validation Checks' },
                  { icon: <Timer className="w-[15px] h-[15px]" style={{ color: '#C4B5A3' }} />, text: '15-Second Results' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    {item.icon}
                    <span className="text-[13px] font-medium" style={{ color: '#9E8A78' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="hero-animate-6 hidden lg:block">
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ OPTIMISTIC IMPACT SECTION ═══════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--warm-bg)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="scroll-reveal mb-14 text-center max-w-3xl mx-auto">
              <span className="pill-badge mb-5 text-[12px] hover-glow-border" style={{
                background: '#E8F5EE',
                borderColor: '#C8E6D4',
                color: 'var(--warm-success)',
              }}>
                <ShieldCheck className="w-3 h-3" />
                Financial Peace of Mind
              </span>
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Empowering you to file with absolute certainty
              </h2>
              <p className="text-lg" style={{ color: 'var(--warm-text-secondary)' }}>
                Eliminate the minor compliance errors that cause massive payment holds, ensuring your working capital never stops flowing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 scroll-reveal-stagger">
              {[
                { value: '₹45,000+', label: 'Payments Unblocked', desc: 'Flowing smoothly from marketplaces', color: 'var(--warm-success)' },
                { value: '2-7 Days', label: 'Faster Payouts', desc: 'No more cashflow bottlenecks', color: 'var(--warm-success)' },
                { value: '₹500+', label: 'Saved on CA Fees', desc: 'Per invoice, instantly verified', color: '#B8860B' },
                { value: '100%', label: 'Absolute Clarity', desc: "Always know you're compliant", color: '#B8860B' },
              ].map((item, i) => (
                <div key={i} className="scroll-reveal warm-card p-7 hover-glow-border hover:border-warm-success transition-colors cursor-default">
                  <div className="text-[2.25rem] sm:text-[2.5rem] font-heading mb-3" style={{ color: item.color }}>
                    {item.value}
                  </div>
                  <p className="font-bold text-[15px]" style={{ color: 'var(--warm-charcoal)' }}>{item.label}</p>
                  <p className="text-[13px] mt-1.5" style={{ color: 'var(--warm-text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ THE SOLUTION ═══════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--warm-bg)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="scroll-reveal text-center mb-16 max-w-2xl mx-auto">
              <span className="pill-badge mb-6 text-[12px] hover-glow-border" style={{
                background: '#E8F5EE',
                borderColor: '#C8E6D4',
                color: 'var(--warm-success)',
              }}>
                <CheckCircle2 className="w-3 h-3" />
                Instant Verification
              </span>
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Your proactive defense against compliance risks
              </h2>
              <p className="text-lg" style={{ color: 'var(--warm-text-secondary)' }}>
                Identify and resolve invoice discrepancies instantly, long before they reach your buyers or the government.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 scroll-reveal-stagger">
              {[
                { title: '15 Seconds', desc: 'Lightning-fast results' },
                { title: '₹99 Only', desc: '80% cheaper than CA' },
                { title: '11 Checks', desc: '100% accuracy guaranteed' },
                { title: 'Instant Fix', desc: 'Step-by-step guidance' },
              ].map((item, i) => (
                <div key={i} className="scroll-reveal warm-card p-8 text-center flex flex-col items-center justify-center hover-glow-border cursor-default">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 hover:scale-110" style={{ background: '#E8F5EE', color: 'var(--warm-success)' }}>
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-heading mb-2" style={{ color: 'var(--warm-charcoal)' }}>{item.title}</h3>
                  <p className="text-[14px]" style={{ color: 'var(--warm-text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="py-24 md:py-32" style={{ background: 'var(--warm-cream-dark)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="scroll-reveal text-center mb-16">
              <span className="pill-badge mb-6 text-[12px] inline-flex hover-glow-border" style={{
                background: '#F0EBE5',
                borderColor: '#E8E0D8',
                color: 'var(--warm-charcoal-soft)',
              }}>
                <Zap className="w-3 h-3" />
                Seamless Workflow
              </span>
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Three simple steps to flawless compliance
              </h2>
              <p className="text-[1.0625rem]" style={{ color: 'var(--warm-text-secondary)' }}>
                From raw invoice data to complete confidence in under a minute.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 relative scroll-reveal-stagger">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-[44px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-[1px]" style={{ background: 'var(--warm-text-secondary)', opacity: 0.3 }} />

              {[
                {
                  step: '1',
                  title: 'Enter Invoice Details',
                  desc: 'Fill a simple form with your invoice data (takes 30 seconds).',
                  icon: <Receipt className="w-5 h-5" />
                },
                {
                  step: '2',
                  title: 'Get Instant Report',
                  desc: 'We run 11 validation checks and generate a detailed report.',
                  icon: <FileCheck className="w-5 h-5" />
                },
                {
                  step: '3',
                  title: 'Fix & Submit',
                  desc: 'Follow our guidance to fix errors and submit confidently.',
                  icon: <RefreshCcw className="w-5 h-5" />
                },
              ].map((item, i) => (
                <div key={i} className="scroll-reveal warm-card p-8 relative z-10 flex flex-col text-center hover-glow-border transition-colors group cursor-default">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-heading text-xl mx-auto mb-6 relative group-hover:scale-110 transition-transform duration-300" style={{
                    background: 'var(--warm-charcoal)',
                    color: 'var(--warm-cream)',
                    boxShadow: '0 4px 20px rgba(40, 30, 21, 0.15)',
                  }}>
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-heading mb-3" style={{ color: 'var(--warm-charcoal)' }}>{item.title}</h3>
                  <p className="text-[14.5px] leading-[1.65]" style={{ color: 'var(--warm-text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ WHY THIS MATTERS ═══════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--warm-bg)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="scroll-reveal mb-16 max-w-3xl text-center mx-auto">
              <span className="pill-badge mb-6 text-[12px] inline-flex hover-glow-border" style={{
                background: '#FEF3E2',
                borderColor: '#FCEAC5',
                color: '#8B6914',
              }}>
                <Scale className="w-3 h-3" />
                Risk Mitigation
              </span>
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Transforming statutory risks into guaranteed compliance
              </h2>
              <p className="text-[1.0625rem] leading-[1.65]" style={{ color: 'var(--warm-text-secondary)' }}>
                Indian GST laws impose heavy penalties for minor discrepancies. We insulate your business from these critical vulnerabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 scroll-reveal-stagger">
              {[
                {
                  icon: <AlertCircle className="w-6 h-6" />,
                  title: 'Input Tax Credit Denial',
                  section: 'Section 16',
                  impact: 'Double Taxation',
                  desc: "If your supplier's GSTIN is invalid or returns are not filed, the buyer loses Input Tax Credit. This means you pay tax twice — once to your supplier, and again to the government.",
                },
                {
                  icon: <Clock className="w-6 h-6" />,
                  title: 'Late Filing Penalty',
                  section: 'Section 47',
                  impact: '₹1,500+ / month',
                  desc: "GSTR-1 filed late attracts ₹50/day (₹20/day for NIL returns). A single month's delay on an incorrect invoice can cost thousands in compounding penalties.",
                },
                {
                  icon: <Building2 className="w-6 h-6" />,
                  title: 'Marketplace Payment Holds',
                  section: 'Operations',
                  impact: 'Blocked Working Capital',
                  desc: 'Amazon, Flipkart, and Meesho automatically reject invoices with wrong tax types (IGST vs CGST/SGST), invalid HSN codes, or calculation mismatches — holding your payments for weeks.',
                },
                {
                  icon: <FileCheck className="w-6 h-6" />,
                  title: 'GST Audit Notice',
                  section: 'Section 65',
                  impact: 'Intensive Scrutiny',
                  desc: 'Businesses with turnover above ₹5 crore face mandatory GST audit. Repeated invoice errors create a paper trail of non-compliance that auditors flag immediately.',
                },
              ].map((item, i) => (
                <div key={i} className="scroll-reveal warm-card p-8 group hover-glow-border hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300" style={{ background: '#F5F0EA', color: 'var(--warm-charcoal)' }}>
                      {item.icon}
                    </div>
                    <div className="text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full" style={{ background: 'var(--warm-bg)', color: 'var(--warm-text-secondary)', border: '1px solid var(--warm-border)' }}>
                      {item.section}
                    </div>
                  </div>

                  <h3 className="text-[1.35rem] font-heading mb-2" style={{ color: 'var(--warm-charcoal)' }}>{item.title}</h3>
                  <div className="text-[13px] font-semibold mb-3" style={{ color: 'var(--warm-accent)' }}>
                    Impact: {item.impact}
                  </div>
                  <p className="text-[14.5px] leading-[1.65]" style={{ color: 'var(--warm-text-secondary)' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="scroll-reveal mt-12 text-center">
              <p className="text-[13.5px] inline-flex items-center gap-2" style={{ color: 'var(--warm-text-secondary)' }}>
                <Scale className="w-4 h-4" /> All references from CGST Act, 2017 and CBIC circulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ WHAT WE CHECK (TABS) ═══════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--warm-cream-dark)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="scroll-reveal text-center mb-16 max-w-2xl mx-auto">
              <span className="pill-badge mb-6 text-[12px] hover-glow-border" style={{
                background: '#E8F5EE',
                borderColor: '#C8E6D4',
                color: 'var(--warm-success)',
              }}>
                <ShieldCheck className="w-3 h-3" />
                Comprehensive Auditing
              </span>
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Enterprise-grade validation, delivered in seconds
              </h2>
              <p className="text-[1.0625rem] leading-[1.65]" style={{ color: 'var(--warm-text-secondary)' }}>
                We subject every invoice to the rigorous auditing standards used by top marketplaces and government portals.
              </p>
            </div>

            <div className="scroll-reveal">
              <InteractiveFeatureTabs />
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════ FAQ ACCORDION ═══════════════ */}
      <section className="py-24 md:py-32" style={{ background: 'var(--warm-bg)' }}>
        <div className="container mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="scroll-reveal text-center mb-16">
              <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.05] mb-5 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="scroll-reveal">
              <FAQAccordion />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--warm-charcoal)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.1]" style={{ background: 'radial-gradient(circle, #9E542F 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #C4B5A3 0%, transparent 70%)' }} />
        </div>

        <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-28 md:py-36 text-center relative z-10">
          <div className="scroll-reveal max-w-3xl mx-auto">
            <h2 className="text-[2.25rem] md:text-[3rem] lg:text-[4rem] leading-[1.05] mb-6 font-heading" style={{ color: 'var(--warm-cream)' }}>
              Take control of your GST compliance today
            </h2>
            <p className="text-lg sm:text-xl mb-10" style={{ color: '#B8A895' }}>
              Check your invoices against the GST rules before the portal checks them for you.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="btn-warm-primary magnetic-btn text-[17px] px-10 py-4 inline-flex items-center gap-2.5"
              style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
            >
              Check Your Invoice Now <ArrowUpRight className="w-5 h-5" />
            </button>

            <p className="mt-8 text-[13px] font-medium" style={{ color: '#9E8A78' }}>
              No signup required&nbsp;&nbsp;·&nbsp;&nbsp;Results in 15 seconds&nbsp;&nbsp;·&nbsp;&nbsp;100% secure
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
