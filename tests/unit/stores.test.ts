import { beforeEach, describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { applyMoves } from '@/lib/turn'
import { cubeToEdit, emptyEdit } from '@/lib/editor'
import { parseMoves } from '@/lib/moves'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useSaved } from '@/store/savedStore'

/** Play the queue to the end, as the 3D loop does one frame at a time. */
function drain() {
  for (let guard = 0; selectBusy(useCube.getState()); guard++) {
    if (guard > 5000) throw new Error('drain: queue never empties')
    useCube.getState().startNext()
    useCube.getState().commitActive()
  }
}

beforeEach(() => {
  useCube.getState().setShape('3')
  useCube.getState().reset()
  useCube.getState().setMethod('beginner')
  useEditor.getState().cancel()
})

describe('cube store', () => {
  it('scrambles, then solves the whole way', () => {
    useCube.getState().scramble()
    expect(useCube.getState().solving).toBe(false)
    drain()
    expect(isSolved(useCube.getState().cube)).toBe(false)

    useCube.getState().solveAll()
    const { steps } = useCube.getState()
    expect(useCube.getState().stepIndex).toBe(steps!.length)
    expect(useCube.getState().solving).toBe(true)
    drain()
    expect(useCube.getState().solving).toBe(false)
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('plays a solution one step at a time', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U F' L2 D B'")))
    useCube.getState().playNextStep()
    const steps = useCube.getState().steps!
    expect(useCube.getState().queue).toEqual(steps[0]!.moves)
    drain()
    for (let i = 1; i < steps.length; i++) {
      useCube.getState().playNextStep()
      drain()
    }
    expect(useCube.getState().stepIndex).toBe(steps.length)
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('drops the solution when the cube is turned by hand', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves('R')))
    useCube.getState().prepareSolution()
    useCube.getState().pushMove({ face: 'U', amount: 1 })
    expect(useCube.getState().steps).toBeNull()
  })

  it('stops a playing queue where it stands, dropping the solution', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U F' L2 D")))
    useCube.getState().solveAll()
    useCube.getState().startNext()
    useCube.getState().stop()
    expect(selectBusy(useCube.getState())).toBe(false)
    // Between two steps, the old solution is neither "all played" nor resumable.
    expect(useCube.getState().steps).toBeNull()
    expect(useCube.getState().stepIndex).toBe(0)
  })

  it('ignores a switch to the shape it already has', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves('R')))
    useCube.getState().setShape('3')
    expect(isSolved(useCube.getState().cube)).toBe(false)
  })

  it('on a shape change, keeps the method if it applies, else falls back', () => {
    useCube.getState().setMethod('beginner')
    useCube.getState().setShape('2')
    expect(useCube.getState().method).toBe('beginner')
    useCube.getState().setShape('4')
    expect(useCube.getState().method).toBe('reduction')
  })

  it('drops the mirror skin on a shape that has none', () => {
    useCube.getState().setVariant('mirror')
    useCube.getState().setShape('123')
    expect(useCube.getState().variant).toBe('classic')
  })
})

describe('editor store', () => {
  it('starts a 3x3 with its six centers painted', () => {
    useEditor.getState().enter()
    expect(useEditor.getState().edit).toEqual(emptyEdit('3'))
    expect(Object.keys(useEditor.getState().edit)).toHaveLength(6)
  })

  it('applies a cube entered from the current state', () => {
    const cube = applyMoves(solvedCube(), parseMoves("R U2 F'"))
    useCube.getState().loadCube(cube)
    useEditor.getState().enterFromCurrent()
    useCube.getState().reset()
    expect(useEditor.getState().apply()).toBe(true)
    expect(useEditor.getState().mode).toBe('play')
    // Same stickers in the same spots (the rebuilt cube lists its pieces by slot).
    expect(cubeToEdit(useCube.getState().cube)).toEqual(cubeToEdit(cube))
  })

  it('refuses an incomplete entry, and reports an impossible one', () => {
    useEditor.getState().enter()
    expect(useEditor.getState().apply()).toBe(false)
    expect(useEditor.getState().error).toBeNull()

    // Two edge stickers swapped: a flipped edge, which no turn can make.
    useEditor.getState().enterFromCurrent()
    const edit = { ...useEditor.getState().edit }
    const [a, b] = Object.keys(edit).filter((k) => k.startsWith('0,1,1'))
    ;[edit[a!], edit[b!]] = [edit[b!]!, edit[a!]!]
    useEditor.setState({ edit })
    expect(useEditor.getState().apply()).toBe(false)
    expect(useEditor.getState().error).toBe('impossible')
  })
})

describe('saved store', () => {
  it('drops an entry that no longer decodes instead of loading it', () => {
    useSaved.setState({ saved: { '3': { cube: 'garbage', savedAt: 0 } } })
    useSaved.getState().restore('3')
    expect(useSaved.getState().saved['3']).toBeUndefined()
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })
})
