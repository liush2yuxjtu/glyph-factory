'use client'

import posthog from 'posthog-js'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="zh-CN">
      <body>
        <NextError statusCode={0} />
        <button type="button" onClick={() => reset()} style={{ margin: '1rem' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
