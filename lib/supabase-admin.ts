import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * Previously this lived in lib/supabase.ts alongside the browser client, and
 * both were constructed at module load. Any client component importing
 * `supabase` therefore also constructed this one in the browser, producing a
 * second GoTrue instance sharing the same storage key — the cause of Supabase's
 * "Multiple GoTrueClient instances detected in the same browser context"
 * warning, which it describes as able to "produce undefined behavior when used
 * concurrently under the same storage key". Session and auth behaviour on
 * logged-in pages is exactly what that would disturb.
 *
 * The service role key has no NEXT_PUBLIC_ prefix, so it was never bundled into
 * client JavaScript — in the browser this client silently fell back to the anon
 * key. Nothing leaked, but a confusing, duplicate auth client existed on every
 * page.
 */

if (typeof window !== 'undefined') {
    throw new Error(
        'lib/supabase-admin.ts was imported into client code. It holds the service role key and must only be used from route handlers, server components or server-side services.'
    );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('⚠️ CRITICAL: SUPABASE_SERVICE_ROLE_KEY missing — admin operations will use the anon key (insecure)')
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey || supabaseAnonKey,
    {
        // A service-role client acts on behalf of the server, never a user.
        // Persisting or refreshing a session is meaningless here and is what
        // made this a competing GoTrue instance in the first place.
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
)
