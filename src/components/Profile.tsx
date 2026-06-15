import { useState, useEffect } from 'react'
import { USER_PROFILE, START_WEIGHT, PHASE1_START_WEIGHT } from '../data/userProfile'
import { loadDailyLogs, loadWeeklyCheckIns, loadWorkouts, exportAllData } from '../utils/storage'
import type { DailyLog, WeeklyCheckIn, WorkoutSession } from '../types'
import Charts from './Charts'
import { calcWeightTrend } from '../utils/weightTrend'

function calcBMI(weightKg: number, heightCm: number) {
  const h = heightCm / 100
  return (weightKg / (h * h)).toFixed(1)
}

function getBMILabel(bmi: number) {
  if (bmi < 18.5) return { label: 'Ondergewicht', color: 'text-blue-400' }
  if (bmi < 25) return { label: 'Normaal gewicht', color: 'text-green-400' }
  if (bmi < 30) return { label: 'Overgewicht', color: 'text-yellow-400' }
  return { label: 'Obesitas', color: 'text-red-400' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function calcStreak(dailyLogs: DailyLog[], workouts: WorkoutSession[]): { current: number; longest: number } {
  const activeDays = new Set<string>()
  for (const l of dailyLogs) activeDays.add(l.date)
  for (const w of workouts) activeDays.add(w.date)

  const sorted = Array.from(activeDays).sort()
  if (sorted.length === 0) return { current: 0, longest: 0 }

  // Longest streak
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) { run++; if (run > longest) longest = run }
    else run = 1
  }

  // Current streak (working backward from today)
  const today = new Date().toISOString().split('T')[0]
  let current = 0
  let checkDate = new Date(today)
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (activeDays.has(dateStr)) {
      current++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }

  return { current, longest }
}

function statusColor(status: string) {
  if (status === 'on_track') return 'text-green-400'
  if (status === 'too_fast') return 'text-red-400'
  if (status === 'too_slow') return 'text-yellow-400'
  return 'text-gray-500'
}

function statusLabel(status: string) {
  if (status === 'on_track') return 'Op koers'
  if (status === 'too_fast') return 'Te snel (verlies spier)'
  if (status === 'too_slow') return 'Te langzaam'
  return 'Onvoldoende data'
}

export default function Profile() {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([])
  const [weeklyCheckIns, setWeeklyCheckIns] = useState<WeeklyCheckIn[]>([])
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([loadDailyLogs(), loadWeeklyCheckIns(), loadWorkouts()]).then(([logs, checkins, ws]) => {
      setDailyLogs(logs)
      setWeeklyCheckIns(checkins)
      setWorkouts(ws)
      setLoading(false)
    })
  }, [])

  const allWeights = [
    ...dailyLogs.filter(l => l.weight).map(l => ({ date: l.date, weight: l.weight! })),
    ...weeklyCheckIns.filter(c => c.weight).map(c => ({ date: c.date, weight: c.weight! })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const currentWeight = allWeights[0]?.weight ?? START_WEIGHT
  const weightChangePhase2 = currentWeight - START_WEIGHT
  const weightChangeTotal = currentWeight - PHASE1_START_WEIGHT

  const bmi = parseFloat(calcBMI(currentWeight, USER_PROFILE.heightCm))
  const bmiInfo = getBMILabel(bmi)
  const latestVO2 = weeklyCheckIns.find(c => c.vo2max)?.vo2max

  const trend = calcWeightTrend(dailyLogs, weeklyCheckIns)
  const streak = calcStreak(dailyLogs, workouts)

  // Latest body measurements
  const latestMeasurements = weeklyCheckIns
    .filter(ci => ci.waist || ci.hips || ci.chest || ci.upperArm)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  async function handleExport() {
    setExporting(true)
    await exportAllData()
    setExporting(false)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Profiel</h1>
        <p className="text-sm text-gray-500 mt-1">Persoonlijke statistieken</p>
      </div>

      {/* Identity card */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 rounded-xl p-5 mb-4 border border-blue-500/30">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-2xl shrink-0">
            💪
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{USER_PROFILE.name}</h2>
            <p className="text-gray-400 text-sm">{USER_PROFILE.age} jaar · {USER_PROFILE.heightCm} cm</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {USER_PROFILE.goals.map((g, i) => (
            <span key={i} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">{g}</span>
          ))}
        </div>
      </div>

      {/* Phase timeline */}
      <div className="mb-4 space-y-2">
        <div className="bg-[#111827] rounded-xl p-3 border border-[#1f2937] flex items-start gap-3">
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full shrink-0 mt-0.5">Fase 1</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 font-medium">Fullbody + 3× hardlopen</p>
            <p className="text-xs text-gray-600 mt-0.5">{formatDate(USER_PROFILE.phase1.startDate)} → {formatDate(USER_PROFILE.phase1.endDate)}</p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-xs text-gray-500">Start: <span className="text-white">{PHASE1_START_WEIGHT} kg</span></span>
              <span className="text-xs text-gray-500">VO2: <span className="text-orange-400">{USER_PROFILE.phase1.startVO2}</span></span>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1929] rounded-xl p-3 border border-blue-500/40 flex items-start gap-3">
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full shrink-0 mt-0.5">Fase 2</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">Upper/Lower Split · Actief</p>
            <p className="text-xs text-gray-600 mt-0.5">Gestart {formatDate(USER_PROFILE.phase2.startDate)}</p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-xs text-gray-500">Start: <span className="text-white">{START_WEIGHT} kg</span></span>
              {latestVO2 && <span className="text-xs text-gray-500">VO2: <span className="text-orange-400">{latestVO2}</span></span>}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 py-10">Laden...</p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Huidig gewicht</p>
              <p className="text-2xl font-bold text-white">{currentWeight} <span className="text-sm font-normal text-gray-500">kg</span></p>
              <div className="mt-1 space-y-0.5">
                <p className={`text-xs font-medium ${weightChangePhase2 < 0 ? 'text-green-400' : weightChangePhase2 > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  Fase 2: {weightChangePhase2 === 0 ? '—' : `${weightChangePhase2 > 0 ? '+' : ''}${weightChangePhase2.toFixed(1)} kg`}
                </p>
                <p className={`text-xs font-medium ${weightChangeTotal < 0 ? 'text-green-400' : weightChangeTotal > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  Totaal: {weightChangeTotal === 0 ? '—' : `${weightChangeTotal > 0 ? '+' : ''}${weightChangeTotal.toFixed(1)} kg`}
                </p>
              </div>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">BMI</p>
              <p className="text-2xl font-bold text-white">{bmi}</p>
              <p className={`text-sm font-medium mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>
            </div>

            {/* Streak card */}
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Actieve streak</p>
              <p className="text-2xl font-bold text-white">{streak.current} <span className="text-sm font-normal text-gray-500">dagen</span></p>
              <p className="text-xs text-gray-600 mt-1">Langste: {streak.longest} dagen</p>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Workouts gelogd</p>
              <p className="text-2xl font-bold text-white">{workouts.length}</p>
              {latestVO2 && <p className="text-xs text-orange-400 mt-1">VO2 Max: {latestVO2}</p>}
            </div>
          </div>

          {/* Weight loss rate & prognosis */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-4">
            <h3 className="font-semibold text-white mb-3">Gewichtsverlies prognose</h3>
            {trend.status === 'insufficient_data' ? (
              <p className="text-xs text-gray-600">Log meer gewicht om een trend te berekenen (minimaal 2 weken).</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Huidig tempo</span>
                  <span className={`text-sm font-bold ${trend.ratePerWeek! < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trend.ratePerWeek! > 0 ? '+' : ''}{trend.ratePerWeek} kg/week
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${statusColor(trend.status)}`}>{statusLabel(trend.status)}</span>
                </div>
                {trend.etaHigh && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ETA 80 kg</span>
                    <span className="text-sm text-amber-400">{trend.etaHigh}</span>
                  </div>
                )}
                {trend.etaLow && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ETA 77 kg</span>
                    <span className="text-sm text-green-400">{trend.etaLow}</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-[#1f2937]">
                  <p className="text-xs text-gray-600">Optimaal tempo: 0.5–1% lichaamsgewicht/week ({(currentWeight * 0.005).toFixed(1)}–{(currentWeight * 0.01).toFixed(1)} kg)</p>
                </div>
              </div>
            )}
          </div>

          {/* Streefgewicht */}
          <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Streefgewicht</h3>
              <span className="text-sm font-bold text-white">77–80 kg</span>
            </div>
            <div className="relative h-3 bg-[#1f2937] rounded-full overflow-hidden mb-2">
              {/* Progress bar from start (95.2) to goal (77) */}
              {(() => {
                const start = PHASE1_START_WEIGHT
                const goal = 77
                const total = start - goal
                const done = start - currentWeight
                const pct = Math.max(0, Math.min(100, (done / total) * 100))
                return (
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                )
              })()}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{PHASE1_START_WEIGHT} kg (start)</span>
              <span className={currentWeight > 80 ? 'text-yellow-400' : 'text-green-400'}>
                {currentWeight > 80 ? `${(currentWeight - 80).toFixed(1)} kg nog` : 'Doel bereikt!'}
              </span>
              <span>77 kg</span>
            </div>
          </div>

          {/* Body measurements */}
          {latestMeasurements && (
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-4">
              <h3 className="font-semibold text-white mb-3">Laatste omtrekken</h3>
              <div className="grid grid-cols-2 gap-3">
                {latestMeasurements.waist && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taille</span>
                    <span className="text-sm font-bold text-cyan-400">{latestMeasurements.waist} cm</span>
                  </div>
                )}
                {latestMeasurements.hips && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Heupen</span>
                    <span className="text-sm font-bold text-purple-400">{latestMeasurements.hips} cm</span>
                  </div>
                )}
                {latestMeasurements.chest && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Borst</span>
                    <span className="text-sm font-bold text-blue-400">{latestMeasurements.chest} cm</span>
                  </div>
                )}
                {latestMeasurements.upperArm && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Bovenarm</span>
                    <span className="text-sm font-bold text-pink-400">{latestMeasurements.upperArm} cm</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-700 mt-2">{formatDate(latestMeasurements.date)}</p>
            </div>
          )}

          {/* Charts */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Grafieken</h2>
            <Charts dailyLogs={dailyLogs} weeklyCheckIns={weeklyCheckIns} workoutSessions={workouts} />
          </div>
        </>
      )}

      {/* Export */}
      <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-4">
        <h3 className="font-semibold text-white mb-1">Data export</h3>
        <p className="text-xs text-gray-500 mb-3">Download alle data als JSON backup</p>
        <button
          onClick={handleExport} disabled={exporting}
          className="w-full bg-[#1f2937] text-gray-300 py-3 rounded-lg text-sm font-medium active:bg-[#2a3448] transition-colors min-h-[44px] flex items-center justify-center gap-2"
        >
          <span>⬇</span> {exporting ? 'Exporteren...' : 'JSON backup downloaden'}
        </button>
      </div>
    </div>
  )
}
