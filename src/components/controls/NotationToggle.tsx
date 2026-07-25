import { useI18n, type Notation } from '@/i18n/i18nStore'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'

/** French (H B G D F Ar) / international (U D L R F B) move notation switch. */
export function NotationToggle() {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const setNotation = useI18n((s) => s.setNotation)
  return (
    <SegmentedToggle<Notation>
      size="sm"
      ariaLabel={t.notation}
      value={notation}
      onChange={setNotation}
      options={[
        { value: 'fr', label: 'fr', title: t.notationTitles.fr },
        { value: 'us', label: 'us', title: t.notationTitles.us },
      ]}
    />
  )
}
