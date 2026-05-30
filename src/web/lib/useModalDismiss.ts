import { useEffect, useRef } from 'react'

// Shared modal behavior: close on Escape and lock background scroll while open.
// Pass the open flag + a close callback; it no-ops while closed. Using a ref
// for onClose keeps the effect keyed only on `isOpen`, so an inline callback
// (e.g. () => setShowModal(false)) doesn't re-attach the listener every render.
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])
}
