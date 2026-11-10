import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../config/env'

let client = null

/**
 * Lazily created so the offline prototype never needs Supabase settings.
 * The session lives in sessionStorage: it survives refreshes but ends with
 * the tab, and is never written to localStorage.
 */
export function supabase() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return client
}

export const ATTACHMENT_BUCKET = 'attachments'
