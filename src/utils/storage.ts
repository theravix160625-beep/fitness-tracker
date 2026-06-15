import { supabase } from '../lib/supabase'
import type { WorkoutSession, DailyLog, WeeklyCheckIn, RunSession } from '../types'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

async function dbSave(table: string, row: object): Promise<string | null> {
  const { error } = await supabase.from(table).upsert(row)
  if (error) return error.message
  return null
}

// Workouts
export async function saveWorkout(session: WorkoutSession): Promise<string | null> {
  return dbSave('workouts', {
    id: session.id, date: session.date, cycle_day: session.cycleDay,
    exercises: session.exercises, energy_level: session.energyLevel,
    notes: session.notes, duration_minutes: session.durationMinutes ?? null,
  })
}

export async function loadWorkouts(): Promise<WorkoutSession[]> {
  const { data, error } = await supabase.from('workouts').select('*').order('date', { ascending: false })
  if (error) { console.error('loadWorkouts:', error.message); return [] }
  return (data ?? []).map(row => ({
    id: row.id, date: row.date, cycleDay: row.cycle_day,
    exercises: row.exercises, energyLevel: row.energy_level,
    notes: row.notes, durationMinutes: row.duration_minutes,
  }))
}

export async function deleteWorkout(id: string): Promise<void> {
  await supabase.from('workouts').delete().eq('id', id)
}

// Daily Logs
export async function saveDailyLog(log: DailyLog): Promise<string | null> {
  return dbSave('daily_logs', {
    id: log.id, date: log.date, weight: log.weight, sleep: log.sleep,
    sleep_quality: log.sleepQuality, steps: log.steps, notes: log.notes,
  })
}

export async function loadDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase.from('daily_logs').select('*').order('date', { ascending: false })
  if (error) { console.error('loadDailyLogs:', error.message); return [] }
  return (data ?? []).map(row => ({
    id: row.id, date: row.date, weight: row.weight, sleep: row.sleep,
    sleepQuality: row.sleep_quality, steps: row.steps, notes: row.notes,
  }))
}

export async function deleteDailyLog(id: string): Promise<void> {
  await supabase.from('daily_logs').delete().eq('id', id)
}

// Weekly Check-ins
export async function saveWeeklyCheckIn(checkin: WeeklyCheckIn): Promise<string | null> {
  return dbSave('weekly_checkins', {
    id: checkin.id, date: checkin.date, weight: checkin.weight,
    vo2max: checkin.vo2max, photos: checkin.photos, notes: checkin.notes,
    avg_calories: checkin.avgCalories, waist: checkin.waist,
    hips: checkin.hips, chest: checkin.chest, upper_arm: checkin.upperArm,
  })
}

export async function loadWeeklyCheckIns(): Promise<WeeklyCheckIn[]> {
  const { data, error } = await supabase.from('weekly_checkins').select('*').order('date', { ascending: false })
  if (error) { console.error('loadWeeklyCheckIns:', error.message); return [] }
  return (data ?? []).map(row => ({
    id: row.id, date: row.date, weight: row.weight, vo2max: row.vo2max,
    photos: row.photos ?? [], notes: row.notes, avgCalories: row.avg_calories,
    waist: row.waist ?? null, hips: row.hips ?? null,
    chest: row.chest ?? null, upperArm: row.upper_arm ?? null,
  }))
}

export async function deleteWeeklyCheckIn(id: string): Promise<void> {
  await supabase.from('weekly_checkins').delete().eq('id', id)
}

// Run Sessions
export async function saveRunSession(run: RunSession): Promise<string | null> {
  return dbSave('run_sessions', {
    id: run.id, date: run.date, distance_km: run.distanceKm,
    duration_min: run.durationMin, heart_rate_avg: run.heartRateAvg,
    feeling: run.feeling, type: run.type, notes: run.notes,
  })
}

export async function loadRunSessions(): Promise<RunSession[]> {
  const { data, error } = await supabase.from('run_sessions').select('*').order('date', { ascending: false })
  if (error) { console.error('loadRunSessions:', error.message); return [] }
  return (data ?? []).map(row => ({
    id: row.id, date: row.date, distanceKm: row.distance_km,
    durationMin: row.duration_min, heartRateAvg: row.heart_rate_avg,
    feeling: row.feeling, type: row.type, notes: row.notes,
  }))
}

export async function deleteRunSession(id: string): Promise<void> {
  await supabase.from('run_sessions').delete().eq('id', id)
}

// Export
export async function exportAllData(): Promise<void> {
  const [workouts, dailyLogs, weeklyCheckIns, runSessions] = await Promise.all([
    loadWorkouts(), loadDailyLogs(), loadWeeklyCheckIns(), loadRunSessions(),
  ])
  const blob = new Blob([JSON.stringify({ exportDate: new Date().toISOString(), workouts, dailyLogs, weeklyCheckIns, runSessions }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `martyn-fitness-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
