import { useState, useEffect, useRef } from 'react'
import type { WeeklyCheckIn as WeeklyCheckInType } from '../types'
import { saveWeeklyCheckIn, loadWeeklyCheckIns, deleteWeeklyCheckIn, generateId } from '../utils/storage'
import SwipeToDelete from './SwipeToDelete'

function getMostRecentSunday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function emptyForm(): WeeklyCheckInType {
  return { id: generateId(), date: getMostRecentSunday(), weight: null, vo2max: null, photos: [], notes: '', avgCalories: null }
}

export default function WeeklyCheckIn() {
  const [checkIns, setCheckIns] = useState<WeeklyCheckInType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<WeeklyCheckInType>(emptyForm)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWeeklyCheckIns().then(data => {
      setCheckIns(data)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    await saveWeeklyCheckIn(form)
    const data = await loadWeeklyCheckIns()
    setCheckIns(data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete(id: string) {
    await deleteWeeklyCheckIn(id)
    const data = await loadWeeklyCheckIns()
    setCheckIns(data)
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const readers: Promise<string>[] = Array.from(files).map(file =>
      new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target?.result as string)
        reader.readAsDataURL(file)
      })
    )
    Promise.all(readers).then(results => {
      setForm(f => ({ ...f, photos: [...f.photos, ...results] }))
    })
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wekelijkse Check-in</h1>
        <p className="text-sm text-gray-500 mt-1">Zondag evaluatie</p>
      </div>

      <div className="bg-[#111827] rounded-xl p-4 mb-6 border border-[#1f2937]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Check-in</h2>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="bg-[#1a2030] border border-[#2a3448] rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
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
            <label className="text-xs text-gray-500 block mb-1">VO2 Max</label>
            <input
              type="number" inputMode="decimal" step="0.1" placeholder="42.5"
              value={form.vo2max ?? ''}
              onChange={e => setForm({ ...form, vo2max: e.target.value === '' ? null : parseFloat(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Gem. calorieën die week (optioneel)</label>
            <input
              type="number" inputMode="numeric" placeholder="2650"
              value={form.avgCalories ?? ''}
              onChange={e => setForm({ ...form, avgCalories: e.target.value === '' ? null : parseInt(e.target.value) })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-2">Foto's (front, side, back)</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {form.photos.map((photo, i) => (
              <div key={i} className="relative">
                <img src={photo} alt={`Foto ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-[#2a3448]" />
                <button
                  onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, pi) => pi !== i) }))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-[#2a3448] rounded-lg flex flex-col items-center justify-center text-gray-600 active:border-blue-500"
            >
              <span className="text-2xl">+</span>
              <span className="text-xs mt-1">Foto</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 block mb-1">Notities / Reflectie</label>
          <textarea
            placeholder="Hoe was de week? Progressie, gevoel, aanpassingen..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
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
          {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Check-in opslaan'}
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 py-6">Laden...</p>
      ) : checkIns.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p className="text-4xl mb-3">📊</p>
          <p>Nog geen wekelijkse check-ins</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Archief</h2>
          {checkIns.map(ci => (
            <SwipeToDelete key={ci.id} onDelete={() => handleDelete(ci.id)}>
              <div
                className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] cursor-pointer active:bg-[#1a2030]"
                onClick={() => setForm(ci)}
              >
                <p className="font-medium text-white text-sm">{formatDate(ci.date)}</p>
                <div className="flex gap-4 mt-2 flex-wrap">
                  {ci.weight && <span className="text-sm font-bold text-blue-400">{ci.weight} kg</span>}
                  {ci.vo2max && <span className="text-sm text-orange-400">VO2: {ci.vo2max}</span>}
                  {ci.avgCalories && <span className="text-sm text-gray-400">🔥 {ci.avgCalories} kcal/dag</span>}
                </div>
                {ci.photos.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {ci.photos.slice(0, 3).map((p, i) => (
                      <img key={i} src={p} alt="" className="w-10 h-10 object-cover rounded" />
                    ))}
                    {ci.photos.length > 3 && <span className="text-xs text-gray-600 self-center ml-1">+{ci.photos.length - 3}</span>}
                  </div>
                )}
                {ci.notes && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{ci.notes}</p>}
              </div>
            </SwipeToDelete>
          ))}
          <p className="text-center text-xs text-gray-700 mt-2">Swipe naar links om te verwijderen • Tik om te bewerken</p>
        </div>
      )}
    </div>
  )
}
