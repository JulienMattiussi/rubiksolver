import { Square } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { Button } from '@/components/ui/Button'

/** Stop: what plays halts (a scramble stopped, a solution paused), in
 *  place of the button that set it going. */
export function StopButton({
  onClick,
  title,
  className = '',
}: {
  onClick: () => void
  title?: string
  className?: string
}) {
  const t = useI18n((s) => s.t)
  return (
    <Button onClick={onClick} title={title} className={className}>
      <Square className="size-4" aria-hidden />
      {t.stop}
    </Button>
  )
}
