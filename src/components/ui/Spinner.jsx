import { LoaderCircle } from 'lucide-react'
import { cx } from '../../utils/cx'

export function Spinner({ className }) {
  return <LoaderCircle className={cx('size-4 animate-spin', className)} aria-hidden />
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="size-6 text-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-md bg-slate-200/70', className)} aria-hidden />
}
