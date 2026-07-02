'use client'
import { createClient } from '@supabase/supabase-js'

let browserClient = null

// Browser-only Supabase Auth client (anon key). Scoped to the Tool Hub login
// gate — separate from the app's custom JWT auth and from lib/db.js's
// server-side service-role client. Never import this from server code.
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return browserClient
}
