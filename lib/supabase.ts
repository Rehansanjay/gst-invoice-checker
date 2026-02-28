import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side (use in components)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Admin client for service-role operations (existing API routes use this)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey) console.error('⚠️ CRITICAL: SUPABASE_SERVICE_ROLE_KEY missing — admin operations will use anon key (insecure)')
export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey || supabaseAnonKey
)
