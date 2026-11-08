import { can } from '../../config/roles'
import { ApiError } from '../errors'
import { commit, getDb, newId, nowIso } from './db'
import { readSession, touchSession } from './session'

/**
 * Request pipeline helpers for the mock server: latency, authentication and
 * authorization. Real endpoints would perform the same checks server-side.
 */

export function latency(ms = 280) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function currentUser() {
  const session = readSession()
  if (!session) return null
  return getDb().users.find((u) => u.id === session.userId) ?? null
}

export function requireUser() {
  const user = currentUser()
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Your session has ended. Please sign in again.')
  touchSession()
  return user
}

export function logUnauthorized(user, action, resource) {
  const db = getDb()
  db.accessLogs.unshift({ id: newId('x'), userId: user?.id ?? null, action, resource, createdAt: nowIso() })
  commit()
}

/** Throws FORBIDDEN (and records the attempt) unless `user` holds `permission`. */
export function authorize(user, permission, resource) {
  if (can(user, permission)) return
  forbid(user, permission, resource)
}

export function forbid(user, action, resource, message = 'You do not have permission to perform this action.') {
  logUnauthorized(user, action, resource)
  throw new ApiError('FORBIDDEN', message)
}

export function notFound(what) {
  return new ApiError('NOT_FOUND', `${what} could not be found. It may have been removed.`)
}
