import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GST Invoice Checker Online — Validate GST Invoices in 15 Seconds | InvoiceCheck.in",
  description: "Free online GST invoice checker. Validate GSTIN, HSN codes, tax calculations & e-invoice compliance before submission. Catch errors that cause Amazon/Flipkart payment holds. 11-point validation for ₹99. Trusted by Indian sellers.",
  keywords: [
    "GST invoice checker",
    "GST invoice validator",
    "check GST invoice online",
    "validate GST invoice",
    "GSTIN validator",
    "HSN code validator",
    "GST compliance check",
    "e-invoice validation",
    "GST invoice errors",
    "Amazon GST invoice",
    "Flipkart GST invoice",
    "GST invoice format checker",
    "GST penalty calculator",
    "CGST SGST IGST calculator",
    "invoice validation India",
    "GST return filing check",
    "place of supply GST",
    "reverse charge mechanism",
    "ITC eligibility check",
  ].join(", "),
  icons: {
    icon: "/invoicecheck-logo.svg",
  },
  metadataBase: new URL("https://invoicecheck.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://invoicecheck.in",
    siteName: "InvoiceCheck.in",
    title: "GST Invoice Checker — Catch Errors Before Submission",
    description: "Validate your GST invoices in 15 seconds. 11-point compliance check covering GSTIN, HSN, tax math, Place of Supply & more. Avoid marketplace payment holds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InvoiceCheck.in — GST Invoice Validator for Indian Sellers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GST Invoice Checker — Validate in 15 Seconds | InvoiceCheck.in",
    description: "Free GST invoice validation tool. Catch errors before Amazon/Flipkart rejects your payment. 11-point check for ₹99.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "InvoiceCheck.in",
              "url": "https://invoicecheck.in",
              "description": "Online GST invoice checker and validator for Indian sellers and businesses. Validates GSTIN, HSN codes, tax calculations, Place of Supply, and e-invoice compliance.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "99",
                "priceCurrency": "INR",
                "description": "Per invoice validation check"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.2",
                "reviewCount": "50",
                "bestRating": "5"
              },
              "featureList": [
                "GSTIN Format Validation",
                "HSN/SAC Code Verification",
                "Tax Rate & Calculation Check",
                "Place of Supply Validation",
                "E-Invoice Compliance Check",
                "Reverse Charge Mechanism Check",
                "ITC Eligibility Assessment",
                "Invoice Date & Period Validation",
                "Mandatory Field Completeness Check",
                "Inter-State vs Intra-State Tax Verification",
                "Overall Compliance Health Score"
              ]
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How to check if a GST invoice is correct?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use InvoiceCheck.in to validate your GST invoice in 15 seconds. Enter your invoice details (GSTIN, HSN code, tax amounts) and our tool runs 11 compliance checks covering GSTIN format, tax calculations, Place of Supply, and more."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the cost of GST invoice validation?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "InvoiceCheck.in charges ₹99 per invoice check — 80% cheaper than hiring a CA. Bulk packages are available at discounted rates for businesses with higher volumes."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why do Amazon and Flipkart reject GST invoices?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Marketplaces reject invoices for errors like incorrect GSTIN, wrong HSN codes, tax calculation mismatches, missing mandatory fields, or Place of Supply issues. These rejections can hold your payments for 2-7 days."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What does the GST invoice checker validate?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our tool validates 11 parameters: GSTIN format, HSN/SAC codes, tax rate accuracy, CGST/SGST/IGST calculations, Place of Supply, invoice numbering, date validity, mandatory fields, reverse charge applicability, ITC eligibility, and overall compliance score."
                  }
                }
              ]
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
      <GoogleAnalytics gaId="G-17FW1M1B0K" />
    </html>
  );
}
