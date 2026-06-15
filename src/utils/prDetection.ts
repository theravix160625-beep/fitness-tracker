import type { WorkoutSession, ExerciseSet } from '../types'

export interface PRResult {
  isWeightPR: boolean
  isVolumePR: boolean
  prevBestWeight: number
  prevBestVolume: number
}

export function detectPR(
  exerciseName: string,
  currentSets: ExerciseSet[],
  allSessions: WorkoutSession[],
  currentSessionId?: string
): PRResult {
  const previousSessions = allSessions.filter(s => s.id !== currentSessionId)

  let prevBestWeight = 0
  let prevBestVolume = 0

  for (const session of previousSessions) {
    const exercise = session.exercises.find(e => e.name === exerciseName)
    if (!exercise) continue
    for (const set of exercise.sets) {
      if (set.weight && set.reps) {
        if (set.weight > prevBestWeight) prevBestWeight = set.weight
        const vol = set.weight * set.reps
        if (vol > prevBestVolume) prevBestVolume = vol
      }
    }
  }

  let currentBestWeight = 0
  let currentBestVolume = 0
  for (const set of currentSets) {
    if (set.weight && set.reps) {
      if (set.weight > currentBestWeight) currentBestWeight = set.weight
      const vol = set.weight * set.reps
      if (vol > currentBestVolume) currentBestVolume = vol
    }
  }

  const isWeightPR = prevBestWeight > 0 && currentBestWeight > prevBestWeight
  const isVolumePR = prevBestVolume > 0 && currentBestVolume > prevBestVolume

  return {
    isWeightPR,
    isVolumePR,
    prevBestWeight,
    prevBestVolume,
  }
}

export function getExerciseHistory(
  exerciseName: string,
  allSessions: WorkoutSession[],
  limit = 3
) {
  const sessions = [...allSessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(s => s.exercises.some(e => e.name === exerciseName))
    .slice(0, limit)

  return sessions.map(s => ({
    date: s.date,
    sets: s.exercises.find(e => e.name === exerciseName)?.sets ?? [],
  }))
}
