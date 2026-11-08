import { Link } from 'react-router'
import { buttonClasses } from './buttonStyles'
import { Spinner } from './Spinner'

const iconSize = (size) => (size === 'lg' ? 'size-5' : 'size-4')

export function Button({ variant, size, loading = false, icon: Icon, children, className, disabled, type = 'button', ...props }) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClasses({ variant, size, className })} {...props}>
      {loading ? <Spinner className={iconSize(size)} /> : Icon && <Icon className={iconSize(size)} aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant, size, icon: Icon, children, className, ...props }) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })} {...props}>
      {Icon && <Icon className={iconSize(size)} aria-hidden />}
      {children}
    </Link>
  )
}
