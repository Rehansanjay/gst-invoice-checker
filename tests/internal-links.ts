/**
 * Guards against orphaned pages.
 *
 * /unpaid-invoice shipped with a sitemap entry and nothing else — zero
 * internal links, absent from both the nav and the footer. A sitemap entry
 * tells Google a URL exists; internal links are how it decides the URL is
 * worth spending crawl budget on. On a domain where thirteen pages are already
 * stuck at "Discovered — currently not indexed", shipping an orphan is close
 * to shipping nothing.
 *
 * Every other indexable page had between three and eight inbound links. This
 * test makes that the floor rather than a coincidence.
 */
import fs from 'fs';
import path from 'path';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

/** Every .tsx under app/ and components/, so links are counted wherever they live. */
function walk(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel, out);
        else if (entry.name.endsWith('.tsx')) out.push(rel);
    }
    return out;
}

const sources = [...walk('app'), ...walk('components')];
const sitemap = read('app/sitemap.ts');
const footerSrc = read('components/Footer.tsx');
const footerHas = (route: string) => footerSrc.includes(`/${route}`);

/** Marketing routes declared in the sitemap, which is what we promise Google. */
const sitemapRoutes = [...sitemap.matchAll(/\$\{SITE_URL\}\/([a-z0-9-]+)`/g)]
    .map((m) => m[1])
    .filter((r) => r !== 'sitemap.xml');

ok('sitemap routes were parsed', sitemapRoutes.length > 5, sitemapRoutes);

/** Minimum inbound internal links before a page counts as reachable. */
const MIN_INBOUND = 2;

/**
 * Pages that legitimately live in the footer and nowhere else.
 *
 * Nobody arrives at a refund policy through a contextual link, and pretending
 * otherwise would push us into scattering links that serve the test rather
 * than the reader. These still need to exist and be crawlable; they do not
 * need to be promoted.
 */
const FOOTER_ONLY = new Set(['privacy', 'terms', 'refund', 'about', 'contact', 'faq']);

for (const route of [...new Set(sitemapRoutes)]) {
    if (FOOTER_ONLY.has(route)) {
        ok(`/${route} is in the footer (footer-only page)`, footerHas(route), route);
        continue;
    }
    // Count links from files that are not the page itself.
    const ownDir = `/${route}/`;
    let inbound = 0;
    for (const file of sources) {
        if (file.includes(ownDir)) continue;
        const text = read(file);
        const pattern = new RegExp(`href=["'\`]/${route}(\\?[^"'\`]*)?["'\`]|href=\\{\`/${route}`, 'g');
        inbound += (text.match(pattern) ?? []).length;
    }
    ok(`/${route} has at least ${MIN_INBOUND} inbound internal links (has ${inbound})`,
        inbound >= MIN_INBOUND, `/${route} is reachable from ${inbound} place(s)`);
}

// ─── The two site-wide surfaces ───────────────────────────────────────
// A page in neither the nav nor the footer is reachable only by whoever
// already knows it exists.

const navbar = read('components/Navbar.tsx');
const footer = footerSrc;

for (const route of ['unpaid-invoice', 'bulk', 'verify-invoice', 'gst-penalty-calculator']) {
    ok(`/${route} appears in the nav or the footer`,
        navbar.includes(`/${route}`) || footer.includes(`/${route}`));
}

// ─── llms.txt ─────────────────────────────────────────────────────────

const llms = read('app/llms.txt/route.ts');
ok('llms.txt reads the Bank Rate from the series rather than restating it',
    llms.includes('currentRate()') && !/Bank Rate: 5\.50/.test(llms));
ok('llms.txt names the current filing venue', llms.includes('odr.msme.gov.in'));
ok('llms.txt dates the portal change', llms.includes('15 October 2025'));
ok('llms.txt states who is NOT covered', /do NOT cover|Medium enterprises/.test(llms));
ok('llms.txt disclaims legal advice', /not a law firm/i.test(llms));
ok('llms.txt links the calculator', llms.includes('/unpaid-invoice'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
