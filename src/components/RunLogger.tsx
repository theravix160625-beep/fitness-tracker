import { useState, useEffect } from 'react'
import type { RunSession } from '../types'
import { saveRunSession, loadRunSessions, deleteRunSession, generateId } from '../utils/storage'

function todayStr() { return new Date().toISOString().split('T')[0] }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatPace(distKm: number, durMin: number): string {
  const paceMin = durMin / distKm
  const min = Math.floor(paceMin)
  const sec = Math.round((paceMin - min) * 60).toString().padStart(2, '0')
  return `${min}:${sec} /km`
}

const RUN_TYPES: { value: RunSession['type']; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  { value: 'tempo', label: 'Tempo', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  { value: 'interval', label: 'Interval', color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  { value: 'long', label: 'Long Run', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { value: 'other', label: 'Anders', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
]

function emptyRun(date = todayStr()): RunSession {
  return { id: generateId(), date, distanceKm: null, durationMin: null, heartRateAvg: null, feeling: 7, type: 'easy', notes: '' }
}

interface Props {
  defaultDate?: string
  onBack?: () => void
}

export default function RunLogger({ defaultDate, onBack }: Props) {
  const [runs, setRuns] = useState<RunSession[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<RunSession>(emptyRun(defaultDate))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showForm, setShowForm] = useState(!onBack)

  useEffect(() => {
    loadRunSessions().then(data => { setRuns(data); setLoading(false) })
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    await saveRunSession(form)
    const data = await loadRunSessions()
    setRuns(data)
    setSaving(false)
    setSaved(true)
    setShowForm(false)
    setForm(emptyRun(defaultDate))
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete(id: string) {
    await deleteRunSession(id)
    setRuns(await loadRunSessions())
  }

  const typeInfo = (type: RunSession['type']) => RUN_TYPES.find(t => t.value === type)!

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        {onBack && <button onClick={onBack} className="text-blue-400 shrink-0">← Terug</button>}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Runs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hardloopsessies bijhouden</p>
        </div>
        {!showForm && (
          <button onClick={() => { setForm(emptyRun(defaultDate)); setShowForm(true) }} className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg font-medium min-h-[44px]">
            + Log Run
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-[#111827] rounded-xl p-4 mb-6 border border-blue-500/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Run loggen</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="bg-[#1a2030] border border-[#2a3448] rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-xl">×</button>
            </div>
          </div>

          {/* Type selector */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-2">Type run</label>
            <div className="flex gap-2 flex-wrap">
              {RUN_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.type === t.value ? t.color : 'text-gray-500 bg-transparent border-[#2a3448]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Afstand (km)</label>
              <input
                type="number" inputMode="decimal" step="0.1" placeholder="5.0"
                value={form.distanceKm ?? ''}
                onChange={e => setForm({ ...form, distanceKm: e.target.value === '' ? null : parseFloat(e.target.value) })}
                className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Duur (minuten)</label>
              <input
                type="number" inputMode="numeric" placeholder="30"
                value={form.durationMin ?? ''}
                onChange={e => setForm({ ...form, durationMin: e.target.value === '' ? null : parseFloat(e.target.value) })}
                className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gem. hartslag (bpm)</label>
              <input
                type="number" inputMode="numeric" placeholder="145"
                value={form.heartRateAvg ?? ''}
                onChange={e => setForm({ ...form, heartRateAvg: e.target.value === '' ? null : parseInt(e.target.value) })}
                className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Gevoel: <span className="text-blue-400 font-bold">{form.feeling}/10</span></label>
              <input
                type="range" min={1} max={10} value={form.feeling}
                onChange={e => setForm({ ...form, feeling: parseInt(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
          </div>

          {form.distanceKm && form.durationMin && (
            <div className="mb-4 p-3 bg-[#0f1623] rounded-lg border border-[#1f2937] flex gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Tempo</p>
                <p className="text-sm font-bold text-white">{formatPace(form.distanceKm, form.durationMin)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Afstand</p>
                <p className="text-sm font-bold text-white">{form.distanceKm} km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Tijd</p>
                <p className="text-sm font-bold text-white">{Math.floor(form.durationMin / 60) > 0 ? `${Math.floor(form.durationMin / 60)}u ` : ''}{form.durationMin % 60}min</p>
              </div>
            </div>
          )}

          <textarea
            placeholder="Notities over de run..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full mb-4 bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
          />

          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full py-3 rounded-xl font-bold text-sm min-h-[48px] ${saved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : saving ? 'bg-blue-500/50 text-white/60' : 'bg-blue-500 text-white active:bg-blue-600'}`}
          >
            {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Run opslaan'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-600 py-6">Laden...</p>
      ) : runs.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p className="text-4xl mb-3">🏃</p>
          <p>Log je eerste run →</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Run historie</h2>
          {runs.map(run => {
            const t = typeInfo(run.type)
            return (
              <div key={run.id} className="bg-[#111827] rounded-xl border border-[#1f2937] mb-3 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${t.color}`}>{t.label}</span>
                        <span className="text-xs text-gray-500">{formatDate(run.date)}</span>
                      </div>
                      <div className="flex gap-4 flex-wrap mt-1">
                        {run.distanceKm && <span className="text-sm font-bold text-white">🏃 {run.distanceKm} km</span>}
                        {run.durationMin && <span className="text-sm text-gray-400">⏱ {run.durationMin} min</span>}
                        {run.distanceKm && run.durationMin && (
                          <span className="text-sm text-blue-400">{formatPace(run.distanceKm, run.durationMin)}</span>
                        )}
                        {run.heartRateAvg && <span className="text-sm text-red-400">♥ {run.heartRateAvg} bpm</span>}
                      </div>
                      {run.notes && <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">{run.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <span className="text-xs text-gray-500">⚡ {run.feeling}/10</span>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-[#1f2937]">
                  <button onClick={() => { setForm(run); setShowForm(true) }} className="flex-1 py-2.5 text-xs text-blue-400 active:bg-[#1a2030]">✏️ Bewerken</button>
                  <div className="w-px bg-[#1f2937]" />
                  <button onClick={() => handleDelete(run.id)} className="flex-1 py-2.5 text-xs text-red-400 active:bg-[#1a2030]">🗑️ Verwijderen</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
