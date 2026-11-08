import { useState } from 'react'
import { ApiError, errorMessage } from '../services/api'
import { hasErrors } from '../utils/validation'

/**
 * Minimal form state: values, validation shown after blur or submit, and
 * server-side field errors that clear as soon as the field is edited.
 */
export function useForm(initialValues, validate = () => ({})) {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const clientErrors = validate(values)
  const errors = { ...serverErrors }
  for (const [name, message] of Object.entries(clientErrors)) {
    if (submitted || touched[name]) errors[name] = message
  }

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setServerErrors((current) => {
      if (!(name in current)) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    setFormError('')
  }

  const field = (name) => ({
    name,
    value: values[name],
    onChange: (event) => setField(name, event.target.value),
    onBlur: () => setTouched((t) => (t[name] ? t : { ...t, [name]: true })),
  })

  const handleSubmit = (onValid) => async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setSubmitted(true)
    setFormError('')
    if (hasErrors(clientErrors)) {
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setSubmitting(true)
    try {
      await onValid(values)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION' && hasErrors(error.fieldErrors)) {
        setServerErrors(error.fieldErrors)
        setFormError(error.message)
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const reset = (next = initialValues) => {
    setValues(next)
    setTouched({})
    setSubmitted(false)
    setServerErrors({})
    setFormError('')
  }

  return { values, setValues, setField, field, errors, formError, setFormError, submitting, handleSubmit, reset }
}
