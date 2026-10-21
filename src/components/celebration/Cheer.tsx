/** A 💪 in front of everything, growing in, beating twice and fading out
 *  (`animate-cheer`, index.css): a step done (a tutorial stage, a face
 *  scanned). Give each one its own key, so a new one starts afresh. */
export function Cheer({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      <span className="animate-cheer text-[9rem] drop-shadow-2xl" onAnimationEnd={onDone}>
        💪
      </span>
    </div>
  )
}
