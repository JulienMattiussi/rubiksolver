/** A text with words between `**` in bold (a glossary's word defined). */
export function Bolded({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) =>
        i % 2 ? (
          <strong key={i} className="font-semibold text-white">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
