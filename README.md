# GST Invoice Checker

A comprehensive Next.js application for validating GST invoices with 11 compliance checks.

## Features

✅ **AI-Powered OCR Capability** - Instantly auto-fill invoice data from PDF/Image uploads.
✅ **Quick Check & Comprehensive Invoice Form** - Validate without logic barriers, featuring distinct sections for Supplier, Buyer, Invoice info, and detailed Line Items.
✅ **Real-time Compliance Engine** - Identifies format errors, arithmetic mismatches, and missing mandatory fields.
✅ **Detailed Compliance Reports** - Get instant feedback, generated reports with fix instructions.
✅ **11 Comprehensive Validation Rules:**
1. GSTIN Format Validation
2. Tax Type Logic (CGST/SGST vs IGST)
3. GST Calculation Accuracy
4. CGST/SGST Equal Split Verification
5. HSN Code Validation
6. Tax Rate Validation
7. Invoice Number & Date Validation
8. Taxable Amount Sum & Invoice Total Validation
✅ **Risk Level Assessment** - Low, Medium, or High risk classification
✅ **User Authentication** - Login and Sign-up to track validation history.
✅ **Modern, Professional UI** - Designed with Tailwind CSS for responsiveness and clarity.

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

