import { ImageResponse } from 'next/og';

/**
 * Default social preview for every route that does not define its own.
 *
 * Replaces a hardcoded /og-image.png reference that 404'd — so link previews
 * were blank on the homepage, and the pages added later (/bulk, the guides,
 * the error codes) carried no og:image at all. That matters more here than on
 * most sites: this gets forwarded in CA and seller WhatsApp groups, where the
 * preview card is the whole first impression.
 *
 * Generated rather than a static file so it stays in step with the brand and
 * needs no binary asset in the repo. Matches the site's warm palette.
 */

export const runtime = 'edge';
export const alt = 'InvoiceCheck.in — GST invoice validation for Indian sellers and CA firms';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#281E15',
                    padding: '72px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Wordmark */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: '#9E542F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FAF8F6',
                            fontSize: '26px',
                            fontWeight: 700,
                        }}
                    >
                        ✓
                    </div>
                    <div style={{ color: '#FAF8F6', fontSize: '30px', fontWeight: 700 }}>
                        InvoiceCheck.in
                    </div>
                </div>

                {/* Headline */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            color: '#FAF8F6',
                            fontSize: '68px',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-1.5px',
                        }}
                    >
                        Catch invoice errors
                    </div>
                    <div
                        style={{
                            color: '#D4A056',
                            fontSize: '68px',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-1.5px',
                        }}
                    >
                        before the portal does
                    </div>
                    <div style={{ color: '#B8A895', fontSize: '28px', marginTop: '24px' }}>
                        16 compliance checks · GSTIN, HSN, tax type, place of supply
                    </div>
                </div>

                {/* Footer strip */}
                <div style={{ display: 'flex', gap: '14px' }}>
                    {['Bulk pre-filing check', 'Built for CA firms', 'Every flag cites its section'].map((t) => (
                        <div
                            key={t}
                            style={{
                                display: 'flex',
                                background: 'rgba(250,248,246,0.08)',
                                border: '1px solid rgba(250,248,246,0.15)',
                                borderRadius: '999px',
                                padding: '10px 22px',
                                color: '#E8E0D8',
                                fontSize: '22px',
                            }}
                        >
                            {t}
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}
