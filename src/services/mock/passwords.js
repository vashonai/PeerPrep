/**
 * Password hashing for accounts registered in the prototype. Uses PBKDF2 via
 * Web Crypto so no plaintext password is ever stored. The production backend
 * replaces this with bcrypt (or argon2) on the server.
 */

const ITERATIONS = 100_000

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(password, salt)
  return { algorithm: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), hash: toBase64(hash) }
}

export async function verifyPassword(password, stored) {
  const hash = await derive(password, fromBase64(stored.salt))
  const a = new Uint8Array(hash)
  const b = fromBase64(stored.hash)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}
