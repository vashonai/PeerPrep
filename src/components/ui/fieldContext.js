import { createContext, useContext } from 'react'

/** Lets controls inside a FormField pick up its id, error and description wiring. */
export const FieldContext = createContext({})

export function useFieldProps({ id, invalid, ...props }) {
  const field = useContext(FieldContext)
  const isInvalid = invalid ?? Boolean(field.error)
  return {
    id: id ?? field.id,
    'aria-invalid': isInvalid || undefined,
    'aria-describedby': field.describedBy,
    'aria-required': field.required || undefined,
    isInvalid,
    ...props,
  }
}
