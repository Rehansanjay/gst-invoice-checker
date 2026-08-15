/**
 * Deadline scheduling: the reminder must fire exactly 4 days a month and stay
 * silent on the other ~26. The previous implementation hardcoded three dates in
 * March 2026 and went permanently inert once they passed, so this pins the
 * recurring behaviour.
 */
import { reminderForToday, formatDueDate } from '../lib/gstDeadlines';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: unknown) => {
    if (cond) pass++; else { fail++; console.log('  FAIL:', name, extra ?? ''); }
};

/** Build a UTC date whose calendar day is what reminderForToday reads. */
const day = (d: number, month = 8, year = 2026) => new Date(Date.UTC(year, month - 1, d));

// --- fires on exactly the right days ---
const r8 = reminderForToday(day(8));
ok('8th → GSTR-1, 3 days out', r8?.return === 'GSTR-1' && r8?.daysLeft === 3 && r8?.urgency === 'moderate', r8);

const r10 = reminderForToday(day(10));
ok('10th → GSTR-1, tomorrow', r10?.return === 'GSTR-1' && r10?.daysLeft === 1 && r10?.urgency === 'critical', r10);

const r17 = reminderForToday(day(17));
ok('17th → GSTR-3B, 3 days out', r17?.return === 'GSTR-3B' && r17?.daysLeft === 3, r17);

const r19 = reminderForToday(day(19));
ok('19th → GSTR-3B, tomorrow', r19?.return === 'GSTR-3B' && r19?.daysLeft === 1 && r19?.urgency === 'critical', r19);

// --- silent every other day of the month ---
const firing = [8, 10, 17, 19];
let silentDays = 0;
for (let d = 1; d <= 28; d++) {
    const r = reminderForToday(day(d));
    if (firing.includes(d)) {
        ok(`day ${d} fires`, r !== null, r);
    } else {
        if (r === null) silentDays++; else console.log(`  FAIL: day ${d} should be silent, got`, r);
    }
}
ok('silent on all 24 other days of a 28-day span', silentDays === 24, silentDays);

// --- never fires on a due date itself (too late to be useful) ---
ok('11th (due date) is silent', reminderForToday(day(11)) === null);
ok('20th (due date) is silent', reminderForToday(day(20)) === null);

// --- works across months, including short ones ---
ok('Feb 8th fires', reminderForToday(day(8, 2)) !== null);
ok('Dec 19th fires', reminderForToday(day(19, 12)) !== null);

// --- due date formatting ---
ok('formats GSTR-1 due date', formatDueDate(day(8), 11) === '11 August 2026', formatDueDate(day(8), 11));
ok('formats GSTR-3B due date', formatDueDate(day(17), 20) === '20 August 2026', formatDueDate(day(17), 20));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
