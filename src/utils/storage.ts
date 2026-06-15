import { supabase } from '../lib/supabase'
import type { WorkoutSession, DailyLog, WeeklyCheckIn } from '../types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Workouts
export async function saveWorkout(session: WorkoutSession): Promise<void> {
  const row = {
    id: session.id,
    date: session.date,
    cycle_day: session.cycleDay,
    exercises: session.exercises,
    energy_level: session.energyLevel,
    notes: session.notes,
    duration_minutes: session.durationMinutes ?? null,
  }
  await supabase.from('workouts').upsert(row)
}

export async function loadWorkouts(): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    date: row.date,
    cycleDay: row.cycle_day,
    exercises: row.exercises,
    energyLevel: row.energy_level,
    notes: row.notes,
    durationMinutes: row.duration_minutes,
  }))
}

export async function deleteWorkout(id: string): Promise<void> {
  await supabase.from('workouts').delete().eq('id', id)
}

// Daily Logs
export async function saveDailyLog(log: DailyLog): Promise<void> {
  const row = {
    id: log.id,
    date: log.date,
    weight: log.weight,
    sleep: log.sleep,
    sleep_quality: log.sleepQuality,
    steps: log.steps,
    notes: log.notes,
  }
  await supabase.from('daily_logs').upsert(row, { onConflict: 'date' })
}

export async function loadDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    date: row.date,
    weight: row.weight,
    sleep: row.sleep,
    sleepQuality: row.sleep_quality,
    steps: row.steps,
    notes: row.notes,
  }))
}

export async function deleteDailyLog(id: string): Promise<void> {
  await supabase.from('daily_logs').delete().eq('id', id)
}

// Weekly Check-ins
export async function saveWeeklyCheckIn(checkin: WeeklyCheckIn): Promise<void> {
  const row = {
    id: checkin.id,
    date: checkin.date,
    weight: checkin.weight,
    vo2max: checkin.vo2max,
    photos: checkin.photos,
    notes: checkin.notes,
    avg_calories: checkin.avgCalories,
  }
  await supabase.from('weekly_checkins').upsert(row)
}

export async function loadWeeklyCheckIns(): Promise<WeeklyCheckIn[]> {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    date: row.date,
    weight: row.weight,
    vo2max: row.vo2max,
    photos: row.photos ?? [],
    notes: row.notes,
    avgCalories: row.avg_calories,
  }))
}

export async function deleteWeeklyCheckIn(id: string): Promise<void> {
  await supabase.from('weekly_checkins').delete().eq('id', id)
}

// Export all data as JSON backup
export async function exportAllData(): Promise<void> {
  const [workouts, dailyLogs, weeklyCheckIns] = await Promise.all([
    loadWorkouts(),
    loadDailyLogs(),
    loadWeeklyCheckIns(),
  ])
  const data = {
    exportDate: new Date().toISOString(),
    workouts,
    dailyLogs,
    weeklyCheckIns,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `martyn-fitness-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
