import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Build-safe: during Vercel build, env vars may not be available.
// We use placeholder values so the module loads without crashing.
// At runtime, real env vars will always be present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Client-side (use in components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Admin client for service-role operations (existing API routes use this)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Only warn on server-side — this key is intentionally unavailable in the browser
if (!serviceRoleKey && typeof window === 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('⚠️ CRITICAL: SUPABASE_SERVICE_ROLE_KEY missing — admin operations will use anon key (insecure)')
}
export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey || supabaseAnonKey
)
