interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Optional tooltip for the option. */
  title?: string
}

interface SegmentedToggleProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** 'md' for the language switch, 'sm' for the compact ones (notation, layer kind). */
  size?: 'sm' | 'md'
}

const SIZE = {
  md: 'px-2 py-1 text-xs',
  sm: 'px-1.5 py-0.5 text-[10px]',
}

/** A small segmented control: one active option among a few (language,
 *  notation, layer kind). */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedToggleProps<T>) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          title={option.title}
          className={`rounded font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${SIZE[size]} ${
            value === option.value ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
