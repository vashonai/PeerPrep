import { cx } from '../../utils/cx'
import { fullName, initials } from '../../utils/format'

const COLORS = ['bg-brand-100 text-brand-700', 'bg-teal-100 text-teal-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700']
const SIZES = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-12 text-base' }

function colorFor(id = '') {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

export function Avatar({ user, size = 'sm', className }) {
  return (
    <span className={cx('inline-grid shrink-0 place-items-center rounded-full font-semibold', SIZES[size], colorFor(user?.id), className)} title={fullName(user)} aria-hidden>
      {initials(user)}
    </span>
  )
}
