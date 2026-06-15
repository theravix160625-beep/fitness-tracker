import { playClick } from '../utils/sounds'

type Tab = 'workout' | 'schema' | 'dagboek' | 'checkin' | 'profiel'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'workout', label: 'Workout',  icon: '💪' },
  { id: 'schema',  label: 'Schema',   icon: '📋' },
  { id: 'dagboek', label: 'Dagboek',  icon: '📓' },
  { id: 'checkin', label: 'Check-in', icon: '📊' },
  { id: 'profiel', label: 'Profiel',  icon: '👤' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto left-0 right-0">
      {/* Gradient top line */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(139,92,246,0.4), transparent)' }} />
      <div className="flex" style={{ background: 'rgba(4,8,18,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { playClick(); onChange(tab.id) }}
              className="flex-1 flex flex-col items-center justify-center py-2.5 min-h-[60px] relative transition-all"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active top glow bar */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                  style={{
                    width: '36px', height: '3px',
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    boxShadow: '0 0 12px rgba(99,102,241,0.8), 0 0 4px rgba(59,130,246,0.9)',
                  }}
                />
              )}

              {/* Icon */}
              <span
                className="text-xl leading-none transition-all duration-200"
                style={{
                  transform: isActive ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' : 'none',
                }}
              >
                {tab.icon}
              </span>

              {/* Label */}
              <span
                className="text-[10px] mt-1 font-semibold tracking-wide transition-all duration-200"
                style={{
                  color: isActive ? 'transparent' : '#4b5e7a',
                  background: isActive ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' : 'none',
                  WebkitBackgroundClip: isActive ? 'text' : 'unset',
                  backgroundClip: isActive ? 'text' : 'unset',
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
