import { Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'
import { ROLE_LABELS, can, homePathFor } from '../../config/roles'
import { useAuth } from '../../hooks/useAuth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminApi } from '../../services/api'

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Redirects signed-in users away from the login and registration pages. */
export function GuestOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <PageSpinner />
  if (user) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/**
 * Hides a page from roles without `permission`. This is a UX guard only:
 * the service layer enforces the same permission on every request.
 */
export function RequirePermission({ permission, resource }) {
  const { user } = useAuth()
  if (!can(user, permission)) return <AccessDenied resource={resource} action={permission} />
  return <Outlet />
}

export function AccessDenied({ resource, action }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const reported = useRef(null)
  useDocumentTitle('Access denied')

  useEffect(() => {
    if (!user || reported.current === pathname) return
    reported.current = pathname
    adminApi.reportAccessDenied(resource, `route:${pathname} (${action})`).catch(() => {})
  }, [user, pathname, resource, action])

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card className="p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <Lock className="size-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">You don’t have access to this page</h1>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{resource}</span> isn’t available to the{' '}
          <span className="font-medium text-slate-800">{ROLE_LABELS[user?.role]}</span> role. This attempt has been recorded for administrators.
        </p>
        <ButtonLink to={homePathFor(user)} className="mt-6">
          Back to your dashboard
        </ButtonLink>
      </Card>
    </div>
  )
}
