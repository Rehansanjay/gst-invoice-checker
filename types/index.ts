export type InvoiceType =
  | 'tax_invoice'
  | 'bill_of_supply'
  | 'credit_note'
  | 'debit_note'
  | 'export_invoice';

export interface ParsedInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGSTIN: string;
  buyerGSTIN: string;
  supplierName?: string;
  buyerName?: string;
  lineItems: LineItem[];
  taxableTotalAmount: number;
  totalTaxAmount: number;
  invoiceTotalAmount: number;
  // New compliance fields
  invoiceType?: InvoiceType;
  placeOfSupply?: string;   // 2-digit state code e.g. "27"
  reverseCharge?: boolean;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  tax_invoice: 'Tax Invoice',
  bill_of_supply: 'Bill of Supply',
  credit_note: 'Credit Note',
  debit_note: 'Debit Note',
  export_invoice: 'Export Invoice',
};

export const STATE_CODE_NAMES: Record<string, string> = {
  '01': '01 - Jammu & Kashmir', '02': '02 - Himachal Pradesh',
  '03': '03 - Punjab', '04': '04 - Chandigarh',
  '05': '05 - Uttarakhand', '06': '06 - Haryana',
  '07': '07 - Delhi', '08': '08 - Rajasthan',
  '09': '09 - Uttar Pradesh', '10': '10 - Bihar',
  '11': '11 - Sikkim', '12': '12 - Arunachal Pradesh',
  '13': '13 - Nagaland', '14': '14 - Manipur',
  '15': '15 - Mizoram', '16': '16 - Tripura',
  '17': '17 - Meghalaya', '18': '18 - Assam',
  '19': '19 - West Bengal', '20': '20 - Jharkhand',
  '21': '21 - Odisha', '22': '22 - Chhattisgarh',
  '23': '23 - Madhya Pradesh', '24': '24 - Gujarat',
  '25': '25 - Daman & Diu', '26': '26 - Dadra & Nagar Haveli',
  '27': '27 - Maharashtra', '28': '28 - Andhra Pradesh (old)',
  '29': '29 - Karnataka', '30': '30 - Goa',
  '31': '31 - Lakshadweep', '32': '32 - Kerala',
  '33': '33 - Tamil Nadu', '34': '34 - Puducherry',
  '35': '35 - Andaman & Nicobar', '36': '36 - Telangana',
  '37': '37 - Andhra Pradesh', '38': '38 - Ladakh',
  '97': '97 - Other Territory',
};

export interface LineItem {
  lineNumber: number;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  taxableAmount: number;
  taxRate: number;
  taxType: 'CGST_SGST' | 'IGST';
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface ValidationResult {
  checkId: string;
  invoiceHash: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  issuesFound: ValidationIssue[];
  checksPassed: ValidationCheck[];
  scoreBreakdown: ScoreBreakdown;
  processingTimeMs: number;
  timestamp: string;
}

export interface ValidationIssue {
  id: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  location?: string;
  expected?: string | number;
  found?: string | number;
  difference?: number;
  howToFix: string;
  impact: string;
  gstLawContext?: string;
}

export interface ValidationCheck {
  id: string;
  category: string;
  title: string;
  description: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  category: string;
  severityWeight: number;
  gstLawRef?: string;
  execute: (invoice: ParsedInvoice) => ValidationIssue[];
}

export interface ScoreBreakdown {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  criticalDeduction: number;
  warningDeduction: number;
  infoDeduction: number;
  totalDeduction: number;
}

export const VALID_GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;
export const VALID_STATE_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '97'
] as const;
