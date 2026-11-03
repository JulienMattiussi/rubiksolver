import type { PUZZLES_FR } from '../fr/puzzles'

/** What a puzzle's page says of it (see the French source). */
export const PUZZLES_EN: typeof PUZZLES_FR = {
  gearCube: {
    summary:
      'Gears in place of its edges: the Gear Cube looks fearsome, yet it is the easiest of its family. Turn it in 3D and solve it step by step.',
    about:
      'The Gear Cube keeps the outline of a 3x3, but nothing turns on its own: its edges are **gears**, and each half turn of a face drives the middle slice a quarter turn. It looks fearsome, yet it is the ideal way into the family: its gears lock so many moves that it has only **41,472 positions**, against over 43 quintillion for a Rubik’s Cube.',
    methodsTitle: 'The corners, then the rest',
    methods:
      'One method: the corners by intuition, then the edges, and you finish by turning the gears the right way round. A few short formulas are enough, easy to remember.',
  },
  gearU: {
    summary:
      'Twisted joints, gears for edges: the Gear Cube Ultimate surprises you at every turn. Turn it in 3D and learn to solve it step by step.',
    about:
      'With its twisted joints, the Gear Cube Ultimate looks like no other cube, and it surprises you even more once in hand: its edges are **gears**. A half turn of a face drives the middle slice a quarter turn, and **the cube only gets its shape back every three turns**. Baffling at first, this constraint soon becomes an ally: with a little practice, you find it makes the puzzle easier to solve.',
    methodsTitle: 'A single method',
    methods:
      'One method to beat it: the corners first, then the edges, and you finish by turning the gears the right way round. The tutorial teaches it step by step, until you know every formula by heart.',
  },
  gearX: {
    summary:
      'A top and a bottom that turn like a 3x3, sides driven by gears: the Gear Cube Extreme blends two worlds. Turn it in 3D and solve it step by step.',
    about:
      'The Gear Cube Extreme is a baffling hybrid: its top and bottom turn a quarter turn, as on an ordinary Rubik’s Cube, while its sides obey **gears**. The two logics keep crossing, and **a turned side only closes the cube again after three turns**. The most demanding of the family, and the most rewarding once tamed.',
    methodsTitle: 'The equator first',
    methods:
      'A method in seven steps: first the middle belt, then the corners, the edges, their clips and finally the gears. Longer than its cousins’, it moves steadily, each step touching only its own pieces.',
  },
}
