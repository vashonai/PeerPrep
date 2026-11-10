import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '../hooks/useToast'
import { authApi } from '../services/api'
import { AuthContext } from './contexts'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart']
const ACTIVITY_THROTTLE_MS = 15_000
const SESSION_CHECK_MS = 30_000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    authApi
      .getSessionUser()
      .catch(() => null)
      .then((sessionUser) => {
        setUser(sessionUser)
        setReady(true)
      })
    // Sign-ins that happen outside this provider, such as email confirmation links.
    return authApi.onAuthChange(() => {
      authApi.getSessionUser().then(setUser, () => {})
    })
  }, [])

  const userId = user?.id
  const userRole = user?.role

  // Inactivity timeout: user activity extends the session; a periodic check
  // signs the user out once the session has lapsed, and picks up role changes.
  useEffect(() => {
    if (!userId) return undefined
    let lastTouch = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastTouch > ACTIVITY_THROTTLE_MS) {
        lastTouch = now
        authApi.recordActivity()
      }
    }
    const check = async () => {
      if (document.visibilityState === 'hidden') return
      const current = await authApi.getSessionUser().catch(() => undefined)
      if (current === undefined) return // Offline: keep the session until the server is reachable.
      if (!current) {
        setUser(null)
        toast.info('You have been signed out', 'Your session ended after 60 minutes of inactivity.')
        navigate('/login')
      } else if (current.role !== userRole) {
        setUser(current)
      }
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', check)
    const interval = setInterval(check, SESSION_CHECK_MS)
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', check)
      clearInterval(interval)
    }
  }, [userId, userRole, toast, navigate])

  const login = useCallback(async (credentials) => {
    const signedIn = await authApi.login(credentials)
    setUser(signedIn)
    return signedIn
  }, [])

  const loginWithDemo = useCallback(async (key) => {
    const signedIn = await authApi.loginWithDemo(key)
    setUser(signedIn)
    return signedIn
  }, [])

  /** Resolves to the new user, or `{ needsConfirmation, email }` when email confirmation is required. */
  const register = useCallback(async (input) => {
    const created = await authApi.register(input)
    if (!created.needsConfirmation) setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, loginWithDemo, register, logout }),
    [user, ready, login, loginWithDemo, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
