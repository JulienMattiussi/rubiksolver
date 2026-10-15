import { useState, type ReactNode } from 'react'
import type { CubeShape } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { PadSection } from './PadSection'

/** A pad's two tabs, when its kinds of layers do not fit stacked. */
type LayerGroup = 'outer' | 'inner'

/** Rows of buttons a pad stacks at most, every kind of layer at once (as
 *  many as the Megaminx's): past them, the kinds go in tabs. */
const STACKED_ROWS = 6

/**
 * The kinds of layers of a rotation pad: every kind stacked, each under its
 * name, when they all fit (`rows`, the rows of buttons a kind shows);
 * otherwise two tabs, each stacked: the outer layers (`isOuter`), then the
 * inner ones. On a new puzzle, the first tab where something turns
 * (`playable`: a tab may hold only turns the state jams).
 */
export function LayerTabs<K extends string>({
  shape,
  kinds,
  rows,
  isOuter,
  playable = () => true,
  nameOf,
  grid,
}: {
  shape: CubeShape
  kinds: readonly K[]
  rows: (kind: K) => number
  isOuter: (kind: K) => boolean
  playable?: (kind: K) => boolean
  nameOf: (kind: K) => string
  /** A kind's buttons. */
  grid: (kind: K) => ReactNode
}) {
  const t = useI18n((s) => s.t)
  const stacked = kinds.reduce((n, k) => n + rows(k), 0) <= STACKED_ROWS
  const groups: { key: LayerGroup; kinds: readonly K[] }[] = stacked
    ? [{ key: 'outer', kinds }]
    : (['outer', 'inner'] as const)
        .map((key) => ({ key, kinds: kinds.filter((k) => isOuter(k) === (key === 'outer')) }))
        .filter((g) => g.kinds.length > 0)
  const [picked, setPicked] = useState<{ shape: string; group: LayerGroup | null }>({
    shape: '',
    group: null,
  })
  if (picked.shape !== shape) {
    setPicked({ shape, group: groups.find((g) => g.kinds.some(playable))?.key ?? null })
  }
  const current = groups.find((g) => g.key === picked.group && picked.shape === shape) ?? groups[0]!
  return (
    <>
      {groups.length > 1 && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={current.key}
            onChange={(group) => setPicked({ shape, group })}
            options={groups.map((g) => ({ value: g.key, label: t.layerGroups[g.key] }))}
          />
        </div>
      )}
      {current.kinds.length > 1
        ? current.kinds.map((k) => (
            <PadSection key={k} title={nameOf(k)}>
              {grid(k)}
            </PadSection>
          ))
        : grid(current.kinds[0]!)}
    </>
  )
}
