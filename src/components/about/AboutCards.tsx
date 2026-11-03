import { useCallback, useState } from 'react'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { AboutDialog } from './AboutDialog'
import { SlantedCard } from './SlantedCard'
import { useAbout } from './useAbout'
import { useAboutShape } from './useAboutShape'
import { useArrival } from './useArrival'

/** The panel's cards' padding, above and below a text (px). */
const PAD = 20

/**
 * The puzzle's page on a wide screen, in the room the scene leaves on both
 * sides of the puzzle, beside the panel's cards: two cards of their kind,
 * mirrored, cut along a slant that hugs the puzzle's top (SlantedCard),
 * both as tall as the taller text needs. Its name and what it is like on
 * the left, its methods on the right. Open on arrival, folded at the
 * reader's first gesture (useArrival). Hidden while entering a puzzle or
 * during the tutorial, which need the room; always in the page, so that
 * what a search engine reads is what the reader sees.
 */
export function AboutCards() {
  const t = useI18n((s) => s.t)
  const about = useAbout()
  const shape = useAboutShape()
  const editing = useEditor((s) => s.mode === 'edit')
  const tutorial = useTutorialStore((s) => s.active)
  const arriving = useArrival()
  const [heights, setHeights] = useState({ left: 0, right: 0 })
  const onLeft = useCallback((left: number) => setHeights((h) => ({ ...h, left })), [])
  const onRight = useCallback((right: number) => setHeights((h) => ({ ...h, right })), [])
  // No room: in its dialog instead (AboutButton opens it).
  if (!shape) return <AboutDialog />
  const height = Math.max(heights.left, heights.right) + 2 * PAD
  const card = { ...shape, height, shown: arriving }
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${editing || tutorial ? 'hidden' : ''} ${
        height > 2 * PAD ? '' : 'invisible'
      }`}
    >
      {about.about && (
        <SlantedCard
          {...card}
          label={t.aboutPuzzleLabel}
          title={about.name}
          text={about.about}
          side="left"
          onMeasure={onLeft}
        />
      )}
      <SlantedCard
        {...card}
        label={t.aboutMethodsLabel}
        title={about.methodsTitle}
        text={about.methods}
        side="right"
        onMeasure={onRight}
      />
    </div>
  )
}
