import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/site';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';

const SLUG = 'msme-45-day-payment-rule';
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
                Two separate rules get discussed as though they were one. Section 15 of the MSMED Act
                fixes how long a buyer has to pay a micro or small enterprise. Section 16 charges
                interest once that period passes. And a third provision, in the Income-tax Act,
                decides whether the buyer can deduct the expense at all.
            </p>

            <p>
                They interact, and the third is usually the one that gets an invoice paid.
            </p>

            <GuideH2 id="window">Fifteen days, or forty-five</GuideH2>

            <p>
                Section 15 requires payment within the period agreed in writing between the parties,
                and that period <strong>cannot exceed forty-five days from the day of
                acceptance</strong>. Where there is no written agreement, the period is fifteen days.
            </p>

            <p>
                Note what that means for a contract that says ninety days. The section reads it down:
                forty-five is a ceiling, not a default, and an agreement cannot lift it. A buyer
                relying on their standard payment terms to justify a longer wait is relying on
                something the statute overrides.
            </p>

            <p>
                Note also what the clock runs from. Acceptance, or deemed acceptance, of the goods or
                services — not the invoice date, and not the date the invoice was entered in the
                buyer&apos;s system. Section 2(b) then defines the <em>appointed day</em> as the day
                immediately following the expiry of that fifteen-day period.
            </p>

            <GuideNote>
                Deemed acceptance matters here. Where a buyer raises no objection in writing within
                fifteen days of delivery, acceptance is taken to have happened on delivery. A buyer
                cannot hold the clock by simply not responding.
            </GuideNote>

            <GuideH2 id="interest">What accrues afterwards</GuideH2>

            <p>
                Section 16 provides for compound interest with monthly rests at{' '}
                <strong>three times the Bank Rate notified by the Reserve Bank of India</strong>,
                running from the appointed day.
            </p>

            <p>
                It is worth being precise about three things in that sentence, because each is
                commonly stated wrongly:
            </p>

            <ul>
                <li>
                    <strong>Three times the Bank Rate</strong>, which is not the repo rate. The Bank
                    Rate tracks the Marginal Standing Facility and generally sits above repo.
                </li>
                <li>
                    <strong>Compound, with monthly rests.</strong> Interest capitalises each month
                    and the following month is charged on the larger balance. Most published
                    calculations quietly use simple interest.
                </li>
                <li>
                    <strong>Notwithstanding any agreement.</strong> Section 16 opens by overriding
                    anything the parties agreed and anything in any other law for the time being in
                    force. A clause waiving interest does not survive it.
                </li>
            </ul>

            <p>
                Because the Bank Rate moves, a claim spanning a rate change has to be computed period
                by period against the rate in force during each month.{' '}
                <Link href="/unpaid-invoice">The calculator</Link> does that and prints the rate it
                used for each period, along with the source it was read from.
            </p>

            <GuideH2 id="deduction">The rule that actually gets invoices paid</GuideH2>

            <p>
                A buyer cannot claim the expense as a deduction until the sum is actually paid to a
                micro or small enterprise.
            </p>

            <p>
                This was Section 43B(h) of the Income-tax Act 1961, inserted with effect from
                assessment year 2024-25. <strong>From 1 April 2026 the corresponding provision is
                Section 37(2)(g) of the Income-tax Act 2025.</strong> Almost every article written
                about this still refers to it by the old number, which is worth knowing when you are
                reading around the subject.
            </p>

            <p>
                The important detail is the exception. For most items caught by Section 43B, paying
                before the income-tax return due date preserves the deduction for the earlier year.
                Clause (h) was specifically excluded from that relief. There is no second chance: if
                the sum is unpaid at 31 March, the deduction is unavailable for that year entirely.
            </p>

            <p>
                For a buyer in the 30% bracket, an unpaid ₹3,00,000 invoice sitting across year-end
                costs roughly ₹90,000 in lost deduction — on top of interest they already owe under
                Section 16. That arithmetic is usually more persuasive than a reminder email.
            </p>

            <GuideH2 id="both-sides">What each side should do about it</GuideH2>

            <p>
                <strong>If you are owed money</strong>, work out the actual figure before you chase
                it. A letter that states the sections, gives a period-by-period computation and names
                the source of the rate reads very differently from one that asks politely. The
                buyer&apos;s own tax position is worth mentioning, though it is better cited than argued —
                their accountant will know what it means.
            </p>

            <p>
                <strong>If you buy from micro and small enterprises</strong>, the exposure is on your
                side and it is larger than the interest. It is worth knowing which of your vendors
                are registered, since the provisions only bite for those that are, and worth clearing
                those balances before 31 March rather than after.
            </p>

            <GuideNote>
                Classification limits were proposed for revision in Budget 2025-26 — investment
                thresholds up 2.5× and turnover thresholds doubled — which reclassifies vendors from
                FY 2026-27. A supplier who was medium may become small, and come inside these
                provisions for the first time.
            </GuideNote>

            <GuideH2 id="limits">The limits of this</GuideH2>

            <p>
                Everything above describes what the provisions say. It is not advice on your
                situation, it reaches no conclusion about whether any particular sum is recoverable,
                and InvoiceCheck.in is not a law firm. Where the amount matters, take advice.
            </p>

            <p>
                The arithmetic, though, is just arithmetic.{' '}
                <Link href="/unpaid-invoice">Work out what a specific invoice has accrued</Link> —
                free, no account, and it shows every step.
            </p>
        </GuideArticle>
    );
}
