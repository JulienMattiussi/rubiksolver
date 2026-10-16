import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { cubeToEdit, emptyEdit } from '@/lib/editor/editor'
import { parseMoves } from '@/lib/core/moves'
import { planKey, selectBusy, selectScrambling, solvedByTurn, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useSaved } from '@/store/savedStore'
import { jointsOf } from '@/lib/editor/jointsEditor'

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
  useEditor.setState({ mode: 'play', error: null })
})

describe('cube store', () => {
  it('scrambles, then solves the whole way', () => {
    useCube.getState().scramble()
    expect(useCube.getState().solving).toBe(false)
    drain()
    expect(isSolved(useCube.getState().cube)).toBe(false)

    useCube.getState().solveAll()
    const { steps } = useCube.getState()
    expect(useCube.getState().dispatched).toBe(steps!.reduce((n, s) => n + s.moves.length, 0))
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
    expect(useCube.getState().dispatched).toBe(steps.reduce((n, s) => n + s.moves.length, 0))
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('plays a solution one move at a time, a step finishing the step under way', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U F' L2 D B'")))
    useCube.getState().playNextMove()
    const steps = useCube.getState().steps!
    const moves = steps.flatMap((s) => [...s.moves])
    expect(useCube.getState().queue).toEqual([moves[0]])
    drain()
    // The step under way: the rest of the first step (one move already played).
    useCube.getState().playNextStep()
    expect(useCube.getState().queue).toEqual(steps[0]!.moves.slice(1))
    drain()
    while (useCube.getState().dispatched < moves.length) {
      useCube.getState().playNextMove()
      expect(useCube.getState().queue).toHaveLength(1)
      drain()
    }
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('walks the solution back: a move, the step under way, the step before', () => {
    const start = applyMoves(solvedCube(), parseMoves("R U F' L2 D B'"))
    useCube.getState().loadCube(start)
    useCube.getState().playNextStep()
    drain()
    const steps = useCube.getState().steps!
    const first = steps[0]!.moves.length
    useCube.getState().playNextMove()
    useCube.getState().playNextMove()
    drain()
    useCube.getState().undoMove()
    drain()
    expect(useCube.getState().dispatched).toBe(first + 1)
    // Within the second step: back to its start.
    useCube.getState().undoStep()
    drain()
    expect(useCube.getState().dispatched).toBe(first)
    // At a step boundary: the whole step before, back to the start.
    useCube.getState().undoStep()
    drain()
    expect(useCube.getState().dispatched).toBe(0)
    expect(useCube.getState().cube).toEqual(start)
    expect(useCube.getState().steps).toBe(steps) // the same solution, still shown
  })

  it('solves the rest of the solution under way, not a new one', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U F' L2 D B'")))
    useCube.getState().playNextMove()
    drain()
    const steps = useCube.getState().steps!
    const rest = steps.flatMap((s) => [...s.moves]).slice(1)
    useCube.getState().solveAll()
    expect(useCube.getState().queue).toEqual(rest)
    drain()
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('pauses a solution after the move under way, then carries on from there', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U F' L2 D B'")))
    useCube.getState().solveAll()
    const moves = useCube.getState().steps!.flatMap((s) => [...s.moves])
    useCube.getState().startNext() // the first move animates
    useCube.getState().pause()
    expect(useCube.getState().queue).toEqual([])
    expect(useCube.getState().active).toEqual(moves[0])
    expect(useCube.getState().dispatched).toBe(1)
    drain()
    expect(useCube.getState().solving).toBe(false)
    // The rest is still there, played from where it stopped.
    useCube.getState().playNextMove()
    expect(useCube.getState().queue).toEqual([moves[1]])
    useCube.getState().solveAll()
    drain()
    expect(isSolved(useCube.getState().cube)).toBe(true)
  })

  it('pauses then takes back the move under way (the left arrow while playing)', () => {
    const start = applyMoves(solvedCube(), parseMoves("R U F' L2 D B'"))
    useCube.getState().loadCube(start)
    useCube.getState().solveAll()
    const steps = useCube.getState().steps!
    useCube.getState().startNext() // the first move animates
    useCube.getState().pause()
    useCube.getState().undoMove()
    expect(useCube.getState().dispatched).toBe(0)
    drain()
    expect(useCube.getState().cube).toEqual(start)
    expect(useCube.getState().steps).toBe(steps)
  })

  it('says a scramble plays until it ends, is stopped, or a solution or a hand turn follows', () => {
    useCube.getState().scramble()
    expect(selectScrambling(useCube.getState())).toBe(true)
    drain()
    expect(selectScrambling(useCube.getState())).toBe(false)

    useCube.getState().scramble()
    useCube.getState().stop()
    expect(selectScrambling(useCube.getState())).toBe(false)
    useCube.getState().scramble()
    useCube.getState().pushMove({ face: 'U', amount: 1 })
    expect(selectScrambling(useCube.getState())).toBe(false)
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
    expect(useCube.getState().dispatched).toBe(0)
  })

  it('takes a solution computed ahead for the current state only, and plays it', () => {
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U R' F2")))
    const ahead = useCube.getState().prepareSolution()
    useCube.getState().loadCube(applyMoves(solvedCube(), parseMoves("R U R' F2")))
    // An answer for another state (stale) is ignored.
    useCube.getState().setPlan(ahead, 'beginner|elsewhere')
    expect(useCube.getState().steps).toBeNull()
    useCube.getState().setPlan(ahead, planKey(useCube.getState()))
    expect(useCube.getState().steps).toBe(ahead)
    expect(useCube.getState().dispatched).toBe(0)
    useCube.getState().solveAll()
    expect(useCube.getState().steps).toBe(ahead) // reused, not recomputed
    drain()
    expect(isSolved(useCube.getState().cube)).toBe(true)
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

describe('solvedByTurn', () => {
  it('fires when a turn solves the cube, never on a reset', () => {
    let shows = 0
    const unsubscribe = useCube.subscribe((next, prev) => {
      if (solvedByTurn(prev, next)) shows++
    })
    const play = (moves: string) => {
      for (const move of parseMoves(moves)) useCube.getState().pushMove(move)
      drain()
    }
    play('R U')
    play("U' R'")
    expect(shows).toBe(1)
    play('F')
    useCube.getState().reset()
    expect(shows).toBe(1)
    unsubscribe()
  })
})

describe('editor store: setting before the colors', () => {
  it("sets a Gear Cube's gears first, their pivots kept through the colors", () => {
    useCube.getState().setShape('gearU')
    const editor = () => useEditor.getState()
    editor().enter()
    expect(editor().phase).toBe('gears')
    editor().spinAt('1,1,0')
    expect(Object.keys(editor().spins)).toHaveLength(4)
    expect(editor().acceptSetup()).toBe(true)
    expect(editor().phase).toBe('paint')
    editor().editSetup()
    expect(editor().phase).toBe('gears')
    expect(Object.keys(editor().spins)).toHaveLength(4)
  })

  it("sets a RoadBlock-I's bars first, kept when its colors are cleared", () => {
    useCube.getState().setShape('roadblock')
    const editor = () => useEditor.getState()
    editor().enter()
    expect(editor().phase).toBe('bars')
    editor().turnBarsAt('2,0,0')
    editor().acceptSetup()
    editor().clearAll()
    expect(editor().twisted).toEqual(['2,0,0'])
  })
})

describe('editor store: the Camouflage face by face', () => {
  it('paints its box first, its faces on Change, each held before the next', async () => {
    useCube.getState().setShape('camo')
    const editor = () => useEditor.getState()
    editor().enter()
    expect(editor().phase).toBe('paint')
    editor().editSetup()
    expect(editor()).toMatchObject({ phase: 'faces', faceAt: 0 })
    // A face with an unpainted cell does not hold.
    useEditor.setState((s) => ({
      faces: s.faces.map((c, f) => (f === 0 ? { ...c, cells: [null, ...c.cells.slice(1)] } : c)),
    }))
    editor().tiltFace(1)
    expect(editor()).toMatchObject({ faceAt: 0, error: 'faces' })
    editor().faceCellAt(0)
    editor().setFaceColor('absent')
    editor().faceCellAt(0)
    for (const at of [1, 2, 3]) {
      editor().tiltFace(1)
      expect(editor().faceAt).toBe(at)
    }
    editor().tiltFace(-1)
    editor().tiltFace(1)
    // Past the last: its state found from its faces (at once without a
    // worker), on to its colors, the box's stickers they show painted.
    editor().tiltFace(1)
    await vi.waitFor(() => expect(editor().phase).toBe('paint'))
    expect(editor().form).toBeUndefined()
    expect(Object.keys(editor().edit).length).toBeGreaterThan(0)
  })
})

describe('editor store: the Purple face by face', () => {
  it('starts with its faces, before any form to pick, and has no thumbnails', () => {
    useCube.getState().setShape('purple')
    const editor = () => useEditor.getState()
    editor().enter()
    expect(editor()).toMatchObject({ phase: 'faces', faceAt: 0 })
    // Its box's faces, ready to change.
    expect(editor().faces).toHaveLength(4)
    expect(editor().faces[0]!.cells).toHaveLength(25)
  })
})

describe('editor store: a bandaged puzzle', () => {
  it('enters its joints, then its colors, back to its joints by Change, out by Cancel', () => {
    useCube.getState().setShape('stripe')
    const editor = () => useEditor.getState()
    editor().enter()
    expect(editor().phase).toBe('joints')
    // No form has these joints: refused.
    expect(editor().acceptSetup()).toBe(false)
    expect(editor().error).toBe('joints')
    editor().join(jointsOf(solvedCube('stripe')))
    expect(editor().acceptSetup()).toBe(true)
    expect(editor().phase).toBe('paint')
    editor().editSetup()
    expect(editor()).toMatchObject({ mode: 'edit', phase: 'joints' })
    editor().acceptSetup()
    editor().cancel()
    expect(editor().mode).toBe('play')
  })

  it('leaves at once when entered from the current state', () => {
    useCube.getState().setShape('stripe')
    useEditor.getState().enterFromCurrent()
    expect(useEditor.getState().phase).toBe('paint')
    useEditor.getState().cancel()
    expect(useEditor.getState().mode).toBe('play')
  })
})
