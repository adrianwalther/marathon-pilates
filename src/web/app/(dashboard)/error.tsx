'use client'

import { useEffect } from 'react'

export default function DashboardError({
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
    <div style={{ fontFamily: 'Poppins, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <p style={{ color: '#555', fontSize: '1rem', fontWeight: 400 }}>Something went wrong loading this page.</p>
      <button
        onClick={reset}
        style={{ background: '#87CEBF', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
      >
        Try again
      </button>
    </div>
  )
}
