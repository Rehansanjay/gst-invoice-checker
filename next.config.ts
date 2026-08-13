import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ── Security Headers ─────────────────────────────────────────────────
const securityHeaders = [
  // Prevent clickjacking — only allow framing from same origin
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer info sent to other origins
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
  // Disable unnecessary browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Enable DNS prefetching for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Force HTTPS for 1 year (production only — safe on Vercel)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Content Security Policy — restrict resource loading to prevent XSS
  //
  // Every third party we actually load must be listed here or the browser
  // silently refuses it. Two things were missing and failing in production:
  //
  //   1. googletagmanager.com — the GA tag renders in the HTML but was blocked,
  //      so no analytics were ever collected.
  //   2. cdn.razorpay.com — Razorpay's checkout.js pulls its risk-detection
  //      bundle, fonts and icons from cdn, not from checkout. Blocking it
  //      breaks fraud checks and leaves the payment modal half-rendered.
  //
  // Razorpay also frames from checkout.razorpay.com as well as api.razorpay.com.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // GTM/GA + both Razorpay script hosts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://*.googletagmanager.com https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // framerusercontent hosts the "Season Mix" heading face (see globals.css);
      // blocked, every heading silently fell back to Georgia/Times.
      "font-src 'self' https://fonts.gstatic.com https://framerusercontent.com https://*.razorpay.com",
      // GA beacons are sent as image requests; Razorpay serves modal icons from cdn
      "img-src 'self' data: blob: https://*.razorpay.com https://*.google-analytics.com https://*.googletagmanager.com",
      "connect-src 'self' https://*.supabase.co https://*.razorpay.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.sentry.io",
      // The checkout modal itself is an iframe
      "frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
    ].join("; ") + ";",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        // Apply security headers to ALL routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // CORS headers for API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL || "https://invoicecheck.in" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};


export default withSentryConfig(nextConfig, {
  // Sentry project settings — populate in Vercel env vars
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps silently (no noise in local dev)
  silent: true,

  // Use the new canonical options (replaces deprecated flags)
  webpack: {
    treeshake: {
      // Strip Sentry debug logging from production bundles
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});


