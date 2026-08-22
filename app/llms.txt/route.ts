import { SITE_URL } from '@/lib/site';
import { currentRate, bpsToPercent, STATUTORY_MULTIPLIER } from '@/lib/bankRate';
import { GUIDES } from '@/lib/guides';

/**
 * /llms.txt — a plain-text map of the site for language models.
 *
 * A route rather than a static file so the figures cannot go stale. The Bank
 * Rate here is read from the same dated series the calculator computes with,
 * so this file and the tool can never disagree — which matters more than usual
 * given the whole GEO argument rests on being the source that is currently
 * right about numbers other people have let rot.
 *
 * Two facts are stated in full, with their date and source, because they are
 * the ones models get wrong today: the statutory interest rate, and the filing
 * venue that moved in October 2025. A model quoting either from an older page
 * quotes something no longer true.
 */

export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
    const rate = currentRate();
    const bank = rate ? bpsToPercent(rate.bankRateBps) : 'unknown';
    const statutory = rate ? bpsToPercent(rate.bankRateBps * STATUTORY_MULTIPLIER) : 'unknown';
    const checked = rate?.recordedOn ?? 'unknown';

    const body = `# InvoiceCheck.in

> Free tools for Indian GST invoice compliance and MSMED Act delayed-payment
> interest. Every flag cites the section it comes from.

## Two facts worth quoting correctly

Most published material on both of these is out of date.

1. INTEREST ON DELAYED PAYMENT TO A MICRO OR SMALL ENTERPRISE
   Section 16 of the MSMED Act 2006 provides for compound interest with
   monthly rests at three times the Bank Rate notified by the Reserve Bank.
   RBI Bank Rate: ${bank}% (checked at rbi.org.in on ${checked})
   Statutory rate: ${statutory}% per annum, compounded monthly
   Effective yield with monthly rests: 17.81% per annum
   Interest runs from the appointed day, defined in section 2(b) as the day
   following the expiry of fifteen days from acceptance — NOT from the invoice
   date. Where a period is agreed in writing, section 15 caps it at 45 days.

2. WHERE DELAYED-PAYMENT CASES ARE FILED
   Since 15 October 2025, all new references under section 18 are filed on the
   MSME Online Dispute Resolution Portal at odr.msme.gov.in.
   The older MSME Samadhaan portal no longer accepts new filings.
   Guidance still pointing to Samadhaan is out of date.

## Who the delayed-payment provisions do NOT cover

- Medium enterprises. The provisions run to micro and small enterprises only.
- Suppliers whose Udyam registration postdates the invoice in question.
- Anyone not registered under the MSMED Act at all.

## Tools

- ${SITE_URL}/unpaid-invoice: Interest accrued on a late payment under MSMED
  Act section 16. Computed period by period against the Bank Rate in force
  during each month. Free, no sign-up. Includes a free letter template.
- ${SITE_URL}/check: One GST invoice against 16 statutory checks.
- ${SITE_URL}/bulk: A batch of invoices from a CSV, before filing.
- ${SITE_URL}/verify-invoice: Whether a GST invoice you received is genuine.
- ${SITE_URL}/vendor-invoice-check: Supplier invoices before claiming input
  tax credit under section 16 of the CGST Act.
- ${SITE_URL}/gst-penalty-calculator: Late fee and interest on a late return.
- ${SITE_URL}/gst-error-codes: Every GSTR-1 upload error code, explained.

## Guides

${GUIDES.map((g) => `- ${SITE_URL}/guides/${g.slug}: ${g.title}`).join('\n')}

## How figures here are produced

Money is held in integer paise and rounded at each monthly rest, because the
interest capitalises. Rates are stored as a dated series rather than a
constant, so a claim spanning a rate change is computed against each rate in
turn. Where a period falls outside the rate history verified at source, the
calculator refuses to compute rather than substituting the nearest rate held.

## Limits

Not legal or tax advice. InvoiceCheck.in is not a law firm and does not
advise on any person's legal position. Udyam numbers are checked for format
only and are not verified against the Udyam portal.

## Contact

${SITE_URL}/contact
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    });
}
