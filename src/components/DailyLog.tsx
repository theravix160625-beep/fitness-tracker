import { useState, useEffect } from 'react'
import type { DailyLog as DailyLogType } from '../types'
import { saveDailyLog, loadDailyLogs, deleteDailyLog, generateId } from '../utils/storage'
import SwipeToDelete from './SwipeToDelete'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function emptyForm(date: string): DailyLogType {
  return { id: generateId(), date, weight: null, sleep: null, sleepQuality: null, steps: null, notes: '' }
}

export default function DailyLog() {
  const today = todayStr()
  const [logs, setLogs] = useState<DailyLogType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<DailyLogType>(emptyForm(today))

  useEffect(() => {
    loadDailyLogs().then(data => {
      setLogs(data)
      const existing = data.find(l => l.date === today)
      if (existing) setForm(existing)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    await saveDailyLog(form)
    const data = await loadDailyLogs()
    setLogs(data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete(id: string) {
    await deleteDailyLog(id)
    const data = await loadDailyLogs()
    setLogs(data)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dagboek</h1>
        <p className="text-sm text-gray-500 mt-1">Dagelijkse check-in</p>
      </div>

      <div className="bg-[#111827] rounded-xl p-4 mb-6 border border-[#1f2937]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Vandaag</h2>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="bg-[#1a2030] border border-[#2a3448] rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Gewicht (kg)</label>
            <input
              type="number" inputMode="decimal" step="0.1" placeholder="91.6"
              value={form.weight ?? ''}
              onChange={e => setForm({ ...form, weight: e.target.value === '' ? null : parseFloat(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Slaap (uren)</label>
            <input
              type="number" inputMode="decimal" step="0.5" placeholder="7.5"
              value={form.sleep ?? ''}
              onChange={e => setForm({ ...form, sleep: e.target.value === '' ? null : parseFloat(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Slaapkwaliteit (1–10)</label>
            <input
              type="number" inputMode="numeric" min={1} max={10} placeholder="8"
              value={form.sleepQuality ?? ''}
              onChange={e => setForm({ ...form, sleepQuality: e.target.value === '' ? null : parseInt(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Stappen</label>
            <input
              type="number" inputMode="numeric" placeholder="10000"
              value={form.steps ?? ''}
              onChange={e => setForm({ ...form, steps: e.target.value === '' ? null : parseInt(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-1">Notities</label>
          <textarea
            placeholder="Hoe voel je je vandaag?"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all min-h-[48px] ${
            saved ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : saving ? 'bg-blue-500/50 text-white/60'
            : 'bg-blue-500 text-white active:bg-blue-600'
          }`}
        >
          {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 py-6">Laden...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p className="text-4xl mb-3">📓</p>
          <p>Log je eerste dagboekentry →</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Eerdere entries</h2>
          {logs.map(log => (
            <SwipeToDelete key={log.id} onDelete={() => handleDelete(log.id)}>
              <div
                className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] cursor-pointer active:bg-[#1a2030]"
                onClick={() => setForm(log)}
              >
                <div className="flex items-start justify-between">
                  <p className="font-medium text-white text-sm">{formatDate(log.date)}</p>
                  {log.weight && <span className="text-sm font-bold text-blue-400">{log.weight} kg</span>}
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  {log.sleep && <span className="text-xs text-gray-500">😴 {log.sleep}u</span>}
                  {log.sleepQuality && <span className="text-xs text-gray-500">⭐ {log.sleepQuality}/10</span>}
                  {log.steps && <span className="text-xs text-gray-500">👟 {log.steps.toLocaleString('nl-NL')}</span>}
                </div>
                {log.notes && <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">{log.notes}</p>}
              </div>
            </SwipeToDelete>
          ))}
          <p className="text-center text-xs text-gray-700 mt-2">Swipe naar links om te verwijderen • Tik om te bewerken</p>
        </div>
      )}
    </div>
  )
}
