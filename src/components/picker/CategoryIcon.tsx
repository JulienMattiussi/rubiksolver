import type { CubeShape, CubeVariant } from '@/lib/types'
import { PuzzleIcon } from './PuzzleIcon'

interface Puzzle {
  readonly shape: CubeShape
  readonly variant: CubeVariant
}

/**
 * Picture of a category: its puzzles grouped, the cover one in front and up
 * to two others smaller behind it, one on each side. Several puzzles at once
 * is what tells a category tile from a single puzzle's.
 */
export function CategoryIcon({ cover, others }: { cover: Puzzle; others: readonly Puzzle[] }) {
  const [left, right] = others
  const side = (p: Puzzle | undefined) =>
    p && <PuzzleIcon shape={p.shape} variant={p.variant} className="-mx-2 h-3/5 opacity-90" />
  return (
    <span className="flex h-full items-end justify-center">
      {side(left)}
      <PuzzleIcon
        shape={cover.shape}
        variant={cover.variant}
        className="relative z-10 -mx-2 h-full drop-shadow-lg"
      />
      {side(right)}
    </span>
  )
}
