import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cubeShape } from '@/lib/cube'
import {
  CUBE_CATEGORIES,
  CUBE_KINDS,
  cubeCategory,
  cubeKindId,
  SHAPE_LABEL,
  type CubeCategory,
} from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { SECTION_LABEL } from '@/components/ui/styles'
import { CategoryIcon } from './CategoryIcon'
import { PickerTile } from './PickerTile'
import { PuzzleIcon } from './PuzzleIcon'

type Kind = (typeof CUBE_KINDS)[number]

const kindsOf = (category: CubeCategory): Kind[] =>
  CUBE_KINDS.filter((kind) => cubeCategory(kind) === category)

/** A category's tile picture: its 3x3 in front if it has one (else its first
 *  puzzle), with up to two others beside it. */
function showcase(category: CubeCategory): { cover: Kind; others: Kind[] } {
  const kinds = kindsOf(category)
  const cover = kinds.find((k) => k.shape === '3') ?? kinds[0]!
  return { cover, others: kinds.filter((k) => k !== cover).slice(0, 2) }
}

/**
 * The cube choice: a button showing the current puzzle, which opens a picker
 * of thumbnails, the categories first, then the puzzles of the chosen one.
 * The current puzzle and its category are highlighted.
 */
export function CubePicker({ disabled, trailing }: { disabled: boolean; trailing?: ReactNode }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  const setShape = useCube((s) => s.setShape)
  const setVariant = useCube((s) => s.setVariant)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<CubeCategory | null>(null)
  const titleId = useId()

  const nameOf = (kind: Kind) => t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant === 'mirror')
  const current: Kind = { shape, variant }
  const isCurrent = (kind: Kind) => cubeKindId(kind) === cubeKindId(current)

  const openPicker = () => {
    setCategory(null)
    setOpen(true)
  }
  const choose = (kind: Kind) => {
    setShape(kind.shape)
    setVariant(kind.variant)
    setOpen(false)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={SECTION_LABEL}>{t.cubeLabel}</span>
        {trailing}
      </div>
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${t.cubeLabel} : ${nameOf(current)}`}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm font-semibold text-white transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        <PuzzleIcon shape={shape} variant={variant} className="size-9 shrink-0" />
        <span className="flex-1">{nameOf(current)}</span>
        <ChevronRight className="size-4 text-slate-400" aria-hidden />
      </button>

      {open && (
        <Modal labelledBy={titleId} onClose={() => setOpen(false)} width="max-w-lg">
          <header className="mb-3 flex items-center gap-2">
            {category && (
              <IconButton label={t.allCategories} onClick={() => setCategory(null)}>
                <ChevronLeft className="size-4" aria-hidden />
              </IconButton>
            )}
            <h2 id={titleId} className="flex-1 text-sm font-semibold text-white">
              {category ? t.cubeCategories[category] : t.chooseCube}
            </h2>
            <IconButton label={t.close} onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden />
            </IconButton>
          </header>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {category
              ? kindsOf(category).map((kind) => (
                  <PickerTile
                    key={cubeKindId(kind)}
                    label={nameOf(kind)}
                    current={isCurrent(kind)}
                    onClick={() => choose(kind)}
                  >
                    <PuzzleIcon shape={kind.shape} variant={kind.variant} className="h-full" />
                  </PickerTile>
                ))
              : CUBE_CATEGORIES.map((c) => (
                  <PickerTile
                    key={c}
                    label={t.cubeCategories[c]}
                    detail={t.puzzleCount(kindsOf(c).length)}
                    current={c === cubeCategory(current)}
                    onClick={() => setCategory(c)}
                  >
                    <CategoryIcon {...showcase(c)} />
                  </PickerTile>
                ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
