export type ShiftType = 'none' | 'day' | 'evening' | 'night'

export interface ExerciseSet {
  weight: number | null
  reps: number | null
  isPR: boolean
}

export interface ExerciseLog {
  name: string
  sets: ExerciseSet[]
  notes: string
}

export interface WorkoutSession {
  id: string
  date: string
  cycleDay: number
  exercises: ExerciseLog[]
  energyLevel: number
  notes: string
  durationMinutes?: number
  shiftType?: ShiftType
}

export interface DailyLog {
  id: string
  date: string
  weight: number | null
  sleep: number | null
  sleepQuality: number | null
  steps: number | null
  notes: string
  mood: number | null
  shiftType: ShiftType
}

export interface WeeklyCheckIn {
  id: string
  date: string
  weight: number | null
  vo2max: number | null
  photos: string[]
  notes: string
  avgCalories: number | null
  waist: number | null
  hips: number | null
  chest: number | null
  upperArm: number | null
  shiftType?: ShiftType
}

export interface RunSession {
  id: string
  date: string
  distanceKm: number | null
  durationMin: number | null
  heartRateAvg: number | null
  feeling: number
  type: 'easy' | 'interval' | 'tempo' | 'long' | 'other'
  notes: string
  shiftType?: ShiftType
}

export interface SchemaExercise {
  name: string
  sets: SchemaSet[]
}

export interface SchemaSet {
  setNumbers: string
  repRange: string
}

export interface SchemaDay {
  day: number
  title: string
  subtitle: string
  calories: string
  type: 'workout' | 'rest' | 'run'
  exercises: SchemaExercise[]
}
