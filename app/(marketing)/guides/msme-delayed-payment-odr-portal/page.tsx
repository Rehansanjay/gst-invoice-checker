import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/site';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';

const SLUG = 'msme-delayed-payment-odr-portal';
const guide = getGuide(SLUG)!;

export const metadata: Metadata = {
    title: `${guide.metaTitle} | InvoiceCheck.in`,
    description: guide.description,
    alternates: { canonical: `/guides/${SLUG}` },
    openGraph: {
        type: 'article',
        title: guide.metaTitle,
        description: guide.description,
        url: guideUrl(SLUG),
        images: [OG_IMAGE],
    },
};

export default function Page() {
    return (
        <GuideArticle guide={guide}>
            <p>
                If you are searching for MSME Samadhaan, you will find a great deal of guidance
                telling you to file there. That guidance is out of date. The Ministry of MSME
                announced on 3 October 2025 that from <strong>15 October 2025</strong>, all new
                delayed-payment cases under the MSMED Act must be filed on the MSME Online Dispute
                Resolution Portal at <strong>odr.msme.gov.in</strong> instead.
            </p>

            <p>
                Samadhaan remains reachable for tracking cases already lodged, but it does not accept
                new references. This guide covers where a claim goes now, what the law actually
                entitles you to, and what to have ready before you start.
            </p>

            <GuideH2 id="who">Who can file</GuideH2>

            <p>
                The delayed-payment provisions run to <strong>micro and small enterprises only</strong>.
                Medium enterprises are outside them — a distinction a fair amount of published
                material gets wrong, and one worth checking before you spend time on a filing.
            </p>

            <p>
                Registration is evidenced by a Udyam number. The date on the certificate matters as
                much as the number: the registration needs to predate the invoice you are claiming
                on. If you supplied the goods first and registered afterwards, that is a problem you
                want to discover now rather than at the Council.
            </p>

            <GuideNote>
                Format is not the same as verification. A Udyam number in the correct shape —
                UDYAM-XX-00-0000000, with a two-letter state code — tells you nothing about whether
                it is live or whose it is. Verify it on the Udyam portal before relying on it.
            </GuideNote>

            <GuideH2 id="when">When payment actually became overdue</GuideH2>

            <p>
                This is the part most people get wrong, and it is not the invoice date.
            </p>

            <p>
                Section 15 requires payment within the period agreed in writing, which cannot exceed
                forty-five days from the day of acceptance. Where nothing is agreed in writing, the
                period is fifteen days. Section 2(b) then defines the <em>appointed day</em> as the
                day immediately following the expiry of those fifteen days from acceptance.
            </p>

            <p>
                So the clock runs from acceptance or deemed acceptance of the goods or services, not
                from when you raised the invoice, and not from when you chased it. Where a written
                agreement fixes a longer period, Section 15 reads it down to forty-five days
                regardless of what the contract says.
            </p>

            <GuideH2 id="interest">What has accrued since</GuideH2>

            <p>
                Section 16 provides for <strong>compound interest with monthly rests at three times
                the Bank Rate notified by the Reserve Bank of India</strong>. Not simple interest,
                not on request, and not something the buyer has to agree to — it runs from the
                appointed day by operation of the section.
            </p>

            <p>
                Two things follow that are easy to miss. The Bank Rate moves, so a claim running
                across a rate change has to be computed period by period against the rate in force
                during each month rather than one rate applied flat across the whole span. And
                because it compounds monthly, the figure grows faster than a mental estimate
                suggests.
            </p>

            <p>
                You can{' '}
                <Link href="/unpaid-invoice">work out what has accrued on a specific invoice</Link>
                {' '}without signing up for anything — it computes month by month and shows the rate
                it used and where that rate came from.
            </p>

            <GuideH2 id="leverage">The part that actually moves a buyer</GuideH2>

            <p>
                Interest is the visible half. The half that tends to get a finance team&apos;s attention
                sits on their side of the ledger.
            </p>

            <p>
                A buyer cannot claim the expense as a deduction until the sum is actually paid to a
                micro or small supplier. That provision was Section 43B(h) of the Income-tax Act
                1961 and, from 1 April 2026, is Section 37(2)(g) of the Income-tax Act 2025. The
                relief that rescues most of Section 43B — paying before the return filing due date —
                does not extend to this clause.
            </p>

            <p>
                Which means an unpaid invoice sitting across 31 March costs the buyer the deduction
                for that year, on top of the interest they already owe. Most buyers have never had
                this pointed out to them, and most suppliers do not know they can.
            </p>

            <GuideH2 id="before">Before you file</GuideH2>

            <p>
                A reference is stronger for being boring and complete. Have these together:
            </p>

            <ul>
                <li>Your Udyam Registration Certificate, showing a date before the invoice</li>
                <li>The invoice itself, and proof of what was supplied</li>
                <li>Evidence of acceptance or delivery — this is what starts the clock</li>
                <li>Any written agreement on payment terms, if one exists</li>
                <li>A period-by-period interest computation, showing the rate used for each month</li>
                <li>Your correspondence chasing payment, in date order</li>
            </ul>

            <p>
                It is worth writing to the buyer before making a reference, if only because it often
                works. A letter that sets out the sections, states the computed figure and cites its
                source tends to get further than a reminder, and it costs nothing to send.
            </p>

            <GuideH2 id="filing">Where the reference goes</GuideH2>

            <p>
                Section 18 provides for a reference to the Micro and Small Enterprises Facilitation
                Council. Since 15 October 2025 those references are filed at{' '}
                <strong>odr.msme.gov.in</strong>.
            </p>

            <p>
                The ODR portal is not simply Samadhaan renamed. Samadhaan, launched in 2017, was
                principally a complaint registration system. The ODR platform is built to carry the
                matter through — conciliation and, failing that, arbitration — which is closer to
                what Section 18 contemplates.
            </p>

            <GuideNote>
                Filing is free. Nobody needs to charge you to lodge a reference, and if someone
                offers to do it on your behalf for a fee, that fee is for their time rather than for
                access.
            </GuideNote>

            <GuideH2 id="limits">What this guide is not</GuideH2>

            <p>
                This sets out what the provisions say. It does not tell you whether you have a claim,
                what it is worth, or whether filing is the right move in your situation — those are
                legal questions and depend on facts a guide cannot see. If the amount matters, take
                advice from an advocate or a chartered accountant before you act.
            </p>

            <p>
                What you can do without advice is find out what the arithmetic comes to.{' '}
                <Link href="/unpaid-invoice">The calculator</Link> is free, needs no account, and
                shows its working.
            </p>
        </GuideArticle>
    );
}
