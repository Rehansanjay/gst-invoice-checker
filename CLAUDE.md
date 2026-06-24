# InvoiceCheck.in — Project Context

## Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API routes, Supabase (Postgres + RLS + Auth)
- Payments: Razorpay (live keys in production)
- Email: Resend
- Error Tracking: Sentry
- Deployment: Vercel

## Critical Rules — Never Break These
- NEVER modify RLS policies without explicitly asking me first
- Payment flow order is strict: validate input → create DB record → then charge Razorpay
- Never expose API keys or Supabase service role key in client components
- All API routes must use Zod for input validation
- Never use `any` type in TypeScript

## Project Structure
- /app → Next.js App Router pages and API routes
- /components → reusable UI components (shadcn/ui based)
- /lib → Supabase client, Razorpay utilities, helpers
- /migrations → Supabase DB migrations
- /types → TypeScript type definitions

## Target Users
- CA firms and GST practitioners in India
- Primary use case: GST invoice validation and compliance checks

## Rules for Making Changes
- Always show a diff before applying changes
- For multi-file changes, list all affected files first and confirm before proceeding
- When writing Supabase queries, always use typed client
- Prefer small focused changes over large rewrites
