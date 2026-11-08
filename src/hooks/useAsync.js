import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async loader whenever `deps` change and tracks loading/error state.
 * Previous data stays visible while reloading to avoid layout flashes.
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [version, setVersion] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    loaderRef.current().then(
      (data) => active && setState({ data, error: null, loading: false }),
      (error) => active && setState({ data: undefined, error, loading: false }),
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}
