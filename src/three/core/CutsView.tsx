import { useState } from 'react'
import type { CutsSpec } from '@/lib/editor/entry'
import { useEditor } from '@/store/editorStore'
import { EMPTY_COLOR } from './colors'
import { PolyPiece } from './PolyPiece'
import type { PolyDrawing } from './polyDrawing'

/** A puzzle's half-cubies being laid (its entry's cuts step, modes/cuts):
 *  drawn as its cells say, gray but the pieces that never move; a click
 *  turns a cell's halves round, its halves lit up together. */
export function CutsView({ spec, drawing }: { spec: CutsSpec; drawing: PolyDrawing }) {
  const cuts = useEditor((s) => s.cuts)
  const cutAt = useEditor((s) => s.cutAt)
  // The cell under the pointer: its halves light up together.
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      {spec.pieces(cuts).map(({ cubie, cell }) => (
        <PolyPiece
          key={cubie.position.join()}
          cubie={cubie}
          drawing={drawing}
          stickerHex={cell ? () => EMPTY_COLOR : undefined}
          onSelect={cell ? () => cutAt(cell) : undefined}
          onHover={
            cell
              ? (_, on) =>
                  setHoveredCell((current) => (on ? cell : current === cell ? null : current))
              : undefined
          }
          highlighted={cell !== undefined && hoveredCell === cell}
        />
      ))}
    </group>
  )
}
