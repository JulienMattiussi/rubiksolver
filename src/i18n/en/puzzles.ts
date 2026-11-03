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
  dino: {
    summary:
      'No centers, no corners: the Dino Cube is made only of edges turning around its corners. Turn it in 3D and solve it step by step.',
    about:
      'The Dino Cube has something baffling about it: **it has no centers and no corners**, only twelve triangle-cut edges, which each corner turns three at a time. The colors first seem to mix at random, then the logic shows, and it becomes a delightful little puzzle, ideal to get into diagonal cuts.',
    methodsTitle: 'A single formula',
    methods:
      'It is solved layer by layer with a single formula, which cycles three edges without disturbing anything else. Once you have it in hand, the whole cube follows.',
  },
  skewb: {
    summary:
      'The Skewb turns by its corners, cutting the cube in half: baffling, then surprisingly simple. Learn to solve it step by step with its tutorial.',
    about:
      'The Skewb does not turn by its faces but by its corners: each turn **cuts the cube into two halves** along a diagonal, and everything seems to tip at once. The first contact unsettles, yet **it is solved with a handful of moves**: the best starting point for diagonal-cut puzzles.',
    methodsTitle: 'The top first',
    methods:
      'A simple method: finish the top first, then all the rest by turning only the bottom, since the top center never moves. The tutorial walks you through it move by move.',
  },
  ivy: {
    summary:
      'Rounded leaves, four corners turning in place: the Ivy Cube is the gentlest of the diagonal-cut puzzles. Turn it in 3D and solve it.',
    about:
      'With its rounded leaves, the Ivy Cube looks more like a design object than a puzzle. Only four corners turn, in place, carrying the leaves around them, and **it often gets solved by accident**, just by playing with it: enough to taste diagonal cuts without getting lost.',
    methodsTitle: 'Face by face',
    methods:
      'A short method: one face, then the opposite face, then the four remaining centers. A few well-chosen turns are enough to beat it.',
  },
  masterSkewb: {
    summary:
      'The Master Skewb, a Skewb cut more finely: the same moves, over three times as many pieces. Turn it in 3D and solve it step by step.',
    about:
      'The Master Skewb keeps the Skewb’s moves, but each corner can carry a whole half of the cube or a mere slice, and its faces break into edges and petals: **fifty pieces** instead of fourteen. In hand, the effect is striking, almost hypnotic. Longer than a Skewb, it stays within reach of anyone who knows its big brother.',
    methodsTitle: 'Skewb first',
    methods:
      'Solve it first as a Skewb, ignoring the small pieces, then sort its edges and petals with commutators, those formulas that swap three pieces without touching the rest.',
  },
  copter: {
    summary:
      'The Curvy Copter turns by its edges, in half turns, and its curved leaves slide from face to face. Turn it in 3D and solve it step by step.',
    about:
      'Here it is no longer the faces or the corners that turn, but **the edges**, a half turn at a time. The curved leaves slide from face to face, and the cube soon looks like an unreadable mosaic. Yet its edges never leave their place: once you find that landmark, the puzzle lets itself be tamed.',
    methodsTitle: 'The edges as landmarks',
    methods:
      'Its edges never leave their place: they give each face its color, and you sort everything else around them, one kind of piece after another.',
  },
  copter3: {
    summary:
      'The Curvy Copter III adds centers and petals to the Curvy Copter: the same dance of edges, even richer. Turn it in 3D and solve it.',
    about:
      'The Curvy Copter III keeps the Curvy Copter’s mechanism, its edges turning a half turn, but its deeper cuts add **centers and twenty-four petals** carried along at each turn. Scrambled, it is lavishly beautiful, and solving it takes more patience than genius.',
    methodsTitle: 'The same compass',
    methods:
      'The same method as its little brother: its edges stay in place and give the colors, and you sort the corners, centers and petals around them, one kind of piece after another.',
  },
  rex: {
    summary:
      'The Rex Cube, a Dino Cube cut deeper: edges, centers and rounded petals mix at every turn. Turn it in 3D and solve it step by step.',
    about:
      'The Rex Cube turns like the Dino Cube, by its corners, but its rounded cuts go deeper: each turn carries **three edges, three centers and nine petals**. Its curves give it great charm, and it solves far more calmly than it looks.',
    methodsTitle: 'From edges to petals',
    methods:
      'A method in three moves: the edges, then the centers, then the petals, each formula disturbing only what is left to do. You move forward without ever going back.',
  },
  fisher: {
    summary:
      'The Fisher Cube is a Rubik’s Cube in disguise: cut at a slant, it changes shape at every turn. Solve it step by step, with the method of your choice.',
    about:
      'The Fisher Cube hides its game: it is **a Rubik’s Cube in disguise**, cut from a cube turned an eighth of a turn. The mechanism is the same, but it changes shape at every turn into unlikely outlines, and its side centers, set at a slant, show which way they face. Your brain protests, then has fun: if you can solve a 3x3, you can almost solve this one.',
    methodsTitle: 'Like a Rubik’s Cube',
    methods:
      'Four 3x3 methods to choose from, layer by layer, CFOP, Petrus or ZZ, played on its colors, then one last formula to turn its side centers the right way round.',
  },
  windmill: {
    summary:
      'The Windmill, the Fisher Cube’s twin: a Rubik’s Cube cut at a slant that, once scrambled, looks all dented. Turn it in 3D and solve it step by step.',
    about:
      'The Windmill is the Fisher Cube’s twin: the same Rubik’s Cube mechanism, cut this time from a cube turned by a smaller angle. That small shift changes everything: its pieces come in uneven sizes and, **once scrambled, it looks like a Rubik’s Cube that has been badly dented**. An even subtler disguise than the Fisher’s, and all the more fun to see through.',
    methodsTitle: 'The 3x3 underneath',
    methods:
      'As with the Fisher Cube, four 3x3 methods to choose from, layer by layer, CFOP, Petrus or ZZ, then one last formula to turn its side centers.',
  },
}
