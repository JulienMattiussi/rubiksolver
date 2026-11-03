import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { StagedFormPicker } from '@/components/edit/StagedFormPicker'
import { solvedCube } from '@/lib/core/cube'
import { stepOf } from '@/lib/editor/entry'
import { applySectorMove } from '@/lib/puzzles/shared/sectors'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'

const STAGES = stepOf('square1', 'form')!.stages!

beforeEach(() => useCube.getState().setShape('square1'))
afterEach(() => act(() => useEditor.setState({ form: undefined, preview: undefined })))

/** The stage's choices, in order, and which of them is picked. */
const choices = () => screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'))
const pressed = () => choices().filter((b) => b.getAttribute('aria-pressed') === 'true')

describe('<StagedFormPicker />', () => {
  it('starts from nothing picked on a new entry', () => {
    render(<StagedFormPicker stages={STAGES} />)
    expect(pressed()).toHaveLength(0)
  })

  it('starts from the form being entered, back from its colors', () => {
    // Out of its box: the top turned a quarter, then slashed.
    const form = applySectorMove(applySectorMove(solvedCube('square1'), { layer: 'U', steps: 3 }), {
      flip: true,
    })
    act(() => useEditor.setState({ form }))
    render(<StagedFormPicker stages={STAGES} />)
    // Its top's outline picked, as it stands: not the box's.
    const top = STAGES.of(form)[0]!.key
    const at = STAGES.options(0, []).findIndex((o) => o.key === top)
    expect(at).toBeGreaterThan(0)
    expect(choices().indexOf(pressed()[0]!)).toBe(at)
  })
})
