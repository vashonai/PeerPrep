import { Compass } from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'
import { Logo } from '../components/Logo'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-12 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">We couldn’t find that page</h1>
      <p className="mt-3 max-w-md text-slate-500">The link may be broken, or the page may have been removed.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink to="/" variant="secondary">Go home</ButtonLink>
        <ButtonLink to="/questions" icon={Compass}>Explore questions</ButtonLink>
      </div>
    </div>
  )
}
