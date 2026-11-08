import { NavLink, Outlet } from 'react-router'
import { Logo } from '../components/Logo'
import { ButtonLink } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { homePathFor } from '../config/roles'
import { useAuth } from '../hooks/useAuth'
import { cx } from '../utils/cx'
import { AppLayout } from './AppLayout'

const YEAR = new Date().getFullYear()

export function PublicHeader() {
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden sm:block">
          <NavLink
            to="/questions"
            className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900')}
          >
            Explore questions
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <ButtonLink to={homePathFor(user)} size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/questions" variant="ghost" size="sm" className="sm:hidden">
                Explore
              </ButtonLink>
              <ButtonLink to="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Logo />
        <p>Collaborative past paper discussion for university students.</p>
        <p>© {YEAR} PeerPrep</p>
      </div>
    </footer>
  )
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

/** Public pages that adopt the app shell for signed-in users. */
export function AdaptiveLayout() {
  const { user, ready } = useAuth()
  if (!ready) return <PageSpinner />
  if (user) return <AppLayout />
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
