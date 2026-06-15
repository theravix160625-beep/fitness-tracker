// Epley formula: weight × (1 + reps/30)
export function estimatedOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return parseFloat((weight * (1 + reps / 30)).toFixed(1))
}

export function bestOneRM(sets: { weight: number | null; reps: number | null }[]): number | null {
  let best: number | null = null
  for (const set of sets) {
    if (!set.weight || !set.reps) continue
    const e = estimatedOneRM(set.weight, set.reps)
    if (best === null || e > best) best = e
  }
  return best
}
