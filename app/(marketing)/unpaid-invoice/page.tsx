import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, OG_IMAGE } from '@/lib/site';
import UnpaidInvoiceClient from './UnpaidInvoiceClient';

/**
 * Statutory interest on a late payment, for the supplier's side.
 *
 * Every other page here speaks to someone worried about a return being
 * rejected. This one speaks to someone who has not been paid — a different
 * person, a different anxiety, and an audience an order of magnitude larger
 * than CA practices.
 *
 * It ships alone, ahead of the guides that would surround it. The domain has
 * thirteen pages stuck at "Discovered — currently not indexed", which is
 * Google declining to spend crawl budget here; adding a cluster of thin pages
 * to a domain in that state makes it worse, not better. One page that does
 * something, then links to it, then the rest.
 */

export const metadata: Metadata = {
    title: 'Unpaid Invoice Interest Calculator — MSMED Act Section 16 | InvoiceCheck.in',
    description:
        'Work out the interest accrued on a late payment to a micro or small enterprise. Three times the RBI Bank Rate, compounded monthly, computed period by period under section 16 of the MSMED Act 2006. Free, no sign-up.',
    alternates: { canonical: '/unpaid-invoice' },
    openGraph: {
        type: 'website',
        title: 'What is a late payment actually costing? Compute it.',
        description:
            'Interest under section 16 of the MSMED Act — three times the Bank Rate, compounded with monthly rests.',
        url: `${SITE_URL}/unpaid-invoice`,
        images: [OG_IMAGE],
    },
};

export default function UnpaidInvoicePage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'Unpaid Invoice Interest Calculator',
                        url: `${SITE_URL}/unpaid-invoice`,
                        applicationCategory: 'FinanceApplication',
                        operatingSystem: 'Web',
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
                        description:
                            'Computes compound interest with monthly rests at three times the RBI Bank Rate on payments delayed beyond the period allowed by section 15 of the MSMED Act 2006.',
                    }),
                }}
            />

            <div className="mx-auto max-w-5xl">
                <div className="mb-10 max-w-3xl">
                    <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-charcoal-soft)' }}
                    >
                        Free · no sign-up · MSMED Act section 16
                    </span>
                    <h1
                        className="mt-4 text-4xl font-bold leading-tight font-heading sm:text-5xl"
                        style={{ color: 'var(--warm-charcoal)' }}
                    >
                        A late payment is not standing still
                    </h1>
                    <p className="mt-4 text-lg" style={{ color: 'var(--warm-charcoal-soft)' }}>
                        Where a buyer pays a registered micro or small enterprise late, section 16 of the
                        MSMED Act 2006 provides for compound interest with monthly rests at three times the
                        Bank Rate notified by the Reserve Bank. Most suppliers never work out what that
                        comes to. This does.
                    </p>
                </div>

                <UnpaidInvoiceClient />

                <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl">
                    <div>
                        <h2 className="text-xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            When the clock starts
                        </h2>
                        <p className="text-sm mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Not from the invoice date. Section 2(b) puts the appointed day at the day
                            following the expiry of fifteen days from acceptance, so where nothing is agreed
                            in writing, interest runs from the sixteenth day after the goods or services were
                            accepted.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Where a period is agreed in writing, section 16 runs interest from the day after
                            the agreed date instead — and section 15 caps any such agreement at forty-five
                            days, however long the contract says.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            Why period by period
                        </h2>
                        <p className="text-sm mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            The Bank Rate moves. A claim running eighteen months can cross several changes,
                            so each month is computed against the rate in force during it. The single-formula
                            approach most explainers use is only correct while the rate holds still.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Where a period falls outside the rate history we have checked at source, the
                            calculator says so rather than substituting the nearest rate it holds.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            Who the provisions run to
                        </h2>
                        <p className="text-sm mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Micro and small enterprises. Medium enterprises are outside the delayed-payment
                            provisions, which is a distinction a good deal of published material gets wrong.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Registration is evidenced by a Udyam number, and the date on the certificate
                            matters as well as the number. We check the format of what you enter; we do not
                            verify it against the Udyam portal.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold mb-3 font-heading" style={{ color: 'var(--warm-charcoal)' }}>
                            What this page is not
                        </h2>
                        <p className="text-sm mb-3" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            It is a calculator. It does not tell you whether you have a claim, what to do
                            about one, or how any of this applies to your situation — those are legal
                            questions and this is not legal advice.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--warm-charcoal-soft)' }}>
                            Also worth knowing:{' '}
                            <Link href="/vendor-invoice-check" className="underline underline-offset-2" style={{ color: 'var(--warm-accent)' }}>
                                the other side of the same relationship
                            </Link>{' '}
                            — checking supplier invoices before claiming input tax credit.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
