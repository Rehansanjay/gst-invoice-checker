/**
 * Guards the affiliate integration.
 *
 * The revenue here is small — a few thousand rupees a month at current
 * traffic. What is not small is what a careless implementation costs: an
 * unmarked paid link is a Google link-scheme violation and can undo the
 * rankings this site spent months earning, and an undisclosed recommendation
 * undoes the one thing the site has going for it, which is that every claim
 * on it cites a source.
 *
 * So these tests protect the rules, not the money.
 */
import fs from 'fs';
import path from 'path';
import {
    AFFILIATE_OFFERS,
    AFFILIATE_REL,
    AFFILIATE_DISCLOSURE,
    activeOffers,
    hasAffiliateOffers,
    type AffiliateOffer,
} from '../lib/affiliates';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

// ─── Inert until configured ───────────────────────────────────────────
// This ships merged before any programme has approved him. It must render
// nothing at all rather than a placeholder or a dead link.

ok('no offer ships with a URL already filled in',
    AFFILIATE_OFFERS.every((o) => o.url === ''),
    AFFILIATE_OFFERS.filter((o) => o.url !== '').map((o) => o.id));

ok('nothing is active out of the box', activeOffers().length === 0);
ok('hasAffiliateOffers is false out of the box', hasAffiliateOffers() === false);

// ─── Only real https links count ──────────────────────────────────────

const fixture: AffiliateOffer[] = [
    { id: 'good', name: 'Good', url: 'https://example.test/?ref=abc', reason: 'x' },
    { id: 'empty', name: 'Empty', url: '', reason: 'x' },
    { id: 'space', name: 'Whitespace', url: '   ', reason: 'x' },
    { id: 'insecure', name: 'Insecure', url: 'http://example.test/?ref=abc', reason: 'x' },
    { id: 'placeholder', name: 'Placeholder', url: 'YOUR_LINK_HERE', reason: 'x' },
];

ok('only the https link activates', activeOffers(fixture).length === 1);
ok('and it is the right one', activeOffers(fixture)[0]?.id === 'good');
ok('an empty url never activates', !activeOffers(fixture).some((o) => o.id === 'empty'));
ok('whitespace never activates', !activeOffers(fixture).some((o) => o.id === 'space'));
ok('a plain http url never activates', !activeOffers(fixture).some((o) => o.id === 'insecure'));
ok('an unreplaced placeholder never activates', !activeOffers(fixture).some((o) => o.id === 'placeholder'));
ok('hasAffiliateOffers is true when one is real', hasAffiliateOffers(fixture));

// ─── The rel attribute ────────────────────────────────────────────────
// Google asks for `sponsored` on paid links specifically. Leaving it off is a
// link-scheme violation. `noopener` closes the target="_blank" tab-nabbing
// hole. None of these is cosmetic.

for (const token of ['sponsored', 'nofollow', 'noopener', 'noreferrer']) {
    ok(`rel includes ${token}`, AFFILIATE_REL.split(/\s+/).includes(token), AFFILIATE_REL);
}

// ─── Disclosure ───────────────────────────────────────────────────────

ok('a disclosure exists', AFFILIATE_DISCLOSURE.trim().length > 60);
ok('it says the money is a commission', /commission/i.test(AFFILIATE_DISCLOSURE));
ok('it says the visitor pays no more', /no extra cost/i.test(AFFILIATE_DISCLOSURE));
ok('it says the checker output is unaffected',
    /nothing here changes what the checker reports/i.test(AFFILIATE_DISCLOSURE));

// ─── Every offer is honestly described ────────────────────────────────

for (const o of AFFILIATE_OFFERS) {
    ok(`${o.id} has a name`, o.name.trim().length > 1);
    ok(`${o.id} explains why it is relevant`, o.reason.trim().length > 40, o.reason);
    ok(`${o.id} makes no superlative claim`,
        !/\b(best|number one|#1|guaranteed|cheapest|top rated)\b/i.test(o.reason), o.reason);
}

// ─── Placement ────────────────────────────────────────────────────────
// Results pages only. The guides are the only pages earning trust, and the
// homepage hero is the first impression — a paid link in either costs more
// than it makes.

const root = path.join(__dirname, '..');
const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel, out);
        else if (e.name.endsWith('.tsx')) out.push(rel);
    }
    return out;
};

const users = [...walk('app'), ...walk('components')]
    .filter((f) => f !== 'components/AffiliateSuggestion.tsx')
    .filter((f) => fs.readFileSync(path.join(root, f), 'utf8').includes('AffiliateSuggestion'));

ok('it is used somewhere', users.length > 0);
ok('never on a guide', !users.some((f) => f.includes('/guides/')), users.filter((f) => f.includes('/guides/')));
ok('never on the homepage', !users.some((f) => f.endsWith('(marketing)/page.tsx')), users);
ok('never in the navbar or footer',
    !users.some((f) => /Navbar|Footer/.test(f)), users);

// The component itself must carry the rel and the disclosure — a caller
// cannot be trusted to remember either.
const component = fs.readFileSync(path.join(root, 'components/AffiliateSuggestion.tsx'), 'utf8');
ok('the component applies AFFILIATE_REL', component.includes('rel={AFFILIATE_REL}'));
ok('the component renders the disclosure', component.includes('AFFILIATE_DISCLOSURE'));
ok('the component returns null when nothing is active',
    /activeOffers\([\s\S]{0,40}\)[\s\S]{0,80}length === 0[\s\S]{0,30}return null/.test(component));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
