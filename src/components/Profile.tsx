import { useState, useEffect } from 'react'
import { USER_PROFILE, START_WEIGHT, PHASE1_START_WEIGHT } from '../data/userProfile'
import { loadDailyLogs, loadWeeklyCheckIns, loadWorkouts, exportAllData } from '../utils/storage'
import type { DailyLog, WeeklyCheckIn, WorkoutSession } from '../types'
import Charts from './Charts'

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

  // Current weight: meest recente uit dagboek of check-in
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
            <span key={i} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
              {g}
            </span>
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

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Streefgewicht</p>
              <p className="text-2xl font-bold text-white">77–80 <span className="text-sm font-normal text-gray-500">kg</span></p>
              <p className={`text-xs mt-1 ${currentWeight - 80 > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {currentWeight > 80 ? `Nog ${(currentWeight - 80).toFixed(1)} kg te gaan` : '🎯 Doel bereikt!'}
              </p>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Workouts gelogd</p>
              <p className="text-2xl font-bold text-white">{workouts.length}</p>
              {latestVO2 && (
                <p className="text-xs text-orange-400 mt-1">VO2 Max: {latestVO2}</p>
              )}
            </div>
          </div>

          {/* Charts */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Grafieken</h2>
            <Charts
              dailyLogs={dailyLogs}
              weeklyCheckIns={weeklyCheckIns}
              workoutSessions={workouts}
            />
          </div>
        </>
      )}

      {/* Export */}
      <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937] mb-4">
        <h3 className="font-semibold text-white mb-1">Data export</h3>
        <p className="text-xs text-gray-500 mb-3">Download alle data als JSON backup</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-[#1f2937] text-gray-300 py-3 rounded-lg text-sm font-medium active:bg-[#2a3448] transition-colors min-h-[44px] flex items-center justify-center gap-2"
        >
          <span>⬇</span> {exporting ? 'Exporteren...' : 'JSON backup downloaden'}
        </button>
      </div>
    </div>
  )
}
