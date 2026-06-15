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
  source: 'dagboek' | 'checkin'
}

function calcMovingAverage(data: WeightPoint[], window = 7): WeightPoint[] {
  return data.map((point, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1)
    const validSlice = slice.filter(p => p.weight != null)
    const avg = validSlice.length > 0
      ? validSlice.reduce((s, p) => s + p.weight, 0) / validSlice.length
      : undefined
    return { ...point, ma7: avg ? parseFloat(avg.toFixed(1)) : undefined }
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
  // Weight chart data
  const weightMap = new Map<string, WeightPoint>()
  dailyLogs.forEach(log => {
    if (log.weight) weightMap.set(log.date, { date: log.date, weight: log.weight, source: 'dagboek' })
  })
  weeklyCheckIns.forEach(ci => {
    if (ci.weight && !weightMap.has(ci.date)) {
      weightMap.set(ci.date, { date: ci.date, weight: ci.weight, source: 'checkin' })
    }
  })
  const weightData = calcMovingAverage(
    Array.from(weightMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  ).map(p => ({ ...p, date: formatDateShort(p.date) }))

  // VO2 Max chart data
  const vo2Data = [...weeklyCheckIns]
    .filter(ci => ci.vo2max)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(ci => ({
      date: formatDateShort(ci.date),
      vo2max: ci.vo2max,
    }))

  // Energy chart data
  const energyData = [...workoutSessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: formatDateShort(s.date),
      energie: s.energyLevel,
    }))

  if (weightData.length === 0 && vo2Data.length === 0 && energyData.length === 0) {
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
          <h3 className="font-semibold text-white mb-1">Gewicht over tijd</h3>
          <p className="text-xs text-gray-600 mb-4">Dagelijks + 7-daags voortschrijdend gemiddelde</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              <Line
                type="monotone"
                dataKey="weight"
                name="Gewicht"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={{ r: 3, fill: '#3b82f6' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="ma7"
                name="7-daags gem."
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                connectNulls
              />
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
              <Line
                type="monotone"
                dataKey="vo2max"
                name="VO2 Max"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                connectNulls
              />
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
              <Line
                type="monotone"
                dataKey="energie"
                name="Energie"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
