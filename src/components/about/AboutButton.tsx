import { Info } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { IconButton } from '@/components/ui/IconButton'
import { useView } from '@/store/viewStore'
import { useAboutShape } from './useAboutShape'

/** Opens the puzzle's page in its dialog (AboutDialog), where the screen
 *  leaves no room for its cards (AboutCards): a phone, a narrow window. */
export function AboutButton() {
  const t = useI18n((s) => s.t)
  const setAboutOpen = useView((s) => s.setAboutOpen)
  const shape = useAboutShape()
  if (shape) return null
  return (
    <IconButton label={t.aboutPuzzle} onClick={() => setAboutOpen(true)}>
      <Info className="size-5" aria-hidden />
    </IconButton>
  )
}
