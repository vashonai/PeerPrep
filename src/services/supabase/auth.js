import { DEMO_MODE } from '../../config/env'
import { hasErrors, validateLogin, validateRegistration } from '../../utils/validation'
import { ApiError } from '../errors'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoEmail } from '../mock/demoAccounts'
import { supabase } from './client'
import { clearSessionState, currentUser, markActivity, toApiError } from './shared'

const validationError = (fieldErrors) => new ApiError('VALIDATION', 'Please correct the highlighted fields.', fieldErrors)

export async function login({ email, password }) {
  const errors = validateLogin({ email, password })
  if (hasErrors(errors)) throw validationError(errors)

  const { error } = await supabase().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) {
    if (error.code === 'email_not_confirmed')
      throw new ApiError('INVALID_CREDENTIALS', 'Please confirm your email address first. Check your inbox for the confirmation link.')
    if (error.code === 'invalid_credentials' || error.status === 400)
      throw new ApiError('INVALID_CREDENTIALS', 'The email or password you entered is incorrect.')
    throw toApiError(error)
  }

  clearSessionState()
  markActivity()
  const user = await currentUser({ fresh: true })
  if (!user) throw new ApiError('NETWORK', 'Signed in, but your profile could not be loaded. Please try again.')
  return user
}

export async function loginWithDemo(key) {
  const account = DEMO_ACCOUNTS.find((a) => a.key === key)
  if (!DEMO_MODE || !account) throw new ApiError('FORBIDDEN', 'Demo accounts are not available.')
  try {
    return await login({ email: account.email, password: DEMO_PASSWORD })
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') throw new ApiError('INVALID_CREDENTIALS', 'This demo account has not been set up yet. Run `npm run seed` to create it.')
    throw error
  }
}

/**
 * Creates a Student account. When email confirmation is enabled in Supabase,
 * no session is returned and the user must confirm before signing in.
 */
export async function register(input) {
  const errors = validateRegistration(input)
  if (hasErrors(errors)) throw validationError(errors)
  const email = input.email.trim().toLowerCase()
  if (isDemoEmail(email) || email.endsWith('@peerprep.demo')) throw validationError({ email: 'This address is reserved for demo accounts.' })

  const { data, error } = await supabase().auth.signUp({
    email,
    password: input.password,
    options: {
      data: { first_name: input.firstName.trim(), last_name: input.lastName.trim() },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  })
  if (error) {
    if (error.code === 'user_already_exists') throw validationError({ email: 'An account with this email already exists. Try signing in instead.' })
    if (error.code === 'weak_password') throw validationError({ password: error.message })
    if (error.code === 'over_email_send_rate_limit') throw new ApiError('NETWORK', 'Too many sign-up emails were sent recently. Please try again later.')
    throw toApiError(error)
  }

  if (!data.session) return { needsConfirmation: true, email }
  clearSessionState()
  markActivity()
  return currentUser({ fresh: true })
}

export async function logout() {
  clearSessionState()
  await supabase().auth.signOut()
}

export function getSessionUser() {
  return currentUser({ fresh: true })
}

export function recordActivity() {
  markActivity()
}

/** Notifies the app when Supabase signs the user in or out (e.g. email confirmation links). */
export function onAuthChange(callback) {
  const { data } = supabase().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(callback, 0)
  })
  return () => data.subscription.unsubscribe()
}
