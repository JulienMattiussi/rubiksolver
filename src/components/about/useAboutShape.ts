import { useSyncExternalStore } from 'react'

/** The panel's cards, their margin and the gap after them, on each side of
 *  the screen (px): where the scene's free room starts. */
const PANEL = 360
/** As the camera first frames it (camera.ts, Scene's field of view), the
 *  puzzle seen corner on, as shares of the screen's height: how wide it
 *  stands at its widest, and the room left above its top corner. */
const PUZZLE_WIDTH = 0.66
const ABOVE_TOP = 0.06
/** How far down the text narrows to its column, as a share of the
 *  screen's height: steep enough that its slant shows, above the puzzle's
 *  top edge all the way. */
const SLANT = 0.24
/** Between the text and the puzzle (px). */
const GAP = 32
/** The card's width beside the puzzle, at its bottom (px): its text cut
 *  there anyway, shown whole on hover (SlantedCard). */
const NARROWEST = 100
/** Its width at the top (px): narrower, its title and first lines would
 *  not read; wider, a line would be too long to read. */
const TOP_NARROWEST = 300
const WIDEST = 460

/** The room the text takes on each side of the puzzle, as a triangle
 *  following the puzzle's top edges: `top` px wide at the top, narrowing
 *  down to `column` px at `drop` px, then as wide down to the bottom. */
export interface AboutShape {
  readonly top: number
  readonly column: number
  readonly drop: number
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

let last: AboutShape | null = null

function shape(): AboutShape | null {
  const width = window.innerWidth
  const height = window.innerHeight
  const column = Math.floor((width - 2 * PANEL - PUZZLE_WIDTH * height) / 2 - GAP)
  const top = Math.floor(Math.min(WIDEST, width / 2 - PANEL - ABOVE_TOP * height))
  const drop = Math.floor(SLANT * height)
  const next =
    column >= NARROWEST && top >= TOP_NARROWEST
      ? { top: Math.max(top, column), column, drop }
      : null
  // The same object while nothing changes (useSyncExternalStore).
  if (next?.top !== last?.top || next?.column !== last?.column || next?.drop !== last?.drop)
    last = next
  return last
}

/** The room the puzzle's page takes on both sides of it (AboutCards), none
 *  where the screen leaves it too little (AboutButton then). */
export function useAboutShape(): AboutShape | null {
  return useSyncExternalStore(subscribe, shape)
}
