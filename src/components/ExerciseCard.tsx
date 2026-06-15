import { useState, useEffect } from 'react'
import type { ExerciseLog, ExerciseSet, WorkoutSession } from '../types'
import SetRow from './SetRow'
import PRBadge from './PRBadge'
import { detectPR, getExerciseHistory } from '../utils/prDetection'

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

  function updateSet(index: number, set: ExerciseSet) {
    const newSets = [...exercise.sets]
    newSets[index] = set
    onChange({ ...exercise, sets: newSets })
  }

  function addSet() {
    const newSet: ExerciseSet = { weight: null, reps: null, isPR: false }
    onChange({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  function removeSet(index: number) {
    const newSets = exercise.sets.filter((_, i) => i !== index)
    onChange({ ...exercise, sets: newSets })
  }

  const getHint = (index: number) => {
    return setHints[index] ?? setHints[setHints.length - 1] ?? '8–12 reps'
  }

  return (
    <div className="bg-[#111827] rounded-xl p-4 mb-3 border border-[#1f2937]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-base">{exercise.name}</h3>
          <div className="flex gap-2 mt-1 flex-wrap">
            {prResult.isWeightPR && <PRBadge visible={true} type="weight" />}
            {prResult.isVolumePR && !prResult.isWeightPR && <PRBadge visible={true} type="volume" />}
          </div>
        </div>
        <button
          onClick={() => setShowHistory(h => !h)}
          className="text-xs text-blue-400 ml-2 mt-1 shrink-0"
        >
          {showHistory ? 'Verberg' : 'Historie'}
        </button>
      </div>

      {showHistory && history.length > 0 && (
        <div className="mb-3 p-3 bg-[#0f1623] rounded-lg border border-[#1f2937]">
          <p className="text-xs text-gray-500 mb-2">Laatste sessies</p>
          {history.map((h, i) => (
            <div key={i} className="mb-1.5">
              <span className="text-xs text-gray-500">{h.date}</span>
              <div className="flex gap-2 flex-wrap mt-0.5">
                {h.sets.map((s, si) => (
                  <span key={si} className="text-xs text-gray-400 bg-[#1a2030] px-2 py-0.5 rounded">
                    {s.weight ?? '?'}kg × {s.reps ?? '?'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showHistory && history.length === 0 && (
        <div className="mb-3 p-3 bg-[#0f1623] rounded-lg">
          <p className="text-xs text-gray-600">Nog geen eerdere sessies</p>
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
            key={i}
            set={set}
            index={i}
            hint={getHint(i)}
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
