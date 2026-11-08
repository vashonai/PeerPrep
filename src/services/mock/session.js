import { SESSION_TIMEOUT_MS } from '../../config/env'

/**
 * Prototype session. Holds an opaque token and the user id only — never a
 * password. sessionStorage keeps it per tab and clears it when the tab closes.
 * In production this becomes an HttpOnly, Secure cookie issued by the server.
 */

const SESSION_KEY = 'peerprep.session'

export function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    if (!session) return null
    if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT_MS) {
      endSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function startSession(userId) {
  const now = Date.now()
  const token = globalThis.crypto?.randomUUID?.() ?? String(now)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, userId, issuedAt: now, lastActivityAt: now }))
}

export function touchSession() {
  const session = readSession()
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, lastActivityAt: Date.now() }))
}

export function endSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
