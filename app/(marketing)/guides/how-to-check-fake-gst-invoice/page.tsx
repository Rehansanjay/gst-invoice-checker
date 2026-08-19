import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';
import { OG_IMAGE } from '@/lib/site';

const SLUG = 'how-to-check-fake-gst-invoice';
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
            {/* Direct answer first. Someone scanning — or a model summarising —
                should be able to lift the whole method from one paragraph before
                any preamble. */}
            <p className="text-lg" style={{ color: 'var(--warm-charcoal)' }}>
                <strong>The short answer:</strong> a GST invoice can be checked by verifying six
                things — that the supplier&apos;s GSTIN is valid and active, that the invoice carries
                every particular Rule 46 requires, that the tax rate is one of the notified slabs,
                that the HSN or SAC code fits the goods or service, that the invoice number and date
                are within the permitted format and window, and that the supplier has actually
                reported the invoice in their return. The first five you can check from the invoice
                itself in a couple of minutes. The sixth needs the GST portal.
            </p>

            <p>
                Fabricated invoices circulate for two reasons: to claim input tax credit that was
                never paid, and to extract payment for goods or services that were never supplied.
                Either way the person holding the invoice carries the loss, which is why it is worth
                a few minutes before you pay or claim against one.
            </p>

            <GuideH2 id="check-1">1. Verify the GSTIN — structure, then status</GuideH2>
            <p>
                A GSTIN is exactly 15 characters: a 2-digit state code, a 10-character PAN, one
                entity code, the letter Z, and a checksum character derived from the preceding
                fourteen. A number invented at random almost never satisfies that checksum, so a
                structurally invalid GSTIN is the single strongest signal that an invoice is not
                genuine.
            </p>
            <p>
                Structure alone is not enough, though. Search the GSTIN on the{' '}
                <a href="https://services.gst.gov.in/services/searchtp" rel="nofollow noopener" target="_blank" className="underline">
                    GST portal&apos;s Search Taxpayer
                </a>{' '}
                page — it is public and needs no login — and confirm three things: the registration
                is <strong>Active</strong> rather than cancelled or suspended, the legal name matches
                the name printed on the invoice, and the state matches the first two digits.
            </p>
            <GuideNote>
                <p>
                    A cancelled GSTIN is the case people miss. The number is real and passes every
                    format check, because it was genuinely issued — it has simply since been
                    cancelled. Invoices issued against it are not valid for input tax credit.
                </p>
            </GuideNote>

            <GuideH2 id="check-2">2. Check the mandatory particulars</GuideH2>
            <p>
                Rule 46 of the CGST Rules lists what a tax invoice must contain, and a fabricated
                document usually omits something. The ones most often missing: place of supply with
                the State named, the HSN or SAC code, whether tax is payable on reverse charge, and
                a signature or digital signature.
            </p>
            <p>
                The full list is in the{' '}
                <Link href="/guides/gst-invoice-mandatory-fields" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    Rule 46 guide
                </Link>
                . An invoice missing a mandatory particular is not a valid tax invoice regardless of
                whether it was issued in good faith.
            </p>

            <GuideH2 id="check-3">3. Check the tax rate is a notified slab</GuideH2>
            <p>
                GST rates come from a fixed set of notified slabs. A rate outside that set — an
                arbitrary 15%, or an effective figure produced by working backwards from a round
                total — is not something a compliant billing system produces. Fabricated invoices
                frequently carry a rate chosen to make the total look tidy.
            </p>

            <GuideH2 id="check-4">4. Check the HSN or SAC code fits</GuideH2>
            <p>
                Every line should carry an HSN code for goods or a SAC for services, at the number of
                digits the supplier&apos;s turnover requires. Two things to look for: a code that
                does not exist, and a code that exists but has nothing to do with what is being
                billed. The second is more common — a plausible-looking code copied from another
                invoice, attached to an unrelated product.
            </p>

            <GuideH2 id="check-5">5. Check the invoice number and date</GuideH2>
            <p>
                An invoice number may be at most 16 characters, must be unique within the financial
                year, and is restricted to letters, digits, hyphen and slash. A number longer than
                that, or containing other punctuation, did not come from a compliant system.
            </p>
            <p>
                On dates, two things are worth a look: an invoice dated in the future, and an invoice
                dated before the supplier&apos;s registration took effect — the registration date is
                visible on the portal alongside the GSTIN.
            </p>

            <GuideH2 id="check-6">6. Check the supplier actually reported it</GuideH2>
            <p>
                This is the one that cannot be done from the invoice, and it is also the one that
                decides your input tax credit. Under Section 16(2)(c) of the CGST Act, credit
                depends on the tax having actually been paid to the government. An invoice can be
                perfect on its face and still leave you with nothing if the supplier never reported
                it.
            </p>
            <p>
                The practical check is whether the invoice appears in your GSTR-2B for the relevant
                period. If it does not, the supplier has not reported it, and no amount of
                verification of the paper will change that.
            </p>

            <GuideH2 id="e-invoice">A shortcut: the e-invoice QR code</GuideH2>
            <p>
                Suppliers above the e-invoicing turnover threshold must obtain an Invoice Reference
                Number from the Invoice Registration Portal, and the invoice must carry a signed QR
                code. If the supplier is within that net, the presence of a valid IRN and QR is
                strong evidence the invoice is real, because it means the invoice was registered
                with the government at the moment it was issued. Its absence, on a supplier who
                should have one, is a serious red flag.
            </p>

            <GuideH2 id="what-fakes-get-wrong">What a fabricated invoice usually gets wrong</GuideH2>
            <ul className="list-disc space-y-2 pl-6">
                <li>A GSTIN that fails the checksum, or belongs to a cancelled registration.</li>
                <li>Tax that does not reconcile — taxable value × rate not matching the tax shown.</li>
                <li>CGST and SGST that are not equal halves of the total tax.</li>
                <li>A missing place of supply, or one inconsistent with the tax heads charged.</li>
                <li>An invoice number that is too long, or in a format no billing system produces.</li>
                <li>Round-number totals arrived at by adjusting the tax rather than the price.</li>
            </ul>

            <GuideH2 id="what-to-do">If an invoice fails these checks</GuideH2>
            <ol className="list-decimal space-y-2 pl-6">
                <li>
                    Do not pay it, and do not claim credit against it, until the supplier has
                    explained the discrepancy.
                </li>
                <li>
                    Ask for a corrected invoice in writing. A genuine supplier with a data-entry
                    error will reissue without argument; that response is itself informative.
                </li>
                <li>
                    Check whether other invoices from the same supplier share the defect. A wrong
                    GSTIN in their master repeats on every document.
                </li>
                <li>
                    If you believe the invoice is deliberately fabricated, it can be reported to the
                    GST authorities through the grievance facility on the GST portal.
                </li>
            </ol>

            <GuideH2 id="automate">Checking this automatically</GuideH2>
            <p>
                Five of the six checks above read only the invoice: the GSTIN structure, the
                mandatory particulars, the rate, the HSN, and the numbering and dates. Those are
                mechanical, and doing them by hand across three different websites is what makes
                people skip them.
            </p>
            <p>
                You can run all five at once with the{' '}
                <Link href="/verify-invoice" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    invoice verification check
                </Link>
                , or a whole batch of supplier invoices with the{' '}
                <Link href="/vendor-invoice-check" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    vendor invoice check
                </Link>
                . The sixth — whether the supplier reported it — genuinely requires the portal, and
                no tool that reads only the invoice can tell you otherwise.
            </p>
        </GuideArticle>
    );
}
