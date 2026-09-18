'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h2>Something went wrong</h2>
      <p>{error.message || 'An unexpected error occurred.'}</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
