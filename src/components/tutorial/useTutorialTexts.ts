import { useMemo } from 'react'
import type { Color, CubeColor } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { COLOR_HEX, MIRROR_STICKER } from '@/three/core/colors'
import { byThickness, LAYER_THICKNESS } from '@/lib/core/shape'
import { thicknessKey } from '@/lib/tutorials/standard/terms'

/** The mirror's colors, thinnest first, and each thickness word's color. */
const THINNEST = byThickness(LAYER_THICKNESS.mirror)
const THICKNESS_OF: Record<string, CubeColor> = Object.fromEntries(
  THINNEST.map((c) => [thicknessKey(c), c]),
)

/**
 * The tutorial's texts for the puzzle shown: on a mirror cube, where a
 * color is a thickness, the mirror's texts over the usual ones (those with
 * a color in them), and a side or piece named by its thicknesses; its
 * swatch the mirror's gold. Elsewhere, the usual texts and colors.
 */
export function useTutorialTexts() {
  const t = useI18n((s) => s.t)
  const mirror = useCube((s) => s.variant) === 'mirror'
  return useMemo(() => {
    const usual = t.tutorial
    if (!mirror) {
      return {
        ...usual,
        colorName: (c: Color) => t.colors[c].toLowerCase(),
        swatch: (c: Color) => COLOR_HEX[c],
        facing: (name: string, center: boolean) => (center ? usual.facing : usual.facingFace)(name),
        term: (key: string) => usual.terms[key] ?? key,
      }
    }
    const m = t.tutorialMirror
    return {
      ...usual,
      piece: m.piece,
      checkFigure: m.checkFigure,
      checks: { ...usual.checks, ...m.checks },
      figures: { ...usual.figures, ...m.figures },
      progress: { ...usual.progress, ...m.progress },
      titles: { ...usual.titles, ...m.titles },
      hints: { ...usual.hints, ...m.hints },
      colorName: (c: Color) => m.thickness[c as CubeColor] ?? t.colors[c].toLowerCase(),
      swatch: () => MIRROR_STICKER,
      facing: (name: string) => m.facing(name),
      term: (key: string) => {
        const color = THICKNESS_OF[key]
        return color
          ? m.thicknessTerm(m.thickness[color], color === THINNEST[0])
          : (m.terms[key] ?? usual.terms[key] ?? key)
      },
    }
  }, [t, mirror])
}
