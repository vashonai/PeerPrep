import { Info, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { FormAlert, FormField, Input, PasswordInput } from '../components/ui/Form'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { cx } from '../utils/cx'
import { passwordStrength, validateRegistration } from '../utils/validation'

const STRENGTH = [
  { label: 'Too weak', className: 'bg-red-500' },
  { label: 'Weak', className: 'bg-red-500' },
  { label: 'Fair', className: 'bg-amber-500' },
  { label: 'Good', className: 'bg-teal-500' },
  { label: 'Strong', className: 'bg-emerald-500' },
]

function StrengthMeter({ password }) {
  if (!password) return null
  const score = passwordStrength(password)
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={cx('h-1 flex-1 rounded-full transition', step <= score ? STRENGTH[score].className : 'bg-slate-200')} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-slate-500">{STRENGTH[score].label}</span>
    </div>
  )
}

export function RegisterPage() {
  useDocumentTitle('Create account')
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const form = useForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' }, validateRegistration)

  const onSubmit = form.handleSubmit(async (values) => {
    const user = await register(values)
    toast.success(`Welcome to PeerPrep, ${user.firstName}!`, 'Your student account is ready.')
    navigate('/dashboard', { replace: true })
  })

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">Join your classmates and start sharing past paper solutions.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <FormAlert>{form.formError}</FormAlert>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField id="firstName" label="First name" required error={form.errors.firstName}>
            <Input autoComplete="given-name" {...form.field('firstName')} />
          </FormField>
          <FormField id="lastName" label="Last name" required error={form.errors.lastName}>
            <Input autoComplete="family-name" {...form.field('lastName')} />
          </FormField>
        </div>
        <FormField id="email" label="Email address" required error={form.errors.email}>
          <Input type="email" autoComplete="email" icon={Mail} placeholder="you@university.edu" {...form.field('email')} />
        </FormField>
        <FormField id="password" label="Password" required error={form.errors.password} hint="At least 8 characters, including a letter and a number.">
          <PasswordInput autoComplete="new-password" {...form.field('password')} />
        </FormField>
        <StrengthMeter password={form.values.password} />
        <FormField id="confirmPassword" label="Confirm password" required error={form.errors.confirmPassword}>
          <PasswordInput autoComplete="new-password" {...form.field('confirmPassword')} />
        </FormField>

        <p className="flex items-start gap-2 rounded-lg bg-slate-100/80 px-3 py-2.5 text-xs text-slate-600">
          <Info className="mt-px size-3.5 shrink-0 text-brand-600" aria-hidden />
          New accounts join as Students. Lecturer and administrator access is granted by a Student Administrator.
        </p>

        <Button type="submit" size="lg" className="w-full" loading={form.submitting}>
          {form.submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
