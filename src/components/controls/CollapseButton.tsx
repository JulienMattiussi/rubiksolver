import { ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { IconButton } from '@/components/ui/IconButton'

/** Mobile-only toggle that collapses the panel to its compact bar. */
export function CollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const t = useI18n((s) => s.t)
  return (
    <IconButton label={collapsed ? t.expand : t.collapse} onClick={onToggle} className="sm:hidden">
      {collapsed ? (
        <ChevronDown className="size-5" aria-hidden />
      ) : (
        <ChevronUp className="size-5" aria-hidden />
      )}
    </IconButton>
  )
}
