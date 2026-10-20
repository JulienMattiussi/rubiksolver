import { solvedCube } from '@/lib/core/cube'
import type { CubeShape } from '@/lib/core/shapes'
import type { Tutorial } from '@/lib/teach/tutorial'
import { PuzzleIcon } from '@/components/picker/PuzzleIcon'
import { useCube } from '@/store/cubeStore'
import { useTutorialTexts } from './useTutorialTexts'

/** A legend piece's name, capitalized (« Le coin A »). */
const legendName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)

/** A piece's picture, front or back (decorative: its name says it). */
export function PiecePicture({
  shape,
  piece,
  back,
  className = 'size-14',
}: {
  shape: CubeShape
  piece: number
  back: boolean
  className?: string
}) {
  const variant = useCube((s) => s.variant)
  return (
    <PuzzleIcon
      shape={shape}
      variant={variant}
      piece={{ index: piece, back }}
      className={className}
    />
  )
}

/** The legend of a puzzle whose pieces are told by shape: its pieces by
 *  kind (the corners, then the edges), each apart under its heading, and
 *  each piece by its name, front and back. */
export function LegendGrid({ tutorial, shape }: { tutorial: Tutorial; shape: CubeShape }) {
  const tx = useTutorialTexts()
  const solved = solvedCube(shape)
  if (!tutorial.legend) return null
  const kindOf = (piece: number) => tutorial.pieceKind(solved[piece]!)
  const kinds = [...new Set(tutorial.legend.labels.map(({ piece }) => kindOf(piece)))]
  return (
    <div className="mt-2 flex flex-col gap-3">
      {kinds.map((kind, k) => (
        <section key={kind} className={k > 0 ? 'border-t border-slate-700 pt-3' : ''}>
          <h4 className="text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
            {tx.legendKinds[kind] ?? kind}
          </h4>
          <ul className="mt-1.5 grid grid-cols-2 gap-2">
            {tutorial
              .legend!.labels.filter(({ piece }) => kindOf(piece) === kind)
              .map(({ piece, label }) => (
                <li key={piece} className="rounded-lg bg-slate-800/70 p-2">
                  <p className="text-xs font-semibold text-slate-200">
                    {legendName(tx.labelled(kind, label))}
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {[false, true].map((back) => (
                      <figure key={String(back)} className="flex min-w-0 flex-col items-center">
                        <PiecePicture
                          shape={shape}
                          piece={piece}
                          back={back}
                          className="aspect-square w-full max-w-14"
                        />
                        <figcaption className="text-[10px] text-slate-400">
                          {back ? tx.legendBack : tx.legendFront}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
