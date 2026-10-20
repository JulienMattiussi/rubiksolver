/**
 * A step's progress in words, its two numbers in the progress dots' colors
 * (for a count too long for dots: a 5x5's 48 centers): the total green, the
 * count done gray at first and greener at each piece, both bold. The words
 * stay as the texts say them; the numbers are found in them, done first.
 */
export function ProgressCount({
  text,
  done,
  total,
}: {
  text: string
  done: number
  total: number
}) {
  const at = text.indexOf(String(done))
  const of = at < 0 ? -1 : text.indexOf(String(total), at + String(done).length)
  if (of < 0) return <>{text}</>
  const share = total > 0 ? Math.round((100 * done) / total) : 0
  return (
    <span>
      {text.slice(0, at)}
      <span
        className="font-semibold"
        style={{
          color: `color-mix(in oklab, var(--color-emerald-400) ${share}%, var(--color-slate-600))`,
        }}
      >
        {done}
      </span>
      {text.slice(at + String(done).length, of)}
      <span className="font-semibold text-emerald-400">{total}</span>
      {text.slice(of + String(total).length)}
    </span>
  )
}
