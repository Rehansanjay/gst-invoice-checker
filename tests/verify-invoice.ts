/**
 * Guards the instant verifier: the GSTIN reader and the e-invoice QR reader.
 *
 * Two things are being protected. The checksum must reject a mistyped
 * number, because that is the whole value of the check. And the QR reader
 * must never claim more than it knows: it decodes, it does not verify a
 * signature, so a well-formed token is reported as read, not as genuine.
 */
import { readGstin, gstinCheckChar } from '../lib/gstin';
import { readEInvoiceQr } from '../lib/einvoiceQr';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const withCheck = (first14: string) => first14 + gstinCheckChar(first14);

// ─── GSTIN checksum ───────────────────────────────────────────────────

// A widely published GSTIN whose checksum is known to be V.
ok('checksum matches a known-good GSTIN', gstinCheckChar('27AAPFU0939F1Z') === 'V');

const good = readGstin('27AAPFU0939F1ZV');
ok('a correct GSTIN is valid', good.valid, good.problems);
ok('the state is named', good.stateName === 'Maharashtra', good.stateName);
ok('the PAN is extracted', good.pan === 'AAPFU0939F', good.pan);
ok('the holder type is read from the PAN', good.holderType === 'Firm / LLP', good.holderType);

ok('lowercase and spaces are normalised', readGstin(' 27aapfu0939f1zv ').valid);

const typo = readGstin('27AAPFU0939F1ZW');
ok('one wrong check character is rejected', !typo.valid);
ok('and the reason names the checksum', typo.problems.some((p) => p.includes('checksum')), typo.problems);

const swapped = readGstin('27AAPFU0993F1ZV');
ok('two transposed digits are rejected', !swapped.valid);

ok('wrong length is rejected with a count', readGstin('27AAPFU0939F1Z').problems[0]?.includes('14'));
ok('a non-GSTIN pattern is rejected', !readGstin('ABCDEFGHIJKLMNO').valid);

const badState = readGstin(withCheck('99AAPFU0939F1Z'));
ok('an unknown state code is reported', !badState.valid && badState.problems.some((p) => p.includes('state code')), badState.problems);

// ─── e-invoice QR ─────────────────────────────────────────────────────

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = (data: Record<string, unknown>, iss = 'NIC') =>
    [b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })), b64url(JSON.stringify({ data: JSON.stringify(data), iss })), 'c2ln'].join('.');

const seller = '27AAPFU0939F1ZV';
const buyer = withCheck('33AABCT1332L1Z');
const irn = 'a'.repeat(64);
const invoice = {
    SellerGstin: seller, BuyerGstin: buyer, DocNo: 'INV/26-27/014', DocTyp: 'INV', DocDt: '20/09/2026',
    TotInvVal: 11800, ItemCnt: 1, MainHsnCode: '998311', Irn: irn, IrnDt: '2026-09-20 11:02:00',
};

const read = readEInvoiceQr(token(invoice));
ok('a well-formed e-invoice QR is read', read.kind === 'einvoice', read);
if (read.kind === 'einvoice') {
    ok('fields are decoded', read.fields.docNo === 'INV/26-27/014' && read.fields.totalValue === 11800, read.fields);
    ok('issuer is decoded', read.fields.issuer === 'NIC');
    ok('no problems for a clean QR', read.problems.length === 0, read.problems);
}

const badSeller = readEInvoiceQr(token({ ...invoice, SellerGstin: '27AAPFU0939F1ZW' }));
ok('a QR carrying a bad supplier GSTIN is flagged', badSeller.kind === 'einvoice' && badSeller.problems.some((p) => p.includes('supplier GSTIN')));

const badIrn = readEInvoiceQr(token({ ...invoice, Irn: 'short' }));
ok('a malformed IRN is flagged', badIrn.kind === 'einvoice' && badIrn.problems.some((p) => p.includes('IRN')));

const urp = readEInvoiceQr(token({ ...invoice, BuyerGstin: 'URP' }));
ok('an unregistered buyer (URP) is not treated as an error', urp.kind === 'einvoice' && urp.buyer === null && urp.problems.length === 0);

ok('a UPI QR is recognised as a payment QR', readEInvoiceQr('upi://pay?pa=shop@okaxis&am=100').kind === 'upi');
ok('a plain URL is not an e-invoice QR', readEInvoiceQr('https://example.com/invoice/1').kind === 'not-einvoice');
ok('garbage in three parts is not an e-invoice QR', readEInvoiceQr('a.b.c').kind === 'not-einvoice');
ok('a token without invoice data is not an e-invoice QR', readEInvoiceQr(token({ foo: 1 })).kind === 'not-einvoice');

console.log(`verify-invoice: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
