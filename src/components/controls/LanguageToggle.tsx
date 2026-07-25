import { useI18n } from '@/i18n/i18nStore'
import type { Locale } from '@/i18n/translations'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'

/** French / English language switch. */
export function LanguageToggle() {
  const t = useI18n((s) => s.t)
  const locale = useI18n((s) => s.locale)
  const setLocale = useI18n((s) => s.setLocale)
  return (
    <SegmentedToggle<Locale>
      ariaLabel={t.language}
      value={locale}
      onChange={setLocale}
      options={[
        { value: 'fr', label: 'fr', title: 'Français' },
        { value: 'en', label: 'en', title: 'English' },
      ]}
    />
  )
}
