import { useEffect, useState } from 'react'

interface Props {
  visible: boolean
  type: 'weight' | 'volume'
}

export default function PRBadge({ visible, type }: Props) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (visible) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 700)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!visible) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 ${animate ? 'pr-flash' : ''}`}
    >
      🏆 PR! {type === 'weight' ? 'Zwaarste gewicht' : 'Hoogste volume'}
    </span>
  )
}
