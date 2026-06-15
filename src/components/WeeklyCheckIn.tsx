import { useState, useEffect, useRef } from 'react'
import type { WeeklyCheckIn as WeeklyCheckInType, ShiftType } from '../types'
import { saveWeeklyCheckIn, loadWeeklyCheckIns, deleteWeeklyCheckIn, generateId } from '../utils/storage'
import { playSave, playDelete } from '../utils/sounds'

const SHIFTS: { value: ShiftType; label: string; icon: string; color: string }[] = [
  { value: 'none',    label: 'Geen dienst', icon: '🌤',  color: 'border-gray-600 text-gray-400' },
  { value: 'day',     label: 'Dagdienst',   icon: '☀️',  color: 'border-amber-500 text-amber-400' },
  { value: 'evening', label: 'Avonddienst', icon: '🌆',  color: 'border-orange-500 text-orange-400' },
  { value: 'night',   label: 'Nachtdienst', icon: '🌙',  color: 'border-indigo-500 text-indigo-400' },
]

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
  return {
    id: generateId(), date: getMostRecentSunday(), weight: null, vo2max: null,
    photos: [], notes: '', avgCalories: null,
    waist: null, hips: null, chest: null, upperArm: null, shiftType: 'none',
  }
}

function MeasurementBadge({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  if (!value) return null
  return (
    <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937] text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-600">{unit}</p>
    </div>
  )
}

function CheckInDetail({ ci, onClose, onEdit }: { ci: WeeklyCheckInType; onClose: () => void; onEdit: () => void }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const hasMeasurements = ci.waist || ci.hips || ci.chest || ci.upperArm

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-blue-400 text-sm">← Terug</button>
        <h1 className="text-lg font-bold text-white flex-1 truncate">{formatDate(ci.date)}</h1>
        <button onClick={onEdit} className="text-sm text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20">
          Bewerken
        </button>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {ci.weight && (
          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937] text-center">
            <p className="text-xs text-gray-500 mb-1">Gewicht</p>
            <p className="text-lg font-bold text-blue-400">{ci.weight}</p>
            <p className="text-xs text-gray-600">kg</p>
          </div>
        )}
        {ci.vo2max && (
          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937] text-center">
            <p className="text-xs text-gray-500 mb-1">VO2 Max</p>
            <p className="text-lg font-bold text-orange-400">{ci.vo2max}</p>
          </div>
        )}
        {ci.avgCalories && (
          <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937] text-center">
            <p className="text-xs text-gray-500 mb-1">Calorieën</p>
            <p className="text-lg font-bold text-green-400">{ci.avgCalories}</p>
            <p className="text-xs text-gray-600">kcal/dag</p>
          </div>
        )}
      </div>

      {/* Body measurements */}
      {hasMeasurements && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Lichaamsomtrekken</h2>
          <div className="grid grid-cols-2 gap-3">
            <MeasurementBadge label="Taille" value={ci.waist} unit="cm" color="text-cyan-400" />
            <MeasurementBadge label="Heupen" value={ci.hips} unit="cm" color="text-purple-400" />
            <MeasurementBadge label="Borst" value={ci.chest} unit="cm" color="text-blue-400" />
            <MeasurementBadge label="Bovenarm" value={ci.upperArm} unit="cm" color="text-pink-400" />
          </div>
        </div>
      )}

      {/* Photos */}
      {ci.photos.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Foto's</h2>
          <div className="grid grid-cols-3 gap-2">
            {ci.photos.map((photo, i) => (
              <button key={i} onClick={() => setSelectedPhoto(photo)} className="aspect-square">
                <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-[#1f2937]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {ci.notes && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h2 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Notities</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ci.notes}</p>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-6 right-6 text-white text-3xl">×</button>
        </div>
      )}
    </div>
  )
}

export default function WeeklyCheckIn() {
  const [checkIns, setCheckIns] = useState<WeeklyCheckInType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<WeeklyCheckInType>(emptyForm)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [detailItem, setDetailItem] = useState<WeeklyCheckInType | null>(null)
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWeeklyCheckIns().then(data => { setCheckIns(data); setLoading(false) })
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError(null)
    const err = await saveWeeklyCheckIn(form)
    if (err) { setError(err); setSaving(false); return }
    const data = await loadWeeklyCheckIns()
    setCheckIns(data)
    setSaving(false)
    setSaved(true)
    setShowForm(false)
    playSave()
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete(id: string) {
    playDelete()
    await deleteWeeklyCheckIn(id)
    setCheckIns(await loadWeeklyCheckIns())
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
    Promise.all(readers).then(results => setForm(f => ({ ...f, photos: [...f.photos, ...results] })))
  }

  function openDetail(ci: WeeklyCheckInType) { setDetailItem(ci); setView('detail') }
  function openEdit(ci: WeeklyCheckInType) { setForm(ci); setView('list'); setShowForm(true) }

  if (view === 'detail' && detailItem) {
    return <CheckInDetail ci={detailItem} onClose={() => setView('list')} onEdit={() => openEdit(detailItem)} />
  }

  const numField = (label: string, placeholder: string, value: number | null, onChange: (v: number | null) => void, inputMode: 'decimal' | 'numeric' = 'decimal', step = '0.1') => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="number" inputMode={inputMode} step={step} placeholder={placeholder}
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
        className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
      />
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Wekelijkse Check-in</h1>
          <p className="text-sm text-gray-500 mt-1">Zondag evaluatie</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setShowForm(true) }} className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg font-medium min-h-[44px]">
          + Nieuw
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111827] rounded-xl p-4 mb-6 border border-blue-500/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{checkIns.find(c => c.id === form.id) ? 'Bewerken' : 'Nieuwe check-in'}</h2>
            <div className="flex items-center gap-3">
              <input
                type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="bg-[#1a2030] border border-[#2a3448] rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-xl">×</button>
            </div>
          </div>

          {/* Dienst */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-2 uppercase tracking-wide font-semibold">Dienst</label>
            <div className="grid grid-cols-2 gap-2">
              {SHIFTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, shiftType: s.value }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] ${
                    form.shiftType === s.value ? `${s.color} bg-white/5` : 'border-[#1f2937] text-gray-600'
                  }`}
                >
                  <span>{s.icon}</span><span className="text-xs">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gewicht & VO2 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {numField('Gewicht (kg)', '91.6', form.weight, v => setForm({ ...form, weight: v }))}
            {numField('VO2 Max', '42.5', form.vo2max, v => setForm({ ...form, vo2max: v }))}
            <div className="col-span-2">
              {numField('Gem. calorieën (optioneel)', '2650', form.avgCalories, v => setForm({ ...form, avgCalories: v ? Math.round(v) : null }), 'numeric', '1')}
            </div>
          </div>

          {/* Body measurements */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Lichaamsomtrekken (cm) — optioneel</p>
            <div className="grid grid-cols-2 gap-3">
              {numField('Taille (cm)', '85', form.waist, v => setForm({ ...form, waist: v }))}
              {numField('Heupen (cm)', '100', form.hips, v => setForm({ ...form, hips: v }))}
              {numField('Borst (cm)', '105', form.chest, v => setForm({ ...form, chest: v }))}
              {numField('Bovenarm (cm)', '35', form.upperArm, v => setForm({ ...form, upperArm: v }))}
            </div>
          </div>

          {/* Foto's */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-2">Foto's</label>
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
              <button onClick={() => fileRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-[#2a3448] rounded-lg flex flex-col items-center justify-center text-gray-600 active:border-blue-500">
                <span className="text-2xl">+</span>
                <span className="text-xs mt-1">Foto</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-1">Notities / Reflectie</label>
            <textarea
              placeholder="Hoe was de week?"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#0f1623] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-blue-500 resize-none"
              rows={4}
            />
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">Fout: {error}</p>
            </div>
          )}

          <button
            onClick={handleSave} disabled={saving || saved}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all min-h-[48px] ${
              saved ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : saving ? 'bg-blue-500/50 text-white/60'
              : 'bg-blue-500 text-white active:bg-blue-600'
            }`}
          >
            {saved ? '✓ Opgeslagen!' : saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-600 py-6">Laden...</p>
      ) : checkIns.length === 0 ? (
        <div className="text-center py-10 text-gray-600">
          <p className="text-4xl mb-3">📊</p>
          <p>Nog geen wekelijkse check-ins</p>
          <button onClick={() => { setForm(emptyForm()); setShowForm(true) }} className="mt-4 text-blue-400 text-sm">
            Voeg je eerste check-in toe →
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Archief</h2>
          {checkIns.map(ci => (
            <div key={ci.id} className="bg-[#111827] rounded-xl border border-[#1f2937] mb-3 overflow-hidden">
              <button className="w-full p-4 text-left active:bg-[#1a2030] transition-colors" onClick={() => openDetail(ci)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{formatDate(ci.date)}</p>
                    <div className="flex gap-3 mt-1.5 flex-wrap">
                      {ci.weight && <span className="text-sm font-bold text-blue-400">{ci.weight} kg</span>}
                      {ci.vo2max && <span className="text-sm text-orange-400">VO2: {ci.vo2max}</span>}
                      {ci.avgCalories && <span className="text-sm text-gray-500">🔥 {ci.avgCalories} kcal</span>}
                      {ci.waist && <span className="text-xs text-cyan-500">taille: {ci.waist} cm</span>}
                    </div>
                    {ci.photos.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {ci.photos.slice(0, 3).map((p, i) => (
                          <img key={i} src={p} alt="" className="w-10 h-10 object-cover rounded-lg" />
                        ))}
                        {ci.photos.length > 3 && <span className="text-xs text-gray-600 self-center ml-1">+{ci.photos.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 text-lg ml-2">›</span>
                </div>
              </button>
              <div className="flex border-t border-[#1f2937]">
                <button onClick={() => openEdit(ci)} className="flex-1 py-2.5 text-xs text-blue-400 active:bg-[#1a2030]">✏️ Bewerken</button>
                <div className="w-px bg-[#1f2937]" />
                <button onClick={() => handleDelete(ci.id)} className="flex-1 py-2.5 text-xs text-red-400 active:bg-[#1a2030]">🗑️ Verwijderen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
