import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { FormAlert, FormField, Input, PasswordInput } from '../components/ui/Form'
import { DEMO_MODE } from '../config/env'
import { homePathFor } from '../config/roles'
import { DemoAccountPicker } from '../features/auth/DemoAccountPicker'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { DEMO_PASSWORD, errorMessage } from '../services/api'
import { fullName } from '../utils/format'
import { validateLogin } from '../utils/validation'

export function LoginPage() {
  useDocumentTitle('Log in')
  const { login, loginWithDemo } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [demoBusy, setDemoBusy] = useState(null)
  const form = useForm({ email: '', password: '' }, validateLogin)

  const finish = (user, destination) => {
    toast.success(`Welcome back, ${user.firstName}`, `Signed in as ${fullName(user)}.`)
    navigate(destination, { replace: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const user = await login(values)
    finish(user, location.state?.from ?? homePathFor(user))
  })

  const onDemo = async (key) => {
    setDemoBusy(key)
    form.setFormError('')
    try {
      const user = await loginWithDemo(key)
      finish(user, homePathFor(user))
    } catch (error) {
      form.setFormError(errorMessage(error))
      setDemoBusy(null)
    }
  }

  const busy = form.submitting || Boolean(demoBusy)

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to continue preparing with your classmates.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <FormAlert>{form.formError}</FormAlert>
        <FormField id="email" label="Email address" required error={form.errors.email}>
          <Input type="email" autoComplete="email" icon={Mail} placeholder="you@university.edu" {...form.field('email')} />
        </FormField>
        <FormField id="password" label="Password" required error={form.errors.password}>
          <PasswordInput autoComplete="current-password" placeholder="Enter your password" {...form.field('password')} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={form.submitting} disabled={busy}>
          {form.submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to PeerPrep?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>

      {DEMO_MODE && (
        <>
          <div className="my-8 flex items-center gap-3 text-xs font-medium tracking-wide text-slate-400 uppercase">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <DemoAccountPicker
            onSelect={onDemo}
            busyKey={demoBusy}
            disabled={busy}
            onFill={(email) => {
              form.setField('email', email)
              form.setField('password', DEMO_PASSWORD)
            }}
          />
        </>
      )}
    </div>
  )
}
