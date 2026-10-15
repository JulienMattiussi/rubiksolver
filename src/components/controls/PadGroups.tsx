import type { ReactNode } from 'react'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadSection } from './PadSection'

/** A group of a pad's layers, under its title (none: the bare grid). */
export type PadGroup<L> = { key: string; title?: string; layers: readonly L[] }

/** The groups of a rotation pad, each a title then its layers, a pair of
 *  buttons each (`pair`: a turn and its opposite), two pairs a row. */
export function PadGroups<G extends PadGroup<unknown>>({
  groups,
  layerKey,
  pair,
}: {
  groups: readonly G[]
  layerKey: (layer: G['layers'][number]) => string
  pair: (layer: G['layers'][number], group: G) => ReactNode
}) {
  return (
    <>
      {groups.map((group) => {
        const grid = (
          <div key={group.key} className="grid grid-cols-2 gap-2">
            {group.layers.map((layer) => (
              <div key={layerKey(layer)} className={TURN_PAIR}>
                {pair(layer, group)}
              </div>
            ))}
          </div>
        )
        return group.title === undefined ? (
          grid
        ) : (
          <PadSection key={group.key} title={group.title}>
            {grid}
          </PadSection>
        )
      })}
    </>
  )
}
