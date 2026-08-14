/**
 * lib/gstErrorCodes.ts
 * ─────────────────────────────────────────────────────────────────────
 * Registry of GST portal / GSTR-1 JSON upload error codes.
 *
 * Why this exists: a practitioner whose return upload fails gets a bare code
 * and a terse message. They then search that code. It is high-intent, low
 * competition, recurring every filing cycle, and searched by exactly the
 * segment we sell to — and most of these errors are ones our engine can catch
 * BEFORE the upload, which is the product argument.
 *
 * `officialMessage` is the portal's own wording, kept verbatim so the page
 * matches what the user is staring at. Everything else is our explanation.
 *
 * GSTN changes wording and adds codes without notice — `lastReviewed` is
 * surfaced on the page so readers can judge staleness.
 */

export interface GstErrorCode {
    code: string;
    /** Portal's own message — what the practitioner sees. */
    officialMessage: string;
    /** Short human label for listings. */
    shortTitle: string;
    /** One-sentence plain-English meaning. */
    summary: string;
    whatItMeans: string;
    commonCauses: string[];
    howToFix: string[];
    /** True when a pre-filing validation could have caught this. */
    preventable: boolean;
    /** Which of our checks catches it — only meaningful when preventable. */
    caughtBy?: string;
    related: string[];
    lastReviewed: string;
}

export const GST_ERROR_CODES: GstErrorCode[] = [
    {
        code: 'RET191113',
        officialMessage: 'The GSTIN is invalid. Please provide a valid GSTIN',
        shortTitle: 'Invalid GSTIN',
        summary:
            'A GSTIN in your upload failed validation — either it is malformed, or it is not the GSTIN the portal expected for this account.',
        whatItMeans:
            'The portal checks every GSTIN in the file against the 15-character structure and its checksum, and it checks that the supplier GSTIN in the JSON matches the account you are uploading to. A single transposed character is enough to fail, because the final checksum digit is derived from the preceding fourteen. This is the most frequent GSTR-1 upload failure, and it is almost always a data-entry problem rather than a portal problem.',
        commonCauses: [
            'A recipient GSTIN was typed or imported with a transposed or missing character.',
            'The JSON was generated under one GSTIN and uploaded to a different account — common in practices handling multiple clients.',
            'A GSTIN carries stray spaces, lowercase letters, or a leading apostrophe left behind by Excel.',
            'A B2B invoice was recorded against a customer who is actually unregistered, so no valid GSTIN exists.',
        ],
        howToFix: [
            'Open the error report the portal generates and note which invoices are flagged — it names them.',
            'Check the flagged GSTINs are exactly 15 characters: 2-digit state code, 10-character PAN, 1 entity digit, the letter Z, then the checksum character.',
            'Confirm you are uploading to the correct client account. Practices juggling several GSTINs hit this constantly.',
            'Strip whitespace and force uppercase — Excel exports frequently carry both problems invisibly.',
            'If the customer is genuinely unregistered, move the invoice out of the B2B section into B2C.',
        ],
        preventable: true,
        caughtBy: 'GSTIN format and checksum validation',
        related: ['RET291109', 'RET191106'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191150',
        officialMessage:
            'IGST is mandatory for interstate supply and CGST & SGST should not be present',
        shortTitle: 'Wrong tax type for the supply',
        summary:
            'You split tax into CGST and SGST on a supply the portal considers inter-state — or the reverse.',
        whatItMeans:
            'The portal derives whether a supply is inter-state or intra-state by comparing your state code against the place of supply, then checks that the tax heads match. Same state means CGST + SGST; different states mean IGST. There is no valid invoice that carries all three. The total tax is often identical either way, which is exactly why this survives a manual review and fails an automated one.',
        commonCauses: [
            'Place of supply was set to the buyer’s billing state while the goods were delivered elsewhere, or vice versa.',
            'A bill-to / ship-to transaction was treated by delivery address instead of the bill-to party’s principal place of business.',
            'Accounting software defaulted the tax type from the customer master rather than from the place of supply on the invoice.',
            'A service was invoiced under the default recipient-location rule when a Section 12 exception applied.',
        ],
        howToFix: [
            'For each flagged invoice, compare the first two digits of your GSTIN with the place-of-supply code.',
            'Same code: the invoice must carry CGST + SGST and no IGST. Different codes: IGST only.',
            'Correct the tax heads at source in your accounting system, not just in the JSON — otherwise it recurs next month.',
            'Regenerate the JSON and re-upload.',
            'If the original invoice already reached the customer, issue a credit note and a corrected invoice rather than silently reusing the number.',
        ],
        preventable: true,
        caughtBy: 'Tax type vs place of supply check',
        related: ['RET191179'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191179',
        officialMessage:
            'The place of supply and state code of the supplier should be different for inter-state supply',
        shortTitle: 'Place of supply conflicts with IGST',
        summary:
            'You charged IGST but the place of supply is your own state, which makes it an intra-state supply.',
        whatItMeans:
            'This is the mirror image of RET191150. Here you have declared IGST while the place of supply code equals your own state code. The portal rejects it because inter-state tax cannot apply to a supply that never left the state. Sellers on marketplaces hit this when a warehouse in their own state is recorded as the destination but the tax was set from the buyer’s registered address.',
        commonCauses: [
            'Place of supply defaulted to the supplier’s state while the tax type was set to IGST.',
            'A customer with an out-of-state GSTIN took delivery within your state, and the tax type followed the GSTIN instead of the delivery.',
            'Manual entry left the place-of-supply field at its default value.',
        ],
        howToFix: [
            'Check the place-of-supply code on each flagged invoice against your own state code.',
            'If they match, the supply is intra-state: replace IGST with CGST + SGST, split equally.',
            'If the place of supply was recorded wrongly, correct it — do not change the tax to fit a wrong place of supply.',
            'Regenerate and re-upload.',
        ],
        preventable: true,
        caughtBy: 'Place of supply conflict check',
        related: ['RET191150'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191175',
        officialMessage: 'The rate entered is not valid according to the rate list',
        shortTitle: 'Invalid GST rate',
        summary:
            'A tax rate on your invoice is not one of the notified GST slabs.',
        whatItMeans:
            'GST rates are drawn from a fixed set of notified slabs. Anything outside that list is rejected outright. The usual culprits are an effective rate produced by rounding, a rate entered as a decimal fraction rather than a percentage, or a rate that was correct before a notification changed it.',
        commonCauses: [
            'A computed effective rate such as 17.6% was written to the file instead of the notified 18%.',
            'The rate was entered as 0.18 instead of 18, or with a stray % character in a numeric field.',
            'A rate that changed by notification was not updated in the item master.',
            'Cess or a state levy was folded into the GST rate column.',
        ],
        howToFix: [
            'Pull the flagged lines and check each rate against the notified slabs.',
            'Ensure the value is a plain number in percentage terms — 18, not 0.18 and not "18%".',
            'Verify the rate actually applies to that HSN. A valid rate against the wrong HSN will pass this check and fail elsewhere.',
            'Fix the item master so the same rate is not re-sent next month.',
        ],
        preventable: true,
        caughtBy: 'GST rate slab validation',
        related: ['RET191205'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191205',
        officialMessage:
            'Tax amounts are not in line with the taxable value and the declared tax rate',
        shortTitle: 'Tax amount does not reconcile',
        summary:
            'Taxable value × rate does not equal the tax you declared, within rounding tolerance.',
        whatItMeans:
            'The portal recomputes tax for every line and compares it with what you declared. Small arithmetic drift is the usual cause, and it accumulates when rounding is applied per line and again at the invoice level. The portal does not care that the difference is a rupee.',
        commonCauses: [
            'Rounding applied at both line and invoice level, producing drift.',
            'A discount deducted after the tax computation rather than from taxable value before it.',
            'Manual overrides to the tax amount that were never reflected in taxable value or rate.',
            'Currency conversion or a freight charge added to the total without being taxed.',
        ],
        howToFix: [
            'For each flagged line, recompute taxable value × rate and round to two decimals.',
            'Compare with the declared CGST + SGST or IGST amount and correct the difference.',
            'Check that all line totals sum to the invoice total you declared.',
            'Where discounts exist, confirm they are deducted from taxable value before tax is computed.',
        ],
        preventable: true,
        caughtBy: 'Line-level tax recalculation and total reconciliation',
        related: ['RET191175'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191133',
        officialMessage:
            'Invoices already exist with different CTIN or same CTIN. Please delete and add again',
        shortTitle: 'Duplicate invoice number',
        summary:
            'An invoice with this number is already on the portal for this period.',
        whatItMeans:
            'Invoice numbers must be unique within a financial year. The portal already holds a record with this number, either from an earlier upload of the same return or against a different counterparty GSTIN. Re-uploading a corrected version does not overwrite the original — the existing entry has to be removed first.',
        commonCauses: [
            'The same JSON was uploaded twice, often after an apparent failure that actually succeeded.',
            'An invoice was corrected and re-uploaded without deleting the original.',
            'Separate sales channels generate overlapping invoice series.',
            'The numbering series restarted mid-year instead of at the start of the financial year.',
        ],
        howToFix: [
            'Check whether the invoice is already present and correct on the portal — if it is, there is nothing to fix.',
            'If it needs replacing, delete the existing entry on the portal first, then upload the corrected one.',
            'If two channels are colliding, give each its own prefix so the series stay distinct.',
            'Never reuse a number for a different invoice; issue a credit note instead.',
        ],
        preventable: true,
        caughtBy: 'Duplicate invoice number detection within a batch',
        related: ['RET291107', 'RET191115'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191114',
        officialMessage:
            'Date is Invalid. Date of invoice cannot be before registration date',
        shortTitle: 'Invoice dated before registration',
        summary:
            'The invoice date precedes the date GST registration took effect.',
        whatItMeans:
            'You cannot issue a tax invoice for a period before you were registered. The portal compares each invoice date against the registration date on record and rejects anything earlier. Newly registered businesses hit this when migrating opening data, and it also appears when a date was simply mistyped — a wrong year is the classic.',
        commonCauses: [
            'A newly registered business uploaded invoices raised before registration took effect.',
            'The year was mistyped, placing the invoice in a prior financial year.',
            'Historic data was migrated into the first return after registration.',
            'The date column was misread by the software due to a day/month format mismatch.',
        ],
        howToFix: [
            'Compare each flagged invoice date against your effective registration date.',
            'Correct genuine typos — a wrong year is the most common single cause.',
            'Pre-registration supplies cannot be reported as tax invoices; a registered person cannot charge GST for that period.',
            'Check your export is writing dates in the format the tool expects, so DD/MM is not read as MM/DD.',
        ],
        preventable: true,
        caughtBy: 'Invoice date sanity checks',
        related: ['RET191176'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191115',
        officialMessage:
            'Invoice number does not exist. Please enter a valid invoice number',
        shortTitle: 'Invalid invoice number format',
        summary:
            'The invoice number is missing, too long, or contains characters the rules do not permit.',
        whatItMeans:
            'An invoice number may be at most 16 characters and is restricted to letters, digits, hyphen and slash. Anything longer, blank, or containing other punctuation is rejected. Systems that build numbers by concatenating branch, year and sequence overrun the limit easily.',
        commonCauses: [
            'The number exceeds 16 characters — usually a concatenated branch/year/sequence.',
            'It contains spaces, hash, ampersand or other disallowed punctuation.',
            'The field is blank for some rows in the export.',
            'Excel stripped a leading zero or reformatted the value as a number.',
        ],
        howToFix: [
            'Check every flagged number is 16 characters or fewer.',
            'Restrict characters to letters, digits, hyphen and slash.',
            'Shorten your numbering scheme at source if it structurally overruns.',
            'Format the column as text before exporting so leading zeros survive.',
        ],
        preventable: true,
        caughtBy: 'Invoice number format validation',
        related: ['RET191133'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191124',
        officialMessage: 'Original invoice is invalid. Original invoice cannot be tracked',
        shortTitle: 'Credit/debit note references a missing invoice',
        summary:
            'A credit or debit note points at an original invoice the portal cannot find.',
        whatItMeans:
            'Every credit or debit note must reference an original invoice that already exists on the portal. If that invoice has not been uploaded, was uploaded under a different number, or belongs to a period not yet filed, the reference cannot be resolved and the note is rejected.',
        commonCauses: [
            'The original invoice has not been uploaded yet — order of upload matters.',
            'The referenced number does not match the original exactly, including prefix and padding.',
            'The original belongs to an earlier period that was never filed.',
            'The original was uploaded against a different counterparty GSTIN.',
        ],
        howToFix: [
            'Confirm the original invoice is present on the portal for the correct period.',
            'Match the referenced number character for character against the original.',
            'Upload the original first, then the credit or debit note.',
            'Check the counterparty GSTIN on the note matches the original invoice.',
        ],
        preventable: false,
        related: ['RET191133'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191106',
        officialMessage: 'Error in JSON structure validation',
        shortTitle: 'JSON structure is invalid',
        summary:
            'The portal could not parse the file — this is a file-level problem, not a single bad invoice.',
        whatItMeans:
            'The upload failed before individual invoices were examined. Either the file does not carry the GSTIN the portal expects, or its structure does not match the schema for the return period. Because it fails at the file level, the portal cannot tell you which invoice is at fault — there may be nothing wrong with any of them.',
        commonCauses: [
            'The JSON was produced by an outdated offline utility or an older schema version.',
            'The file lacks the GSTIN, or carries a different one from the account uploading it.',
            'The file was edited by hand and the JSON is no longer well-formed.',
            'The wrong file was selected — a GSTR-3B or a different period.',
        ],
        howToFix: [
            'Confirm you selected the right file for the right return and period.',
            'Regenerate it with the current version of your offline utility or software.',
            'Verify the GSTIN inside the file matches the account you are uploading to.',
            'Avoid hand-editing JSON; fix the data at source and regenerate.',
        ],
        preventable: false,
        related: ['RET191166', 'RET291106'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191166',
        officialMessage: 'Decryption/Decoding failed',
        shortTitle: 'File could not be decoded',
        summary: 'The uploaded file is corrupt or was altered after it was generated.',
        whatItMeans:
            'The portal could not decode the file at all. This is nearly always a transport or corruption problem rather than a data problem: an interrupted download, a file opened and re-saved in an editor, or a truncated upload.',
        commonCauses: [
            'The file was opened and re-saved in a text editor, changing its encoding.',
            'The download or upload was interrupted, leaving it truncated.',
            'The file was renamed to .json from another format.',
            'An antivirus or sync client modified the file in place.',
        ],
        howToFix: [
            'Regenerate the file from source rather than trying to repair it.',
            'Do not open it in an editor before uploading.',
            'Upload from a local disk rather than a synced cloud folder.',
            'Retry on a stable connection.',
        ],
        preventable: false,
        related: ['RET191106'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191148',
        officialMessage:
            'No section data or Gross Turnover is available to process the request',
        shortTitle: 'No data to process',
        summary:
            'The portal found nothing to file — either the sections are empty or turnover is not set.',
        whatItMeans:
            'The submission carried no invoice data in any section, or aggregate turnover has not been declared for the year. This appears when a NIL return is attempted through the wrong route, or when a filter excluded every invoice from the generated file.',
        commonCauses: [
            'A NIL return was attempted without using the NIL filing route.',
            'A date filter excluded every invoice when generating the file.',
            'Aggregate turnover for the preceding financial year was never declared.',
            'The data was prepared under a different period than the one being filed.',
        ],
        howToFix: [
            'If the return is genuinely NIL, file through the NIL route rather than uploading an empty file.',
            'Check the period filter used when generating the file.',
            'Declare aggregate turnover on the portal if it has not been set.',
            'Confirm the period selected on the portal matches the period in the file.',
        ],
        preventable: false,
        related: [],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET191176',
        officialMessage:
            'Do enter the correct shipping bill date that is on or after Invoice Date and on or before today’s date',
        shortTitle: 'Shipping bill date out of range',
        summary:
            'On an export invoice, the shipping bill date is before the invoice date or in the future.',
        whatItMeans:
            'Export invoices carry shipping bill details, and the portal enforces that the shipping bill date falls between the invoice date and today. A date outside that window is rejected. Format mismatches are as common a cause as genuinely wrong dates.',
        commonCauses: [
            'The shipping bill date was entered as earlier than the invoice date.',
            'A future date was entered, often a typo in the year.',
            'DD/MM and MM/DD formats were mixed between systems.',
            'The shipping bill relates to a different invoice.',
        ],
        howToFix: [
            'Check each export invoice: shipping bill date must be on or after the invoice date and not in the future.',
            'Verify the date format your export writes matches what the utility expects.',
            'Confirm the shipping bill actually belongs to that invoice.',
        ],
        preventable: true,
        caughtBy: 'Invoice date sanity checks',
        related: ['RET191114'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET291107',
        officialMessage: 'The invoice no. (s) already exist in the GSTR 1',
        shortTitle: 'Invoice already filed in GSTR-1',
        summary: 'This invoice number is already present in the filed GSTR-1.',
        whatItMeans:
            'The number already exists in a GSTR-1 that has been filed. Unlike a duplicate within a single upload, this one is already on record with the department, so correcting it means an amendment rather than a delete and re-upload.',
        commonCauses: [
            'The invoice was already reported in an earlier period.',
            'A correction was attempted by re-uploading rather than amending.',
            'The numbering series repeated across financial years.',
        ],
        howToFix: [
            'Check which period already carries this invoice number.',
            'If a correction is needed, use the amendment table rather than uploading again.',
            'Ensure the series does not repeat across years.',
        ],
        preventable: true,
        caughtBy: 'Duplicate invoice number detection within a batch',
        related: ['RET191133'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET291109',
        officialMessage: 'The GSTIN of the supplier is invalid',
        shortTitle: 'Supplier GSTIN invalid',
        summary: 'The supplier GSTIN on an invoice failed validation.',
        whatItMeans:
            'The supplier GSTIN, rather than the recipient’s, is malformed or does not exist. In purchase-side data this usually means a vendor master holds a wrong or outdated GSTIN — including one that has since been cancelled.',
        commonCauses: [
            'A vendor master holds a mistyped GSTIN.',
            'The vendor’s registration was cancelled or superseded.',
            'The GSTIN carries whitespace or lowercase characters.',
            'A supply from an unregistered vendor was recorded with a placeholder GSTIN.',
        ],
        howToFix: [
            'Validate the flagged supplier GSTINs against the structure and checksum.',
            'Confirm the registration is still active — a cancelled GSTIN also blocks input tax credit.',
            'Correct the vendor master so it does not recur.',
            'Record genuinely unregistered vendors correctly rather than with a placeholder.',
        ],
        preventable: true,
        caughtBy: 'GSTIN format and checksum validation',
        related: ['RET191113'],
        lastReviewed: '2026-08-13',
    },
    {
        code: 'RET291106',
        officialMessage: 'Error in JSON structure validation',
        shortTitle: 'JSON structure invalid (purchase side)',
        summary:
            'The purchase-side file could not be parsed — the GSTIN is missing or the structure is wrong.',
        whatItMeans:
            'The purchase-side equivalent of RET191106. The file failed schema validation before any invoice was read, most often because it does not carry the GSTIN or was produced by an outdated utility.',
        commonCauses: [
            'The file omits the GSTIN.',
            'It was generated by an outdated offline utility.',
            'The structure was altered by hand editing.',
        ],
        howToFix: [
            'Regenerate the file with a current utility.',
            'Confirm the GSTIN is present and matches the account.',
            'Do not hand-edit the JSON.',
        ],
        preventable: false,
        related: ['RET191106'],
        lastReviewed: '2026-08-13',
    },
];

export function getErrorCode(code: string): GstErrorCode | undefined {
    const needle = code.trim().toUpperCase();
    return GST_ERROR_CODES.find((e) => e.code === needle);
}

/** Codes our pre-filing validation can catch, used for the index summary. */
export const PREVENTABLE_COUNT = GST_ERROR_CODES.filter((e) => e.preventable).length;
