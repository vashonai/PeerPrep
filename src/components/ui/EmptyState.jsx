import { TriangleAlert } from 'lucide-react'
import { errorMessage } from '../../services/api'
import { cx } from '../../utils/cx'
import { Button } from './Button'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-semibold text-slate-900">We couldn’t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
