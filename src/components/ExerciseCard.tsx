import { useState, useEffect } from 'react'
import type { ExerciseLog, ExerciseSet, WorkoutSession } from '../types'
import SetRow from './SetRow'
import PRBadge from './PRBadge'
import { detectPR, getExerciseHistory } from '../utils/prDetection'
import { bestOneRM, estimatedOneRM } from '../utils/oneRM'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  exercise: ExerciseLog
  onChange: (exercise: ExerciseLog) => void
  allSessions: WorkoutSession[]
  currentSessionId?: string
  setHints: string[]
}

export default function ExerciseCard({ exercise, onChange, allSessions, currentSessionId, setHints }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const [prResult, setPrResult] = useState({ isWeightPR: false, isVolumePR: false, prevBestWeight: 0, prevBestVolume: 0 })

  useEffect(() => {
    const result = detectPR(exercise.name, exercise.sets, allSessions, currentSessionId)
    setPrResult(result)
  }, [exercise.sets, exercise.name, allSessions, currentSessionId])

  const history = getExerciseHistory(exercise.name, allSessions.filter(s => s.id !== currentSessionId))

  // 1RM trend data for chart
  const oneRMTrend = history
    .slice()
    .reverse()
    .map(h => ({
      date: new Date(h.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      orm: bestOneRM(h.sets),
    }))
    .filter(p => p.orm !== null)

  // Current best 1RM
  const current1RM = bestOneRM(exercise.sets)

  function updateSet(index: number, set: ExerciseSet) {
    const newSets = [...exercise.sets]
    newSets[index] = set
    onChange({ ...exercise, sets: newSets })
  }

  function addSet() {
    onChange({ ...exercise, sets: [...exercise.sets, { weight: null, reps: null, isPR: false }] })
  }

  function removeSet(index: number) {
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== index) })
  }

  const getHint = (index: number) => setHints[index] ?? setHints[setHints.length - 1] ?? '8–12 reps'

  return (
    <div className="bg-[#111827] rounded-xl p-4 mb-3 border border-[#1f2937]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-base">{exercise.name}</h3>
          <div className="flex gap-2 mt-1 flex-wrap items-center">
            {current1RM && (
              <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                ~1RM: {current1RM} kg
              </span>
            )}
            {prResult.isWeightPR && <PRBadge visible={true} type="weight" />}
            {prResult.isVolumePR && !prResult.isWeightPR && <PRBadge visible={true} type="volume" />}
          </div>
        </div>
        <button onClick={() => setShowHistory(h => !h)} className="text-xs text-blue-400 ml-2 mt-1 shrink-0 min-h-[36px] px-2">
          {showHistory ? 'Verberg' : 'Progressie'}
        </button>
      </div>

      {showHistory && (
        <div className="mb-3 p-3 bg-[#0f1623] rounded-lg border border-[#1f2937]">
          {history.length === 0 ? (
            <p className="text-xs text-gray-600">Nog geen eerdere sessies</p>
          ) : (
            <>
              {/* 1RM progress chart */}
              {oneRMTrend.length >= 2 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Geschat 1RM over tijd</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={oneRMTrend} margin={{ top: 2, right: 2, bottom: 2, left: -30 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a2030', border: '1px solid #2a3448', borderRadius: 6, fontSize: 11 }}
                        formatter={(v) => [`${v} kg`, '~1RM']}
                      />
                      <Line type="monotone" dataKey="orm" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {/* Last sessions */}
              <p className="text-xs text-gray-500 mb-1.5">Laatste sessies</p>
              {history.slice(0, 3).map((h, i) => (
                <div key={i} className="mb-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{h.date}</span>
                    {bestOneRM(h.sets) && <span className="text-xs text-purple-400">~1RM: {bestOneRM(h.sets)} kg</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-0.5">
                    {h.sets.map((s, si) => (
                      <span key={si} className="text-xs text-gray-400 bg-[#1a2030] px-2 py-0.5 rounded">
                        {s.weight ?? '?'}kg × {s.reps ?? '?'}
                        {s.weight && s.reps ? <span className="text-gray-600"> (~{estimatedOneRM(s.weight, s.reps)})</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mb-1">
        <div className="flex text-xs text-gray-600 mb-1 px-8">
          <span className="flex-1">Gewicht (kg)</span>
          <span className="flex-1">Reps</span>
          <span className="w-16 text-right">Doel</span>
        </div>
        {exercise.sets.map((set, i) => (
          <SetRow
            key={i} set={set} index={i} hint={getHint(i)}
            onChange={s => updateSet(i, s)}
            onDelete={() => removeSet(i)}
            canDelete={exercise.sets.length > 1}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={addSet}
          className="text-xs text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20 hover:bg-blue-400/20 transition-colors min-h-[36px]"
        >
          + Set toevoegen
        </button>
      </div>

      <textarea
        placeholder="Notities bij deze oefening..."
        value={exercise.notes}
        onChange={e => onChange({ ...exercise, notes: e.target.value })}
        className="w-full mt-3 bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
        rows={2}
      />
    </div>
  )
}
