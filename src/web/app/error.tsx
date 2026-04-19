'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: 'Poppins, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, background: '#fff' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 400, color: '#333', marginBottom: '1rem' }}>Something went wrong</h2>
        <button
          onClick={reset}
          style={{ background: '#87CEBF', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
