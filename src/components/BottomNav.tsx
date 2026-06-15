type Tab = 'workout' | 'schema' | 'dagboek' | 'checkin' | 'profiel'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'schema', label: 'Schema', icon: '📋' },
  { id: 'dagboek', label: 'Dagboek', icon: '📓' },
  { id: 'checkin', label: 'Check-in', icon: '📊' },
  { id: 'profiel', label: 'Profiel', icon: '👤' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#1f2937]">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
              active === tab.id
                ? 'text-blue-400'
                : 'text-gray-500 active:text-gray-300'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            {active === tab.id && (
              <span className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400" style={{ position: 'static', display: 'block', height: 2, background: '#3b82f6', borderRadius: 1, marginTop: 2, width: '40%', marginLeft: 'auto', marginRight: 'auto' }} />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
