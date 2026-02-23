import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CA Partner Success Stories — InvoiceCheck.in';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #052e16 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background grid */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.4)',
                        borderRadius: '100px',
                        padding: '8px 20px',
                        marginBottom: '28px',
                    }}
                >
                    <span style={{ color: '#86efac', fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}>
                        ★ CA PARTNER PROGRAM — MARCH 2026
                    </span>
                </div>

                {/* Heading */}
                <div
                    style={{
                        fontSize: '62px',
                        fontWeight: 800,
                        color: '#ffffff',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        marginBottom: '20px',
                        letterSpacing: '-1px',
                    }}
                >
                    CA Partner Success Stories
                </div>

                {/* Sub */}
                <div
                    style={{
                        fontSize: '26px',
                        color: '#86efac',
                        textAlign: 'center',
                        marginBottom: '52px',
                        maxWidth: '800px',
                    }}
                >
                    How CAs prevented GST penalties before the March 20 filing deadline
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '24px' }}>
                    {[
                        { value: '15+', label: 'Violations caught' },
                        { value: '₹0', label: 'Penalties paid' },
                        { value: '30s', label: 'Per invoice check' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '16px',
                                padding: '24px 40px',
                            }}
                        >
                            <span style={{ color: '#4ade80', fontSize: '44px', fontWeight: 800, lineHeight: 1 }}>
                                {stat.value}
                            </span>
                            <span style={{ color: '#86efac', fontSize: '16px', marginTop: '8px' }}>{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            width: '28px',
                            height: '28px',
                            background: '#16a34a',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ color: '#4ade80', fontSize: '20px', fontWeight: 700 }}>InvoiceCheck.in</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
