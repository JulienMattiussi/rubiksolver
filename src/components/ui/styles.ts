/** Shared Tailwind class strings of the panel, so its blocks look alike. */

/** A block of the panel (setup, solve, tutorial): a column, unframed (the
 *  panel is its frame, as the entry's; its heading sets it apart). */
export const SECTION_BOX = 'flex flex-col gap-3'

/** A scan's instruction: where to hold the puzzle, read at a glance. */
export const SCAN_WHERE = 'font-extrabold text-amber-200'

/** What sets two blocks stacked in one panel apart (the phone's single
 *  card: setup, then solve): a thin line. */
export const SECTION_RULE = 'border-t border-slate-700/60 pt-5'

/** Small-caps heading of a section, also used for field labels. */
export const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-wide text-slate-400'

/** A rotation pad's pair of buttons (a turn and its opposite, the first
 *  filled, the second outlined), framed as one control. */
export const TURN_PAIR = 'flex overflow-hidden rounded-lg border border-slate-600'
