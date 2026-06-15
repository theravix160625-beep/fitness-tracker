import { useState, useEffect, useRef } from 'react'
import type { DailyLog as DailyLogType, ShiftType } from '../types'
import { saveDailyLog, loadDailyLogs, deleteDailyLog, generateId } from '../utils/storage'
import { playSave, playDelete, playClick, playMilestone } from '../utils/sounds'
import { launchConfetti } from '../utils/confetti'
import { PHASE1_START_WEIGHT } from '../data/userProfile'

const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '💪']
const MOOD_LABELS = ['Uitgeput', 'Matig', 'Oké', 'Goed', 'Top!']
const MOOD_COLORS = ['text-gray-500', 'text-yellow-600', 'text-yellow-400', 'text-green-400', 'text-emerald-400']

const SHIFTS: { value: ShiftType; label: string; icon: string; color: string }[] = [
  { value: 'none',    label: 'Geen dienst', icon: '🌤',  color: 'border-gray-600 text-gray-400' },
  { value: 'day',     label: 'Dagdienst',   icon: '☀️',  color: 'border-amber-500 text-amber-400' },
  { value: 'evening', label: 'Avonddienst', icon: '🌆',  color: 'border-orange-500 text-orange-400' },
  { value: 'night',   label: 'Nachtdienst', icon: '🌙',  color: 'border-indigo-500 text-indigo-400' },
]

const MILESTONES = [
  { kg: PHASE1_START_WEIGHT - 3,  label: 'Min 3 kg!',      icon: '🔥', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/40 text-orange-300' },
  { kg: PHASE1_START_WEIGHT - 5,  label: 'Min 5 kg!',      icon: '🔥🔥', color: 'from-orange-500/20 to-red-600/10 border-orange-400/40 text-orange-300' },
  { kg: PHASE1_START_WEIGHT - 10, label: 'Min 10 kg!',     icon: '🏆', color: 'from-yellow-500/20 to-amber-600/10 border-yellow-500/40 text-yellow-300' },
  { kg: PHASE1_START_WEIGHT - 15, label: 'Min 15 kg! Bijna op doel!', icon: '🎯', color: 'from-green-500/20 to-emerald-600/10 border-green-500/40 text-green-300' },
  { kg: 77, label: 'DOEL BEREIKT! 77 kg!', icon: '🏆🎉', color: 'from-purple-500/20 to-blue-600/10 border-purple-500/40 text-purple-300' },
]

function todayStr() { return new Date().toISOString().split('T')[0] }

function offsetDateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function emptyForm(date: string): DailyLogType {
  return { id: generateId(), date, weight: null, sleep: null, sleepQuality: null, steps: null, notes: '', mood: null, shiftType: 'none' }
}

// Completion ring component
function CompletionRing({ pct }: { pct: number }) {
  const size = 88
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const color = pct >= 1 ? '#10b981' : pct >= 0.6 ? '#3b82f6' : pct > 0 ? '#8b5cf6' : '#374151'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="ring-transition"
      />
    </svg>
  )
}

// Readiness card based on sleep
function ReadinessCard({ log }: { log: DailyLogType | undefined }) {
  if (!log) return (
    <div className="flex-1 bg-[#0f1623] rounded-xl p-3 border border-[#1f2937] flex items-center gap-2">
      <span className="text-2xl">📊</span>
      <div>
        <p className="text-xs text-gray-500 font-medium">Gereedheid</p>
        <p className="text-xs text-gray-600">Log gisteren voor inzicht</p>
      </div>
    </div>
  )
  const { sleep, sleepQuality } = log
  let emoji = '❓', label = 'Onbekend', sub = '', colorClass = 'text-gray-400', bgClass = 'border-[#1f2937]'
  if (sleep && sleepQuality) {
    if (sleep >= 7.5 && sleepQuality >= 7) {
      emoji = '💪'; label = 'Klaar voor training'; sub = 'Optimaal herstel'; colorClass = 'text-emerald-400'; bgClass = 'border-emerald-500/30'
    } else if (sleep >= 6 && sleepQuality >= 5) {
      emoji = '🟡'; label = 'Train op gevoel'; sub = 'Normaal herstel'; colorClass = 'text-yellow-400'; bgClass = 'border-yellow-500/30'
    } else {
      emoji = '😴'; label = 'Prioriteit: herstel'; sub = 'Weinig slaap gisteren'; colorClass = 'text-orange-400'; bgClass = 'border-orange-500/30'
    }
  } else if (sleep) {
    emoji = sleep >= 7 ? '😊' : '😴'
    label = sleep >= 7 ? 'Goed geslapen' : 'Weinig geslapen'
    sub = `${sleep} uur slaap`
    colorClass = sleep >= 7 ? 'text-green-400' : 'text-orange-400'
    bgClass = sleep >= 7 ? 'border-green-500/30' : 'border-orange-500/30'
  }
  return (
    <div className={`flex-1 bg-[#0f1623] rounded-xl p-3 border ${bgClass} flex items-center gap-2`}>
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${colorClass}`}>{label}</p>
        {sub && <p className="text-xs text-gray-600 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// Mini calendar (last 5 weeks)
function MiniCalendar({ logs }: { logs: DailyLogType[] }) {
  const today = todayStr()
  const logMap = new Map(logs.map(l => [l.date, l]))
  const days: string[] = []
  for (let i = 34; i >= 0; i--) days.push(offsetDateStr(-i))

  const dayLabels = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z']

  return (
    <div className="bg-[#0d1320] rounded-xl p-4 border border-[#1f2937]">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">Activiteit — 5 weken</p>
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {dayLabels.map((d, i) => (
          <p key={i} className="text-center text-[9px] text-gray-700 font-medium">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(date => {
          const log = logMap.get(date)
          const isToday = date === today
          const isFuture = date > today
          let bg = 'bg-[#1a2030]'
          if (!isFuture) {
            if (log?.weight && log?.sleep) bg = 'bg-emerald-500'
            else if (log?.weight || log?.sleep) bg = 'bg-blue-500'
            else if (log) bg = 'bg-purple-500/60'
          }
          return (
            <div
              key={date}
              title={date}
              className={`aspect-square rounded-md ${bg} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0d1320]' : ''} ${isFuture ? 'opacity-20' : ''}`}
            />
          )
        })}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        <span className="text-[10px] text-gray-600 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Alles gelogd</span>
        <span className="text-[10px] text-gray-600 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Deels</span>
        <span className="text-[10px] text-gray-600 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1a2030] inline-block" /> Niets</span>
      </div>
    </div>
  )
}

export default function DailyLog() {
  const today = todayStr()
  const [logs, setLogs] = useState<DailyLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<DailyLogType>(emptyForm(today))
  const [milestone, setMilestone] = useState<typeof MILESTONES[0] | null>(null)
  const [activeMoodBtn, setActiveMoodBtn] = useState<number | null>(null)
  const moodRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadDailyLogs().then(data => {
      setLogs(data)
      const existing = data.find(l => l.date === today)
      if (existing) setForm(existing)
      setLoading(false)
    })
  }, [])

  // Completion %
  const filled = [form.weight, form.sleep, form.sleepQuality, form.steps, form.mood, form.shiftType !== 'none' ? 1 : null].filter(v => v != null).length
  const completionPct = filled / 6

  // Yesterday's log for readiness
  const yesterday = offsetDateStr(-1)
  const yesterdayLog = logs.find(l => l.date === yesterday)

  // Week-on-week weight comparison
  const thisWeekWeights = logs.filter(l => l.weight && l.date >= offsetDateStr(-6) && l.date <= today).map(l => l.weight!)
  const lastWeekWeights = logs.filter(l => l.weight && l.date >= offsetDateStr(-13) && l.date <= offsetDateStr(-7)).map(l => l.weight!)
  const thisWeekAvg = thisWeekWeights.length ? thisWeekWeights.reduce((a, b) => a + b, 0) / thisWeekWeights.length : null
  const lastWeekAvg = lastWeekWeights.length ? lastWeekWeights.reduce((a, b) => a + b, 0) / lastWeekWeights.length : null
  const weekDelta = thisWeekAvg && lastWeekAvg ? parseFloat((thisWeekAvg - lastWeekAvg).toFixed(1)) : null

  async function handleSave() {
    if (saving) return
    setSaving(true)

    // Milestone check
    if (form.weight) {
      const prevWeights = logs.filter(l => l.weight && l.id !== form.id).map(l => l.weight!)
      const prevLow = prevWeights.length ? Math.min(...prevWeights) : Infinity
      const isNewLow = form.weight < prevLow

      const hitMilestone = [...MILESTONES].reverse().find(m => form.weight! <= m.kg && (prevLow > m.kg || prevWeights.length === 0))

      if (hitMilestone) {
        setMilestone(hitMilestone)
        playMilestone()
        launchConfetti()
        setTimeout(() => setMilestone(null), 5000)
      } else if (isNewLow && prevWeights.length > 0) {
        playMilestone()
        launchConfetti(0.5)
      } else {
        playSave()
      }
    } else {
      playSave()
    }

    await saveDailyLog(form)
    const data = await loadDailyLogs()
    setLogs(data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDelete(id: string) {
    playDelete()
    await deleteDailyLog(id)
    const data = await loadDailyLogs()
    setLogs(data)
    if (form.id === id) setForm(emptyForm(today))
  }

  function setMood(v: number) {
    playClick()
    setActiveMoodBtn(v)
    setForm(f => ({ ...f, mood: v }))
    setTimeout(() => setActiveMoodBtn(null), 200)
  }

  function setShift(v: ShiftType) {
    playClick()
    setForm(f => ({ ...f, shiftType: v }))
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-6 pb-5 mb-2">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent" />
        <h1 className="text-2xl font-bold gradient-text relative">Dagboek</h1>
        <p className="text-sm text-gray-500 mt-0.5 relative">Dagelijkse check-in</p>
      </div>

      <div className="px-4">
        {/* Milestone banner */}
        {milestone && (
          <div className={`mb-4 p-4 rounded-xl border bg-gradient-to-br ${milestone.color} milestone-enter flex items-center gap-3`}>
            <span className="text-3xl">{milestone.icon}</span>
            <div>
              <p className="font-bold text-base">{milestone.label}</p>
              <p className="text-xs opacity-70">Geweldig werk! Ga zo door 🎯</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-[#0d1320] rounded-2xl border border-[#1f2937] mb-5 overflow-hidden card-glow-blue">
          {/* Ring + readiness header */}
          <div className="p-4 border-b border-[#1a2535]">
            <div className="flex items-center gap-4">
              {/* Completion ring */}
              <div className="relative shrink-0">
                <CompletionRing pct={completionPct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-white">{Math.round(completionPct * 100)}%</p>
                  <p className="text-[9px] text-gray-600">ingevuld</p>
                </div>
              </div>
              <ReadinessCard log={yesterdayLog} />
            </div>

            {/* Week comparison */}
            {weekDelta !== null && (
              <div className="mt-3 flex items-center justify-between bg-[#111827] rounded-lg px-3 py-2 border border-[#1a2535]">
                <span className="text-xs text-gray-500">Deze week vs vorige week</span>
                <span className={`text-sm font-bold ${weekDelta < 0 ? 'text-emerald-400' : weekDelta > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {weekDelta > 0 ? '+' : ''}{weekDelta} kg
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            {/* Date */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">
                {form.date === today ? 'Vandaag' : formatDate(form.date)}
              </p>
              <input
                type="date" value={form.date}
                onChange={e => {
                  const existing = logs.find(l => l.date === e.target.value)
                  setForm(existing ?? emptyForm(e.target.value))
                }}
                className="bg-[#1a2030] border border-[#2a3448] rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Gewicht (kg)', key: 'weight', mode: 'decimal', step: '0.1', ph: '91.6', type: 'float' },
                { label: 'Slaap (uren)', key: 'sleep', mode: 'decimal', step: '0.5', ph: '7.5', type: 'float' },
                { label: 'Slaapkwaliteit (1–10)', key: 'sleepQuality', mode: 'numeric', step: '1', ph: '8', type: 'int' },
                { label: 'Stappen', key: 'steps', mode: 'numeric', step: '1', ph: '10000', type: 'int' },
              ].map(({ label, key, mode, step, ph, type }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type="number"
                    inputMode={mode as 'decimal' | 'numeric'}
                    step={step}
                    placeholder={ph}
                    value={(form as any)[key] ?? ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      [key]: e.target.value === '' ? null : type === 'int' ? parseInt(e.target.value) : parseFloat(e.target.value)
                    }))}
                    className="w-full bg-[#0a0f1a] border border-[#1f2937] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px] transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Mood */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-2 uppercase tracking-wide font-semibold">Stemming</label>
              <div ref={moodRef} className="flex gap-2 justify-between">
                {MOOD_EMOJIS.map((emoji, i) => {
                  const val = i + 1
                  const isSelected = form.mood === val
                  const isPopping = activeMoodBtn === val
                  return (
                    <button
                      key={val}
                      onClick={() => setMood(val)}
                      className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all ${isPopping ? 'mood-pop' : ''} ${
                        isSelected
                          ? `border-blue-500 bg-blue-500/15 ${MOOD_COLORS[i]}`
                          : 'border-[#1f2937] bg-[#0a0f1a] text-gray-600'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[9px] mt-1 font-medium">{MOOD_LABELS[i]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shift type */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-2 uppercase tracking-wide font-semibold">Dienst</label>
              <div className="grid grid-cols-2 gap-2">
                {SHIFTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setShift(s.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${
                      form.shiftType === s.value
                        ? `${s.color} bg-white/5`
                        : 'border-[#1f2937] text-gray-600 bg-[#0a0f1a]'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="text-xs">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">Notities</label>
              <textarea
                placeholder="Hoe voel je je vandaag?"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#0a0f1a] border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                rows={3}
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all min-h-[52px] ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40'
                  : saving
                  ? 'bg-blue-500/40 text-white/50'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white btn-glow'
              }`}
            >
              {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        {!loading && <MiniCalendar logs={logs} />}

        {/* History */}
        {loading ? (
          <div className="mt-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl shimmer" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-600 mt-5">
            <p className="text-4xl mb-3">📓</p>
            <p>Log je eerste dagboekentry hierboven</p>
          </div>
        ) : (
          <div className="mt-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest">Eerdere entries</h2>
            {logs.slice(0, 30).map(log => {
              const shift = SHIFTS.find(s => s.value === (log.shiftType ?? 'none'))
              return (
                <div
                  key={log.id}
                  className="bg-[#0d1320] rounded-xl border border-[#1f2937] mb-2 overflow-hidden"
                >
                  <button
                    className="w-full p-3.5 text-left active:bg-[#1a2535] transition-colors"
                    onClick={() => setForm(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white text-sm">{formatDate(log.date)}</p>
                          {shift && shift.value !== 'none' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border ${shift.color} border-opacity-40`}>
                              {shift.icon} {shift.label}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1.5 flex-wrap items-center">
                          {log.weight && <span className="text-sm font-bold text-blue-400">{log.weight} kg</span>}
                          {log.sleep && <span className="text-xs text-gray-500">😴 {log.sleep}u</span>}
                          {log.sleepQuality && <span className="text-xs text-gray-500">⭐ {log.sleepQuality}/10</span>}
                          {log.steps && <span className="text-xs text-gray-500">👟 {log.steps.toLocaleString('nl-NL')}</span>}
                          {log.mood && <span className="text-sm">{MOOD_EMOJIS[(log.mood ?? 1) - 1]}</span>}
                        </div>
                        {log.notes && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{log.notes}</p>}
                      </div>
                    </div>
                  </button>
                  <div className="flex border-t border-[#1a2535]">
                    <button
                      onClick={() => setForm(log)}
                      className="flex-1 py-2.5 text-xs text-blue-400 active:bg-[#1a2535]"
                    >✏️ Bewerken</button>
                    <div className="w-px bg-[#1a2535]" />
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex-1 py-2.5 text-xs text-red-400 active:bg-[#1a2535]"
                    >🗑️ Verwijderen</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
