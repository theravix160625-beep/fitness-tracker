import { SCHEMA } from '../data/schema'
import { getCurrentCycleDay } from '../utils/cycleDay'

export default function Schema() {
  const currentDay = getCurrentCycleDay()

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Trainingsschema</h1>
        <p className="text-sm text-gray-500 mt-1">Upper/Lower Split — Fase 2 (start 15 juni 2025)</p>
      </div>

      {SCHEMA.map(day => {
        const isCurrent = day.day === currentDay
        return (
          <div
            key={day.day}
            className={`rounded-xl p-4 mb-4 border transition-all ${
              isCurrent
                ? 'border-blue-500 bg-[#0d1929]'
                : 'border-[#1f2937] bg-[#111827]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                isCurrent ? 'bg-blue-500 text-white' : 'bg-[#1f2937] text-gray-400'
              }`}>
                Dag {day.day}
              </span>
              {isCurrent && (
                <span className="text-xs font-semibold text-blue-400 animate-pulse">● Vandaag</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                day.type === 'workout' ? 'bg-purple-500/20 text-purple-300' :
                day.type === 'run' ? 'bg-orange-500/20 text-orange-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {day.type === 'workout' ? '💪 Workout' : day.type === 'run' ? '🏃 Run' : '🌿 Rust'}
              </span>
            </div>

            <h3 className="font-bold text-white text-base mb-0.5">{day.subtitle}</h3>
            <p className="text-xs text-gray-500 mb-3">🔥 {day.calories} calorieën</p>

            {day.exercises.length > 0 && (
              <div className="space-y-3">
                {day.exercises.map((ex, i) => (
                  <div key={i} className="bg-[#0f1623] rounded-lg p-3 border border-[#1a2335]">
                    <p className="font-medium text-white text-sm mb-2">{ex.name}</p>
                    <div className="space-y-1">
                      {ex.sets.map((s, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-20 shrink-0">{s.setNumbers}</span>
                          <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">{s.repRange}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {day.type === 'rest' && (
              <div className="bg-[#0f1623] rounded-lg p-3 border border-[#1a2335]">
                <p className="text-sm text-green-400">🚶 10.000 stappen doelstelling</p>
                <p className="text-xs text-gray-500 mt-1">Actief herstel — beweeg maar herstel je spieren</p>
              </div>
            )}

            {day.type === 'run' && (
              <div className="bg-[#0f1623] rounded-lg p-3 border border-[#1a2335]">
                <p className="text-sm text-orange-400">📱 Via Runna App</p>
                <p className="text-xs text-gray-500 mt-1">Calorieën afhankelijk van type run</p>
              </div>
            )}
          </div>
        )
      })}

      <div className="text-center py-4">
        <p className="text-xs text-gray-700">↩ Cycle herhaalt zich elke 8 dagen</p>
      </div>
    </div>
  )
}
