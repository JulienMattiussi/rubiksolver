import { useI18n } from '@/i18n/i18nStore'
import { SECTION_LABEL } from '@/components/ui/styles'
import { MoveGuideButton } from '@/components/guide/MoveGuideButton'
import { NotationToggle } from './NotationToggle'
import { RecenterButton } from './RecenterButton'

/** Title line of a rotation pad, with the recenter and notation switches,
 *  then the move guide's button. */
export function PadHeader() {
  const t = useI18n((s) => s.t)
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={SECTION_LABEL}>{t.moves}</h2>
        <div className="flex items-center gap-2">
          <RecenterButton />
          <NotationToggle />
        </div>
      </div>
      <MoveGuideButton />
    </>
  )
}
