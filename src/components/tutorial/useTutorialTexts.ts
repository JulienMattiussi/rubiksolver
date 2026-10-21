import { useMemo } from 'react'
import type { Color, CubeColor } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useColorName } from '@/hooks/useColorName'
import { COLOR_HEX, VARIANT_SKIN } from '@/three/core/colors'
import { byThickness, LAYER_THICKNESS, tellsSizes } from '@/lib/core/shape'
import { thicknessKey } from '@/lib/tutorials/standard/terms'

/**
 * The tutorial's texts for the puzzle shown: where stickers tell sizes (a
 * mirror cube: a color is a thickness), the thickness texts over the usual
 * ones (those with a color in them), and a side or piece named by its
 * thicknesses; its swatch the variant's skin. Elsewhere, the usual texts
 * and colors.
 */
export function useTutorialTexts() {
  const t = useI18n((s) => s.t)
  const variant = useCube((s) => s.variant)
  const color = useColorName()
  return useMemo(() => {
    const usual = t.tutorial
    if (!tellsSizes(variant)) {
      return {
        ...usual,
        colorName: (c: Color) => color(c).toLowerCase(),
        swatch: (c: Color) => COLOR_HEX[c],
        /** How to hold the puzzle: by its center in front, its side, or the
         *  tutorial's own way (`Tutorial.holding`). */
        facing: (name: string, down: string, how: string) =>
          (how === 'center' ? usual.facing : (usual.holding[how] ?? usual.facingFace))(name, down),
        term: (key: string) => usual.terms[key] ?? key,
      }
    }
    const m = t.tutorialMirror
    // Its colors, thinnest first, and each thickness word's color.
    const thinnest = byThickness(LAYER_THICKNESS[variant])
    const thicknessOf: Record<string, CubeColor> = Object.fromEntries(
      thinnest.map((c) => [thicknessKey(c), c]),
    )
    return {
      ...usual,
      piece: m.piece,
      checkFigure: m.checkFigure,
      checks: { ...usual.checks, ...m.checks },
      figures: { ...usual.figures, ...m.figures },
      progress: { ...usual.progress, ...m.progress },
      titles: { ...usual.titles, ...m.titles },
      hints: { ...usual.hints, ...m.hints },
      colorName: (c: Color) => m.thickness[c as CubeColor] ?? color(c).toLowerCase(),
      swatch: () => VARIANT_SKIN[variant]!,
      facing: (name: string, down: string, how: string) =>
        (usual.holding[how] ?? m.facing)(name, down),
      term: (key: string) => {
        const color = thicknessOf[key]
        return color
          ? m.thicknessTerm(m.thickness[color], color === thinnest[0])
          : (m.terms[key] ?? usual.terms[key] ?? key)
      },
    }
  }, [t, variant, color])
}
