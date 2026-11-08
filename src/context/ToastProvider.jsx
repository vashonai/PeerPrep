import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { cx } from '../utils/cx'
import { ToastContext } from './contexts'

const TONES = {
  success: { icon: CircleCheck, className: 'text-emerald-600' },
  error: { icon: TriangleAlert, className: 'text-red-600' },
  info: { icon: Info, className: 'text-brand-600' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (tone, title, description) => {
      const id = ++nextId.current
      setToasts((list) => [...list.slice(-2), { id, tone, title, description }])
      setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 4000)
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [push],
  )

  return (
    <ToastContext value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map(({ id, tone, title, description }) => {
          const { icon: Icon, className } = TONES[tone]
          return (
            <div
              key={id}
              role={tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-raised"
            >
              <Icon className={cx('mt-0.5 size-5 shrink-0', className)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(id)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Dismiss notification">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}
