'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, ShieldCheck, BookOpen, Timer, ChevronDown, ArrowRight,
  Search, ListChecks, Wrench, BellRing,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { WATCH_PRICE_RUPEES } from '@/lib/watch';
import LoggedInHome from '@/components/LoggedInHome';
import InvoiceVerifier from '@/components/InvoiceVerifier';
import ToolDirectory from '@/components/ToolDirectory';
import SectionHeading from '@/components/SectionHeading';

/*
 * Homepage, reorganised (Sep 2026).
 *
 * It was nine sections and ~8,700px: the same pitch four times, headings in
 * five sizes with mixed alignment, and several claims that were not true
 * ("guaranteed compliance", a "₹45,000 typical payout at risk", a mandatory
 * GST audit above ₹5 crore that was withdrawn in 2021). Now six sections,
 * each with one job:
 *
 *   1. Hero — the H1 the page ranks on, plus the instant verifier.
 *   2. Every tool, grouped by the visitor's side of the invoice.
 *   3. Vendor GST Watch — the early-access test, where it can be seen.
 *   4. How it works, in three steps.
 *   5. FAQ, which also feeds the FAQPage structured data.
 *   6. One closing call to action.
 *
 * No scroll-reveal here: content hidden until an observer fires shows as
 * blank to anyone scrolling fast, and to crawlers and screenshots.
 */

/**
 * Hoisted to module scope so the FAQPage structured data below is generated
 * from the same array the accordion renders, and the two cannot drift.
 */
const HOMEPAGE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Is my invoice data secure?',
    a: 'Free checks are processed in memory and never written to our database — nothing about that invoice is kept. The GSTIN and e-invoice QR checks at the top of this page run entirely in your browser, so nothing is uploaded at all. If you pay for a full report, we do store the invoice details, because that is what lets you re-open, download and email the report afterwards. We never sell your data or use it to train AI models, and you can ask us to delete a stored check at any time.',
  },
  {
    q: 'Does this replace my CA?',
    a: 'No, and it is not meant to. We run 16 mechanical checks on the invoice itself — GSTIN structure, tax head against place of supply, HSN, the arithmetic, invoice numbering and dates. That is the tedious layer, and it is the layer that gets returns rejected on upload. Judgement calls, classification, notices and the return itself are your CA\'s work. It is built to clear the mechanical errors before the professional review starts.',
  },
  {
    q: 'What if the government GST portal is down?',
    a: 'Nothing here depends on it. Every check runs on the invoice itself — GSTIN structure and checksum, tax arithmetic, HSN, numbering and dates — so it works whether the portal is up or not. The one thing only the portal can tell you is whether a GSTIN is currently active, and we link you to the portal search for that.',
  },
  {
    q: 'Does this integrate with Tally or Zoho?',
    a: 'Not directly. You can check any invoice you have generated before you upload it to your buyer or marketplace, or run a whole batch at once on the bulk page.',
  },
];

const STEPS = [
  {
    icon: Search,
    title: 'Check what you have',
    body: 'Paste a GSTIN, upload the QR from an e-invoice, or enter a whole invoice. No sign-up.',
  },
  {
    icon: ListChecks,
    title: 'See what is wrong, and why',
    body: 'Every problem names the rule it breaks, so you can check it yourself or show your CA.',
  },
  {
    icon: Wrench,
    title: 'Fix it, or chase it',
    body: 'Correct your own invoice before you file, or ask the supplier before you pay them.',
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {HOMEPAGE_FAQS.map((faq, i) => (
        <div key={faq.q} className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid var(--warm-border)' }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="text-[16px] font-semibold" style={{ color: 'var(--warm-charcoal)' }}>{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
              style={{ color: 'var(--warm-text-secondary)' }}
            />
          </button>
          <div className={`accordion-content ${openIndex === i ? 'open' : ''}`}>
            <div className="accordion-inner">
              <p className="px-6 pb-6 text-[15px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                {faq.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Shared section frame: one padding scale and one container width for every section. */
function Section({ children, tone = 'bg', id }: { children: React.ReactNode; tone?: 'bg' | 'alt' | 'dark'; id?: string }) {
  const background = tone === 'dark' ? 'var(--warm-charcoal)' : tone === 'alt' ? 'var(--warm-cream-dark)' : 'var(--warm-bg)';
  return (
    <section id={id} className="py-16 md:py-24 scroll-mt-20" style={{ background }}>
      <div className="container mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <LoggedInHome />;
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--warm-bg)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HOMEPAGE_FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      {/* ═══════════════ 1. HERO ═══════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--warm-charcoal)' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(circle, #9E542F 0%, transparent 70%)' }} />
          <div className="absolute -bottom-48 -left-24 h-[400px] w-[400px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, #C4B5A3 0%, transparent 70%)' }} />
        </div>

        <div className="container relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 pt-10 pb-16 md:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <span
                className="pill-badge mb-5 text-xs sm:mb-7"
                style={{ background: 'rgba(250, 248, 246, 0.06)', borderColor: 'rgba(250, 248, 246, 0.12)', color: '#C4B5A3' }}
              >
                <Sparkles className="h-3 w-3" style={{ color: '#D4A056' }} />
                Free · No sign-up needed
              </span>

              <h1 className="font-heading mb-5 text-[2.75rem] leading-[1.05] sm:text-[3.5rem] lg:text-[4rem]" style={{ color: 'var(--warm-cream)' }}>
                Check Your Invoices{' '}
                <span style={{ color: 'var(--warm-accent)' }}>in 15 Seconds</span>
              </h1>

              <p className="mb-6 text-[1.125rem] leading-[1.6] sm:mb-8 sm:text-xl" style={{ color: '#B8A895' }}>
                A 16-point GST compliance check that catches errors before the portal or the marketplace rejects them.
                Fix them in minutes, not next month&apos;s amendment.
              </p>

              <a
                href="#tools"
                className="inline-flex items-center gap-1.5 text-[15px] font-semibold underline-offset-4 hover:underline"
                style={{ color: '#C4B5A3' }}
              >
                Or browse every tool
                <ChevronDown className="h-4 w-4" />
              </a>

              <div className="mt-8 hidden flex-wrap items-center gap-x-5 gap-y-3 sm:flex">
                {[
                  { icon: ShieldCheck, text: '16 validation checks' },
                  { icon: BookOpen, text: 'Every check cites its rule' },
                  { icon: Timer, text: 'Results in seconds' },
                ].map((item) => (
                  <span key={item.text} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#9E8A78' }}>
                    <item.icon className="h-[15px] w-[15px]" style={{ color: '#7EC89B' }} />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {/* The instant verifier: most visitors arrive holding an invoice they received. */}
            <div id="verify" className="scroll-mt-24">
              <InvoiceVerifier />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 2. EVERY TOOL ═══════════════ */}
      <Section id="tools">
        <SectionHeading
          eyebrow="All tools"
          title="Pick the side of the invoice you are on"
          subtitle="Every tool is free to run. Each one does a single job and tells you which rule it is checking."
        />
        <ToolDirectory />
      </Section>

      {/* ═══════════════ 3. VENDOR GST WATCH ═══════════════ */}
      <section className="py-4 md:py-6" style={{ background: 'var(--warm-bg)' }}>
        <div className="container mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div
            className="flex flex-col gap-6 rounded-3xl p-7 sm:p-10 md:flex-row md:items-center md:justify-between"
            style={{ background: 'var(--warm-accent)' }}
          >
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#F5DCCB' }}>
                <BellRing className="h-4 w-4" /> New · early access
              </p>
              <h2 className="font-heading text-[1.9rem] leading-[1.1] sm:text-[2.25rem]" style={{ color: 'var(--warm-cream)' }}>
                Know when a supplier stops filing, before it costs you ITC
              </h2>
              <p className="mt-3 text-[1.0625rem] leading-relaxed" style={{ color: '#F5E6DA' }}>
                Vendor GST Watch checks every supplier&apos;s GSTIN and return filing each month, and alerts you when one
                lapses. ₹{WATCH_PRICE_RUPEES}/month early-access price. Not built yet: tell us if you want it.
              </p>
            </div>
            <Link
              href="/vendor-gst-watch"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-4 text-[16px] font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--warm-cream)', color: 'var(--warm-charcoal)' }}
            >
              Get early access <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. HOW IT WORKS ═══════════════ */}
      <Section>
        <SectionHeading eyebrow="How it works" title="Three steps, no sign-up" />
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl p-6"
              style={{ background: '#fff', border: '1px solid var(--warm-border)', boxShadow: 'var(--warm-card-shadow)' }}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="font-heading flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                  style={{ background: 'var(--warm-charcoal)', color: 'var(--warm-cream)' }}
                >
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5" style={{ color: 'var(--warm-accent)' }} />
              </div>
              <h3 className="font-heading text-[1.35rem] leading-tight" style={{ color: 'var(--warm-charcoal)' }}>{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ═══════════════ 5. FAQ ═══════════════ */}
      <Section tone="alt">
        <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
        <FAQAccordion />
      </Section>

      {/* ═══════════════ 6. CLOSING CTA ═══════════════ */}
      <Section tone="dark">
        <SectionHeading
          tone="dark"
          title="Check an invoice before it costs you"
          subtitle="Start with a GSTIN or an e-invoice QR at the top of the page, or run the full 16-point check."
        />
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#verify" className="btn-warm-primary inline-flex items-center gap-2 px-7 py-4 text-[16px]">
            Check a GSTIN now <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-[16px] font-semibold"
            style={{ border: '1px solid rgba(250, 248, 246, 0.25)', color: 'var(--warm-cream)' }}
          >
            Run the full check
          </Link>
        </div>
      </Section>
    </div>
  );
}
