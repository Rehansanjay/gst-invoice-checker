/**
 * lib/sanitize.ts
 * ─────────────────────────────────────────────────────────────────────
 * HTML sanitization utility to prevent XSS in email templates.
 */

/**
 * Escape HTML special characters to prevent XSS injection.
 * Use this whenever interpolating user-supplied strings into HTML templates.
 */
export function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
