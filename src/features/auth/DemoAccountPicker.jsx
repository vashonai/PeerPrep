import { ArrowRight, GraduationCap, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '../../components/ui/Spinner'
import { ROLES } from '../../config/roles'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../services/api'
import { cx } from '../../utils/cx'

const ROLE_VISUALS = {
  [ROLES.STUDENT]: { icon: UserRound, label: 'Student', className: 'bg-brand-50 text-brand-600' },
  [ROLES.LECTURER]: { icon: GraduationCap, label: 'Lecturer', className: 'bg-teal-50 text-teal-600' },
  [ROLES.STUDENT_ADMIN]: { icon: ShieldCheck, label: 'Administrator', className: 'bg-amber-50 text-amber-600' },
}

/**
 * "Try a demo account" panel. Demo credentials are public test credentials
 * that exist only while DEMO_MODE is enabled.
 */
export function DemoAccountPicker({ onSelect, onFill, busyKey, disabled }) {
  const [showCredentials, setShowCredentials] = useState(false)

  return (
    <section aria-labelledby="demo-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="demo-heading" className="text-sm font-semibold text-slate-900">
            Try a demo account
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Explore PeerPrep from each role’s point of view. No sign-up needed.</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {DEMO_ACCOUNTS.map((account) => {
          const visual = ROLE_VISUALS[account.role]
          const Icon = visual.icon
          const busy = busyKey === account.key
          return (
            <li key={account.key}>
              <button
                type="button"
                onClick={() => onSelect(account.key)}
                disabled={disabled}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', visual.className)}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Continue as {visual.label}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {account.name} · {account.summary}
                  </span>
                </span>
                {busy ? (
                  <Spinner className="size-4 text-brand-600" />
                ) : (
                  <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowCredentials((v) => !v)}
          aria-expanded={showCredentials}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
        >
          <KeyRound className="size-3.5" aria-hidden />
          {showCredentials ? 'Hide demo credentials' : 'Prefer to type them? Show demo credentials'}
        </button>
        {showCredentials && (
          <div className="mt-3 animate-fade-in overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Role</th>
                  <th scope="col" className="px-3 py-2 font-medium">Email</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEMO_ACCOUNTS.map((account) => (
                  <tr key={account.key}>
                    <td className="px-3 py-2 text-slate-600">{ROLE_VISUALS[account.role].label}</td>
                    <td className="px-3 py-2 font-mono text-slate-800">{account.email}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => onFill(account.email)} className="font-medium text-brand-600 hover:text-brand-700">
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Password for all demo accounts: <span className="font-mono font-medium text-slate-800">{DEMO_PASSWORD}</span>. These are public test credentials.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
