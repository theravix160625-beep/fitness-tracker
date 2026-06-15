import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DailyLog, WeeklyCheckIn, WorkoutSession } from '../types'

interface WeightPoint {
  date: string
  weight: number
  ma7?: number
}

function calcMovingAverage(data: WeightPoint[], window = 7): WeightPoint[] {
  return data.map((point, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1)
    const valid = slice.filter(p => p.weight != null)
    const avg = valid.length > 0 ? valid.reduce((s, p) => s + p.weight, 0) / valid.length : undefined
    return { ...point, ma7: avg ? parseFloat(avg.toFixed(1)) : undefined }
  })
}

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() === 0 ? 7 : d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  return monday.toISOString().split('T')[0]
}

function calcWeeklyAverages(dailyLogs: DailyLog[]): { week: string; avg: number }[] {
  const weekMap = new Map<string, number[]>()
  for (const log of dailyLogs) {
    if (!log.weight) continue
    const key = getISOWeekKey(log.date)
    if (!weekMap.has(key)) weekMap.set(key, [])
    weekMap.get(key)!.push(log.weight)
  }
  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, weights]) => ({
      week,
      avg: parseFloat((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)),
    }))
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function formatWeek(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()} ${d.toLocaleDateString('nl-NL', { month: 'short' })}`
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
  // Daily weight + 7-day MA
  const weightMap = new Map<string, number>()
  for (const log of dailyLogs) {
    if (log.weight) weightMap.set(log.date, log.weight)
  }
  for (const ci of weeklyCheckIns) {
    if (ci.weight && !weightMap.has(ci.date)) weightMap.set(ci.date, ci.weight)
  }
  const weightData = calcMovingAverage(
    Array.from(weightMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, weight]) => ({ date, weight }))
  ).map(p => ({ ...p, date: formatDateShort(p.date) }))

  // Weekly averages from daily logs
  const weeklyAvgData = calcWeeklyAverages(dailyLogs).map(w => ({
    ...w,
    week: formatWeek(w.week),
  }))

  // VO2 Max
  const vo2Data = [...weeklyCheckIns]
    .filter(ci => ci.vo2max)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ci => ({ date: formatDateShort(ci.date), vo2max: ci.vo2max }))

  // Energy
  const energyData = [...workoutSessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({ date: formatDateShort(s.date), energie: s.energyLevel }))

  const hasAnyData = weightData.length > 0 || vo2Data.length > 0 || energyData.length > 0

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
      {weightData.length >= 2 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-1">Gewicht — dagelijks</h3>
          <p className="text-xs text-gray-600 mb-4">Dagboek + 7-daags voortschrijdend gemiddelde</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="weight" name="Gewicht" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3, fill: '#3b82f6' }} connectNulls />
              <Line type="monotone" dataKey="ma7" name="7-daags gem." stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {weeklyAvgData.length >= 2 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-1">Gewicht — wekelijks gemiddelde</h3>
          <p className="text-xs text-gray-600 mb-4">Gemiddeld gewicht per week op basis van dagboek</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyAvgData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Gem. gewicht']} />
              <Line type="monotone" dataKey="avg" name="Wekelijks gem." stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4, fill: '#06b6d4' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {vo2Data.length >= 1 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-1">VO2 Max over tijd</h3>
          <p className="text-xs text-gray-600 mb-4">Wekelijks ingevoerd vanuit Garmin / Apple Watch</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={vo2Data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="vo2max" name="VO2 Max" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: '#f97316' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {energyData.length >= 2 && (
        <div className="bg-[#111827] rounded-xl p-4 border border-[#1f2937]">
          <h3 className="font-semibold text-white mb-1">Energieniveau per workout</h3>
          <p className="text-xs text-gray-600 mb-4">Subjectief gevoel 1–10</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={energyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
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
