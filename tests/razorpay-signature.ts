/**
 * Guards Razorpay payment-signature verification.
 *
 * This is the only thing between "somebody posted a JSON body" and "we hand
 * over a paid document", so the failure modes matter more than the happy path.
 *
 * Two of them are the reason this lives in a library rather than inline in the
 * route handler. `crypto.timingSafeEqual` THROWS on a length mismatch, so a
 * forged signature of the wrong length would crash the handler instead of
 * being rejected — and a plain `===` leaks timing on a value an attacker
 * controls and can retry without limit. Neither is visible by reading the
 * route, and neither could be tested there without a live secret.
 */
import { verifyPaymentSignature, signForTest } from '../lib/razorpaySignature';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const SECRET = 'test_secret_not_a_real_key';
const ORDER = 'order_ABC123XYZ';
const PAYMENT = 'pay_DEF456UVW';
const good = signForTest(ORDER, PAYMENT, SECRET);

// ─── The happy path ───────────────────────────────────────────────────

ok('a correct signature verifies', verifyPaymentSignature(ORDER, PAYMENT, good, SECRET).valid);
ok('an uppercase hex signature verifies',
    verifyPaymentSignature(ORDER, PAYMENT, good.toUpperCase(), SECRET).valid);
ok('the signature is a 64-character sha256 hex digest', /^[0-9a-f]{64}$/.test(good), good);

// ─── Forgery ──────────────────────────────────────────────────────────

const flipped = (good[0] === 'a' ? 'b' : 'a') + good.slice(1);
ok('a signature differing by one character is rejected',
    !verifyPaymentSignature(ORDER, PAYMENT, flipped, SECRET).valid);
ok('and the reason is a digest mismatch',
    verifyPaymentSignature(ORDER, PAYMENT, flipped, SECRET).reason === 'DIGEST_MISMATCH');

ok('a signature for a different order is rejected',
    !verifyPaymentSignature('order_OTHER', PAYMENT, good, SECRET).valid);
ok('a signature for a different payment is rejected',
    !verifyPaymentSignature(ORDER, 'pay_OTHER', good, SECRET).valid);
ok('a signature made with a different secret is rejected',
    !verifyPaymentSignature(ORDER, PAYMENT, signForTest(ORDER, PAYMENT, 'other_secret'), SECRET).valid);

// The order and payment ids are joined with a pipe. Swapping them must not
// verify, or a caller could redeem one payment against another order.
ok('swapped order and payment ids are rejected',
    !verifyPaymentSignature(PAYMENT, ORDER, good, SECRET).valid);

// ─── Length mismatch must not throw ───────────────────────────────────
// timingSafeEqual throws on differing lengths. Without the guard this is an
// unhandled exception rather than a rejection.

for (const wrongLength of ['abc123', good.slice(0, 63), good + 'ff', 'f'.repeat(128)]) {
    let threw = false;
    let result = { valid: true } as { valid: boolean; reason?: string };
    try { result = verifyPaymentSignature(ORDER, PAYMENT, wrongLength, SECRET); }
    catch { threw = true; }
    ok(`a ${wrongLength.length}-character signature does not throw`, !threw, wrongLength.length);
    ok(`a ${wrongLength.length}-character signature is rejected`, !result.valid);
}

// ─── Malformed input ──────────────────────────────────────────────────
// Non-hex cannot be a digest, and must be refused before any comparison.

for (const junk of ['not-hex-at-all', 'zzzz'.repeat(16), '../../etc/passwd', '<script>', '']) {
    const res = verifyPaymentSignature(ORDER, PAYMENT, junk, SECRET);
    ok(`non-hex signature rejected: ${JSON.stringify(junk.slice(0, 20))}`, !res.valid);
}

ok('an empty order id is rejected', !verifyPaymentSignature('', PAYMENT, good, SECRET).valid);
ok('an empty payment id is rejected', !verifyPaymentSignature(ORDER, '', good, SECRET).valid);

// ─── Missing secret ───────────────────────────────────────────────────
// Must never verify, and must be distinguishable from a bad signature — it is
// our misconfiguration, not the customer's payment failing.

for (const noSecret of [undefined, '']) {
    const res = verifyPaymentSignature(ORDER, PAYMENT, good, noSecret);
    ok(`a missing secret never verifies (${JSON.stringify(noSecret)})`, !res.valid);
    ok(`a missing secret is reported as NO_SECRET (${JSON.stringify(noSecret)})`,
        res.reason === 'NO_SECRET', res.reason);
}

// ─── The route distinguishes the two ──────────────────────────────────
// NO_SECRET must return 503, everything else 400. Reporting our own
// misconfiguration as the customer's payment failing would send them chasing
// their bank over a problem on this side.

import fs from 'fs';
import path from 'path';
const route = fs.readFileSync(
    path.join(__dirname, '..', 'app/api/unpaid-invoice/deliver/route.ts'), 'utf8');
ok('the delivery route branches on NO_SECRET', route.includes("check.reason === 'NO_SECRET'"));
ok('the delivery route returns 503 for a missing secret', /NO_SECRET'[\s\S]{0,200}503/.test(route));
ok('the delivery route returns 400 for a bad signature', /400/.test(route));
ok('the delivery route refuses a replayed order', route.includes("=== 'completed'"));
ok('the delivery route marks completed only after sending',
    route.indexOf('sendComputationCertificate') < route.indexOf("status: 'completed'"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
