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
      {/* The panel stands at the bottom: up unfolds it, down folds it. */}
      {collapsed ? (
        <ChevronUp className="size-5" aria-hidden />
      ) : (
        <ChevronDown className="size-5" aria-hidden />
      )}
    </IconButton>
  )
}
