import { CYCLE_START_DATE } from '../data/userProfile'

const CYCLE_LENGTH = 8

export function getCurrentCycleDay(): number {
  const start = new Date(CYCLE_START_DATE)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const diffMs = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 1
  return (diffDays % CYCLE_LENGTH) + 1
}

export function getCycleDayForDate(dateStr: string): number {
  const start = new Date(CYCLE_START_DATE)
  const date = new Date(dateStr)
  start.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diffMs = date.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 1
  return (diffDays % CYCLE_LENGTH) + 1
}
