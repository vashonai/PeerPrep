import { TriangleAlert, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '../../utils/cx'
import { Button } from './Button'
import { FormField, Textarea } from './Form'

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

/** Accessible modal built on the native <dialog> element (focus trap and Esc for free). */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => event.target === ref.current && onClose()}
      className={cx('m-auto w-[calc(100%-2rem)] rounded-2xl bg-white p-0 text-slate-800 shadow-raised open:animate-slide-up', SIZES[size])}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Close dialog">
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

/**
 * Confirmation dialog for destructive or significant actions. With
 * `reasonLabel`, collects an optional reason that is passed to `onConfirm`.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading = false, reasonLabel, reasonPlaceholder, children }) {
  const [reason, setReason] = useState('')
  const reasonId = useId()

  const close = () => {
    if (loading) return
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={async () => { await onConfirm(reason.trim()); setReason('') }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-full', tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          {description && <p className="text-sm text-slate-600">{description}</p>}
          {children}
          {reasonLabel && (
            <FormField id={reasonId} label={reasonLabel} hint="Recorded in the moderation log.">
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonPlaceholder} maxLength={300} />
            </FormField>
          )}
        </div>
      </div>
    </Modal>
  )
}
