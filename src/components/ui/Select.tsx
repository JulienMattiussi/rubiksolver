import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { SECTION_LABEL } from './styles'

/** A choice of the list: its value, its name, and what it may wear at the
 *  right of its name (an icon, with the words it stands for). */
interface SelectOption {
  readonly value: string
  readonly label: string
  readonly badge?: { readonly icon: ReactNode; readonly title: string }
}

interface SelectProps {
  id: string
  label: string
  value: string
  options: readonly SelectOption[]
  disabled?: boolean
  onChange: (value: string) => void
  /** Optional extra content shown at the right end of the label line. */
  trailing?: ReactNode
}

/** An option's name and badge, in the button as in the list. */
function OptionText({ option }: { option: SelectOption }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{option.label}</span>
      {option.badge && (
        <span className="shrink-0 text-amber-300" title={option.badge.title}>
          {option.badge.icon}
          <span className="sr-only">{`, ${option.badge.title}`}</span>
        </span>
      )}
    </span>
  )
}

/**
 * A labeled dropdown, styled like the rest of the panel: a button opening
 * a list (the ARIA select-only combobox), so that an option can wear an
 * icon, which a native `<select>` cannot. Keyboard: arrows, Home and End
 * move, Enter or Space choose, Escape and Tab close.
 */
export function Select({
  id,
  label,
  value,
  options,
  disabled = false,
  onChange,
  trailing,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  const [active, setActive] = useState(selected)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const labelId = `${id}-label`
  const optionId = (i: number) => `${listId}-${i}`

  // A click elsewhere closes the list.
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  const show = () => {
    setActive(selected)
    setOpen(true)
  }
  const choose = (i: number) => {
    const option = options[i]
    if (option && option.value !== value) onChange(option.value)
    setOpen(false)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const last = options.length - 1
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      if (open) setActive(moves[e.key]!)
      else show()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) choose(active)
      else show()
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Tab') setOpen(false)
  }

  const current = options[selected]
  return (
    <div ref={root} className="relative">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label id={labelId} htmlFor={id} className={`block ${SECTION_LABEL}`}>
          {label}
        </label>
        {trailing}
      </div>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm font-semibold text-white transition hover:border-slate-500 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {current && <OptionText option={current} />}
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl"
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={optionId(i)}
              role="option"
              aria-selected={option.value === value}
              onPointerEnter={() => setActive(i)}
              // Chosen before the button loses focus.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === active ? 'bg-slate-700 text-white' : 'text-slate-200'
              } ${option.value === value ? 'font-semibold' : ''}`}
            >
              <OptionText option={option} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
