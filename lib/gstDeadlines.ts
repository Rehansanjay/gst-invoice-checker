/**
 * lib/gstDeadlines.ts
 * ─────────────────────────────────────────────────────────────────────
 * GST filing deadlines recur monthly, so they are derived from the current
 * date rather than listed. The previous implementation hardcoded three dates
 * in March 2026; once those passed the reminder became permanently inert.
 *
 * Monthly due dates:
 *   GSTR-1  — 11th (outward supplies)
 *   GSTR-3B — 20th (summary return and tax payment)
 *
 * We remind three days out and again the day before. Anything more is noise
 * to someone who files every month.
 */

export type ReturnType = 'GSTR-1' | 'GSTR-3B';

export interface DeadlineWindow {
    return: ReturnType;
    /** Day of month the return is due. */
    dueDay: number;
    daysLeft: number;
    urgency: 'moderate' | 'critical';
}

const DUE_DAYS: { type: ReturnType; day: number }[] = [
    { type: 'GSTR-1', day: 11 },
    { type: 'GSTR-3B', day: 20 },
];

/** Today's date in IST, which is what Indian filing deadlines are measured in. */
export function todayIST(): Date {
    const now = new Date();
    // Shift into IST then read the UTC parts, so the calendar day is IST's.
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

/**
 * Returns the reminder due today, or null. Reminders fire 3 days before a due
 * date and again 1 day before.
 */
export function reminderForToday(date: Date = todayIST()): DeadlineWindow | null {
    const dayOfMonth = date.getUTCDate();

    for (const { type, day } of DUE_DAYS) {
        const daysLeft = day - dayOfMonth;
        if (daysLeft === 3) {
            return { return: type, dueDay: day, daysLeft, urgency: 'moderate' };
        }
        if (daysLeft === 1) {
            return { return: type, dueDay: day, daysLeft, urgency: 'critical' };
        }
    }
    return null;
}

/** e.g. "11 September 2026" for the due date in the month of `date`. */
export function formatDueDate(date: Date, dueDay: number): string {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), dueDay));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
