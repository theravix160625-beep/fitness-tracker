import type { ExerciseSet } from '../types'

interface Props {
  set: ExerciseSet
  index: number
  hint: string
  onChange: (set: ExerciseSet) => void
  onDelete: () => void
  canDelete: boolean
}

export default function SetRow({ set, index, hint, onChange, onDelete, canDelete }: Props) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-gray-500 text-sm w-6 text-center shrink-0">{index + 1}</span>
      <div className="flex-1 flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            value={set.weight ?? ''}
            onChange={e => onChange({ ...set, weight: e.target.value === '' ? null : parseFloat(e.target.value) })}
            className="w-full bg-[#1a2030] border border-[#2a3448] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.reps ?? ''}
            onChange={e => onChange({ ...set, reps: e.target.value === '' ? null : parseInt(e.target.value) })}
            className="w-full bg-[#1a2030] border border-[#2a3448] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[44px]"
          />
        </div>
      </div>
      <span className="text-gray-600 text-xs w-16 text-right shrink-0">{hint}</span>
      {canDelete && (
        <button
          onClick={onDelete}
          className="text-gray-600 hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center shrink-0"
        >
          ×
        </button>
      )}
    </div>
  )
}
