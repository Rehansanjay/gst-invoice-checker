import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GST Penalty Calculator — InvoiceCheck.in';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
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
                {/* Background grid lines */}
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
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '100px',
                        padding: '8px 20px',
                        marginBottom: '28px',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444',
                        }}
                    />
                    <span style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}>
                        FREE TOOL — NO SIGNUP REQUIRED
                    </span>
                </div>

                {/* Main heading */}
                <div
                    style={{
                        fontSize: '68px',
                        fontWeight: 800,
                        color: '#ffffff',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        marginBottom: '20px',
                        letterSpacing: '-1px',
                    }}
                >
                    GST Penalty Calculator
                </div>

                {/* Subheading */}
                <div
                    style={{
                        fontSize: '26px',
                        color: '#a5b4fc',
                        textAlign: 'center',
                        marginBottom: '48px',
                        maxWidth: '800px',
                        lineHeight: 1.4,
                    }}
                >
                    Section 47 · 50 · 73 · 122 of CGST Act 2017
                </div>

                {/* Stat pills */}
                <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                        { label: 'Late Filing', value: 'Section 50 + 47' },
                        { label: 'Wrong Tax Type', value: 'Section 73' },
                        { label: 'Missing HSN', value: 'Section 122' },
                        { label: 'ITC Mismatch', value: 'Section 16(2)' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '12px',
                                padding: '14px 22px',
                            }}
                        >
                            <span style={{ color: '#e0e7ff', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                                {item.label}
                            </span>
                            <span style={{ color: '#818cf8', fontSize: '13px' }}>{item.value}</span>
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
                            background: '#6366f1',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ color: '#6366f1', fontSize: '20px', fontWeight: 700 }}>InvoiceCheck.in</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
