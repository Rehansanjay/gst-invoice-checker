/**
 * lib/udyam.ts
 * ─────────────────────────────────────────────────────────────────────
 * Udyam Registration Number: FORMAT checking only.
 *
 * The MSMED Act's delayed-payment remedies run to registered micro and small
 * enterprises, and registration is evidenced by a Udyam number in the form
 *
 *     UDYAM-XX-00-0000000
 *              │   │    └─ seven digit serial
 *              │   └────── two digit district/office code
 *              └────────── two LETTER state code (GJ, MH, KA …)
 *
 * Note the state code is alphabetic. GSTIN uses a two DIGIT code and the two
 * schemes are unrelated, so VALID_STATE_CODES from types/ does not apply here.
 *
 * WHAT THIS DOES NOT DO
 *
 * It does not verify the number against the Udyam portal, confirm the holder,
 * or establish the registration date. It reads the shape of a string. The UI
 * must say so — a user who is told their number "checks out" and reads that as
 * "my claim is valid" has been misled by us, not by the tool.
 *
 * The same reasoning governs the return type: `problems`, not `valid` alone.
 * Whether someone has a claim is a legal conclusion, and stating one is
 * exactly the line lib/msmeInterest.ts and the page copy stay behind.
 */

/**
 * Two-letter state codes seen in Udyam numbers.
 *
 * Best-effort and deliberately non-authoritative: the Ministry publishes no
 * machine-readable list, so an unrecognised code is reported as UNRECOGNISED,
 * never as invalid. A real registration from a state missing here must not be
 * rejected by our guesswork.
 */
export const UDYAM_STATE_CODES: Readonly<Record<string, string>> = {
    AN: 'Andaman and Nicobar Islands',
    AP: 'Andhra Pradesh',
    AR: 'Arunachal Pradesh',
    AS: 'Assam',
    BR: 'Bihar',
    CG: 'Chhattisgarh',
    CH: 'Chandigarh',
    DD: 'Daman and Diu',
    DL: 'Delhi',
    DN: 'Dadra and Nagar Haveli',
    GA: 'Goa',
    GJ: 'Gujarat',
    HP: 'Himachal Pradesh',
    HR: 'Haryana',
    JH: 'Jharkhand',
    JK: 'Jammu and Kashmir',
    KA: 'Karnataka',
    KL: 'Kerala',
    LA: 'Ladakh',
    LD: 'Lakshadweep',
    MH: 'Maharashtra',
    ML: 'Meghalaya',
    MN: 'Manipur',
    MP: 'Madhya Pradesh',
    MZ: 'Mizoram',
    NL: 'Nagaland',
    OD: 'Odisha',
    PB: 'Punjab',
    PY: 'Puducherry',
    RJ: 'Rajasthan',
    SK: 'Sikkim',
    TN: 'Tamil Nadu',
    TR: 'Tripura',
    TS: 'Telangana',
    UK: 'Uttarakhand',
    UP: 'Uttar Pradesh',
    WB: 'West Bengal',
};

const UDYAM_PATTERN = /^UDYAM-([A-Z]{2})-(\d{2})-(\d{7})$/;

export type UdyamProblem = 'EMPTY' | 'MALFORMED' | 'UNRECOGNISED_STATE';

export interface UdyamRead {
    /** Uppercased, whitespace-stripped. Empty when nothing was supplied. */
    normalised: string;
    /** True only when the string matches the published format exactly. */
    wellFormed: boolean;
    stateCode: string | null;
    stateName: string | null;
    problems: UdyamProblem[];
}

/**
 * Reads a Udyam number's shape. Never throws, never rejects on a hunch.
 *
 * An empty input is not an error: the number is optional on the calculator,
 * because someone who does not have one still gets a useful figure and a
 * pointer to registration.
 */
export function readUdyam(raw: string | null | undefined): UdyamRead {
    const normalised = (raw ?? '').replace(/\s+/g, '').toUpperCase();

    if (!normalised) {
        return { normalised: '', wellFormed: false, stateCode: null, stateName: null, problems: ['EMPTY'] };
    }

    const match = UDYAM_PATTERN.exec(normalised);
    if (!match) {
        return { normalised, wellFormed: false, stateCode: null, stateName: null, problems: ['MALFORMED'] };
    }

    const stateCode = match[1];
    const stateName = UDYAM_STATE_CODES[stateCode] ?? null;

    return {
        normalised,
        wellFormed: true,
        stateCode,
        stateName,
        // A well-formed number with an unfamiliar state code is still well
        // formed. The flag exists so the UI can say "we don't recognise GZ" —
        // useful if it is a typo, harmless if our list is simply incomplete.
        problems: stateName ? [] : ['UNRECOGNISED_STATE'],
    };
}

/** Human-readable note for a problem, phrased as an observation not a ruling. */
export function describeUdyamProblem(problem: UdyamProblem): string {
    switch (problem) {
        case 'EMPTY':
            return 'No Udyam number entered. The MSMED Act delayed-payment provisions run to registered micro and small enterprises, and registration is evidenced by a Udyam number.';
        case 'MALFORMED':
            return 'This does not match the Udyam format UDYAM-XX-00-0000000. Check the number on your registration certificate.';
        case 'UNRECOGNISED_STATE':
            return 'We do not recognise the state code in this number. It may be a typo, or our list may be incomplete — the number is otherwise correctly formatted.';
    }
}
