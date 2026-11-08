/**
 * Demo mode seeds public test accounts and runs the in-browser mock server.
 * Set VITE_DEMO_MODE=false once a real backend is connected.
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

/** Matches the 60-minute inactivity timeout in the security requirements. */
export const SESSION_TIMEOUT_MS = 60 * 60 * 1000
