import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import type { DailyLog, WeeklyCheckIn, WorkoutSession } from '../types'
import { calcWeightTrend } from '../utils/weightTrend'

function getMonday(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (day - 1))
  return d.toISOString().split('T')[0]
}

function calcWeeklyAverages(dailyLogs: DailyLog[], checkIns: WeeklyCheckIn[]): { week: string; avg: number; label: string }[] {
  const weekMap = new Map<string, number[]>()
  for (const log of dailyLogs) {
    if (!log.weight) continue
    const key = getMonday(log.date)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key)!.push(log.weight)
  }
  for (const ci of checkIns) {
    if (!ci.weight) continue
    const key = getMonday(ci.date)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key)!.push(ci.weight)
  }
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, weights]) => {
      const d = new Date(week)
      return {
        week,
        avg: parseFloat((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)),
        label: `${d.getDate()} ${d.toLocaleDateString('nl-NL', { month: 'short' })}`,
      }
    })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

interface Props {
  dailyLogs: DailyLog[]
  weeklyCheckIns: WeeklyCheckIn[]
  workoutSessions: WorkoutSession[]
}

const tooltipStyle = {
  backgroundColor: '#1a2030',
  border: '1px solid #2a3448',
  borderRadius: 8,
  color: '#f1f5f9',
  fontSize: 12,
}

export default function Charts({ dailyLogs, weeklyCheckIns, workoutSessions }: Props) {
  // Combined daily weight points
  const weightMap = new Map<string, number>()
  for (const log of dailyLogs) { if (log.weight) weightMap.set(log.date, log.weight) }
  for (const ci of weeklyCheckIns) { if (ci.weight && !weightMap.has(ci.date)) weightMap.set(ci.date, ci.weight) }

  const sortedDailyPoints = Array.from(weightMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  // 7-day moving average on daily points
  const dailyWithMA = sortedDailyPoints.map(([date, weight], i, arr) => {
    const slice = arr.slice(Math.max(0, i - 6), i + 1)
    const ma7 = parseFloat((slice.reduce((s, [, w]) => s + w, 0) / slice.length).toFixed(1))
    return { date: formatDateShort(date), weight, ma7 }
  })

  // Weekly averages
  const weeklyAvgs = calcWeeklyAverages(dailyLogs, weeklyCheckIns)
  const weeklyAvgData = weeklyAvgs.map(w => ({ label: w.label, avg: w.avg }))

  // VO2 Max
  const vo2Data = [...weeklyCheckIns]
    .filter(ci => ci.vo2max)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ci => ({ date: formatDateShort(ci.date), vo2max: ci.vo2max }))

  // Energy per workout
  const energyData = [...workoutSessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({ date: formatDateShort(s.date), energie: s.energyLevel }))

  // Body measurements trend
  const measurementData = [...weeklyCheckIns]
    .filter(ci => ci.waist || ci.hips || ci.chest || ci.upperArm)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ci => ({
      date: formatDateShort(ci.date),
      taille: ci.waist,
      heupen: ci.hips,
      borst: ci.chest,
      bovenarm: ci.upperArm,
    }))

  // Weight trend from calcWeightTrend (for trend line reference on weekly chart)
  const trend = calcWeightTrend(dailyLogs, weeklyCheckIns)

  const hasAnyData = dailyWithMA.length > 0 || vo2Data.length > 0 || energyData.length > 0

  if (!hasAnyData) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p className="text-3xl mb-2">📈</p>
        <p className="text-sm">Grafieken verschijnen zodra je data invoert</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly average — primary, most meaningful */}
      {weeklyAvgData.length >= 1 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-0.5">Gewicht — wekelijks gemiddelde</h3>
          <p className="text-xs text-gray-600 mb-1">Gemiddeld gewicht per week (dagboek + check-ins)</p>
          {trend.ratePerWeek !== null && (
            <p className="text-xs text-cyan-400 mb-3">
              Trend: {trend.ratePerWeek > 0 ? '+' : ''}{trend.ratePerWeek} kg/week
              {trend.etaHigh ? ` · 80 kg ≈ ${trend.etaHigh}` : ''}
              {trend.etaLow ? ` · 77 kg ≈ ${trend.etaLow}` : ''}
            </p>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyAvgData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Gem. gewicht']} />
              {/* Goal reference lines */}
              <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '80', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
              <ReferenceLine y={77} stroke="#10b981" strokeDasharray="3 3" label={{ value: '77', position: 'right', fill: '#10b981', fontSize: 10 }} />
              <Line type="monotone" dataKey="avg" name="Wekelijks gem." stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2, stroke: '#0e7490' }} connectNulls activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end">
            <span className="text-xs text-amber-400">— 80 kg</span>
            <span className="text-xs text-green-400">— 77 kg (doel)</span>
          </div>
        </div>
      )}

      {/* Daily weight + 7-day MA */}
      {dailyWithMA.length >= 2 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-0.5">Gewicht — dagelijks</h3>
          <p className="text-xs text-gray-600 mb-4">Ruwe dagboekwaarden + 7-daags voortschrijdend gemiddelde</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyWithMA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="weight" name="Dagelijks" stroke="#3b82f6" strokeWidth={1} dot={{ r: 2, fill: '#3b82f6' }} connectNulls opacity={0.6} />
              <Line type="monotone" dataKey="ma7" name="7-daags gem." stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body measurements */}
      {measurementData.length >= 1 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-0.5">Lichaamsomtrekken</h3>
          <p className="text-xs text-gray-600 mb-4">Taille, heupen, borst, bovenarm (cm)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={measurementData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} cm`]} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="taille" name="Taille" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} connectNulls />
              <Line type="monotone" dataKey="heupen" name="Heupen" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} connectNulls />
              <Line type="monotone" dataKey="borst" name="Borst" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} connectNulls />
              <Line type="monotone" dataKey="bovenarm" name="Bovenarm" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: '#f472b6' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* VO2 Max */}
      {vo2Data.length >= 1 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-0.5">VO2 Max over tijd</h3>
          <p className="text-xs text-gray-600 mb-4">Wekelijks ingevoerd vanuit Garmin / Apple Watch</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={vo2Data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="vo2max" name="VO2 Max" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: '#f97316' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Energy per workout */}
      {energyData.length >= 2 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-0.5">Energieniveau per workout</h3>
          <p className="text-xs text-gray-600 mb-4">Subjectief gevoel 1–10</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={energyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2535" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={[1, 10]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="energie" name="Energie" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
