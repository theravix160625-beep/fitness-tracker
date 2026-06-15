import type { DailyLog, WeeklyCheckIn } from '../types'

export interface WeeklyAvg {
  weekStart: string
  avg: number
  count: number
}

export interface WeightTrendResult {
  weeklyAvgs: WeeklyAvg[]
  ratePerWeek: number | null       // kg/week (negative = loss)
  weeksToGoalLow: number | null    // weeks to 80 kg
  weeksToGoalHigh: number | null   // weeks to 77 kg
  status: 'on_track' | 'too_fast' | 'too_slow' | 'insufficient_data'
  etaLow: string | null            // date string
  etaHigh: string | null
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (day - 1))
  return d.toISOString().split('T')[0]
}

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + Math.round(weeks * 7))
  return d.toISOString().split('T')[0]
}

function formatETA(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
}

export function calcWeightTrend(
  dailyLogs: DailyLog[],
  weeklyCheckIns: WeeklyCheckIn[],
  goalLow = 77,
  goalHigh = 80
): WeightTrendResult {
  // Combine all weight data
  const allPoints: { date: string; weight: number }[] = []
  for (const l of dailyLogs) {
    if (l.weight) allPoints.push({ date: l.date, weight: l.weight })
  }
  for (const c of weeklyCheckIns) {
    if (c.weight && !allPoints.find(p => p.date === c.date)) {
      allPoints.push({ date: c.date, weight: c.weight })
    }
  }
  allPoints.sort((a, b) => a.date.localeCompare(b.date))

  // Group by week
  const weekMap = new Map<string, number[]>()
  for (const p of allPoints) {
    const w = getMonday(p.date)
    if (!weekMap.has(w)) weekMap.set(w, [])
    weekMap.get(w)!.push(p.weight)
  }

  const weeklyAvgs: WeeklyAvg[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weights]) => ({
      weekStart,
      avg: parseFloat((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(2)),
      count: weights.length,
    }))

  if (weeklyAvgs.length < 2) {
    return { weeklyAvgs, ratePerWeek: null, weeksToGoalLow: null, weeksToGoalHigh: null, status: 'insufficient_data', etaLow: null, etaHigh: null }
  }

  // Linear regression over weekly avgs for rate
  const n = weeklyAvgs.length
  const xs = weeklyAvgs.map((_, i) => i)
  const ys = weeklyAvgs.map(w => w.avg)
  const xMean = xs.reduce((s, x) => s + x, 0) / n
  const yMean = ys.reduce((s, y) => s + y, 0) / n
  const slope = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0) /
    xs.reduce((s, x) => s + (x - xMean) ** 2, 0)

  const ratePerWeek = parseFloat(slope.toFixed(2))
  const currentAvg = weeklyAvgs[weeklyAvgs.length - 1].avg
  const today = new Date().toISOString().split('T')[0]

  // Optimal loss rate: 0.5–1% of body weight per week
  const currentWeight = currentAvg
  const optimalMin = -(currentWeight * 0.005)
  const optimalMax = -(currentWeight * 0.01)

  let status: WeightTrendResult['status']
  if (ratePerWeek > optimalMin) status = 'too_slow'
  else if (ratePerWeek < optimalMax) status = 'too_fast'
  else status = 'on_track'

  // ETA calculation
  let weeksToGoalLow: number | null = null
  let weeksToGoalHigh: number | null = null
  let etaLow: string | null = null
  let etaHigh: string | null = null

  if (ratePerWeek < 0) {
    weeksToGoalLow = parseFloat(((currentAvg - goalLow) / Math.abs(ratePerWeek)).toFixed(1))
    weeksToGoalHigh = parseFloat(((currentAvg - goalHigh) / Math.abs(ratePerWeek)).toFixed(1))
    if (weeksToGoalLow > 0) etaLow = formatETA(addWeeks(today, weeksToGoalLow))
    if (weeksToGoalHigh > 0 && currentAvg > goalHigh) etaHigh = formatETA(addWeeks(today, weeksToGoalHigh))
  }

  return { weeklyAvgs, ratePerWeek, weeksToGoalLow, weeksToGoalHigh, status, etaLow, etaHigh }
}
