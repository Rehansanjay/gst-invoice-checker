import { createBrowserClient } from '@supabase/ssr'

// Build-safe: during Vercel build, env vars may not be available.
// We use placeholder values so the module loads without crashing.
// At runtime, real env vars will always be present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

/**
 * The browser client, and the only Supabase client that belongs in client
 * components. The service-role client now lives in lib/supabase-admin.ts —
 * keeping both here meant every client component that imported this file also
 * constructed the admin client in the browser, giving two GoTrue instances on
 * one storage key.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
