# GST Invoice Checker

A comprehensive Next.js application for validating GST invoices with 11 compliance checks.

## Features

✅ **11 Comprehensive Validation Rules:**
1. GSTIN Format Validation (Supplier & Buyer)
2. Tax Type Logic (CGST/SGST vs IGST based on state)
3. GST Calculation Accuracy
4. CGST/SGST Equal Split Verification
5. HSN Code Validation
6. Tax Rate Validation
7. Invoice Number Validation
8. Invoice Date Validation
9. Taxable Amount Sum Verification
10. Invoice Total Calculation Check

✅ **Health Score System** - Get instant feedback on invoice quality
✅ **Risk Level Assessment** - Low, Medium, or High risk classification
✅ **Detailed Issue Reports** - Clear explanations with fix instructions
✅ **Modern UI** - Beautiful, responsive interface built with Tailwind CSS

## Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Update `.env.local` with your API keys (optional for basic testing):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

Click the "Validate Sample Invoice" button to see the validation system in action with a pre-configured test invoice.

## Project Structure

```
gst-invoice-checker/
├── app/
│   ├── api/validate/route.ts    # Validation API endpoint
│   └── page.tsx                 # Main application page
├── components/ui/               # UI components
├── lib/services/
│   ├── validationRules.ts      # 11 validation rules
│   └── validationService.ts    # Validation orchestrator
├── types/index.ts              # TypeScript definitions
└── .env.local                  # Environment variables
```

## Validation Rules

- **GSTIN Format:** 15-char pattern validation
- **Tax Type Logic:** CGST/SGST for same state, IGST for interstate
- **Calculations:** Verifies all GST calculations
- **HSN Codes:** 4-8 digit validation
- **Tax Rates:** Valid GST rates (0%, 0.25%, 3%, 5%, 12%, 18%, 28%)
- **Totals:** Sum verification for line items and invoice total

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Custom UI Components

---

**Built with ❤️ using Next.js and TypeScript**

