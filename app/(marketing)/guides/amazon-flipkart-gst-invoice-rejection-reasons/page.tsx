import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';

const SLUG = 'amazon-flipkart-gst-invoice-rejection-reasons';
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
    },
};

export default function Page() {
    return (
        <GuideArticle guide={guide}>
            <p>
                Marketplace invoice validation is automated, and the feedback you get is usually a
                status flag rather than an explanation. The invoice is marked non-compliant, the
                payout moves to hold, and you are left comparing documents line by line to work out
                which field did it.
            </p>
            <p>
                The checks themselves are not mysterious. They are the statutory invoice
                requirements under Rule 46 of the CGST Rules plus arithmetic verification. Below are
                the ones that fail most often, in roughly the order we see them.
            </p>

            <GuideH2 id="tax-head">1. Wrong tax head — IGST charged instead of CGST + SGST</GuideH2>
            <p>
                The most common failure by a wide margin, and the most expensive, because the total
                tax often looks correct. The trigger is usually a buyer whose GSTIN belongs to one
                state while delivery goes to a warehouse in another. Place of supply decides this,
                not the billing address — the{' '}
                <Link href="/guides/igst-vs-cgst-sgst-place-of-supply" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    place of supply guide
                </Link>{' '}
                works through the cases.
            </p>

            <GuideH2 id="gstin">2. Invalid or inactive GSTIN</GuideH2>
            <p>
                A GSTIN is 15 characters with a fixed structure: two-digit state code, ten-character
                PAN, one entity code, the letter Z, and a checksum character. A transposed digit
                still looks plausible to a human and fails the checksum instantly.
            </p>
            <p>
                Format is only half of it. A GSTIN that was valid when you onboarded the buyer may
                since have been cancelled or suspended, and an invoice against a cancelled
                registration is not going to survive validation — or give your buyer usable credit.
            </p>

            <GuideH2 id="hsn">3. Missing, short, or wrong HSN / SAC code</GuideH2>
            <p>
                HSN reporting requirements scale with turnover, and the number of digits matters:
                businesses above the prescribed threshold must report six digits, smaller ones four.
                Reporting a four-digit code where six are required is a rejection, even though the
                code itself is correct as far as it goes.
            </p>
            <p>
                The subtler version is an HSN code that is valid but does not carry the rate you
                applied. The code and the rate have to agree with each other.
            </p>

            <GuideH2 id="math">4. Tax arithmetic that does not reconcile</GuideH2>
            <p>
                Taxable value multiplied by rate must equal the tax charged, per line, and the line
                totals must sum to the invoice total. Rounding applied per line and again at the
                bottom introduces a rupee or two of drift, and an automated check does not care that
                the difference is small.
            </p>
            <GuideNote>
                <p>
                    Discounts are a frequent cause here. A discount shown after the tax computation
                    rather than deducted from taxable value before it produces an invoice where
                    every number is individually defensible and the totals still do not tie.
                </p>
            </GuideNote>

            <GuideH2 id="mandatory">5. A missing mandatory field</GuideH2>
            <p>
                Rule 46 lists what a tax invoice must contain. The ones most often left off:
                place of supply on inter-state supplies, the recipient&apos;s state and state code,
                the HSN summary, and a declaration where the invoice is signed digitally. An invoice
                missing any of them is not a valid tax invoice regardless of how correct the tax is.
            </p>

            <GuideH2 id="numbering">6. Invoice numbering breaks the rules</GuideH2>
            <p>
                Invoice numbers must be consecutive, unique within the financial year, and no longer
                than 16 characters. Series that restart mid-year, duplicate across sales channels,
                or carry characters outside letters, digits, hyphen and slash all cause problems —
                and duplicates in particular tend to surface later as a GSTR-1 upload failure rather
                than at invoice time.
            </p>

            <GuideH2 id="dates">7. Invoice date outside the acceptable window</GuideH2>
            <p>
                An invoice dated after the shipment, dated in a return period you have already
                filed, or backdated into a closed period will be flagged. Time-of-supply rules fix
                when the invoice must be raised — for goods, on or before removal or delivery.
            </p>

            <GuideH2 id="rcm">8. Reverse charge flagged incorrectly</GuideH2>
            <p>
                The reverse charge field is a yes or no that changes who pays. Marking a normal
                supply as reverse charge means you have charged tax on a document that says the
                recipient owes it, which is contradictory on its face. The reverse mistake — a
                genuine RCM supply not flagged — leaves the tax unpaid by anyone.
            </p>

            <GuideH2 id="einvoice">9. Missing IRN or QR code where e-invoicing applies</GuideH2>
            <p>
                If your aggregate turnover crosses the e-invoicing threshold, a B2B invoice without
                an Invoice Reference Number and signed QR code from the IRP is not a valid invoice
                at all, and your buyer cannot claim credit against it. The threshold has been
                lowered repeatedly, so a business that was outside the net last year may be inside
                it now without having noticed.
            </p>

            <GuideH2 id="what-to-do">If a payment is already on hold</GuideH2>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    Fix the invoice at source rather than editing the PDF — the version that has to
                    be correct is the one that reaches GSTR-1.
                </li>
                <li>
                    If the original was already reported, correct it with a credit note or an
                    amendment in the next GSTR-1 rather than silently reissuing the same number.
                </li>
                <li>
                    Check whether the same defect affects the rest of the batch. Wrong tax heads and
                    short HSN codes are configuration problems, so they are rarely isolated.
                </li>
                <li>
                    Re-validate before resubmitting, so you are not spending another cycle finding
                    out about the second error after fixing the first.
                </li>
            </ul>

            <p>
                The{' '}
                <Link href="/check" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    invoice checker
                </Link>{' '}
                runs all of the above in one pass and tells you which line failed and why.
            </p>
        </GuideArticle>
    );
}
