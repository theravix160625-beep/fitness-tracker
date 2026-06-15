import { useState, useEffect } from 'react'
import { USER_PROFILE } from '../data/userProfile'
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

  const latestDaily = dailyLogs.find(l => l.weight)
  const latestCheckin = weeklyCheckIns.find(c => c.weight)

  let currentWeight = USER_PROFILE.weightKg
  let currentWeightSource = 'startgewicht'

  if (latestDaily && latestCheckin) {
    if (latestDaily.date >= latestCheckin.date) {
      currentWeight = latestDaily.weight!
      currentWeightSource = 'dagboek'
    } else {
      currentWeight = latestCheckin.weight!
      currentWeightSource = 'wekelijkse check-in'
    }
  } else if (latestDaily?.weight) {
    currentWeight = latestDaily.weight
    currentWeightSource = 'dagboek'
  } else if (latestCheckin?.weight) {
    currentWeight = latestCheckin.weight
    currentWeightSource = 'wekelijkse check-in'
  }

  const weightChange = currentWeight - USER_PROFILE.weightKg
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

      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 rounded-xl p-5 mb-4 border border-blue-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-3xl">
            💪
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{USER_PROFILE.name}</h2>
            <p className="text-gray-400 text-sm">{USER_PROFILE.age} jaar · {USER_PROFILE.heightCm} cm</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {USER_PROFILE.goals.map((g, i) => (
                <span key={i} className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 py-10">Laden...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Huidig gewicht</p>
              <p className="text-2xl font-bold text-white">{currentWeight} <span className="text-sm font-normal text-gray-500">kg</span></p>
              <p className="text-xs text-gray-600 mt-1">via {currentWeightSource}</p>
              <p className={`text-sm font-medium mt-1 ${weightChange < 0 ? 'text-green-400' : weightChange > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {weightChange === 0 ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
              </p>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">BMI</p>
              <p className="text-2xl font-bold text-white">{bmi}</p>
              <p className={`text-sm font-medium mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Startgewicht</p>
              <p className="text-2xl font-bold text-white">{USER_PROFILE.weightKg} <span className="text-sm font-normal text-gray-500">kg</span></p>
              <p className="text-xs text-gray-600 mt-1">15 juni 2025</p>
            </div>

            <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
              <p className="text-xs text-gray-500 mb-1">Workouts gelogd</p>
              <p className="text-2xl font-bold text-white">{workouts.length}</p>
              {latestVO2 && <p className="text-sm text-orange-400 mt-1">VO2 Max: {latestVO2}</p>}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Grafieken</h2>
            <Charts dailyLogs={dailyLogs} weeklyCheckIns={weeklyCheckIns} workoutSessions={workouts} />
          </div>
        </>
      )}

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
