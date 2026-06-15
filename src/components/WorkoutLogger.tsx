import { useState, useEffect, useRef } from 'react'
import type { WorkoutSession, ExerciseLog, ExerciseSet, ShiftType } from '../types'
import { SCHEMA } from '../data/schema'
import { getCurrentCycleDay } from '../utils/cycleDay'
import { saveWorkout, loadWorkouts, deleteWorkout, generateId } from '../utils/storage'
import ExerciseCard from './ExerciseCard'
import SwipeToDelete from './SwipeToDelete'
import RunLogger from './RunLogger'
import { playSave, playDelete, playClick } from '../utils/sounds'

// ─── Constants ────────────────────────────────────────
const FREE_CYCLE_DAY = 9

const FREE_LABELS: { value: string; icon: string; color: string }[] = [
  { value: 'Vrije training',      icon: '🏋️', color: 'border-blue-500 text-blue-300 bg-blue-500/10' },
  { value: 'Met trainingpartner', icon: '🤝', color: 'border-purple-500 text-purple-300 bg-purple-500/10' },
  { value: 'Run + Kracht',        icon: '🏃💪', color: 'border-orange-500 text-orange-300 bg-orange-500/10' },
  { value: 'Yoga & Stretching',   icon: '🧘', color: 'border-emerald-500 text-emerald-300 bg-emerald-500/10' },
  { value: 'Andere sport',        icon: '⚽', color: 'border-cyan-500 text-cyan-300 bg-cyan-500/10' },
]

const SHIFTS: { value: ShiftType; label: string; icon: string; color: string }[] = [
  { value: 'none',    label: 'Geen dienst', icon: '🌤',  color: 'border-gray-600 text-gray-400' },
  { value: 'day',     label: 'Dagdienst',   icon: '☀️',  color: 'border-amber-500 text-amber-400' },
  { value: 'evening', label: 'Avonddienst', icon: '🌆',  color: 'border-orange-500 text-orange-400' },
  { value: 'night',   label: 'Nachtdienst', icon: '🌙',  color: 'border-indigo-500 text-indigo-400' },
]

// Free workout label is encoded in notes as first line: "[vrij:Label]\n..."
function encodeFreeLabel(label: string, notes: string) {
  return `[vrij:${label}]\n${notes}`
}
function parseFreeLabel(session: WorkoutSession): { label: string; notes: string } {
  if (session.cycleDay !== FREE_CYCLE_DAY) return { label: '', notes: session.notes }
  const m = session.notes.match(/^\[vrij:([^\]]+)\]\n?/)
  if (m) return { label: m[1], notes: session.notes.slice(m[0].length) }
  return { label: 'Vrije training', notes: session.notes }
}

// ─── Helpers ──────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0] }

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
  if (setNumbers.includes('&')) { const m = setNumbers.match(/\d+/g); return m ? m.length : 2 }
  const match = setNumbers.match(/^(\d+)\s*sets?/i)
  if (match) return parseInt(match[1])
  return 1
}

function getSetHints(dayIndex: number, exerciseName: string): string[] {
  const day = SCHEMA[dayIndex]
  const ex = day.exercises.find(e => e.name === exerciseName)
  if (!ex) return []
  const hints: string[] = []
  ex.sets.forEach(s => { const c = parseSetCount(s.setNumbers); for (let i = 0; i < c; i++) hints.push(s.repRange) })
  return hints
}

function emptySet(): ExerciseSet { return { weight: null, reps: null, isPR: false } }
function newFreeExercise(name: string): ExerciseLog { return { name, sets: [emptySet(), emptySet(), emptySet()], notes: '' } }

// ─── Main component ───────────────────────────────────
type View = 'list' | 'active' | 'history' | 'run' | 'free'

export default function WorkoutLogger() {
  const [view, setView] = useState<View>('list')
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [runDate, setRunDate] = useState(todayStr())

  // Free workout state
  const [freeLabel, setFreeLabel] = useState(FREE_LABELS[0].value)
  const [freeExercises, setFreeExercises] = useState<ExerciseLog[]>([])
  const [freeNewName, setFreeNewName] = useState('')
  const [freeEnergyLevel, setFreeEnergyLevel] = useState(7)
  const [freeNotes, setFreeNotes] = useState('')
  const [freeShift, setFreeShift] = useState<ShiftType>('none')
  const freeNameRef = useRef<HTMLInputElement>(null)

  const currentCycleDay = getCurrentCycleDay()

  useEffect(() => {
    loadWorkouts().then(sessions => { setAllSessions(sessions); setLoading(false) })
  }, [])

  // Sessions logged today per cycleDay
  const today = todayStr()
  const todayCountByCycleDay: Record<number, number> = {}
  for (const s of allSessions) {
    if (s.date === today) todayCountByCycleDay[s.cycleDay] = (todayCountByCycleDay[s.cycleDay] ?? 0) + 1
  }

  // ─── Schema workout ──────────────────────────
  function startWorkout(dayIdx: number) {
    const day = SCHEMA[dayIdx]
    const session: WorkoutSession = {
      id: generateId(), date: todayStr(), cycleDay: day.day,
      exercises: buildInitialExercises(dayIdx), energyLevel: 7, notes: '', shiftType: 'none',
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
    playSave()
    setTimeout(() => { setView('list'); setActiveSession(null); setSaved(false) }, 1000)
  }

  // ─── Free workout ────────────────────────────
  function openFree() {
    setFreeLabel(FREE_LABELS[0].value)
    setFreeExercises([])
    setFreeNewName('')
    setFreeEnergyLevel(7)
    setFreeNotes('')
    setFreeShift('none')
    setView('free')
  }

  function addFreeExercise() {
    const name = freeNewName.trim()
    if (!name) return
    setFreeExercises(ex => [...ex, newFreeExercise(name)])
    setFreeNewName('')
    freeNameRef.current?.focus()
  }

  function updateFreeExercise(index: number, exercise: ExerciseLog) {
    setFreeExercises(ex => { const n = [...ex]; n[index] = exercise; return n })
  }

  function removeFreeExercise(index: number) {
    setFreeExercises(ex => ex.filter((_, i) => i !== index))
  }

  async function saveFreeSession() {
    if (saving) return
    setSaving(true)
    const session: WorkoutSession = {
      id: generateId(), date: todayStr(), cycleDay: FREE_CYCLE_DAY,
      exercises: freeExercises,
      energyLevel: freeEnergyLevel,
      notes: encodeFreeLabel(freeLabel, freeNotes),
      shiftType: freeShift,
    }
    await saveWorkout(session)
    const sessions = await loadWorkouts()
    setAllSessions(sessions)
    setSaving(false)
    setSaved(true)
    playSave()
    setTimeout(() => { setView('list'); setSaved(false) }, 1000)
  }

  // ─── Delete ──────────────────────────────────
  async function handleDelete(id: string) {
    playDelete()
    await deleteWorkout(id)
    setAllSessions(await loadWorkouts())
  }

  // ─── RUN VIEW ────────────────────────────────
  if (view === 'run') return <RunLogger defaultDate={runDate} onBack={() => setView('list')} />

  // ─── HISTORY VIEW ────────────────────────────
  if (view === 'history') {
    const sorted = [...allSessions].sort((a, b) => b.date.localeCompare(a.date))
    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="text-blue-400">← Terug</button>
          <h1 className="text-xl font-bold text-white">Workout Geschiedenis</h1>
        </div>
        {loading && <p className="text-center text-gray-600 py-10">Laden...</p>}
        {!loading && sorted.length === 0 && (
          <div className="text-center py-16 text-gray-600"><p className="text-4xl mb-3">📭</p><p>Nog geen workouts gelogd</p></div>
        )}
        {sorted.map(session => {
          const isFree = session.cycleDay === FREE_CYCLE_DAY
          const { label: fLabel } = parseFreeLabel(session)
          const title = isFree ? fLabel || 'Vrije training' : (SCHEMA[session.cycleDay - 1]?.title ?? `Dag ${session.cycleDay}`)
          const freeInfo = isFree ? FREE_LABELS.find(l => l.value === fLabel) : null
          return (
            <SwipeToDelete key={session.id} onDelete={() => handleDelete(session.id)}>
              <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {freeInfo && <span className="text-lg">{freeInfo.icon}</span>}
                      <p className="font-semibold text-white">{title}</p>
                      {isFree && <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">Vrij</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(session.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {!isFree && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Dag {session.cycleDay}</span>}
                    <span className="text-xs text-gray-600">⚡ {session.energyLevel}/10</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {session.exercises.slice(0, 4).map((ex, i) => (
                    <span key={i} className="text-xs text-gray-500 bg-[#1a2030] px-2 py-0.5 rounded">{ex.name.split(' ').slice(0, 2).join(' ')}</span>
                  ))}
                  {session.exercises.length > 4 && <span className="text-xs text-gray-600">+{session.exercises.length - 4}</span>}
                </div>
              </div>
            </SwipeToDelete>
          )
        })}
        {sorted.length > 0 && <p className="text-center text-xs text-gray-700 mt-2">Swipe naar links om te verwijderen</p>}
      </div>
    )
  }

  // ─── FREE WORKOUT VIEW ───────────────────────
  if (view === 'free') {
    const selectedLabel = FREE_LABELS.find(l => l.value === freeLabel)!
    return (
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setView('list')} className="text-blue-400 shrink-0">← Terug</button>
          <div>
            <h1 className="text-xl font-bold text-white">Vrije training</h1>
            <p className="text-xs text-gray-500">Logt los van je schema</p>
          </div>
        </div>

        {/* Label picker */}
        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-3">Type training</label>
          <div className="flex flex-col gap-2">
            {FREE_LABELS.map(l => (
              <button
                key={l.value}
                onClick={() => { playClick(); setFreeLabel(l.value) }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${freeLabel === l.value ? l.color : 'border-[#1f2937] text-gray-500'}`}
              >
                <span className="text-xl shrink-0">{l.icon}</span>
                <span>{l.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shift type */}
        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-2">Dienst</label>
          <div className="grid grid-cols-2 gap-2">
            {SHIFTS.map(s => (
              <button key={s.value} onClick={() => { playClick(); setFreeShift(s.value) }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${freeShift === s.value ? `${s.color} bg-white/5` : 'border-[#1f2937] text-gray-600'}`}>
                <span>{s.icon}</span><span className="text-xs">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy level */}
        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="block text-sm text-gray-400 mb-2">
            Energieniveau: <span className="text-blue-400 font-bold">{freeEnergyLevel}/10</span>
          </label>
          <input type="range" min={1} max={10} value={freeEnergyLevel}
            onChange={e => setFreeEnergyLevel(parseInt(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs text-gray-700 mt-1"><span>Uitgeput</span><span>Topfit</span></div>
        </div>

        {/* Exercise builder */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Oefeningen <span className="text-gray-600 font-normal">({freeExercises.length})</span></h2>
          </div>

          {freeExercises.map((ex, i) => (
            <div key={i} className="relative">
              <ExerciseCard
                exercise={ex}
                onChange={e => updateFreeExercise(i, e)}
                allSessions={allSessions}
                setHints={['8–12 reps']}
              />
              <button
                onClick={() => removeFreeExercise(i)}
                className="absolute top-3 right-14 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg"
              >
                Verwijder
              </button>
            </div>
          ))}

          {/* Add exercise input */}
          <div className="bg-[#111827] rounded-xl p-4 border border-blue-500/30 border-dashed">
            <label className="text-xs text-gray-500 block mb-2">Oefening toevoegen</label>
            <div className="flex gap-2">
              <input
                ref={freeNameRef}
                type="text"
                placeholder="Bijv. Bench Press, Pull-ups..."
                value={freeNewName}
                onChange={e => setFreeNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFreeExercise() } }}
                className="flex-1 bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
              />
              <button
                onClick={addFreeExercise}
                disabled={!freeNewName.trim()}
                className="bg-blue-500 text-white px-4 rounded-lg font-bold text-lg min-h-[44px] min-w-[44px] disabled:opacity-30 active:bg-blue-600"
              >
                +
              </button>
            </div>
            {freeExercises.length === 0 && (
              <p className="text-xs text-gray-700 mt-2">Typ een oefeningsnaam en druk op + om te beginnen</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="block text-sm text-gray-400 mb-2">Notities</label>
          <textarea
            placeholder={`Notities over de ${selectedLabel.icon} ${freeLabel}...`}
            value={freeNotes}
            onChange={e => setFreeNotes(e.target.value)}
            className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={saveFreeSession} disabled={saved || saving}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all min-h-[56px] ${
            saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : saving ? 'bg-blue-500/40 text-white/50'
            : 'btn-glow text-white'
          }`}
        >
          {saved ? `✓ ${selectedLabel.icon} Opgeslagen!` : saving ? 'Opslaan...' : `${selectedLabel.icon} ${freeLabel} opslaan`}
        </button>
      </div>
    )
  }

  // ─── ACTIVE SCHEMA WORKOUT ───────────────────
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
          <input type="range" min={1} max={10} value={activeSession.energyLevel}
            onChange={e => setActiveSession({ ...activeSession, energyLevel: parseInt(e.target.value) })} className="w-full" />
          <div className="flex justify-between text-xs text-gray-700 mt-1"><span>Uitgeput</span><span>Topfit</span></div>
        </div>

        {/* Shift type */}
        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="text-xs text-gray-500 block mb-2 uppercase tracking-wide font-semibold">Dienst</label>
          <div className="grid grid-cols-2 gap-2">
            {SHIFTS.map(s => (
              <button key={s.value} onClick={() => setActiveSession({ ...activeSession, shiftType: s.value })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${activeSession.shiftType === s.value ? `${s.color} bg-white/5` : 'border-[#1f2937] text-gray-600'}`}>
                <span>{s.icon}</span><span className="text-xs">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeSession.exercises.map((exercise, i) => (
          <ExerciseCard key={i} exercise={exercise} onChange={ex => updateExercise(i, ex)}
            allSessions={allSessions} currentSessionId={activeSession.id}
            setHints={getSetHints(activeDayIdx, exercise.name)} />
        ))}

        <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-[#1f2937]">
          <label className="block text-sm text-gray-400 mb-2">Sessie notities</label>
          <textarea placeholder="Hoe was de workout? Bijzonderheden..."
            value={activeSession.notes}
            onChange={e => setActiveSession({ ...activeSession, notes: e.target.value })}
            className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none" rows={3} />
        </div>

        <button onClick={saveSession} disabled={saved || saving}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all min-h-[56px] ${
            saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : saving ? 'bg-blue-500/40 text-white/50'
            : 'btn-glow text-white'
          }`}>
          {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Workout opslaan'}
        </button>
      </div>
    )
  }

  // ─── LIST VIEW ───────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Workout</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cycle dag {currentCycleDay} van 8</p>
        </div>
        <button onClick={() => setView('history')} className="text-sm text-blue-400 bg-blue-400/10 px-3 py-2 rounded-lg border border-blue-400/20 min-h-[44px]">
          Geschiedenis
        </button>
      </div>

      {/* Vrije / extra training button */}
      <button
        onClick={openFree}
        className="w-full mb-5 flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/5 text-left active:bg-purple-500/10 transition-all"
      >
        <span className="text-2xl">➕</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-purple-300">Vrije / extra training</p>
          <p className="text-xs text-gray-600">Onverwachte sessie, met trainingpartner, andere sport…</p>
        </div>
        <span className="text-purple-500 text-lg">›</span>
      </button>

      {loading && <div className="text-center py-10 text-gray-600"><p>Laden...</p></div>}

      {!loading && SCHEMA.map((day, idx) => {
        const isCurrent = day.day === currentCycleDay
        const isWorkout = day.type === 'workout'
        const isRun = day.type === 'run'

        // All sessions for this cycle day, sorted by date desc
        const daySessions = allSessions
          .filter(s => s.cycleDay === day.day)
          .sort((a, b) => b.date.localeCompare(a.date))

        const todayCount = todayCountByCycleDay[day.day] ?? 0
        const lastSession = daySessions[0]

        return (
          <div key={day.day} className={`rounded-xl p-4 mb-3 border transition-all ${isCurrent ? 'border-blue-500 bg-[#0d1929]' : 'border-[#1f2937] bg-[#111827]'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCurrent ? 'bg-blue-500 text-white' : 'bg-[#1f2937] text-gray-500'}`}>
                    Dag {day.day}
                  </span>
                  {isCurrent && <span className="text-xs text-blue-400 font-medium">← Vandaag</span>}
                  {day.type === 'rest' && <span className="text-xs text-emerald-400">🌿 Rust</span>}
                  {isRun && <span className="text-xs text-orange-400">🏃 Run</span>}
                  {/* Today's session count badge */}
                  {todayCount > 0 && (
                    <span className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      ✓ {todayCount}× gelogd vandaag
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white mt-1">{day.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{day.subtitle}</p>
                {lastSession && (
                  <p className="text-xs text-gray-700 mt-1">Laatste: {formatDate(lastSession.date)}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                <span className="text-xs text-gray-600">{day.calories} kcal</span>
                {isWorkout && (
                  <button
                    onClick={() => startWorkout(idx)}
                    className={`text-sm px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors ${
                      isCurrent ? 'bg-blue-500 text-white active:bg-blue-600' : 'bg-[#1f2937] text-gray-300 active:bg-[#2a3448]'
                    }`}
                  >
                    {todayCount > 0 ? '+ Sessie' : 'Start'}
                  </button>
                )}
                {isRun && (
                  <button
                    onClick={() => { setRunDate(todayStr()); setActiveDayIdx(idx); setView('run') }}
                    className={`text-sm px-4 py-2 rounded-lg font-medium min-h-[44px] transition-colors ${
                      isCurrent ? 'bg-orange-500 text-white active:bg-orange-600' : 'bg-[#1f2937] text-gray-300 active:bg-[#2a3448]'
                    }`}
                  >
                    Log Run
                  </button>
                )}
              </div>
            </div>

            {/* Expand: toon sessies van vandaag als er meer dan 1 is */}
            {todayCount > 1 && (
              <div className="mt-3 pt-3 border-t border-[#1a2535] space-y-1">
                <p className="text-xs text-gray-600 mb-1">Sessies vandaag:</p>
                {allSessions.filter(s => s.cycleDay === day.day && s.date === today).map((s, si) => (
                  <div key={s.id} className="flex items-center justify-between bg-[#0a1020] rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400">Sessie {si + 1} · ⚡ {s.energyLevel}/10 · {s.exercises.length} oef.</span>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 active:opacity-70">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Free workouts logged today */}
      {(todayCountByCycleDay[FREE_CYCLE_DAY] ?? 0) > 0 && (
        <div className="mt-2 mb-3">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Vrije trainingen vandaag</p>
          {allSessions
            .filter(s => s.cycleDay === FREE_CYCLE_DAY && s.date === today)
            .map(s => {
              const { label } = parseFreeLabel(s)
              const info = FREE_LABELS.find(l => l.value === label)
              return (
                <div key={s.id} className="flex items-center justify-between bg-[#111827] rounded-xl px-4 py-3 border border-purple-500/20 mb-2">
                  <div className="flex items-center gap-2">
                    <span>{info?.icon ?? '🏋️'}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{label}</p>
                      <p className="text-xs text-gray-600">{s.exercises.length} oefeningen · ⚡ {s.energyLevel}/10</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 active:opacity-70">🗑</button>
                </div>
              )
            })
          }
        </div>
      )}
    </div>
  )
}
