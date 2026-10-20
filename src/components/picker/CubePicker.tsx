import { Box, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cubeShape } from '@/lib/core/cube'
import {
  CUBE_CATEGORIES,
  CUBE_KINDS,
  cubeCategory,
  cubeKindId,
  isCover,
  SHAPE_LABEL,
  type CubeCategory,
  type CubeKind,
} from '@/lib/core/shapes'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { goTo } from '@/store/router'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'
import { SECTION_LABEL } from '@/components/ui/styles'
import { CategoryIcon } from './CategoryIcon'
import { hasTutorial } from '@/lib/tutorials/registry'
import { PickerTile } from './PickerTile'
import { PuzzleIcon } from './PuzzleIcon'

type Kind = CubeKind

const kindsOf = (category: CubeCategory): Kind[] =>
  CUBE_KINDS.filter((kind) => cubeCategory(kind) === category)

/** A tile's width: two a row, three from `sm` (gaps of 0.5rem between);
 *  four past twelve tiles, in a wider dialog. */
const TILE_WIDTH = 'flex w-[calc(50%-0.25rem)] flex-col *:flex-1 sm:w-[calc((100%-1rem)/3)]'
const TILE_WIDTH_4 = 'flex w-[calc(50%-0.25rem)] flex-col *:flex-1 sm:w-[calc((100%-1.5rem)/4)]'
const MANY = 12

/** A category's tile picture: its cover in front if it has one (its card
 *  says, else its first puzzle), with up to two others beside it. */
function showcase(category: CubeCategory): { cover: Kind; others: Kind[] } {
  const kinds = kindsOf(category)
  const cover = kinds.find((k) => isCover(k.shape)) ?? kinds[0]!
  return { cover, others: kinds.filter((k) => k !== cover).slice(0, 2) }
}

/**
 * The cube choice: a button showing the current puzzle, which opens a picker
 * of thumbnails, the categories first, then the puzzles of the chosen one.
 * The current puzzle and its category are highlighted.
 */
export function CubePicker({
  disabled,
  trailing,
  home = false,
}: {
  disabled: boolean
  trailing?: ReactNode
  /** The home page: no puzzle chosen yet, the button invites to choose one. */
  home?: boolean
}) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<CubeCategory | null>(null)
  const titleId = useId()

  const nameOf = (kind: Kind) => t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant)
  const current: Kind = { shape, variant }
  const isCurrent = (kind: Kind) => !home && cubeKindId(kind) === cubeKindId(current)
  const shown = home ? t.chooseModel : nameOf(current)

  const tiles = category ? kindsOf(category).length : CUBE_CATEGORIES.length
  const tileWidth = tiles > MANY ? TILE_WIDTH_4 : TILE_WIDTH

  const openPicker = () => {
    setCategory(null)
    setOpen(true)
  }
  // Through the address: a link to that puzzle, back returns to this one.
  const choose = (kind: Kind) => {
    goTo({ kind })
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
        aria-label={t.cubeLabelOf(shown)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm font-semibold text-white transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {home ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-500 text-slate-400">
            <Box className="size-4" aria-hidden />
          </span>
        ) : (
          <PuzzleIcon shape={shape} variant={variant} className="size-9 shrink-0" />
        )}
        <span className={`flex-1 ${home ? 'text-slate-300' : ''}`}>{shown}</span>
        <ChevronRight className="size-4 text-slate-400" aria-hidden />
      </button>

      {open && (
        <Modal
          labelledBy={titleId}
          onClose={() => setOpen(false)}
          width={tiles > MANY ? 'max-w-2xl' : 'max-w-lg'}
        >
          <header className="mb-3 flex items-center gap-2">
            {category && (
              <button
                type="button"
                onClick={() => setCategory(null)}
                title={t.allCategories}
                className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 py-1 pr-2.5 pl-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:bg-sky-500/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <ChevronLeft className="size-4" aria-hidden />
                {t.categories}
              </button>
            )}
            <h2 id={titleId} className="flex-1 text-sm font-semibold text-white">
              {category ? t.cubeCategories[category] : t.chooseCube}
            </h2>
            <IconButton label={t.close} onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden />
            </IconButton>
          </header>
          {/* Two or three a row (four past twelve), an incomplete last row centered. */}
          <div className="flex flex-wrap justify-center gap-2">
            {category
              ? kindsOf(category).map((kind) => (
                  <div key={cubeKindId(kind)} className={tileWidth}>
                    <PickerTile
                      label={nameOf(kind)}
                      current={isCurrent(kind)}
                      tutorial={hasTutorial(kind.shape) ? t.withTutorial : undefined}
                      onClick={() => choose(kind)}
                    >
                      <PuzzleIcon shape={kind.shape} variant={kind.variant} className="h-full" />
                    </PickerTile>
                  </div>
                ))
              : CUBE_CATEGORIES.map((c) => (
                  <div key={c} className={tileWidth}>
                    <PickerTile
                      label={t.cubeCategories[c]}
                      detail={t.puzzleCount(kindsOf(c).length)}
                      current={!home && c === cubeCategory(current)}
                      // Marked as its puzzles are when one has a tutorial.
                      tutorial={
                        kindsOf(c).some((kind) => hasTutorial(kind.shape))
                          ? t.withTutorials
                          : undefined
                      }
                      onClick={() => setCategory(c)}
                    >
                      <CategoryIcon {...showcase(c)} />
                    </PickerTile>
                  </div>
                ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
