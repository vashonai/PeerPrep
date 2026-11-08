import { DEMO_MODE } from '../../config/env'
import { ROLES } from '../../config/roles'
import { hasErrors, validateLogin, validateRegistration } from '../../utils/validation'
import { ApiError } from '../errors'
import { commit, getDb, newId, nowIso } from './db'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoEmail } from './demoAccounts'
import { hashPassword, verifyPassword } from './passwords'
import { currentUser, latency } from './server'
import { endSession, startSession, touchSession } from './session'
import { validationError } from './shared'

const toSessionUser = ({ id, firstName, lastName, email, role, isDemo }) => ({ id, firstName, lastName, email, role, isDemo })

const invalidCredentials = () => new ApiError('INVALID_CREDENTIALS', 'The email or password you entered is incorrect.')

export async function login({ email, password }) {
  const errors = validateLogin({ email, password })
  if (hasErrors(errors)) throw validationError(errors)
  await latency(450)

  const db = getDb()
  const normalized = email.trim().toLowerCase()
  const user = db.users.find((u) => u.email === normalized)
  if (!user) throw invalidCredentials()

  let valid = false
  if (isDemoEmail(normalized)) {
    valid = DEMO_MODE && password === DEMO_PASSWORD
  } else {
    const credential = db.credentials.find((c) => c.userId === user.id)
    valid = credential ? await verifyPassword(password, credential) : false
  }
  if (!valid) throw invalidCredentials()

  startSession(user.id)
  return toSessionUser(user)
}

export async function loginWithDemo(key) {
  const account = DEMO_ACCOUNTS.find((a) => a.key === key)
  if (!DEMO_MODE || !account) throw new ApiError('FORBIDDEN', 'Demo accounts are not available.')
  return login({ email: account.email, password: DEMO_PASSWORD })
}

export async function register(input) {
  const errors = validateRegistration(input)
  if (hasErrors(errors)) throw validationError(errors)
  await latency(550)

  const db = getDb()
  const email = input.email.trim().toLowerCase()
  if (isDemoEmail(email) || email.endsWith('@peerprep.demo'))
    throw validationError({ email: 'This address is reserved for demo accounts.' })
  if (db.users.some((u) => u.email === email))
    throw validationError({ email: 'An account with this email already exists. Try signing in instead.' })

  // Every new account is a Student; only a StudentAdmin can grant other roles.
  const user = {
    id: newId('u'),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    role: ROLES.STUDENT,
    isDemo: false,
    createdAt: nowIso(),
  }
  const credential = await hashPassword(input.password)
  db.users.push(user)
  db.credentials.push({ userId: user.id, ...credential })
  commit()

  startSession(user.id)
  return toSessionUser(user)
}

export async function logout() {
  endSession()
}

/** Returns the signed-in user for a still-valid session, or null. */
export async function getSessionUser() {
  const user = currentUser()
  return user ? toSessionUser(user) : null
}

export function recordActivity() {
  touchSession()
}
