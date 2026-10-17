import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Move } from '@/lib/core/types'
import { formulaParts, occupantOf, pieceColors } from '@/lib/tutorial/tutorial'
import type { TutorialView } from '@/hooks/useTutorial'
import { useI18n } from '@/i18n/i18nStore'
import { useView } from '@/store/viewStore'
import { COLOR_HEX, HIGHLIGHT, PLACE } from '@/three/core/colors'
import { FormulaMoves } from './FormulaMoves'
import { Toned } from './Toned'

/**
 * A tutorial step's instructions, numbered: hold the puzzle (a click turns
 * the view so), spot the pieces, play the formula, check where they went.
 * Once played (`review`), the instructions done are checked off and the
 * last stands out.
 */
export function Instructions({ view, busy }: { view: TutorialView; busy: boolean }) {
  const t = useI18n((s) => s.t)
  const viewToward = useView((s) => s.viewToward)
  const { cube, step, pick, shown, review } = view
  if (!step) return null
  // Where the center to face stands: the view turns toward it.
  const front = cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === step.front)
  const name = (index: number) =>
    t.tutorial.piece(
      cube[index]!.stickers.length,
      pieceColors(cube, index, step.marker)
        .map((c) => t.colors[c].toLowerCase())
        .join('-'),
    )
  const occupant = pick ? occupantOf(cube, pick) : null
  // The formula move by move, a block it repeats shown once, with its
  // count; followed by hand, the moves played so far checked off, the next
  // one standing out, and the block's round told.
  const play = (formula: Move[], done: number) => {
    const { lead, block, times } = formulaParts(formula)
    const list = (part: Move[], playedOf: number, nextHere: boolean, inline = false) => (
      <FormulaMoves
        cube={cube}
        moves={part}
        disabled={busy || review}
        inline={inline}
        done={playedOf}
        next={done > 0 && nextHere}
      />
    )
    if (times === 0) {
      return (
        <>
          {t.tutorial.play(formula.length)}
          {list(formula, done, true)}
        </>
      )
    }
    const leadDone = Math.min(done, lead.length)
    const inBlock = Math.max(0, done - lead.length)
    // Rounds of the block played, and how far into the next.
    const rounds = Math.min(times, Math.floor(inBlock / block.length))
    const into = rounds === times ? block.length : inBlock % block.length
    const round = inBlock > 0 ? ` ${t.tutorial.round(Math.min(rounds + 1, times), times)}` : ''
    const blockList = list(block, into, leadDone === lead.length && rounds < times, true)
    return lead.length > 0 ? (
      <>
        {t.tutorial.play(lead.length)}
        {list(lead, leadDone, true)}
        <p className="mt-1.5">
          {t.tutorial.repeat(times)}
          {round}
        </p>
        {blockList}
      </>
    ) : (
      <>
        {t.tutorial.repeatAll(block.length, times)}
        {round}
        {blockList}
      </>
    )
  }
  const instructions: ReactNode[] = [
    <button
      key="hold"
      type="button"
      onClick={() => front && viewToward(front.stickers[0]!.normal)}
      title={t.tutorial.facingTitle}
      className="rounded text-left underline decoration-dotted underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      <Toned colors={[COLOR_HEX[step.front]]}>
        {t.tutorial.facing(t.colors[step.front].toLowerCase())}
      </Toned>
    </button>,
    ...(pick
      ? [
          <Toned key="spot" framed colors={occupant === null ? [HIGHLIGHT] : [HIGHLIGHT, PLACE]}>
            {occupant === null
              ? t.tutorial.spot(name(pick.piece))
              : t.tutorial.spotSwap(name(pick.piece), name(occupant))}
          </Toned>,
        ]
      : []),
    shown ? play(shown.moves, shown.done) : t.tutorial.noFormula,
    pick ? t.tutorial.check(name(pick.piece)) : t.tutorial.checkAll,
  ]
  return (
    <ol className="flex flex-col gap-2.5 text-xs leading-snug text-slate-300">
      {instructions.map((text, i) => {
        // Played: the instructions done, the last (check) to do.
        const done = review && i < instructions.length - 1
        const now = review && !done
        return (
          <li key={i} className={`flex gap-2 ${done ? 'opacity-50' : ''}`}>
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${now ? 'bg-amber-500' : 'bg-slate-700'}`}
              aria-hidden
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <div className={`min-w-0 ${now ? 'text-white' : ''}`}>{text}</div>
          </li>
        )
      })}
    </ol>
  )
}
