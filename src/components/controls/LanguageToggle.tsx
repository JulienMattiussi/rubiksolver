import { useI18n } from '@/i18n/i18nStore'
import type { Locale } from '@/i18n/translations'
import { goTo } from '@/store/router'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'

/** French / English language switch, through the address (`#/en/...`). */
export function LanguageToggle() {
  const t = useI18n((s) => s.t)
  const locale = useI18n((s) => s.locale)
  return (
    <SegmentedToggle<Locale>
      ariaLabel={t.language}
      value={locale}
      onChange={(locale) => goTo({ locale })}
      options={[
        { value: 'fr', label: 'fr', title: 'Français' },
        { value: 'en', label: 'en', title: 'English' },
      ]}
    />
  )
}
