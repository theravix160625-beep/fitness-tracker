import { useState, useRef } from 'react'

interface Props {
  onDelete: () => void
  children: React.ReactNode
}

export default function SwipeToDelete({ onDelete, children }: Props) {
  const [offset, setOffset] = useState(0)
  const [swiped, setSwiped] = useState(false)
  const startX = useRef<number | null>(null)
  const threshold = 80

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    setSwiped(false)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return
    const diff = startX.current - e.touches[0].clientX
    if (diff > 0) {
      setOffset(Math.min(diff, 120))
    }
  }

  function handleTouchEnd() {
    if (offset > threshold) {
      setSwiped(true)
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  function handleConfirm() {
    onDelete()
    setOffset(0)
    setSwiped(false)
  }

  function handleCancel() {
    setOffset(0)
    setSwiped(false)
  }

  return (
    <div className="relative overflow-hidden rounded-xl mb-3">
      <div
        className="absolute inset-y-0 right-0 flex items-center bg-red-500/90 px-4 rounded-xl"
        style={{ minWidth: 80 }}
      >
        <span className="text-white text-sm font-medium">Verwijder</span>
      </div>
      <div
        className="relative swipe-delete"
        style={{ transform: swiped ? 'translateX(-120px)' : `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      {swiped && (
        <div className="absolute inset-0 bg-[#0f0f0f]/90 flex items-center justify-center gap-3 rounded-xl z-10">
          <button
            onClick={handleConfirm}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[44px]"
          >
            Verwijderen
          </button>
          <button
            onClick={handleCancel}
            className="bg-[#1f2937] text-gray-300 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px]"
          >
            Annuleren
          </button>
        </div>
      )}
    </div>
  )
}
