import { playClick } from '../utils/sounds'

type Tab = 'workout' | 'schema' | 'dagboek' | 'checkin' | 'profiel'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'schema',  label: 'Schema',  icon: '📋' },
  { id: 'dagboek', label: 'Dagboek', icon: '📓' },
  { id: 'checkin', label: 'Check-in', icon: '📊' },
  { id: 'profiel', label: 'Profiel',  icon: '👤' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5"
      style={{ background: 'rgba(10,14,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="flex">
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { playClick(); onChange(tab.id) }}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[58px] transition-all relative ${
                isActive ? 'text-white' : 'text-gray-600 active:text-gray-400'
              }`}
            >
              {/* Active glow dot */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', boxShadow: '0 0 8px #3b82f6' }}
                />
              )}
              <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] mt-1 font-semibold tracking-wide transition-all ${isActive ? 'gradient-text' : ''}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
