import { ChevronDown, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../../utils/cx'
import { FieldContext, useFieldProps } from './fieldContext'

const controlBase =
  'block w-full rounded-lg border bg-white text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const controlState = (invalid) =>
  invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100'

export function FormField({ id, label, required, hint, error, action, children, className }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <FieldContext value={{ id, error, describedBy, required }}>
      <div className={className}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
          </label>
          {action}
        </div>
        {children}
        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )}
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    </FieldContext>
  )
}

export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

export function Input({ className, icon: Icon, ...props }) {
  const { isInvalid, ...fieldProps } = useFieldProps(props)
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />}
      <input className={cx(controlBase, controlState(isInvalid), 'h-10 px-3', Icon && 'pl-9', className)} {...fieldProps} />
    </div>
  )
}

export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false)
  const { isInvalid, ...fieldProps } = useFieldProps(props)
  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={cx(controlBase, controlState(isInvalid), 'h-10 pr-10 pl-3', className)} {...fieldProps} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function Textarea({ className, rows = 5, ...props }) {
  const { isInvalid, ...fieldProps } = useFieldProps(props)
  return <textarea rows={rows} className={cx(controlBase, controlState(isInvalid), 'px-3 py-2.5 leading-relaxed', className)} {...fieldProps} />
}

export function Select({ className, children, ...props }) {
  const { isInvalid, ...fieldProps } = useFieldProps(props)
  return (
    <div className="relative">
      <select className={cx(controlBase, controlState(isInvalid), 'h-10 appearance-none pr-9 pl-3', className)} {...fieldProps}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </div>
  )
}

/** Form-level error summary shown above the submit button. */
export function FormAlert({ children, tone = 'error' }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className={cx(
        'flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm',
        tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
