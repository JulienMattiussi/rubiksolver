import { BookOpen, Pencil, Sparkles, type LucideIcon } from 'lucide-react'

/**
 * The app's three features, each with its own icon and color, the same on
 * the home page's cards and on the buttons that open them: entering a cube
 * (sky), the move guide (violet), solving (amber).
 */
export type Feature = 'edit' | 'guide' | 'solve'

export const FEATURE_ICON: Record<Feature, LucideIcon> = {
  edit: Pencil,
  guide: BookOpen,
  solve: Sparkles,
}

/** The home page's icon chip of each feature. */
export const FEATURE_CHIP: Record<Feature, string> = {
  edit: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  guide: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
  solve: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
}

/** The button opening each feature: tinted like its chip, solving (the
 *  main action) filled. */
export const FEATURE_BUTTON: Record<Feature, string> = {
  edit: 'bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-400/40 hover:bg-sky-500/25',
  guide:
    'bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-400/40 hover:bg-violet-500/25',
  solve:
    'bg-amber-400 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300',
}
