import { Check } from 'lucide-react'
import type { CubeShape } from '@/lib/core/types'
import { piecesLeft } from '@/lib/editor/modes/joints'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'

/** A piece's picture: its cells, 1 by 2 or 2 by 2, one tile. */
function PieceIcon({ wide, tall }: { wide: number; tall: number }) {
  const cell = 9
  return (
    <svg
      viewBox={`0 0 ${wide * cell + 2} ${tall * cell + 2}`}
      className="h-5 shrink-0"
      style={{ width: `${((wide * cell + 2) / (tall * cell + 2)) * 1.25}rem` }}
      aria-hidden
    >
      <rect
        x={1}
        y={1}
        width={wide * cell}
        height={tall * cell}
        rx={1.5}
        className="fill-sky-500/30 stroke-sky-300"
        strokeWidth={1}
      />
    </svg>
  )
}

/**
 * While a bandaged puzzle's joints are entered: the 2x1s and 2x2s it has
 * left to fuse (jointsEditor.ts), each with its picture; a kind it lacks
 * is not shown.
 */
export function PiecesLeft({ shape }: { shape: CubeShape }) {
  const t = useI18n((s) => s.t)
  const joints = useEditor((s) => s.joints)
  const { pairs, squares } = piecesLeft(shape, joints)
  const rows = [
    { kind: '2x1', count: pairs, wide: 2, tall: 1 },
    { kind: '2x2', count: squares, wide: 2, tall: 2 },
  ].filter((row) => row.count.total > 0)
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ kind, count, wide, tall }) => (
        <li
          key={kind}
          className="flex items-center gap-3 text-sm text-slate-200"
          aria-label={t.piecesLeftLabel(kind, count.left)}
        >
          <span className="flex w-7 justify-center">
            <PieceIcon wide={wide} tall={tall} />
          </span>
          <span className="w-8 font-medium">{kind}</span>
          <span className={count.left ? '' : 'text-slate-400'}>{t.piecesLeft(count.left)}</span>
          {!count.left && <Check className="size-4 text-emerald-400" aria-hidden />}
        </li>
      ))}
    </ul>
  )
}
