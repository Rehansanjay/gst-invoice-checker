/**
 * Guards the prices shown on /pricing against the prices actually charged.
 *
 * The server looks up its own price from packageType and ignores whatever the
 * client sends, which is the right design — a client-supplied price would be
 * a hole. But it also means the two can drift apart silently, and they had:
 * the page advertised ₹599, ₹1,999 and ₹2,999 while the API charged ₹399,
 * ₹1,499 and ₹2,499. Customers were charged less than the page promised, so
 * nobody complained and nothing broke. It just quietly stopped being true.
 *
 * Same class of bug as the check-count drift, and caught the same way: read
 * both sources and compare.
 */
import fs from 'fs';
import path from 'path';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const root = path.join(__dirname, '..');
const api = fs.readFileSync(path.join(root, 'app/api/purchase-package/route.ts'), 'utf8');
const page = fs.readFileSync(path.join(root, 'app/(marketing)/pricing/page.tsx'), 'utf8');
const paymentRoute = fs.readFileSync(path.join(root, 'app/api/payment/route.ts'), 'utf8');

// ─── What the server charges ──────────────────────────────────────────

const serverPackages = new Map<string, { price: number; credits: number }>();
for (const m of api.matchAll(/(\w+):\s*\{\s*price:\s*(\d+),\s*credits:\s*(\d+)\s*\}/g)) {
    serverPackages.set(m[1], { price: Number(m[2]), credits: Number(m[3]) });
}
ok('the server package map was parsed', serverPackages.size >= 4, [...serverPackages.keys()]);

// ─── What the page renders ────────────────────────────────────────────

const pageButtons = new Map<string, { price: number; credits: number }>();
for (const m of page.matchAll(/packageType="(\w+)"\s*\n\s*price=\{(\d+)\}\s*\n\s*credits=\{(\d+)\}/g)) {
    pageButtons.set(m[1], { price: Number(m[2]), credits: Number(m[3]) });
}
ok('the page purchase buttons were parsed', pageButtons.size >= 4, [...pageButtons.keys()]);

// ─── They must agree ──────────────────────────────────────────────────

for (const [type, shown] of pageButtons) {
    const charged = serverPackages.get(type);
    ok(`${type} is a package the server knows about`, charged !== undefined, type);
    if (!charged) continue;
    ok(`${type}: page price ₹${shown.price} matches charged ₹${charged.price}`,
        shown.price === charged.price, { shown: shown.price, charged: charged.price });
    ok(`${type}: page credits ${shown.credits} match granted ${charged.credits}`,
        shown.credits === charged.credits, { shown: shown.credits, granted: charged.credits });
}

// ─── Credits are granted from a second map, which must also agree ─────
// app/api/payment/route.ts keeps its own CREDITS_MAP. A package missing from
// it falls through to `?? 1`, granting a single credit for a ₹4,999 payment.

const creditsMap = new Map<string, number>();
const block = paymentRoute.match(/const CREDITS_MAP[^}]+\}/)?.[0] ?? '';
for (const m of block.matchAll(/(\w+):\s*(\d+)/g)) creditsMap.set(m[1], Number(m[2]));

for (const [type, charged] of serverPackages) {
    ok(`${type} appears in CREDITS_MAP, so it cannot fall through to 1 credit`,
        creditsMap.has(type), { type, creditsMap: [...creditsMap.keys()] });
    if (creditsMap.has(type)) {
        ok(`${type}: CREDITS_MAP grants ${creditsMap.get(type)}, matching ${charged.credits}`,
            creditsMap.get(type) === charged.credits,
            { creditsMap: creditsMap.get(type), packages: charged.credits });
    }
}

// ─── The ladder must descend ──────────────────────────────────────────
// A bigger pack that costs more per check is the kind of thing a CA notices
// in the first ten seconds, and it is exactly what selling 100 checks at
// ₹4,999 would have done next to a ₹2,499 pack of the same size.

const ladder = [...serverPackages.entries()]
    .map(([type, p]) => ({ type, perCheck: p.price / p.credits, credits: p.credits }))
    .sort((a, b) => a.credits - b.credits);

for (let i = 1; i < ladder.length; i++) {
    ok(`${ladder[i].type} costs less per check than ${ladder[i - 1].type}`,
        ladder[i].perCheck < ladder[i - 1].perCheck,
        ladder.map((l) => `${l.type}=₹${l.perCheck.toFixed(2)}`));
}

// ─── The practice tier is purchasable ─────────────────────────────────
// It sat behind a contact form for weeks. A CA who wanted to pay could not.

ok('the practice tier exists server-side', serverPackages.has('practice_250'));
ok('the practice tier has a buy button on the page', pageButtons.has('practice_250'));
ok('the practice tier is the cheapest per check',
    ladder[ladder.length - 1]?.type === 'practice_250', ladder.map((l) => l.type));

// It is a one-off order, not a Razorpay subscription. Saying "/month" beside a
// button that does not renew would be a promise the payment flow cannot keep.
const practiceCard = page.slice(page.indexOf('CA Bulk Plan'), page.indexOf('</ul>', page.indexOf('CA Bulk Plan')));
ok('the practice card does not claim to be monthly', !/\/month/.test(practiceCard),
    practiceCard.match(/.{0,60}\/month.{0,60}/)?.[0]);
ok('the practice card says it does not auto-renew', /not a subscription|does not.{0,20}renew|nothing renews/i.test(practiceCard));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
