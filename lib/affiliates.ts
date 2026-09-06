/**
 * lib/affiliates.ts
 * ─────────────────────────────────────────────────────────────────────
 * Affiliate recommendations, and the rules that keep them from costing
 * more than they earn.
 *
 * WHY THIS EXISTS
 *
 * The site gets roughly 300 visitors a month. At that volume ads need
 * 30× the traffic to pay anything, and the ₹99 unlock has been seen and
 * declined about 180 times. Affiliate is the only model that earns at
 * this size, because it does not require the visitor to pay us at all.
 *
 * It is not a business — realistically a few thousand rupees a month. It
 * is the difference between the site earning nothing and earning
 * something while the bigger question is worked out.
 *
 * THE RULES, AND WHY EACH ONE MATTERS MORE THAN THE REVENUE
 *
 * 1. NOTHING RENDERS UNTIL A REAL LINK IS CONFIGURED. The placeholders
 *    below are inert. This can ship merged today and stay invisible
 *    until Rehan is actually approved and pastes his URLs in — no
 *    half-broken links live, no dead clicks.
 *
 * 2. rel="sponsored nofollow noopener". Google requires paid links to be
 *    marked; unmarked ones are a link-scheme violation and can cost the
 *    rankings the site spent months earning. This is not optional and
 *    should never be "cleaned up" as clutter.
 *
 * 3. DISCLOSED, EVERY TIME. Stated next to the link, not buried in a
 *    footer. The site's whole credibility is that every flag cites its
 *    section — an undisclosed paid recommendation would undo that for a
 *    few hundred rupees.
 *
 * 4. RESULTS PAGES ONLY. Never on the guides, never on the homepage
 *    hero. Someone reading about Section 16 is being informed, not sold
 *    to, and the guides are the only pages earning any trust.
 *
 * 5. RELEVANT OR ABSENT. A recommendation shown to someone whose invoice
 *    was clean is noise. These appear where the tool has just found a
 *    problem better software would have prevented at source.
 */

export interface AffiliateOffer {
    /** Stable key, used in analytics. */
    id: string;
    /** Product name as the visitor would recognise it. */
    name: string;
    /**
     * The tracking URL from the programme dashboard, with the affiliate
     * id already in it. Empty string = not configured = nothing renders.
     */
    url: string;
    /** One honest line on why someone here might want it. */
    reason: string;
}

/**
 * Paste the tracking URL from each programme's dashboard into `url`.
 *
 * Zoho's programme is at https://www.zoho.com/affiliate/ and is confirmed
 * live. The others are placeholders — only add a row once you have been
 * accepted and hold a real tracking link, because an entry with a guessed
 * URL is worse than no entry.
 */
export const AFFILIATE_OFFERS: AffiliateOffer[] = [
    {
        id: 'zoho-invoice',
        name: 'Zoho Invoice',
        url: '',
        reason:
            'Numbers invoices in a compliant series automatically, so the length and format problems above do not recur.',
    },
    {
        id: 'vyapar',
        name: 'Vyapar',
        url: '',
        reason:
            'Built for Indian GST billing, with the tax head and HSN fields enforced at entry rather than caught afterwards.',
    },
];

/** Offers that actually have a tracking link. Everything else is skipped. */
export function activeOffers(offers: AffiliateOffer[] = AFFILIATE_OFFERS): AffiliateOffer[] {
    return offers.filter((o) => o.url.trim().startsWith('https://'));
}

/** True when there is at least one real link to show. */
export function hasAffiliateOffers(offers: AffiliateOffer[] = AFFILIATE_OFFERS): boolean {
    return activeOffers(offers).length > 0;
}

/**
 * The rel value every affiliate link must carry.
 *
 * `sponsored` is what Google asks for on paid links specifically;
 * `nofollow` is the older signal and is kept for crawlers that do not
 * understand `sponsored`; `noopener` closes the tab-nabbing hole that
 * target="_blank" opens.
 */
export const AFFILIATE_REL = 'sponsored nofollow noopener noreferrer';

/** Shown next to the links. Short, plain, and not hidden in a footer. */
export const AFFILIATE_DISCLOSURE =
    'These are paid recommendations — we earn a commission if you sign up, at no extra cost to you. We only list tools we would suggest anyway, and nothing here changes what the checker reports.';
