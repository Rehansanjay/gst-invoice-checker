import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GST Invoice Checker — Validate in 15 Seconds | InvoiceCheck.in",
  description: "Free GST invoice checker. Validate GSTIN, HSN, tax heads and totals before the portal or a marketplace rejects them. 16 checks, no sign-up.",
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
  // Icons are served from /public at STABLE urls, declared explicitly.
  //
  // app/icon.svg was previously used, but Next.js emits it with a build hash
  // (/icon.svg?icon.0541b5af.svg) that changes on every deploy, and Google
  // wants a stable favicon url. Worse, /favicon.ico — the conventional path
  // Googlebot requests directly — was returning 404 after the stock Next.js
  // icon was deleted, leaving nothing at the location Google checks first.
  //
  // .ico is listed first: it is the format Google's SERP favicon pipeline
  // handles most reliably, at 48x48 (Google's base unit). SVG follows for
  // browsers that prefer a vector tab icon.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "GST Invoice Checker — Catch Errors Before Submission",
    description: "Validate your GST invoices in 15 seconds. 16-point compliance check covering GSTIN, HSN, tax math, Place of Supply & more. Avoid marketplace payment holds.",
    // No `images` here on purpose: app/opengraph-image.tsx supplies it and is
    // inherited by every route without its own. The previous hardcoded
    // /og-image.png did not exist and returned 404 on every share.
  },
  twitter: {
    card: "summary_large_image",
    title: "GST Invoice Checker — Validate in 15 Seconds | InvoiceCheck.in",
    description: "Free GST invoice validation tool. Catch errors before Amazon/Flipkart rejects your payment. 16 checks, free to run.",
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
              "name": SITE_NAME,
              "url": SITE_URL,
              "description": "Online GST invoice checker and validator for Indian sellers and businesses. Validates GSTIN, HSN codes, tax calculations, Place of Supply, and e-invoice compliance.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "99",
                "priceCurrency": "INR",
                "description": "Per invoice validation check"
              },
              // No aggregateRating: we have no collected reviews. Declaring one
              // is a Google structured-data policy violation and risks a manual
              // action. Add this back only when real reviews exist to back it.
              // Mirrors the 16 rules in ALL_RULES (lib/services/validationRules.ts).
              // Keep in step with that registry — this list previously named 11
              // features, some of which no rule implemented.
              "featureList": [
                "GSTIN Format Validation",
                "State Code Validation",
                "Duplicate GSTIN Detection",
                "Tax Type Logic (CGST/SGST vs IGST)",
                "GST Rate Validity",
                "GST Amount Calculation",
                "CGST/SGST Equal Split",
                "HSN Code Validation",
                "Invoice Number Validation",
                "Invoice Date Validation",
                "Taxable Amount Sum",
                "Invoice Total Calculation",
                "Place of Supply Validation",
                "Invoice Type Compliance",
                "Reverse Charge Mechanism (RCM)",
                "Invoice-Level Tax Rounding"
              ]
            }),
          }}
        />
        {/*
          The FAQPage schema that lived here has moved to the homepage.

          A root layout renders on every route, so this was declaring /terms,
          /privacy, /pricing and everything else to be an FAQ page carrying
          questions none of them display. Google asks that FAQPage markup
          describe content visible on the page that carries it, and it was
          additionally colliding with the genuine FAQPage on /faq.
        */}
      </head>
      <body
        className={`${inter.variable} antialiased`}
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
