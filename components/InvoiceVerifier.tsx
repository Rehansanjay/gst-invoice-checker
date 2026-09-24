'use client';

/**
 * The instant "is this invoice genuine?" box.
 *
 * Search Console says most visitors arrive holding an invoice someone else
 * issued and asking whether it is real. The full checker asks them to type
 * four sections first; they leave in about 13 seconds. This answers the
 * question they came with in one field, and only then offers the full check.
 *
 * Everything runs in the browser. The GSTIN and the QR never leave the
 * device, which is also why the result is careful about what it can know:
 * a well-formed GSTIN is not proof of an active registration, and a decoded
 * QR is not a verified signature. Both say so and link to where the
 * government answers that part.
 */

import { useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle, QrCode, Hash, Upload, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { readGstin, GST_PORTAL_SEARCH_URL, type GstinReading } from '@/lib/gstin';
import { readEInvoiceQr, OFFICIAL_QR_VERIFIER_URL, type QrReading } from '@/lib/einvoiceQr';
import { track } from '@/lib/analytics';

type Mode = 'gstin' | 'qr';

/** Decode the first QR found in an image file. Downscales huge photos first. */
async function decodeQrFromFile(file: File): Promise<string | null> {
    const { default: jsQR } = await import('jsqr');
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = url;
        });
        // Try full size (capped) then smaller: dense e-invoice QRs read best
        // near native size, noisy phone photos read better scaled down.
        for (const max of [2000, 1200, 800]) {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, w, h);
            const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
            if (found?.data) return found.data;
        }
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4 py-1.5 text-[13.5px] border-b last:border-b-0" style={{ borderColor: 'var(--warm-border-light)' }}>
            <span style={{ color: 'var(--warm-text-secondary)' }}>{label}</span>
            <span className="font-medium text-right break-all" style={{ color: 'var(--warm-text)' }}>{value || '—'}</span>
        </div>
    );
}

function Verdict({ good, title, children }: { good: boolean | 'warn'; title: string; children?: React.ReactNode }) {
    const color = good === true ? 'var(--warm-success)' : good === 'warn' ? '#B7791F' : 'var(--warm-danger)';
    const Icon = good === true ? CheckCircle2 : good === 'warn' ? AlertTriangle : XCircle;
    return (
        <div className="flex gap-2.5 items-start">
            <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
            <div>
                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-text)' }}>{title}</p>
                {children && <div className="text-[13.5px] leading-relaxed mt-1" style={{ color: 'var(--warm-charcoal-soft)' }}>{children}</div>}
            </div>
        </div>
    );
}

function PortalNote() {
    return (
        <p className="text-[13px] leading-relaxed mt-3 p-3 rounded-lg" style={{ background: 'var(--warm-cream-dark)', color: 'var(--warm-charcoal-soft)' }}>
            This proves the number is correctly formed, not that the business is active. To see the registered name and
            whether the GSTIN is active or cancelled, search it on the{' '}
            <a href={GST_PORTAL_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-0.5" style={{ color: 'var(--warm-accent)' }}>
                GST portal <ExternalLink className="w-3 h-3" />
            </a>
            .
        </p>
    );
}

function GstinResult({ r }: { r: GstinReading }) {
    if (!r.valid) {
        return (
            <Verdict good={false} title="This GSTIN cannot be real">
                <ul className="list-disc pl-4 space-y-0.5">
                    {r.problems.map((p) => <li key={p}>{p}</li>)}
                </ul>
            </Verdict>
        );
    }
    return (
        <>
            <Verdict good title="The GSTIN is correctly formed" />
            <div className="mt-3">
                <Row label="State" value={`${r.stateName} (${r.stateCode})`} />
                <Row label="PAN inside it" value={r.pan ?? ''} />
                <Row label="Holder type" value={r.holderType ?? 'Unknown'} />
            </div>
            <PortalNote />
        </>
    );
}

function QrResult({ r }: { r: QrReading }) {
    if (r.kind !== 'einvoice') {
        return <Verdict good="warn" title={r.kind === 'upi' ? 'This is a payment QR' : 'Not a GST e-invoice QR'}>{r.note}</Verdict>;
    }
    const f = r.fields;
    return (
        <>
            {r.problems.length === 0 ? (
                <Verdict good title="The e-invoice QR reads correctly">
                    Compare every line below with what is printed on the invoice. If any of them differ, the invoice was
                    changed after it was registered.
                </Verdict>
            ) : (
                <Verdict good={false} title="The QR has problems">
                    <ul className="list-disc pl-4 space-y-0.5">
                        {r.problems.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                </Verdict>
            )}
            <div className="mt-3">
                <Row label="Supplier GSTIN" value={f.sellerGstin} />
                <Row label="Buyer GSTIN" value={f.buyerGstin} />
                <Row label="Invoice number" value={f.docNo} />
                <Row label="Invoice date" value={f.docDate} />
                <Row label="Total value" value={f.totalValue === null ? '' : `₹${f.totalValue.toLocaleString('en-IN')}`} />
                <Row label="Line items" value={f.itemCount === null ? '' : String(f.itemCount)} />
                <Row label="Main HSN" value={f.mainHsn} />
                <Row label="Registered on" value={f.irnDate} />
                <Row label="Issued by" value={f.issuer} />
            </div>
            <p className="text-[13px] leading-relaxed mt-3 p-3 rounded-lg" style={{ background: 'var(--warm-cream-dark)', color: 'var(--warm-charcoal-soft)' }}>
                We read the QR but do not check its digital signature. The government&apos;s{' '}
                <a href={OFFICIAL_QR_VERIFIER_URL} target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-0.5" style={{ color: 'var(--warm-accent)' }}>
                    e-Invoice QR Verifier app <ExternalLink className="w-3 h-3" />
                </a>{' '}
                does, and confirms the invoice was really registered.
            </p>
        </>
    );
}

export default function InvoiceVerifier() {
    const [mode, setMode] = useState<Mode>('gstin');
    const [gstin, setGstin] = useState('');
    const [qrText, setQrText] = useState('');
    const [gstinResult, setGstinResult] = useState<GstinReading | null>(null);
    const [qrResult, setQrResult] = useState<QrReading | null>(null);
    const [qrError, setQrError] = useState('');
    const [reading, setReading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const checkGstin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gstin.trim()) return;
        const r = readGstin(gstin);
        setGstinResult(r);
        track('verify_gstin', { valid: r.valid });
    };

    const showQr = (text: string) => {
        const r = readEInvoiceQr(text);
        setQrResult(r);
        track('verify_qr', { kind: r.kind, problems: r.kind === 'einvoice' ? r.problems.length : 0 });
    };

    const onFile = async (file: File | undefined) => {
        if (!file) return;
        setQrError('');
        setQrResult(null);
        setReading(true);
        try {
            const text = await decodeQrFromFile(file);
            if (!text) {
                setQrError('No QR code found in that image. Try a sharper photo, or a screenshot cropped around the QR.');
                track('verify_qr', { kind: 'unreadable' });
            } else {
                setQrText(text);
                showQr(text);
            }
        } catch {
            setQrError('That file could not be opened as an image. Use a JPG or PNG; for a PDF invoice, take a screenshot of the QR.');
        } finally {
            setReading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const tab = (m: Mode, label: string, Icon: typeof Hash) => (
        <button
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13.5px] font-semibold rounded-lg transition-colors"
            style={mode === m
                ? { background: 'var(--warm-charcoal)', color: 'var(--warm-cream)' }
                : { background: 'transparent', color: 'var(--warm-charcoal-soft)' }}
            aria-pressed={mode === m}
        >
            <Icon className="w-4 h-4" /> {label}
        </button>
    );

    const hasResult = mode === 'gstin' ? !!gstinResult : !!qrResult;

    return (
        <div className="rounded-2xl p-5 sm:p-6 text-left" style={{ background: 'var(--warm-cream)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <p className="font-heading text-[1.35rem] leading-tight mb-1" style={{ color: 'var(--warm-text)' }}>
                Is this invoice genuine?
            </p>
            <p className="text-[13.5px] mb-4" style={{ color: 'var(--warm-text-secondary)' }}>
                Check the supplier&apos;s GSTIN, or read the QR on an e-invoice. Free, instant, nothing uploaded.
            </p>

            <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--warm-bg-alt)' }}>
                {tab('gstin', 'GSTIN', Hash)}
                {tab('qr', 'e-invoice QR', QrCode)}
            </div>

            {mode === 'gstin' ? (
                <form onSubmit={checkGstin} className="flex flex-col sm:flex-row gap-2">
                    <label htmlFor="verify-gstin" className="sr-only">Supplier GSTIN</label>
                    <input
                        id="verify-gstin"
                        value={gstin}
                        onChange={(e) => { setGstin(e.target.value); setGstinResult(null); }}
                        placeholder="e.g. 27AAPFU0939F1ZV"
                        maxLength={20}
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 px-4 py-3 rounded-lg border text-[15px] font-mono uppercase outline-none focus:ring-2"
                        style={{ borderColor: 'var(--warm-border)', background: '#fff', color: 'var(--warm-text)' }}
                    />
                    <button type="submit" className="btn-warm-primary px-5 py-3 text-[15px] inline-flex items-center justify-center gap-1.5">
                        Check GSTIN
                    </button>
                </form>
            ) : (
                <div className="space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={reading}
                        className="btn-warm-primary w-full px-5 py-3 text-[15px] inline-flex items-center justify-center gap-2"
                    >
                        {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {reading ? 'Reading QR…' : 'Upload a photo or screenshot of the QR'}
                    </button>
                    <details className="text-[13px]" style={{ color: 'var(--warm-text-secondary)' }}>
                        <summary className="cursor-pointer">Or paste the scanned QR text</summary>
                        <textarea
                            value={qrText}
                            onChange={(e) => setQrText(e.target.value)}
                            rows={3}
                            placeholder="eyJhbGciOi…"
                            className="w-full mt-2 px-3 py-2 rounded-lg border font-mono text-[12px]"
                            style={{ borderColor: 'var(--warm-border)', background: '#fff', color: 'var(--warm-text)' }}
                        />
                        <button type="button" onClick={() => qrText.trim() && showQr(qrText)} className="btn-warm-secondary mt-2 px-4 py-2 text-[13px]">
                            Read this QR
                        </button>
                    </details>
                    {qrError && <p className="text-[13px]" style={{ color: 'var(--warm-danger)' }}>{qrError}</p>}
                </div>
            )}

            {hasResult && (
                <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--warm-border)' }} aria-live="polite">
                    {mode === 'gstin' && gstinResult && <GstinResult r={gstinResult} />}
                    {mode === 'qr' && qrResult && <QrResult r={qrResult} />}

                    <Link
                        href="/check"
                        onClick={() => track('verify_full_check_clicked', { from: mode })}
                        className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold"
                        style={{ color: 'var(--warm-accent)' }}
                    >
                        Check the whole invoice — tax, HSN and format <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="mt-2 text-[13px]" style={{ color: 'var(--warm-text-secondary)' }}>
                        Buy from many suppliers?{' '}
                        <Link href="/vendor-gst-watch" className="underline font-medium" style={{ color: 'var(--warm-accent)' }}>
                            Get told when one stops filing
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}
