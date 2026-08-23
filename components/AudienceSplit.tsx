import Link from 'next/link';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, ChevronDown } from 'lucide-react';

/**
 * Two doors, directly beneath the hero.
 *
 * WHAT THIS IS FOR
 *
 * A visitor arriving cold does not know what this site is. It has seven tools
 * that solve two quite different problems for two quite different people, and
 * the homepage previously explained one of them and linked to almost none.
 * Someone who files returns and someone chasing an unpaid invoice were being
 * shown the same page and left to work it out.
 *
 * So each box answers three questions in order, because that is the order they
 * are actually asked: is this me, what happens here, and what do I need to
 * have ready. Only then the tools.
 *
 * IT ALSO FIXES A CRAWL PROBLEM
 *
 * Thirteen pages sit at "Discovered — currently not indexed", which is Google
 * declining to spend budget on this domain. Every tool now has a described
 * link from the most-crawled page on it. That is why the tools are visible
 * rather than revealed on click: a link that only exists after an interaction
 * passes no crawl signal, and a door you must open to find out what is behind
 * it is worse than a label you can read.
 *
 * WHY NOT "CA" AND "MSME"
 *
 * MSME is a legal classification, not an identity. A freelancer owed three
 * lakh does not think "I am an MSME" — so that label loses exactly the people
 * it is for. Identity mis-routes anyway: a CA uses the unpaid-invoice tool on
 * a client's behalf. The boxes are named for the situation you are in.
 */

interface Tool {
    href: string;
    name: string;
    detail: string;
}

const ISSUING: Tool[] = [
    { href: '/check', name: 'Check one invoice', detail: 'Sixteen statutory checks, each citing its section' },
    { href: '/bulk', name: 'Check a whole batch', detail: 'A CSV from Tally, Zoho or Busy — worst first' },
    { href: '/gst-penalty-calculator', name: 'Late return calculator', detail: 'What a missed GSTR-1 or 3B costs' },
    { href: '/gst-error-codes', name: 'GSTR-1 error codes', detail: 'Every rejection code, and what triggers it' },
    { href: '/invoice-number-check', name: 'Invoice number check', detail: 'Sixteen characters and the Rule 46(b) limits' },
];

const RECEIVING: Tool[] = [
    { href: '/verify-invoice', name: 'Verify an invoice', detail: 'Whether one you were given is genuine' },
    { href: '/vendor-invoice-check', name: 'Check vendor invoices', detail: 'Before you claim input tax credit' },
    { href: '/unpaid-invoice', name: 'Interest on a late payment', detail: 'What a buyer owes under the MSMED Act' },
];

function Door({
    icon, eyebrow, title, blurb, need, tools, cta, ctaHref,
}: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    blurb: string;
    need: string;
    tools: Tool[];
    cta: string;
    ctaHref: string;
}) {
    // warm-card rather than a hand-rolled shadow. It already carries the
    // resting elevation, the hover lift and the site's easing curve, and every
    // other raised surface here uses it — a second, slightly different shadow
    // would be visible the moment these sat near anything else on the page.
    //
    // The resting shadow is the point. These two are the choice the whole
    // section exists to present, and a flat bordered rectangle reads as a panel
    // of text to skim past rather than an object to pick.
    return (
        <div className="warm-card flex flex-col p-7 md:p-8 h-full">
            <div className="flex items-center gap-2.5 mb-4">
                <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-accent)' }}
                >
                    {icon}
                </span>
                <span
                    className="text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: 'var(--warm-accent)' }}
                >
                    {eyebrow}
                </span>
            </div>

            <h3 className="text-[1.4rem] md:text-[1.6rem] leading-tight font-heading mb-3" style={{ color: 'var(--warm-charcoal)' }}>
                {title}
            </h3>

            <p className="text-[15px] leading-relaxed mb-5" style={{ color: 'var(--warm-charcoal-soft)' }}>
                {blurb}
            </p>

            {/* The question nobody answers on a landing page, and everybody has. */}
            <div
                className="rounded-xl px-4 py-3 mb-6"
                style={{ background: 'var(--warm-bg-alt)' }}
            >
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--warm-text-secondary)' }}>
                    What you need
                </span>
                <p className="text-[13.5px] mt-1 leading-snug" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    {need}
                </p>
            </div>

            <ul className="mb-7 space-y-0">
                {tools.map((t) => (
                    <li key={t.href}>
                        <Link
                            href={t.href}
                            className="group flex items-baseline gap-2 py-2.5"
                            style={{ borderTop: '1px solid var(--warm-border-light)' }}
                        >
                            <ArrowRight
                                className="w-3.5 h-3.5 shrink-0 self-center transition-transform group-hover:translate-x-0.5"
                                style={{ color: 'var(--warm-accent)' }}
                            />
                            <span className="text-[14.5px] font-semibold group-hover:underline underline-offset-4" style={{ color: 'var(--warm-charcoal)' }}>
                                {t.name}
                            </span>
                            <span className="text-[13px] hidden sm:inline" style={{ color: 'var(--warm-text-secondary)' }}>
                                — {t.detail}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>

            <Link href={ctaHref} className="mt-auto block">
                <span className="btn-warm-primary magnetic-btn w-full h-12 text-[15px] flex items-center justify-center gap-2">
                    {cta}
                    <ArrowRight className="w-4 h-4" />
                </span>
            </Link>
        </div>
    );
}

export default function AudienceSplit() {
    return (
        <section
            id="where-you-fit"
            className="py-16 md:py-24"
            style={{ background: 'var(--warm-cream-dark)', borderBottom: '1px solid var(--warm-border)' }}
        >
            <div className="container mx-auto px-5 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">

                    <div className="mb-10 md:mb-12 max-w-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--warm-accent)' }}>
                            Start here
                        </span>
                        <h2
                            className="mt-3 text-[1.9rem] md:text-[2.5rem] leading-[1.1] font-heading"
                            style={{ color: 'var(--warm-charcoal)' }}
                        >
                            Which side of the invoice are you on?
                        </h2>
                        <p className="mt-4 text-[16px] leading-relaxed" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            InvoiceCheck reads an invoice and tells you what is wrong with it before
                            somebody else does — the GST portal, a marketplace, or a customer who has
                            stopped paying. Two situations, two sets of tools.
                        </p>
                    </div>

                    <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 items-stretch">
                        <Door
                            icon={<ArrowUpRight className="w-[18px] h-[18px]" />}
                            eyebrow="You send invoices"
                            title="Catch it before the portal does"
                            blurb="Wrong tax head, a short HSN code, arithmetic that does not reconcile — the portal rejects the whole return and you find out at filing time. This finds them first, and every flag cites the section it comes from."
                            need="One invoice in front of you, or a CSV export from Tally, Zoho, Busy or the GSTR-1 offline tool."
                            tools={ISSUING}
                            cta="Check a batch — free"
                            ctaHref="/bulk"
                        />
                        <Door
                            icon={<ArrowDownLeft className="w-[18px] h-[18px]" />}
                            eyebrow="You receive them"
                            title="Check what arrives, chase what does not"
                            blurb="A supplier's mistake costs you the input tax credit, and a customer who pays late owes you statutory interest whether they know it or not. Both are things you can check in under a minute."
                            need="The invoice you were given, or the date and amount of one that has not been paid."
                            tools={RECEIVING}
                            cta="Work out what you are owed"
                            ctaHref="/unpaid-invoice"
                        />
                    </div>

                    <p className="mt-8 text-[14px]" style={{ color: 'var(--warm-text-secondary)' }}>
                        Everything above runs free and without an account.{' '}
                        <Link href="/pricing" className="font-semibold underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                            ₹99 unlocks the fixes
                        </Link>{' '}
                        on a single invoice check — the corrected values and how to put each one right.
                    </p>

                    {/*
                      The boxes answer "which one is mine". Plenty of people
                      will not pick either until they know what the thing
                      actually does to an invoice, and that is the section
                      below — so say what is down there rather than leaving a
                      bare chevron to be interpreted.

                      A real anchor, not a scroll handler: it works without
                      JavaScript, survives a right-click, and is one more
                      internal link on a page that needs them.
                    */}
                    <div className="mt-14 flex justify-center">
                        <a
                            href="#how-it-works"
                            className="group flex flex-col items-center gap-2 py-2"
                            aria-label="See what the check actually does to an invoice"
                        >
                            <span
                                className="text-[13.5px] font-semibold transition-colors group-hover:underline underline-offset-4"
                                style={{ color: 'var(--warm-charcoal-soft)' }}
                            >
                                Not sure yet? See what it actually checks
                            </span>
                            <span
                                className="scroll-cue-arrow w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-accent)' }}
                            >
                                <ChevronDown className="w-[18px] h-[18px]" />
                            </span>
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
}
