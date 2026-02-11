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
}

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
