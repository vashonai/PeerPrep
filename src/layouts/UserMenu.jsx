import { ChevronDown, FolderOpen, LogOut, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { RoleBadge } from '../components/StatusBadges'
import { Avatar } from '../components/ui/Avatar'
import { ConfirmDialog } from '../components/ui/Modal'
import { CAN_RESET_DEMO_DATA } from '../config/env'
import { PERMISSIONS, ROLE_LABELS, can } from '../config/roles'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { adminApi } from '../services/api'
import { fullName } from '../utils/format'

const itemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'

export function UserMenu() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signOut = async () => {
    setOpen(false)
    await logout()
    toast.success('Signed out', 'See you next time.')
    navigate('/login')
  }

  const resetData = async () => {
    setResetting(true)
    try {
      await adminApi.resetDemoData()
      await logout()
      toast.success('Demo data restored', 'Sign in again to continue testing.')
      navigate('/login')
    } finally {
      setResetting(false)
      setConfirmReset(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition hover:bg-slate-100"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-semibold text-slate-900">{fullName(user)}</span>
          <span className="block text-xs leading-tight text-slate-500">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="size-4 text-slate-400" aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-72 animate-slide-up rounded-xl border border-slate-200 bg-white p-1.5 shadow-raised">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{fullName(user)}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <RoleBadge role={user.role} />
                {user.isDemo && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Demo</span>}
              </div>
            </div>
          </div>
          <div className="my-1 border-t border-slate-100" />
          {can(user, PERMISSIONS.CONTENT_EDIT_OWN) && (
            <Link role="menuitem" to="/my-contributions" onClick={() => setOpen(false)} className={itemClass}>
              <FolderOpen className="size-4 text-slate-400" aria-hidden /> My contributions
            </Link>
          )}
          {CAN_RESET_DEMO_DATA && (
            <button
              role="menuitem"
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false)
                setConfirmReset(true)
              }}
            >
              <RotateCcw className="size-4 text-slate-400" aria-hidden /> Reset demo data
            </button>
          )}
          <button role="menuitem" type="button" onClick={signOut} className={`${itemClass} text-red-600 hover:bg-red-50 hover:text-red-700`}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetData}
        loading={resetting}
        title="Reset demo data?"
        description="All questions, answers, verifications and accounts created in this browser will be replaced with the original sample data, and you will be signed out."
        confirmLabel="Reset data"
      />
    </div>
  )
}
