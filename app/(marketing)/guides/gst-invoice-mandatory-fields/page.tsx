import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';
import { OG_IMAGE } from '@/lib/site';

const SLUG = 'gst-invoice-mandatory-fields';
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
                Rule 46 of the CGST Rules, 2017 lists the particulars a tax invoice must carry.
                It is a dull list, and that is exactly why invoices fail on it — the tax is
                usually right and a field is simply missing. An invoice short of a mandatory
                particular is not a valid tax invoice, and your buyer&apos;s input tax credit
                rests on it being one.
            </p>

            <GuideH2 id="the-list">The full list</GuideH2>
            <p>Every tax invoice must contain:</p>
            <ul className="list-disc space-y-2 pl-6">
                <li>Name, address and GSTIN of the supplier.</li>
                <li>
                    A consecutive serial number, unique for the financial year, no longer than
                    16 characters, using only letters, digits, hyphen and slash.
                </li>
                <li>Date of issue.</li>
                <li>Name, address and GSTIN or UIN of the recipient, if they are registered.</li>
                <li>
                    Where the recipient is <strong>unregistered</strong> and the taxable value is
                    ₹50,000 or more: their name and address, the address of delivery, and the
                    State together with its code.
                </li>
                <li>HSN code for goods, or SAC for services.</li>
                <li>Description of the goods or services.</li>
                <li>Quantity, with unit or Unique Quantity Code, for goods.</li>
                <li>Total value of the supply.</li>
                <li>Taxable value, after any discount or abatement.</li>
                <li>Rate of tax — central, State, integrated, Union territory, and cess.</li>
                <li>Amount of tax charged, broken out by each of those heads.</li>
                <li>
                    Place of supply along with the name of the State, for inter-state supplies.
                </li>
                <li>Address of delivery, where it differs from the place of supply.</li>
                <li>Whether tax is payable on a reverse charge basis.</li>
                <li>Signature or digital signature of the supplier or their authorised representative.</li>
            </ul>

            <GuideH2 id="most-missed">The four that actually get left off</GuideH2>
            <p>
                In practice the list above fails in a small number of predictable places.
            </p>

            <div className="space-y-4">
                <p>
                    <strong>1. Place of supply with the State name.</strong> Plenty of invoices
                    carry a state code buried in the buyer&apos;s GSTIN and nothing else. On an
                    inter-state supply the place of supply must appear as its own particular,
                    with the State named. This is also the field that decides whether you charge
                    IGST or CGST + SGST, so getting it wrong breaks two things at once — see the{' '}
                    <Link href="/guides/igst-vs-cgst-sgst-place-of-supply" className="underline" style={{ color: 'var(--warm-accent)' }}>
                        place of supply guide
                    </Link>
                    .
                </p>
                <p>
                    <strong>2. The reverse charge flag.</strong> A yes-or-no field that changes who
                    owes the tax. Software often omits it entirely rather than printing
                    &quot;No&quot;, which leaves the position ambiguous on the face of the document.
                </p>
                <p>
                    <strong>3. The unregistered-recipient block above ₹50,000.</strong> Sellers
                    treat B2C invoices as needing nothing about the buyer. Past ₹50,000 of taxable
                    value that stops being true: name, address, delivery address, State and State
                    code all become mandatory.
                </p>
                <p>
                    <strong>4. Signature or digital signature.</strong> Routinely dropped from
                    system-generated PDFs. Rule 46 requires it, whether as a digital signature or
                    the signature of an authorised person.
                </p>
            </div>

            <GuideNote>
                <p>
                    The serial number trips people up structurally rather than by omission. It must
                    be unique across the financial year and at most 16 characters. Numbering schemes
                    that concatenate branch, year and sequence overrun that limit and are rejected
                    on upload — see{' '}
                    <Link href="/gst-error-codes/ret191115" className="underline" style={{ color: 'var(--warm-accent)' }}>
                        RET191115
                    </Link>
                    .
                </p>
            </GuideNote>

            <GuideH2 id="hsn-digits">How many HSN digits you need</GuideH2>
            <p>
                Reporting a valid code at the wrong length is still a failure. The number of digits
                required scales with aggregate annual turnover, and the thresholds have been
                tightened by notification more than once — smaller businesses report fewer digits,
                larger ones must report more. Confirm the digit requirement for your current
                turnover band before you file, rather than assuming last year&apos;s setting still
                applies.
            </p>

            <GuideH2 id="consequences">What a missing field actually costs</GuideH2>
            <p>
                The immediate cost lands on your buyer. Input tax credit under Section 16 depends on
                holding a valid tax invoice, so a defective document puts their credit at risk — and
                they will notice at reconciliation, after they have paid you. For a marketplace or a
                larger buyer, that is the point at which payment stops.
            </p>
            <p>
                For you, the correction is rarely a quiet edit. If the invoice has already been
                reported in GSTR-1, fixing it means a credit note or an amendment in a later return,
                not a re-issue under the same number.
            </p>

            <GuideH2 id="checklist">Before you file</GuideH2>
            <ul className="list-disc space-y-2 pl-6">
                <li>Both GSTINs present, 15 characters, correct structure.</li>
                <li>Serial number unique for the year and 16 characters or fewer.</li>
                <li>Place of supply present with the State named, on every inter-state supply.</li>
                <li>Reverse charge stated explicitly, even when it is &quot;No&quot;.</li>
                <li>HSN or SAC present, at the digit length your turnover requires.</li>
                <li>Tax heads consistent — CGST + SGST, or IGST, never a mix.</li>
                <li>Taxable value × rate equals the tax shown, per line.</li>
                <li>Signature or DSC present.</li>
            </ul>

            <p>
                Most of these are mechanical, which means they are worth checking automatically
                rather than by eye. You can run a single invoice through the{' '}
                <Link href="/check" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    invoice checker
                </Link>
                , or a whole batch before filing with the{' '}
                <Link href="/bulk" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    bulk pre-filing check
                </Link>
                .
            </p>
        </GuideArticle>
    );
}
