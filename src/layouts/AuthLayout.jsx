import { CircleCheck, Search, ShieldCheck, Users } from 'lucide-react'
import { Outlet } from 'react-router'
import { Logo } from '../components/Logo'

const YEAR = new Date().getFullYear()

const POINTS = [
  { icon: Search, text: 'Search past paper questions by course, topic and difficulty.' },
  { icon: Users, text: 'Discuss solutions with classmates in one organised thread.' },
  { icon: ShieldCheck, text: 'See which answers lecturers have verified as correct.' },
]

export function AuthLayout() {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-12">
        <Logo />
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
        <p className="text-center text-xs text-slate-400 lg:text-left">© {YEAR} PeerPrep</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-brand-900 lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-brand-600/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">Every past paper, discussed and verified.</h2>
          <p className="mt-4 text-brand-100/80">PeerPrep brings exam preparation out of scattered group chats and into one searchable, trustworthy place.</p>

          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-brand-50">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-teal-300">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>

          <figure className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-medium text-brand-100">COMP 2310</span>
              <span className="text-brand-200/70">Normalization</span>
            </div>
            <p className="mt-3 text-sm font-medium text-white">Decompose R(A, B, C, D, E) into BCNF</p>
            <p className="mt-2 line-clamp-2 text-sm text-brand-100/70">A and C never appear on the right-hand side, so AC is the only candidate key…</p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
              <CircleCheck className="size-3.5" aria-hidden /> Verified Correct by Dr. Reid
            </p>
          </figure>
        </div>
      </aside>
    </div>
  )
}
