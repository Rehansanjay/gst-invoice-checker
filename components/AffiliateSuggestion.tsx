import { ExternalLink } from 'lucide-react';
import {
    activeOffers,
    AFFILIATE_REL,
    AFFILIATE_DISCLOSURE,
    type AffiliateOffer,
} from '@/lib/affiliates';

/**
 * A disclosed affiliate recommendation, shown only where it is relevant.
 *
 * Renders NOTHING when no offer has a real tracking URL, so this can sit in
 * the tree before Rehan is approved by any programme and appear the moment he
 * pastes a link into lib/affiliates.ts. No placeholder, no dead click, no
 * "coming soon".
 *
 * Deliberately quiet: a bordered block in the site's own palette rather than
 * anything that reads as an ad unit. The site's credibility is that every flag
 * cites its section — a flashing banner beside that would cost more trust than
 * the commission is worth.
 */
export default function AffiliateSuggestion({
    heading = 'Stop this happening at source',
    intro,
    offers,
}: {
    heading?: string;
    intro?: string;
    offers?: AffiliateOffer[];
}) {
    const active = activeOffers(offers);
    if (active.length === 0) return null;

    return (
        <div
            className="rounded-xl p-6"
            style={{ background: 'var(--warm-cream)', border: '1px solid var(--warm-border)' }}
        >
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                {heading}
            </h3>
            {intro && (
                <p className="text-sm mb-4" style={{ color: 'var(--warm-charcoal-soft)' }}>
                    {intro}
                </p>
            )}

            <ul className="space-y-3">
                {active.map((o) => (
                    <li key={o.id}>
                        <a
                            href={o.url}
                            target="_blank"
                            rel={AFFILIATE_REL}
                            className="group block"
                        >
                            <span
                                className="text-[15px] font-semibold inline-flex items-center gap-1 group-hover:underline underline-offset-4"
                                style={{ color: 'var(--warm-accent)' }}
                            >
                                {o.name}
                                <ExternalLink className="h-3.5 w-3.5" />
                            </span>
                            <span className="block text-[13.5px] leading-snug mt-0.5" style={{ color: 'var(--warm-charcoal-soft)' }}>
                                {o.reason}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>

            {/*
              Next to the links, not in the footer. Someone who clicks should
              already know the relationship — that is the whole point of a
              disclosure, and burying it defeats it.
            */}
            <p className="text-xs mt-4 pt-3" style={{ color: 'var(--warm-text-secondary)', borderTop: '1px solid var(--warm-border)' }}>
                {AFFILIATE_DISCLOSURE}
            </p>
        </div>
    );
}
