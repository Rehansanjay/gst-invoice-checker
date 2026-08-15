import type { Metadata } from 'next';
import { OG_IMAGE } from '@/lib/site';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';

const SLUG = 'igst-vs-cgst-sgst-place-of-supply';
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
                Almost every GST invoice that gets bounced back has the same root cause: the wrong
                tax heads. The supplier charged IGST when the transaction was intra-state, or split
                it into CGST and SGST when it was inter-state. The total tax amount is often
                identical, which is exactly why it slips past a manual review — and exactly why an
                automated one catches it.
            </p>

            <GuideH2 id="the-rule">The rule in one line</GuideH2>
            <p>
                Compare the <strong>location of the supplier</strong> with the{' '}
                <strong>place of supply</strong>. Same state or union territory means an intra-state
                supply, so you charge CGST + SGST. Different ones mean an inter-state supply, so you
                charge IGST. That is Sections 7 and 8 of the IGST Act, 2017, and there is no third
                option — you never charge all three heads on the same line.
            </p>

            <GuideNote>
                <p>
                    The comparison is <strong>not</strong> supplier state versus buyer&apos;s billing
                    address, and it is not supplier state versus the state named in the
                    buyer&apos;s GSTIN. Both of those are proxies that happen to be right most of
                    the time, which makes the cases where they are wrong very easy to miss.
                </p>
            </GuideNote>

            <GuideH2 id="goods">Place of supply for goods</GuideH2>
            <p>
                Section 10 of the IGST Act governs goods. The cases that matter in practice:
            </p>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>Goods that move.</strong> Place of supply is where the movement
                    terminates for delivery to the recipient. Delivery address wins, not billing
                    address.
                </li>
                <li>
                    <strong>Goods that do not move.</strong> Place of supply is the location of the
                    goods at the time of delivery.
                </li>
                <li>
                    <strong>Bill-to / ship-to.</strong> Where A bills B but ships to C on B&apos;s
                    instruction, the law deems B to have received the goods, so the place of supply
                    is B&apos;s principal place of business — not the state the goods physically
                    landed in. This one causes a lot of wrong-head invoices.
                </li>
                <li>
                    <strong>Exports and supplies to an SEZ.</strong> Treated as inter-state, so
                    IGST — or zero-rated without payment of tax if you supply under a LUT.
                </li>
            </ul>

            <GuideH2 id="services">Place of supply for services</GuideH2>
            <p>
                Section 12 covers services where both parties are in India. The default is simple:
                if the recipient is registered, the place of supply is the recipient&apos;s
                location. If the recipient is unregistered, it is the address on record, and failing
                that, the supplier&apos;s location.
            </p>
            <p>The exceptions override the default, and they are where mistakes cluster:</p>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>Immovable property</strong> — including hotel accommodation, architects
                    and interior decorators: the location of the property, regardless of where
                    either party is registered.
                </li>
                <li>
                    <strong>Restaurant, catering, personal grooming, fitness, beauty</strong>: where
                    the service is actually performed.
                </li>
                <li>
                    <strong>Training and events</strong>: where the event is held, for a registered
                    recipient it is their location.
                </li>
                <li>
                    <strong>Passenger transport</strong>: where the passenger embarks.
                </li>
            </ul>

            <GuideH2 id="examples">Four worked examples</GuideH2>
            <div className="space-y-4">
                <p>
                    <strong>1. Seller in Maharashtra, buyer registered in Maharashtra, delivered in
                    Maharashtra.</strong> Intra-state. CGST + SGST.
                </p>
                <p>
                    <strong>2. Seller in Maharashtra, buyer&apos;s GSTIN is Maharashtra, goods
                    delivered to the buyer&apos;s Gujarat warehouse.</strong> The movement
                    terminates in Gujarat, so the place of supply is Gujarat. Inter-state. IGST.
                    This is the classic e-commerce case, and charging CGST + SGST here because the
                    GSTIN said Maharashtra is a rejection waiting to happen.
                </p>
                <p>
                    <strong>3. Seller in Karnataka, consultancy to a client registered in
                    Delhi.</strong> Recipient is registered, so place of supply is Delhi.
                    Inter-state. IGST — even if every meeting happened in Bengaluru.
                </p>
                <p>
                    <strong>4. Seller in Karnataka, interior design for a property in
                    Karnataka, client registered in Delhi.</strong> The immovable-property exception
                    overrides the default. Place of supply is Karnataka, same as the supplier, so
                    CGST + SGST — and the Delhi client cannot claim that ITC.
                </p>
            </div>

            <GuideH2 id="cost">What it costs you when it is wrong</GuideH2>
            <p>
                Two separate problems. First, your buyer loses input tax credit, because the credit
                sitting in their GSTR-2B is under the wrong head and cannot be used. Marketplaces
                and larger buyers reject on exactly this basis, and your payment sits on hold until
                you issue a corrected document.
            </p>
            <p>
                Second, you have paid the wrong tax to the wrong government. Section 77 of the CGST
                Act and Section 19 of the IGST Act let you pay the correct tax and claim a refund of
                the tax paid wrongly, and interest is not charged on the shortfall in that
                situation. That is a genuine relief, but it still means a refund claim, a credit
                note, and weeks of working capital tied up over what was a one-field mistake.
            </p>

            <GuideH2 id="checklist">Before you issue the invoice</GuideH2>
            <ul className="list-disc pl-6 space-y-2">
                <li>Read the state code from the first two digits of both GSTINs — do not trust the address block.</li>
                <li>Confirm the actual delivery state for goods, and check for a bill-to / ship-to split.</li>
                <li>Check whether your service falls under a Section 12 exception before applying the default.</li>
                <li>Confirm the invoice carries one head pair only: CGST + SGST, or IGST. Never a mix.</li>
                <li>Confirm the place of supply field is present on the invoice — it is mandatory for inter-state supplies.</li>
            </ul>

            <p>
                You can run all of these at once with the{' '}
                <Link href="/check" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    invoice checker
                </Link>
                , and if a return has already gone in late, the{' '}
                <Link href="/gst-penalty-calculator" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    GST penalty calculator
                </Link>{' '}
                will tell you what the delay is costing.
            </p>
        </GuideArticle>
    );
}
