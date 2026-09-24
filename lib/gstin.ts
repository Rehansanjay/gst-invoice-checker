/**
 * lib/gstin.ts
 * ─────────────────────────────────────────────────────────────────────
 * Reads a GSTIN offline: shape, checksum, state and the PAN inside it.
 *
 * WHAT THIS CAN AND CANNOT SAY
 *
 * A GSTIN's last character is a checksum of the first fourteen, so an
 * invented or mistyped number almost never passes. That is a real test
 * of whether a number COULD have been issued.
 *
 * It says nothing about whether the number WAS issued, or whether it is
 * still active. Registration status lives on the GST portal. Anything that
 * shows this result must say so, and link to the portal's own search,
 * rather than let "valid format" read as "genuine business".
 */

const CODEPOINTS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** State and UT codes as used in the first two digits of a GSTIN. */
export const GST_STATES: Readonly<Record<string, string>> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
    '97': 'Other Territory',
};

/** The 4th character of a PAN says what kind of holder it is. */
const HOLDER_TYPES: Readonly<Record<string, string>> = {
    P: 'Individual / proprietor',
    C: 'Company',
    H: 'Hindu Undivided Family',
    F: 'Firm / LLP',
    A: 'Association of Persons',
    T: 'Trust',
    B: 'Body of Individuals',
    L: 'Local authority',
    J: 'Artificial juridical person',
    G: 'Government',
};

/** The checksum character GSTN derives from the first 14 characters. */
export function gstinCheckChar(first14: string): string {
    const mod = CODEPOINTS.length;
    let factor = 2;
    let sum = 0;
    for (let i = first14.length - 1; i >= 0; i--) {
        const product = factor * CODEPOINTS.indexOf(first14[i]);
        sum += Math.floor(product / mod) + (product % mod);
        factor = factor === 2 ? 1 : 2;
    }
    return CODEPOINTS[(mod - (sum % mod)) % mod];
}

export interface GstinReading {
    normalised: string;
    /** Shape and checksum both pass. */
    valid: boolean;
    /** Plain-language reasons it failed; empty when valid. */
    problems: string[];
    stateCode?: string;
    stateName?: string;
    pan?: string;
    holderType?: string;
}

const SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function readGstin(input: string): GstinReading {
    const normalised = input.replace(/\s+/g, '').toUpperCase();
    const problems: string[] = [];

    if (normalised.length !== 15) {
        problems.push(`A GSTIN has 15 characters; this has ${normalised.length}.`);
        return { normalised, valid: false, problems };
    }
    if (!SHAPE.test(normalised)) {
        problems.push('The characters are not in the GSTIN pattern (2 digits, a 10-character PAN, 1 entity character, the letter Z, 1 check character).');
        return { normalised, valid: false, problems };
    }

    const stateCode = normalised.slice(0, 2);
    const stateName = GST_STATES[stateCode];
    const pan = normalised.slice(2, 12);
    const holderType = HOLDER_TYPES[pan[3]];

    if (!stateName) problems.push(`"${stateCode}" is not a GST state code.`);

    const expected = gstinCheckChar(normalised.slice(0, 14));
    if (normalised[14] !== expected) {
        problems.push('The last character does not match the checksum of the first fourteen. The number is mistyped or made up.');
    }

    return { normalised, valid: problems.length === 0, problems, stateCode, stateName, pan, holderType };
}

/** The GST portal's public taxpayer search, where registration status lives. */
export const GST_PORTAL_SEARCH_URL = 'https://services.gst.gov.in/services/searchtp';
