/**
 * Runtime configuration from Vite env variables (see .env.example).
 *
 * With VITE_SUPABASE_URL set, the app talks to Supabase. Without it, the app
 * runs the offline prototype against the in-browser mock server.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
export const DATA_SOURCE = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? 'supabase' : 'mock'

/** Shows the public demo accounts on the login page. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

/** Only the offline prototype can be wiped and re-seeded from the browser. */
export const CAN_RESET_DEMO_DATA = DEMO_MODE && DATA_SOURCE === 'mock'

/** Matches the 60-minute inactivity timeout in the security requirements. */
export const SESSION_TIMEOUT_MS = 60 * 60 * 1000
