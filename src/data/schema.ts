import type { SchemaDay } from '../types'

export const SCHEMA: SchemaDay[] = [
  {
    day: 1,
    title: 'Upperbody A',
    subtitle: 'Upper Body A + Easy Run',
    calories: '2700',
    type: 'workout',
    exercises: [
      {
        name: 'Dumbbell Chest Press',
        sets: [
          { setNumbers: 'Set 1', repRange: '3–5 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Pec Fly',
        sets: [
          { setNumbers: 'Set 1 & 2', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Pull Up (assisted of weighted)',
        sets: [
          { setNumbers: 'Sets 1 t/m 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Upper Back Row Machine',
        sets: [
          { setNumbers: 'Set 1', repRange: '5–8 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '8–12 reps' },
        ],
      },
      {
        name: 'Viking Press / Machine Shoulder Press',
        sets: [
          { setNumbers: 'Set 1', repRange: '5–8 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Single Arm Preacher Curl',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Overhead Tricep Extensions',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
    ],
  },
  {
    day: 2,
    title: 'Lowerbody A',
    subtitle: 'Lower Body A (Quad Focus) + 25 min LISS Cardio Zone 2',
    calories: '2700',
    type: 'workout',
    exercises: [
      {
        name: 'Leg Extensions',
        sets: [
          { setNumbers: 'Set 1', repRange: '6–8 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '8–12 reps' },
        ],
      },
      {
        name: 'Belt Squat / Hack Squat',
        sets: [
          { setNumbers: 'Set 1', repRange: '5–8 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Legpress',
        sets: [
          { setNumbers: '2 sets', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Adductor',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Lying Leg Curls',
        sets: [
          { setNumbers: '2 sets', repRange: '8–12 reps' },
        ],
      },
      {
        name: 'Calf Raises',
        sets: [
          { setNumbers: '3 sets', repRange: '10–15 reps' },
        ],
      },
    ],
  },
  {
    day: 3,
    title: 'Actieve Rust',
    subtitle: 'Actieve Rust — 10.000 Stappen',
    calories: '2300',
    type: 'rest',
    exercises: [],
  },
  {
    day: 4,
    title: 'Run',
    subtitle: 'Run via Runna App',
    calories: '2300–2500',
    type: 'run',
    exercises: [],
  },
  {
    day: 5,
    title: 'Upperbody B',
    subtitle: 'Upper Body B + 25 min LISS Cardio Zone 2',
    calories: '2700',
    type: 'workout',
    exercises: [
      {
        name: 'Seated Row',
        sets: [
          { setNumbers: 'Set 1', repRange: '5–8 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'High Row Machine',
        sets: [
          { setNumbers: '2 sets', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Incline Smith Machine Benchpress',
        sets: [
          { setNumbers: 'Set 1', repRange: '3–5 reps' },
          { setNumbers: 'Set 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Chest Dips',
        sets: [
          { setNumbers: '2 sets', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Shoulder Side Raise Machine',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Bayesian Bicep Curls (cables)',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Tricep Straight Bar Pushdowns',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
    ],
  },
  {
    day: 6,
    title: 'Run',
    subtitle: 'Run via Runna App',
    calories: '2300–2500',
    type: 'run',
    exercises: [],
  },
  {
    day: 7,
    title: 'Lowerbody B',
    subtitle: 'Lower Body B (Hamstring Focus) + 25 min LISS Cardio Zone 2',
    calories: '2700',
    type: 'workout',
    exercises: [
      {
        name: 'Seated Leg Curls',
        sets: [
          { setNumbers: 'Set 1', repRange: '6–8 reps' },
          { setNumbers: 'Sets 2 & 3', repRange: '8–12 reps' },
        ],
      },
      {
        name: 'RDL',
        sets: [
          { setNumbers: 'Set 1', repRange: '5–8 reps' },
          { setNumbers: 'Sets 2 & 3', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Hip Thrust',
        sets: [
          { setNumbers: '2 sets', repRange: '6–10 reps' },
        ],
      },
      {
        name: 'Abductor',
        sets: [
          { setNumbers: '3 sets', repRange: '10–12 reps' },
        ],
      },
      {
        name: 'Walking Lunges',
        sets: [
          { setNumbers: '2 sets', repRange: '10–12 stappen per been' },
        ],
      },
      {
        name: 'Calf Raises',
        sets: [
          { setNumbers: '3 sets', repRange: '6–10 reps' },
        ],
      },
    ],
  },
  {
    day: 8,
    title: 'Actieve Rust',
    subtitle: 'Actieve Rust — 10.000 Stappen',
    calories: '2300',
    type: 'rest',
    exercises: [],
  },
]

export function getDefaultSetsForExercise(exerciseName: string, schemaDay: SchemaDay): ExerciseSetDefaults[] {
  const exercise = schemaDay.exercises.find(e => e.name === exerciseName)
  if (!exercise) return [{ hint: '8–12 reps' }]

  const defaults: ExerciseSetDefaults[] = []
  exercise.sets.forEach(s => {
    const count = parseSetCount(s.setNumbers)
    for (let i = 0; i < count; i++) {
      defaults.push({ hint: s.repRange })
    }
  })
  return defaults
}

export interface ExerciseSetDefaults {
  hint: string
}

function parseSetCount(setNumbers: string): number {
  if (setNumbers.includes('t/m')) {
    const match = setNumbers.match(/(\d+)\s*t\/m\s*(\d+)/)
    if (match) return parseInt(match[2]) - parseInt(match[1]) + 1
  }
  if (setNumbers.includes('&')) {
    const matches = setNumbers.match(/\d+/g)
    return matches ? matches.length : 2
  }
  const match = setNumbers.match(/^(\d+)\s*sets?/i)
  if (match) return parseInt(match[1])
  return 1
}
