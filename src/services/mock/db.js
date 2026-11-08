import { createSeedData } from '../../data/seed'
import { ApiError } from '../errors'

/**
 * Mock database persisted to localStorage. Stands in for the real database
 * and is only ever touched by the mock service modules in this folder.
 */

const STORAGE_KEY = 'peerprep.db'
const SCHEMA_VERSION = 1

let state = null

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.version === SCHEMA_VERSION) return parsed.data
    }
  } catch {
    // Corrupt or inaccessible storage: fall back to fresh seed data.
  }
  const data = createSeedData()
  write(data)
  return data
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data }))
    return true
  } catch {
    return false
  }
}

export function getDb() {
  if (!state) state = load()
  return state
}

/** Persists pending mutations. Rolls back the in-memory copy if storage is full. */
export function commit() {
  if (!write(state)) {
    state = null
    throw new ApiError('STORAGE_FULL', 'Your browser storage is full. Remove large attachments or reset the demo data.')
  }
}

export function resetDb() {
  state = createSeedData()
  write(state)
}

export function newId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

export const nowIso = () => new Date().toISOString()
