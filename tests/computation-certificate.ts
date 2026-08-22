/**
 * Guards the paid computation certificate.
 *
 * This is the one artefact somebody hands over money for, which raises the bar
 * on two things in particular.
 *
 * It must still reach no legal conclusion. Selling a document is exactly the
 * circumstance in which s.29 of the Advocates Act matters most, so the same
 * copy discipline that governs the free letter is enforced here — and enforced
 * against the PDF's actual extracted text, not just the source.
 *
 * And it must be worth the money. The numbers are free on screen, so the tests
 * below pin the things that are NOT: the forward projection, the rate
 * provenance, and a reference stable enough to quote.
 */
import {
    generateComputationCertificate,
    certificateReference,
    certificateFilename,
    projectForward,
    PROJECTION_DAYS,
} from '../lib/computationCertificate';
import zlib from 'zlib';
import { computeInterest, formatPaise, type ClaimInput } from '../lib/msmeInterest';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const claim: ClaimInput = {
    principalPaise: 30_000_000,
    acceptanceDate: d('2026-02-13'),
    writtenAgreement: false,
    asOf: d('2026-08-22'),
};
const r = computeInterest(claim);
if (!r.ok) { console.log('fixture failed:', r.reason); process.exit(1); }
const computed = r;

// ─── Reference is stable and claim-derived ────────────────────────────
// Two people discussing "the computation" must be discussing the same one,
// and buying twice must not produce two identifiers for one claim.

const ref = certificateReference(claim);
ok('reference has the expected shape', /^IC-[0-9A-F]{8}$/.test(ref), ref);
ok('the same claim always yields the same reference', certificateReference({ ...claim }) === ref);
ok('a different principal yields a different reference',
    certificateReference({ ...claim, principalPaise: 30_000_001 }) !== ref);
ok('a different acceptance date yields a different reference',
    certificateReference({ ...claim, acceptanceDate: d('2026-02-14') }) !== ref);
ok('an agreed period yields a different reference',
    certificateReference({ ...claim, writtenAgreement: true, agreedDays: 30 }) !== ref);
ok('a settled claim yields a different reference from an open one',
    certificateReference({ ...claim, paidOn: d('2026-07-01') }) !== ref);

// The reference must not move with the computation date — it identifies the
// claim, not the moment it was rendered.
ok('the reference is independent of asOf',
    certificateReference({ ...claim, asOf: d('2026-09-30') }) === ref);

ok('the filename carries the reference and the date',
    certificateFilename(claim, computed) === `interest-computation-${ref}-2026-08-22.pdf`,
    certificateFilename(claim, computed));

// ─── Forward projection ───────────────────────────────────────────────
// The figure a negotiation turns on, and the main thing the free screen
// does not show.

const projection = projectForward(claim, computed);
ok('projects three horizons', projection.length === PROJECTION_DAYS.length, projection.length);
ok('projections are ordered and increasing',
    projection.every((p, i) => i === 0 || Number(p.total.replace(/,/g, '')) > Number(projection[i - 1].total.replace(/,/g, ''))),
    projection.map((p) => p.total));
ok('each projection exceeds the present total',
    projection.every((p) => Number(p.total.replace(/,/g, '')) > computed.totalPaise / 100));
ok('projection dates are the stated number of days out',
    projection.every((p) => {
        const days = Math.round((Date.parse(p.on) - Date.parse(computed.computedTo)) / 86_400_000);
        return days === p.days;
    }),
    projection.map((p) => `${p.days}->${p.on}`));

// A settled claim stopped accruing, so projecting it forward would be a lie.
const settled = computeInterest({ ...claim, paidOn: d('2026-07-01') });
ok('a paid claim is not projected forward',
    settled.ok && projectForward({ ...claim, paidOn: d('2026-07-01') }, settled).length === 0);

// ─── The document itself ──────────────────────────────────────────────

// pdfkit writes text into content streams, so the raw buffer is not readable.
// Extracting what a reader would actually see keeps these assertions honest
// rather than testing the source file back to itself.
function extractText(buf: Buffer): string {
    // pdfkit flate-compresses its content streams, so the text is not present
    // in the raw bytes. Inflating first means these assertions run against
    // what a reader actually sees rather than whatever happened to survive
    // uncompressed — which, before this, was about a fifth of the document.
    const raw = buf.toString('latin1');
    const pieces: string[] = [];

    const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    for (const m of raw.matchAll(streamRe)) {
        const bytes = Buffer.from(m[1], 'latin1');
        let content: string;
        try {
            content = zlib.inflateSync(bytes).toString('latin1');
        } catch {
            content = m[1]; // Not compressed, or not inflatable: read as-is.
        }
        pieces.push(content);
    }

    const content = pieces.join('\n');
    const out: string[] = [];

    // pdfkit emits text as HEX strings inside TJ arrays — <436f6d...> — not as
    // literal (parenthesised) strings. Reading only the literal form found
    // about a fifth of the document and quietly passed a handful of these
    // assertions while missing the rest.
    for (const m of content.matchAll(/\[((?:[^\][]|\\.)*)\]\s*TJ/g)) {
        const arr = m[1];
        for (const piece of arr.matchAll(/<([0-9A-Fa-f\s]+)>|\(((?:[^()\\]|\\.)*)\)/g)) {
            if (piece[1] !== undefined) {
                const hex = piece[1].replace(/\s+/g, '');
                out.push(Buffer.from(hex, 'hex').toString('latin1'));
            } else {
                out.push(piece[2]);
            }
        }
        // Kerning offsets between pieces are positioning, not spaces, so the
        // pieces of one run are joined without separators.
        out.push(' ');
    }
    // Single-showing operators, in either form.
    for (const m of content.matchAll(/<([0-9A-Fa-f\s]+)>\s*Tj/g)) {
        out.push(Buffer.from(m[1].replace(/\s+/g, ''), 'hex').toString('latin1'), ' ');
    }
    for (const m of content.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)) out.push(m[1], ' ');

    return out.join('').replace(/\\([()\\])/g, '$1');
}

// Rendering is async and the runner compiles to CJS, where top-level await is
// unavailable — so everything touching a generated PDF lives in here.
async function main() {
const pdf = await generateComputationCertificate({ claim, computed, invoiceNumber: 'INV-2026-0041' });
ok('a PDF is produced', Buffer.isBuffer(pdf) && pdf.length > 2000, pdf.length);
ok('it is a real PDF', pdf.subarray(0, 5).toString() === '%PDF-');

const text = extractText(pdf);
// Prose wraps across lines in the PDF, so phrase assertions run against a
// whitespace-normalised copy. Only layout assertions should see real breaks.
const prose = text.replace(/\s+/g, ' ');

ok('extraction found readable text', text.length > 400, text.length);
ok('names the section it computes under', /Section 16/.test(text));
ok('names the Act', /Micro, Small and Medium Enterprises Development Act/.test(text) || /MSMED/.test(text));
ok('carries the reference', text.includes(ref), text.slice(0, 200));
ok('carries the principal', text.includes(formatPaise(computed.principalPaise)));
ok('carries the interest', text.includes(formatPaise(computed.interestPaise)));
ok('carries the total', text.includes(formatPaise(computed.totalPaise)));
ok('carries the supplied invoice number', text.includes('INV-2026-0041'));

// Provenance is a large part of what is being sold.
ok('prints where the Bank Rate came from', /rbi\.org\.in/.test(text));
ok('prints when the rate was checked', /2026-08-22/.test(text));
ok('states the compounding basis', /monthly rests/i.test(text));
ok('explains the part-period treatment', /pro rata/i.test(prose));
ok('explains period-by-period rating', /in force during each month/i.test(prose));

// Every schedule row must appear, or the document is not the computation.
ok('every period appears in the document',
    computed.schedule.every((s) => text.includes(s.periodStart)),
    computed.schedule.map((s) => s.periodStart).filter((p) => !text.includes(p)));

ok('the forward projection appears', /continues to be delayed/i.test(prose));

// ─── Limits, stated ───────────────────────────────────────────────────

ok('disclaims legal and tax advice', /not legal or tax\s*advice/i.test(text.replace(/\s+/g, ' ')));
ok('says InvoiceCheck is not a law firm', /not a law firm/i.test(prose));
ok('says medium enterprises are outside the provisions', /medium enterprises are outside/i.test(prose));
ok('says the Udyam number was not verified', /not verified against the Udyam portal/i.test(prose));
ok('names the current filing venue', /odr.msme.gov.in/.test(prose));

// ─── No legal conclusion, in the thing being sold ─────────────────────

const CONCLUSIONS = [
    /you are entitled/i, /you can claim/i, /you are eligible/i,
    /is recoverable/i, /we certify/i, /we confirm that you/i,
    /legally due/i, /must pay/i, /is liable to pay you/i,
];
for (const c of CONCLUSIONS) {
    ok(`states no legal conclusion (${c.source})`, !c.test(text), text.match(c)?.[0]);
}
ok('explicitly reaches no conclusion on recoverability',
    /reaches no conclusion/i.test(text.replace(/\s+/g, ' ')));

// ─── A settled claim still renders ────────────────────────────────────

if (settled.ok) {
    const settledPdf = await generateComputationCertificate({
        claim: { ...claim, paidOn: d('2026-07-01') }, computed: settled,
    });
    const settledText = extractText(settledPdf);
    ok('a settled claim produces a document', settledPdf.length > 2000);
    ok('a settled claim is marked paid', /Paid on 2026-07-01/.test(settledText), settledText.slice(0, 300));
    ok('a settled claim shows no forward projection', !/continues to be delayed/i.test(settledText));
}
}

main().then(() => {
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail === 0 ? 0 : 1);
}).catch((err) => {
    console.error('  FAIL: certificate generation threw', err);
    process.exit(1);
});
