import { useState, useEffect } from 'react'
import type { WorkoutSession, ExerciseLog, ExerciseSet } from '../types'
import { SCHEMA } from '../data/schema'
import { getCurrentCycleDay } from '../utils/cycleDay'
import { saveWorkout, loadWorkouts, deleteWorkout, generateId } from '../utils/storage'
import ExerciseCard from './ExerciseCard'
import SwipeToDelete from './SwipeToDelete'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

function buildInitialExercises(dayIndex: number): ExerciseLog[] {
  const day = SCHEMA[dayIndex]
  return day.exercises.map(ex => {
    const totalSets = ex.sets.reduce((acc, s) => acc + parseSetCount(s.setNumbers), 0)
    const sets: ExerciseSet[] = Array.from({ length: totalSets }, () => ({ weight: null, reps: null, isPR: false }))
    return { name: ex.name, sets, notes: '' }
  })
}

function parseSetCount(setNumbers: string): number {
  if (setNumbers.includes('t/m')) {
    const match = setNumbers.match(/(\d+)\s*t\/m\s*(\d+)/)
    if (match) return parseInt(match[2]) - parseInt(match[1]) + 1
  }
  if (setNumbers.includes('&')) {
    const matches = setNumbers.match(/\d+/g)
    return matches ? matches.length : 2
  }
  const match = setNumbers.match(/^(\d+)\s*sets?/i)
  if (match) return parseInt(match[1])
  return 1
}

function getSetHints(dayIndex: number, exerciseName: string): string[] {
  const day = SCHEMA[dayIndex]
  const ex = day.exercises.find(e => e.name === exerciseName)
  if (!ex) return []
  const hints: string[] = []
  ex.sets.forEach(s => {
    const count = parseSetCount(s.setNumbers)
    for (let i = 0; i < count; i++) hints.push(s.repRange)
  })
  return hints
}

type View = 'list' | 'active' | 'history'

export default function WorkoutLogger() {
  const [view, setView] = useState<View>('list')
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentCycleDay = getCurrentCycleDay()

  useEffect(() => {
    loadWorkouts().then(sessions => {
      setAllSessions(sessions)
      setLoading(false)
    })
  }, [])

  function startWorkout(dayIdx: number) {
    const day = SCHEMA[dayIdx]
    const session: WorkoutSession = {
      id: generateId(),
      date: todayStr(),
      cycleDay: day.day,
      exercises: buildInitialExercises(dayIdx),
      energyLevel: 7,
      notes: '',
    }
    setActiveSession(session)
    setActiveDayIdx(dayIdx)
    setView('active')
    setSaved(false)
  }

  function updateExercise(index: number, exercise: ExerciseLog) {
    if (!activeSession) return
    const exercises = [...activeSession.exercises]
    exercises[index] = exercise
    setActiveSession({ ...activeSession, exercises })
  }

  async function saveSession() {
    if (!activeSession || saving) return
    setSaving(true)
    await saveWorkout(activeSession)
    const sessions = await loadWorkouts()
    setAllSessions(sessions)
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setView('list')
      setActiveSession(null)
      setSaved(false)
    }, 1000)
  }

  async function handleDelete(id: string) {
    await deleteWorkout(id)
    const sessions = await loadWorkouts()
    setAllSessions(sessions)
  }

  if (view === 'history') {
    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-blue-400">← Terug</button>
          <h1 className="text-xl font-bold text-white">Workout Geschiedenis</h1>
        </div>
        {loading && <p className="text-center text-gray-600 py-10">Laden...</p>}
        {!loading && allSessions.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">📭</p>
            <p>Nog geen workouts gelogd</p>
          </div>
        )}
        {[...allSessions].sort((a, b) => b.date.localeCompare(a.date)).map(session => (
          <SwipeToDelete key={session.id} onDelete={() => handleDelete(session.id)}>
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{SCHEMA[session.cycleDay - 1]?.title ?? `Dag ${session.cycleDay}`}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(session.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Dag {session.cycleDay}</span>
                  <span className="text-xs text-gray-600">⚡ {session.energyLevel}/10</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {session.exercises.slice(0, 4).map((ex, i) => (
                  <span key={i} className="text-xs text-gray-500 bg-[#1a2030] px-2 py-0.5 rounded">
                    {ex.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                ))}
                {session.exercises.length > 4 && (
                  <span className="text-xs text-gray-600">+{session.exercises.length - 4}</span>
                )}
              </div>
            </div>
          </SwipeToDelete>
        ))}
        {allSessions.length > 0 && (
          <p className="text-center text-xs text-gray-700 mt-4">Swipe naar links om te verwijderen</p>
        )}
      </div>
    )
  }

  if (view === 'active' && activeSession) {
    const day = SCHEMA[activeDayIdx]
    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setView('list')} className="text-blue-400 shrink-0">← Terug</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{day.title}</h1>
            <p className="text-xs text-gray-500">{formatDate(activeSession.date)}</p>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="block text-sm text-gray-400 mb-2">
            Energieniveau: <span className="text-blue-400 font-bold">{activeSession.energyLevel}/10</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={activeSession.energyLevel}
            onChange={e => setActiveSession({ ...activeSession, energyLevel: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-700 mt-1">
            <span>Uitgeput</span><span>Topfit</span>
          </div>
        </div>

        {activeSession.exercises.map((exercise, i) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            onChange={ex => updateExercise(i, ex)}
            allSessions={allSessions}
            currentSessionId={activeSession.id}
            setHints={getSetHints(activeDayIdx, exercise.name)}
          />
        ))}

        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="block text-sm text-gray-400 mb-2">Sessie notities</label>
          <textarea
            placeholder="Hoe was de workout? Bijzonderheden..."
            value={activeSession.notes}
            onChange={e => setActiveSession({ ...activeSession, notes: e.target.value })}
            className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={saveSession}
          disabled={saved || saving}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all min-h-[56px] ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : saving
              ? 'bg-blue-500/50 text-white/60'
              : 'bg-blue-500 text-white active:bg-blue-600'
          }`}
        >
          {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Workout opslaan'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cycle dag {currentCycleDay} van 8</p>
        </div>
        <button
          onClick={() => setView('history')}
          className="text-sm text-blue-400 bg-blue-400/10 px-3 py-2 rounded-lg border border-blue-400/20 min-h-[44px]"
        >
          Geschiedenis
        </button>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-600">
          <p>Laden...</p>
        </div>
      )}

      {!loading && SCHEMA.map((day, idx) => {
        const isCurrent = day.day === currentCycleDay
        const isWorkout = day.type === 'workout'
        const recentSession = [...allSessions]
          .filter(s => s.cycleDay === day.day)
          .sort((a, b) => b.date.localeCompare(a.date))[0]

        return (
          <div
            key={day.day}
            className={`rounded-xl p-4 mb-3 border transition-all ${
              isCurrent
                ? 'border-blue-500 bg-[#0d1929]'
                : 'border-[#1f2937] bg-[#111827]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCurrent ? 'bg-blue-500 text-white' : 'bg-[#1f2937] text-gray-500'
                  }`}>
                    Dag {day.day}
                  </span>
                  {isCurrent && <span className="text-xs text-blue-400 font-medium">← Vandaag</span>}
                  {day.type === 'rest' && <span className="text-xs text-green-400">🌿 Rust</span>}
                  {day.type === 'run' && <span className="text-xs text-orange-400">🏃 Run</span>}
                </div>
                <h3 className="font-semibold text-white mt-1">{day.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{day.subtitle}</p>
                {recentSession && (
                  <p className="text-xs text-gray-700 mt-1">Laatst: {formatDate(recentSession.date)}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                <span className="text-xs text-gray-600">{day.calories} kcal</span>
                {isWorkout && (
                  <button
                    onClick={() => startWorkout(idx)}
                    className={`text-sm px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors ${
                      isCurrent
                        ? 'bg-blue-500 text-white active:bg-blue-600'
                        : 'bg-[#1f2937] text-gray-300 active:bg-[#2a3448]'
                    }`}
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
