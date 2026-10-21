import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ColorWords } from '@/components/edit/scan/ColorWords'

describe('ColorWords', () => {
  it('puts a swatch before each color named, the text kept whole', () => {
    const { container } = render(
      <ColorWords
        text="le centre vert face à l’objectif, le blanc en haut"
        colors={[
          { color: 'W', name: 'blanc' },
          { color: 'G', name: 'vert' },
        ]}
      />,
    )
    expect(container.textContent).toBe('le centre vert face à l’objectif, le blanc en haut')
    const swatches = [...container.querySelectorAll('[aria-hidden]')]
    expect(swatches.map((s) => (s as HTMLElement).style.backgroundColor)).toHaveLength(2)
    // In the order they come: green first.
    expect(swatches[0]!.nextSibling?.textContent).toMatch(/^vert/)
  })
})
