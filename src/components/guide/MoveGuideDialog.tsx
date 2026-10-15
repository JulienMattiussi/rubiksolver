import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { describeMove, moveGuide } from '@/lib/app/moveGuide'
import { formatMove } from '@/lib/core/moves'
import { turnAllowed } from '@/lib/core/turn'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { GuideCanvas } from '@/three/guide/GuideCanvas'
import { IconButton } from '@/components/ui/IconButton'
import { Modal } from '@/components/ui/Modal'

/** Share of the list's height, top and bottom, outside the band where rows
 *  play: only the rows in the middle animate. */
const BAND_MARGIN = '-30% 0px -30% 0px'

/**
 * The move guide: every turn of the current puzzle, one row per turn and its
 * opposite, each shown on the puzzle as it is now, with its notation and a
 * sentence. One WebGL canvas draws every tile (GuideCanvas); the rows in the
 * middle of the scrolled list play, the others stand still.
 */
export function MoveGuideDialog({ onClose }: { onClose: () => void }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const cube = useCube((s) => s.cube)
  const variant = useCube((s) => s.variant)
  const shape = cubeShape(cube)
  const dims = cubeDims(cube)
  const groups = useMemo(() => moveGuide(shape), [shape])
  const titleId = useId()

  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())
  const tileRefs = useRef(new Map<string, HTMLElement>())
  const [playing, setPlaying] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        setPlaying((before) => {
          const next = new Set(before)
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.row!
            if (entry.isIntersecting) next.add(id)
            else next.delete(id)
          }
          return next
        }),
      { root: listRef.current, rootMargin: BAND_MARGIN },
    )
    rowRefs.current.forEach((row) => observer.observe(row))
    return () => observer.disconnect()
  }, [groups])

  const rows = groups.flatMap((group, g) =>
    group.rows.map((turns, r) => ({ id: `${g}-${r}`, group, first: r === 0, turns })),
  )
  const tiles = rows.flatMap((row) =>
    row.turns.map((turn, k) => {
      const key = `${row.id}-${k}`
      return {
        key,
        track: () => tileRefs.current.get(key) ?? null,
        cube,
        variant,
        turn,
        playing: playing.has(row.id),
      }
    }),
  )

  return (
    <Modal labelledBy={titleId} onClose={onClose} width="max-w-2xl">
      <header className="mb-2 flex items-center gap-2">
        <h2 id={titleId} className="flex-1 text-sm font-semibold text-white">
          {t.moveGuide}
        </h2>
        <IconButton label={t.close} onClick={onClose}>
          <X className="size-4" aria-hidden />
        </IconButton>
      </header>
      <p className="mb-3 text-xs text-slate-400">{t.moveGuideIntro}</p>
      <div className="relative">
        <GuideCanvas tiles={tiles} />
        <div ref={listRef} className="relative z-10 max-h-[65vh] overflow-y-auto pr-1 pb-[25vh]">
          {rows.map((row) => (
            <section
              key={row.id}
              data-row={row.id}
              ref={(el) => {
                if (el) rowRefs.current.set(row.id, el)
                else rowRefs.current.delete(row.id)
              }}
            >
              {row.first && (
                <h3 className="mt-2 mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {t.guideSections[row.group.section]}
                </h3>
              )}
              <div className="mb-3 grid grid-cols-2 gap-2">
                {row.turns.map((turn, k) => {
                  const key = `${row.id}-${k}`
                  const blocked = !turnAllowed(cube, turn)
                  return (
                    <figure key={key} className="rounded-lg border border-slate-700/60 p-2">
                      <div
                        ref={(el) => {
                          if (el) tileRefs.current.set(key, el)
                          else tileRefs.current.delete(key)
                        }}
                        className="relative h-32 overflow-hidden rounded-md sm:h-40"
                      >
                        <span className="absolute top-1 left-1 z-10 rounded bg-slate-900/70 px-1.5 font-mono text-base font-semibold text-white">
                          {formatMove(turn, labels, dims, shape)}
                        </span>
                        {blocked && (
                          <p className="absolute inset-0 flex items-center justify-center bg-slate-900/70 p-3 text-center text-xs font-medium text-amber-200">
                            {t.guideBlocked}
                          </p>
                        )}
                      </div>
                      <figcaption className="mt-2 text-xs leading-snug text-slate-300">
                        {t.describeMove(describeMove(turn, shape))}
                      </figcaption>
                    </figure>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  )
}
