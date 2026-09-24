/**
 * The one heading style every homepage section uses.
 *
 * The homepage had nine sections with five heading sizes and a mix of left
 * and centred alignment. Every section below the hero now goes through this,
 * so size, spacing and alignment cannot drift section by section.
 */

export default function SectionHeading({
    eyebrow,
    title,
    subtitle,
    id,
    tone = 'light',
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    id?: string;
    /** 'dark' for sections on the charcoal background. */
    tone?: 'light' | 'dark';
}) {
    const dark = tone === 'dark';
    return (
        <div className="mx-auto max-w-2xl text-center mb-10 md:mb-14">
            {eyebrow && (
                <p
                    className="text-[12.5px] font-semibold uppercase tracking-[0.14em] mb-3"
                    style={{ color: dark ? '#C4B5A3' : 'var(--warm-accent)' }}
                >
                    {eyebrow}
                </p>
            )}
            <h2
                id={id}
                className="font-heading text-[2rem] sm:text-[2.5rem] md:text-[2.75rem] leading-[1.1]"
                style={{ color: dark ? 'var(--warm-cream)' : 'var(--warm-charcoal)' }}
            >
                {title}
            </h2>
            {subtitle && (
                <p
                    className="mt-4 text-[1.0625rem] leading-relaxed"
                    style={{ color: dark ? '#B8A895' : 'var(--warm-text-secondary)' }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
}
