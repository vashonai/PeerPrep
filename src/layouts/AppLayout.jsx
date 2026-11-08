import { FilePlus2, Info, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Logo } from '../components/Logo'
import { ButtonLink } from '../components/ui/Button'
import { DEMO_MODE } from '../config/env'
import { PERMISSIONS, can, homePathFor } from '../config/roles'
import { isNavItemActive, navigationFor } from '../features/auth/navigation'
import { useAuth } from '../hooks/useAuth'
import { cx } from '../utils/cx'
import { UserMenu } from './UserMenu'

function SidebarNav({ user, pathname, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {navigationFor(user).map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{section.label}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(item, pathname)
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                      active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cx('size-[18px]', active ? 'text-brand-600' : 'text-slate-400')} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function DemoNotice() {
  if (!DEMO_MODE) return null
  return (
    <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
      <p className="flex items-center gap-1.5 font-semibold text-slate-700">
        <Info className="size-3.5 text-brand-600" aria-hidden /> Demo mode
      </p>
      <p className="mt-1">Data is stored in this browser only. Role checks here are for demonstration, not production security.</p>
    </div>
  )
}

export function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <Logo to={homePathFor(user)} />
        </div>
        <SidebarNav user={user} pathname={pathname} />
        <DemoNotice />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/40" onClick={() => setDrawerOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-up flex-col bg-white shadow-raised">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo to={homePathFor(user)} />
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav user={user} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            <DemoNotice />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button type="button" onClick={() => setDrawerOpen(true)} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo to={homePathFor(user)} />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {can(user, PERMISSIONS.QUESTION_CREATE) && pathname !== '/questions/new' && (
              <div className="hidden sm:block">
                <ButtonLink to="/questions/new" size="sm" icon={FilePlus2}>
                  Upload question
                </ButtonLink>
              </div>
            )}
            <UserMenu />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
