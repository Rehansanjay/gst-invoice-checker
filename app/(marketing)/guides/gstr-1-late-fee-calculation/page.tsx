import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle, { GuideH2, GuideNote } from '@/components/GuideArticle';
import { getGuide, guideUrl } from '@/lib/guides';

const SLUG = 'gstr-1-late-fee-calculation';
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
                Late fee on GSTR-1 is charged per day of delay under Section 47 of the CGST Act. The
                statutory rate is ₹100 per day under CGST plus ₹100 per day under SGST, but CBIC
                notifications have reduced it, and the reduced rates are what actually apply.
            </p>

            <GuideH2 id="rates">The rates that apply in practice</GuideH2>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>Return with outward supplies:</strong> ₹25 CGST + ₹25 SGST ={' '}
                    <strong>₹50 per day</strong> of delay.
                </li>
                <li>
                    <strong>NIL return:</strong> ₹10 CGST + ₹10 SGST ={' '}
                    <strong>₹20 per day</strong> of delay.
                </li>
            </ul>
            <p>
                The count runs from the day after the due date until the day you actually file, both
                heads accruing together. There is no separate IGST late fee.
            </p>

            <GuideH2 id="caps">The caps are based on turnover</GuideH2>
            <p>
                Late fee for GSTR-1 is capped per return, and the cap depends on your aggregate
                annual turnover in the preceding financial year:
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse my-2">
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--warm-border)' }}>
                            <th className="py-3 pr-4 font-semibold" style={{ color: 'var(--warm-charcoal)' }}>
                                Category
                            </th>
                            <th className="py-3 font-semibold" style={{ color: 'var(--warm-charcoal)' }}>
                                Maximum late fee per return
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: '1px solid var(--warm-border)' }}>
                            <td className="py-3 pr-4">NIL return</td>
                            <td className="py-3">₹500 (₹250 + ₹250)</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--warm-border)' }}>
                            <td className="py-3 pr-4">Turnover up to ₹1.5 crore</td>
                            <td className="py-3">₹2,000 (₹1,000 + ₹1,000)</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--warm-border)' }}>
                            <td className="py-3 pr-4">Turnover ₹1.5 crore to ₹5 crore</td>
                            <td className="py-3">₹5,000 (₹2,500 + ₹2,500)</td>
                        </tr>
                        <tr>
                            <td className="py-3 pr-4">Turnover above ₹5 crore</td>
                            <td className="py-3">₹10,000 (₹5,000 + ₹5,000)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <GuideNote>
                <p>
                    The cap applies <strong>per return</strong>, not per year. Three late months for
                    a business under ₹1.5 crore is three separate ₹2,000 ceilings, not one.
                </p>
            </GuideNote>

            <GuideH2 id="examples">Worked examples</GuideH2>
            <p>
                <strong>20 days late, regular return, turnover ₹80 lakh.</strong> 20 × ₹50 = ₹1,000.
                Below the ₹2,000 cap, so ₹1,000 is payable.
            </p>
            <p>
                <strong>60 days late, regular return, turnover ₹80 lakh.</strong> 60 × ₹50 = ₹3,000,
                but the cap for this slab is ₹2,000, so ₹2,000 is payable. Past day 40 the fee stops
                growing.
            </p>
            <p>
                <strong>60 days late, NIL return.</strong> 60 × ₹20 = ₹1,200, capped at ₹500.
            </p>
            <p>
                <strong>Three consecutive months, each 45 days late, turnover ₹3 crore.</strong>{' '}
                45 × ₹50 = ₹2,250 per return, under the ₹5,000 slab cap, so ₹6,750 in total across
                the three.
            </p>

            <GuideH2 id="interest">Late fee is not interest — they are separate</GuideH2>
            <p>
                GSTR-1 reports outward supplies; it does not carry a tax payment. Interest under
                Section 50 at 18% per annum attaches to tax paid late through GSTR-3B, not to a late
                GSTR-1. A business that files both late owes the daily late fee on each return plus
                interest on the unpaid tax, and it is easy to budget for one and be surprised by the
                other.
            </p>

            <GuideH2 id="knock-on">The knock-on effects cost more than the fee</GuideH2>
            <ul className="list-disc pl-6 space-y-2">
                <li>
                    <strong>Your buyers lose visibility of their credit.</strong> Until you file,
                    your invoices do not appear in their GSTR-2B, so they cannot claim that ITC. For
                    a large buyer this is the point at which they start withholding payment.
                </li>
                <li>
                    <strong>Filing is sequential.</strong> You cannot file a period&apos;s GSTR-1
                    while an earlier one is outstanding, so one skipped month blocks every month
                    after it.
                </li>
                <li>
                    <strong>GSTR-1 can be blocked by an unfiled GSTR-3B.</strong> Failing to file
                    GSTR-3B for the preceding period restricts your ability to furnish GSTR-1.
                </li>
                <li>
                    <strong>Returns time out permanently.</strong> A return that goes unfiled for
                    three years past its due date can no longer be filed at all, which leaves the
                    period unresolvable.
                </li>
            </ul>

            <p>
                To put numbers on a specific delay, use the{' '}
                <Link href="/gst-penalty-calculator" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    GST penalty calculator
                </Link>
                . And since an invoice error usually means an amendment in a later return, it is
                worth{' '}
                <Link href="/check" className="underline" style={{ color: 'var(--warm-accent)' }}>
                    validating the invoice
                </Link>{' '}
                before it goes into GSTR-1 in the first place.
            </p>
        </GuideArticle>
    );
}
