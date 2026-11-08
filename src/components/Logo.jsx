import { Link } from 'react-router'
import { cx } from '../utils/cx'

export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cx('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path d="M10 23V9h6.5a4.5 4.5 0 0 1 0 9H13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22.5" cy="22.5" r="2.5" className="fill-teal-300" />
    </svg>
  )
}

export function Logo({ to = '/', className, inverted = false }) {
  return (
    <Link to={to} className={cx('inline-flex items-center gap-2.5 rounded-lg', className)} aria-label="PeerPrep home">
      <LogoMark />
      <span className={cx('text-lg font-semibold tracking-tight', inverted ? 'text-white' : 'text-slate-900')}>
        Peer<span className={inverted ? 'text-teal-300' : 'text-brand-600'}>Prep</span>
      </span>
    </Link>
  )
}
