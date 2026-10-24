/** A text with words between `**` in bold (a glossary's word defined, how
 *  many times to repeat; where to hold a puzzle, in a scan's instruction),
 *  `strong` their style. */
export function Bolded({
  text,
  strong = 'font-semibold text-white',
}: {
  text: string
  strong?: string
}) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 ? (
          <strong key={i} className={strong}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
