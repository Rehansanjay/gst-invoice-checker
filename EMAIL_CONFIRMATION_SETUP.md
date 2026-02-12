# Email Confirmation Setup

## Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Email Auth"
3. **Uncheck** "Enable email confirmations"
4. Click Save

This allows users to sign up and login immediately without email confirmation.

## Option 2: Configure Email Confirmation (Production)

If you want to keep email confirmation enabled:

1. **Configure Email Templates:**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Update "Confirm signup" template if needed

2. **Site URL Configuration:**
   - Go to Authentication → URL Configuration
   - Set **Site URL**: `http://localhost:3000` (dev) or your production URL
   - Add to **Redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/dashboard`
     - Your production URLs

3. **Email Provider (Production):**
   - Configure a custom SMTP provider (Supabase's default is rate-limited)
   - Or use Supabase's built-in email service

## Current Setup

We've configured the app to:
- ✅ Add `emailRedirectTo` in signup to redirect to dashboard after confirmation
- ✅ Created `/auth/callback` route to handle email confirmation links
- ✅ Handle duplicate user creation errors gracefully
- ✅ Redirect to dashboard after successful confirmation

## Testing

1. **With Email Confirmation Disabled:**
   - Sign up → Immediate redirect to dashboard

2. **With Email Confirmation Enabled:**
   - Sign up → Check email → Click link → Redirect to dashboard

## Recommended: Disable for Development

For a smoother development experience, **disable email confirmation** in Supabase settings. Enable it when you're ready for production.
