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
  bigBlock: {
    summary:
      'The BigBlock, a Rubik’s Cube with one big block fused: only two faces turn. The gentlest of the bandaged puzzles, to solve step by step.',
    about:
      'The BigBlock is a Rubik’s Cube in which **a block of twelve pieces** is fused in one piece: only **two faces still turn**. It sounds like a joke, yet those two faces are enough to scramble it seriously. The most approachable of the bandaged puzzles, perfect to discover the family.',
    methodsTitle: 'The corners, then the edges',
    methods:
      'A method in two moves: the corners first, then the edges, each time with a two-face formula that only touches what is left to do.',
  },
  squarebik: {
    summary:
      'The Squarebik, a half-fused Rubik’s Cube, restrained like a Square-1: only three faces turn. Turn it in 3D and solve it step by step.',
    about:
      'The Squarebik fuses half of its middle ring, the way a Square-1 does: **only three faces still turn**. You soon think it solved, then stumble on pieces that refuse to cross from one side to the other. A transition puzzle, just devious enough to get you hooked.',
    methodsTitle: 'Like a 3x3, almost',
    methods:
      'It is solved layer by layer, like a Rubik’s Cube, climbing floor by floor with only the faces that still turn. A few more formulas than on a 3x3, but the path feels familiar.',
  },
  fused: {
    summary:
      'The Fused, a Rubik’s Cube with a 2x2x2 corner fused into a block: three faces turn. An approachable, clever puzzle, to solve step by step.',
    about:
      'The Fused has **a whole corner fused into a block of eight pieces**: the three faces touching it no longer turn, leaving only three. The scramble looks tame, but you soon need cunning to bring each piece where it belongs. Both approachable and clever.',
    methodsTitle: 'Layer by layer, with cunning',
    methods:
      'It is solved layer by layer, somewhere between Petrus and Fridrich, with the three free faces: the bottom and middle are built by intuition, and a few well-chosen formulas finish the top.',
  },
  quadStripe: {
    summary:
      'The QuadStripe fuses three squares and three bars around a hidden cube: each turn changes which faces can turn. Solve it step by step in 3D.',
    about:
      'On the QuadStripe, three fused squares and three bars wrap around a **small hidden cube**. With each turn the fusings move and **other faces get blocked**: the puzzle keeps changing under your fingers. You have to learn to read it as much as to turn it, and that is what makes it gripping.',
    methodsTitle: 'Everything goes through START',
    methods:
      'Like the bandaged puzzles of its kind, you first bring it back to its starting position, START, where all its formulas begin, then sort each kind of piece there, one after another.',
  },
  detour: {
    summary:
      'The Detour, two bars and five fused tabs: a Rubik’s Cube that forces you to take side roads. Turn it in 3D and solve it step by step.',
    about:
      'The Detour lives up to its name: with its two bars and **five fused tabs**, no direct turn leads where you want, you keep having to **take detours**. Its thousands of possible shapes make it a real maze, but each passage found is a rare pleasure.',
    methodsTitle: 'Back to START',
    methods:
      'You bring it back to its START position, where one face turns freely, sort the pieces in small groups with short formulas, then return to the solved cube’s shape.',
  },
  diamond: {
    summary:
      'The Diamond, two squares and two tabs fused: few shapes, but each has its trap. An elegant bandaged puzzle to turn in 3D and solve step by step.',
    about:
      'The Diamond fuses **two squares and two tabs**, and takes only about a hundred shapes, far fewer than its cousins the Stripe or the Detour, which have thousands. But each one hides a trap. An elegant bandaged puzzle, ideal to learn to steer around blocks.',
    methodsTitle: 'A round trip',
    methods:
      'You go through its START position, where the top turns freely, to sort all the pieces there, then return to the cube’s shape. A short, well-marked round trip.',
  },
  bandage: {
    summary:
      'The Bandage Cube, seven fused bars around a free corner: the classic of the bandaged puzzles. Turn it in 3D and solve it step by step.',
    about:
      'The Bandage Cube is the family’s classic: **seven fused bars**, some tabs and a single corner left free. Each turn moves the fusings and freezes other faces, so you often move forward by going backward. Demanding but flawlessly logical, it is the test every bandaged fan ends up facing.',
    methodsTitle: 'Bar after bar',
    methods:
      'From its START position, you put its bars back one by one, each with the formula that suits it; the last two follow on their own.',
  },
  quad: {
    summary:
      'The Quad, three fused squares around a hidden cube: the QuadStripe without its bars, freer and trickier. Solve it step by step in 3D.',
    about:
      'The Quad is the QuadStripe stripped of its bars: it keeps only **three fused squares** around a small hidden cube. More freedom, then, but fewer landmarks, and you catch yourself scrambling it further while thinking you are solving it. Shorter than its big brother, and full of surprises.',
    methodsTitle: 'The hidden cube first',
    methods:
      'From its START position, you first rebuild the small hidden cube, then sort the edges and corners around it, with the QuadStripe’s formulas.',
  },
  stripe: {
    summary:
      'The Stripe, three bars fused in a star around a corner: a Rubik’s Cube with many turns blocked. Turn it in 3D and solve it step by step.',
    about:
      'The Stripe fuses **three bars in a star** around one corner, so that a good share of the turns is blocked at any moment. Yet its solving path is surprisingly close to a Rubik’s Cube’s, layer after layer, for whoever knows how to get around its bars.',
    methodsTitle: 'Layer after layer',
    methods:
      'From its START position, you solve it almost like a 3x3, from bottom to top, with formulas cut for its bars, before returning to the cube’s shape.',
  },
  fusedStripe: {
    summary:
      'The FusedStripe, the Fused’s block and three fused bars: one of the toughest bandaged puzzles. Turn it in 3D and solve it step by step.',
    about:
      'The FusedStripe piles up constraints: **the Fused’s big block and three bars in a star**. So few turns remain that you soon feel cramped, and orienting its pieces requires going through one precise intermediate position. One of the toughest bandaged puzzles, and one of the most satisfying to beat.',
    methodsTitle: 'A forced detour',
    methods:
      'You first place its bars, corners and edges, then orient everything by going through an intermediate position where new formulas become possible, before coming back.',
  },
  alcatraz: {
    summary:
      'The Alcatraz, the most locked-down bandaged puzzle: a block, three bars, two tabs and a square. Can you escape? Solve it step by step.',
    about:
      'The Alcatraz bears a prison’s name, and earns it: **a block of eight pieces, three bars, two tabs and a square** fused together. It is the last and most fearsome of the series, where every turn is negotiated. Escaping takes method and perseverance, but the way out is all the sweeter.',
    methodsTitle: 'The great escape',
    methods:
      'From its START position, you first free its bars, then place and turn the top corners and edges with a few long formulas. A demanding course, marked out step by step.',
  },
  ai: {
    summary:
      'The AI Cube, a 4x4 with half its pieces fused into big blocks: nothing turns as expected. Turn it in 3D and solve it step by step.',
    about:
      'The AI Cube starts from a 4x4 in which **four big fused blocks** sit in a checkerboard, surrounded by small free cubes. Depending on where the blocks are, you can turn half the cube, a layer or a mere slice, and the puzzle changes face at every turn. Fascinating to handle, and far more approachable than it looks.',
    methodsTitle: 'Back to the Pocket',
    methods:
      'You bring it back to a 2x2x2: first rebuild its eight blocks, small cubes included, then solve it as a plain Pocket Cube.',
  },
  roadblock: {
    summary:
      'The RoadBlock-I, a 5x5 whose centers are fused into bars: a slice turns only if its bars let it through. Solve it step by step in 3D.',
    about:
      'The RoadBlock-I is a 5x5 in which **the nine centers of each face are fused into three bars**. A slice turns only if no bar blocks its way, hence its name. You keep laying the bars down and standing them up to open the way: an ingenious puzzle, as baffling as it is fun.',
    methodsTitle: 'Opening the road',
    methods:
      'You bring it back to a Rubik’s Cube: by laying its bars the right way, you free the slices that need turning, then solve it as a 3x3.',
  },
  oct4: {
    summary:
      'The 4-Trajber’s Octahedron, a 4x4 disguised as an eight-color octahedron: if you know the 4x4, you will soon feel at home. Turn it in 3D and solve it.',
    about:
      'Under its eight triangular faces, the 4-Trajber’s Octahedron hides **a 4x4 cut into an octahedron**: it turns exactly like one, but each piece shows a single color. The disguise is so good that it takes a while to recognize your old companion, then everything feels familiar, and fun to rediscover from a new angle.',
    methodsTitle: 'An old companion',
    methods:
      'It is solved one kind of piece after another, corners, centers then edges, with commutators borrowed from a well-known cube.',
  },
  vto: {
    summary:
      'The Octahedron VTO turns by its corners, a quarter turn: a 3x3 cut into an octahedron, with Pyraminx faces. Turn it in 3D and solve it.',
    about:
      'The Octahedron VTO is **a 3x3 cut into an octahedron**: its six corners turn, a quarter turn, and their tips can also turn alone. Each face, cut into nine triangles, recalls a Pyraminx, so you keep wavering between the two logics. Baffling at first, it proves far less difficult than it looks.',
    methodsTitle: 'Like a Pyraminx',
    methods:
      'First match its centers by turning the corners, as on a Pyraminx, then sort the edges with a few short formulas.',
  },
  gem: {
    summary:
      'The GEM-0, an octahedron with its tips planed into golden squares: a jewel that turns like a 3x3. Turn it in 3D and solve it step by step.',
    about:
      'The GEM-0 is a VTO whose **tips have been planed into golden squares**, each bearing an emblem: it takes on the look of a jewel and now turns like a 3x3, by quarter turns. The most beautiful of the octahedra, almost too precious to dare scramble.',
    methodsTitle: 'The centers first',
    methods:
      'As on a Pyraminx, first match its centers by turning the squares, then sort the edges: a short, elegant method, like the puzzle itself.',
  },
  fto: {
    summary:
      'The FTO, an octahedron whose eight faces turn by thirds: lively, deep, and like nothing you know. Turn it in 3D and solve it step by step.',
    about:
      'The FTO turns **its eight faces**, a third of a turn, each one carrying along pieces of its neighbors. It scrambles in an instant and looks like nothing you know, neither cube nor Pyraminx. A lively, deep puzzle that makes you build new reflexes.',
    methodsTitle: 'One piece at a time',
    methods:
      'One kind of piece after another, corners, centers then edges, each with a 3-cycle that touches nothing else. Methodical, with no bad surprise.',
  },
  rainbow: {
    summary:
      'The Rainbow, a cuboctahedron with turning triangles: only twelve pieces, but a real puzzle. Turn it in 3D and solve it step by step.',
    about:
      'The Rainbow blends **six squares and eight triangles**, and the triangles are what turn, each one cycling the three pieces at its corners. It has only twelve pieces, each with four colors, and yet it holds out surprisingly long. A rare shape, very elegant, that will not be tamed at the first try.',
    methodsTitle: 'One triangle, then the rest',
    methods:
      'Complete a first triangle, then all the others with two commutators; the last one falls into place on its own, like a reward.',
  },
  megaminx: {
    summary:
      'The Megaminx, the twelve-faced Rubik’s Cube: more pieces, but a familiar logic. Turn it in 3D and learn to solve it step by step.',
    about:
      'The Megaminx is **a Rubik’s Cube with twelve pentagonal faces**: more pieces, more colors, and a feeling of vertigo at the first scramble. Yet anyone who can solve a 3x3 soon finds their bearings: the same ideas, just longer to unfold. A marathon rather than a sprint, and a huge satisfaction at the finish.',
    methodsTitle: 'The extended star',
    methods:
      'It is solved like a Rubik’s Cube layer by layer, gaining a neighboring face at each step, up to the top, which is finished last.',
  },
  crystal: {
    summary:
      'The Pyraminx Crystal, a Megaminx cut deeper, with no centers: twelve faces that intertwine. Turn it in 3D and solve it step by step.',
    about:
      'The Pyraminx Crystal takes the Megaminx’s shape, but its cuts plunge to the center of the neighboring faces: **it has no centers left**, and each turn shakes up a large part of the puzzle. The usual landmarks vanish, and everything must be rebuilt from the corners. Splendid once scrambled, and a real challenge for Megaminx fans.',
    methodsTitle: 'The corners first',
    methods:
      'Like the Megaminx layer by layer, but always placing the corners before the edges, since no center gives the colors anymore.',
  },
  skewbU: {
    summary:
      'The Skewb Ultimate, a Skewb cut into a dodecahedron: twelve faces for a familiar mechanism. Turn it in 3D and solve it step by step.',
    about:
      'The Skewb Ultimate looks like a Megaminx, but it is **a Skewb disguised as a dodecahedron**: each turn tips a whole half of the puzzle. Its slanted faces blur the landmarks, and you search a long time for where the centers hide. Once you see through the disguise, it solves like its big brother, with the same pleasure.',
    methodsTitle: 'The top first',
    methods:
      'The Skewb’s method, fitted to its shape: finish the top first, then all the rest by turning only the bottom.',
  },
  pyra: {
    summary:
      'The Pyraminx, the turning pyramid: four corners, a crystal-clear logic. The ideal puzzle to start with, with its step-by-step tutorial.',
    about:
      'The Pyraminx is the dream way into puzzles that are not cubes: **a pyramid whose every corner turns**, with its layer or its tip alone. Its tips are set with a single turn, and the rest follows a crystal-clear logic. You think it complicated, it solves in no time, and you cannot stop scrambling it.',
    methodsTitle: 'The centers first',
    methods:
      'First match its centers, with a single turn each, then sort the edges with three formulas to remember. The tutorial guides you step by step, until you solve it on your own.',
  },
  tetra: {
    summary:
      'The Tetraminx, a Pyraminx without its tips: the same pyramid, pared down. Turn it in 3D and solve it step by step.',
    about:
      'The Tetraminx is **a Pyraminx with its tips taken off**: four truncated corners, and nothing else changes. Pared down, it goes straight to the point, and it is probably the gentlest pyramid to start with.',
    methodsTitle: 'The Pyraminx’s essentials',
    methods:
      'The Pyraminx’s method, without the tips step: the centers first, a turn each, then the edges with three formulas.',
  },
  pyra4: {
    summary:
      'The Master Pyraminx, a four-layer Pyraminx: more pieces, more slices, and twins to tell apart. Turn it in 3D and solve it step by step.',
    about:
      'The Master Pyraminx enlarges the pyramid to **four layers**, each slice turning on its own. Its pieces multiply, some come in pairs of twins you must learn to tell apart, and the little Pyraminx suddenly feels far away. A fine step up for anyone who already masters its little brother.',
    methodsTitle: 'From easy to subtle',
    methods:
      'Treat it as a big Pyraminx: the easy pieces first, then the edges, which come in pairs of twins, with commutators, those formulas that swap three pieces without touching the rest.',
  },
  pyra5: {
    summary:
      'The Professor Pyraminx, five layers and seven kinds of pieces: the biggest of the pyramids. Turn it in 3D and solve it step by step.',
    about:
      'The Professor Pyraminx takes the pyramid to **five layers and seven kinds of pieces**. Scrambled, it is **a sea of small triangles**, of an almost artistic beauty, that you would hesitate to solve. Yet each piece ends up in its place with flawless logic: a test of patience, and a superb object.',
    methodsTitle: 'The same method, scaled up',
    methods:
      'The Master Pyraminx’s method, extended: the easy pieces first, then the edges and the centers with commutators, one family of pieces after another.',
  },
  jing: {
    summary:
      'The Pyraminx Jing, a pyramid cut through its heart: each corner tips half the puzzle. Turn it in 3D and solve it step by step.',
    about:
      'The Pyraminx Jing cuts **beyond the center**: each corner tips a whole half of the pyramid, its centers included. The scramble soon gets dizzying, far more than on a Pyraminx, but it has only fourteen pieces, and you end up untangling its logic with pleasure.',
    methodsTitle: 'The corners in one turn',
    methods:
      'The corners first, a turn each, then the edges and centers with commutators, those formulas that move only three pieces.',
  },
  morph: {
    summary:
      'The Pyramorphinx, a 2x2 disguised as a pyramid that changes shape at every turn. Turn it in 3D and learn to solve it with its tutorial.',
    about:
      'The Pyramorphinx looks like a Pyraminx, but it is **a 2x2 cut from a pyramid**: at the first quarter turn, it changes into an unexpected outline. The contrast between its pyramid look and its cube moves is delightfully unsettling. If you know the 2x2 you solve it fast, and everyone else learns two puzzles at once.',
    methodsTitle: 'Like a Pocket',
    methods:
      'Its eight pieces are the corners of a 2x2, and it is solved as one. The tutorial teaches it step by step, taking its changing shape into account.',
  },
  mmorph: {
    summary:
      'The Master Morphinx, a Rubik’s Cube cut from a pyramid, forever changing shape. Solve it step by step, with the method of your choice.',
    about:
      'The Master Morphinx is **a Rubik’s Cube disguised as a pyramid**: a 3x3’s mechanism, cut from a tetrahedron. At the first turn, the pyramid breaks up into strange shapes, and you doubt you are dealing with a cube. A disguise as good as the Fisher Cube’s, and just as much fun to see through.',
    methodsTitle: 'A 3x3 under the pyramid',
    methods:
      'Four 3x3 methods to choose from, layer by layer, CFOP, Petrus or ZZ, played on its colors, with a last step to turn its centers the right way round.',
  },
  dinoCyl: {
    summary:
      'The Dino Cylinder, a Dino Cube cut into a cylinder, with extra corners. Turn it in 3D and solve it step by step.',
    about:
      'The Dino Cylinder keeps the Dino Cube’s mechanism, but cut into **a cylinder as tall as it is wide**, with extra corners that pivot in place. Its round outline fools the eye: you look for faces where there are only curves. A gentle, original puzzle, as delightful in hand as on the shelf.',
    methodsTitle: 'The corners as a compass',
    methods:
      'It is solved layer by layer with a single formula that cycles three edges; its corners, which never leave their place, tell you how to hold it.',
  },
  puck: {
    summary:
      'The Hockey Puck, a puck of twenty-four turning, flipping pieces, numbered on top. Turn it in 3D and put each number back in place.',
    about:
      'The Hockey Puck is shaped like a puck: **two layers of twelve pieces**, numbered on top, turning on each other and flipping by halves. The numbers make it a puzzle of figures more than colors, and putting 1 to 12 back in order becomes strangely addictive.',
    methodsTitle: 'Sorting the numbers',
    methods:
      'First separate the numbered pieces from the others, then sort each layer by swapping pieces, until the ring of numbers is back.',
  },
  barrel: {
    summary:
      'The Barrel, a Rubik’s Cube with its edges planed into an eight-sided barrel, four extra colors. Solve it step by step, with the method of your choice.',
    about:
      'The Barrel is a Rubik’s Cube whose **four vertical edges have been planed off**: it becomes an eight-sided barrel, with four extra colors on the cuts. The familiar cube feels strangely new, and solving it holds a nice surprise: its middle edges have no visible way round, which simplifies the end.',
    methodsTitle: 'Four ways to go',
    methods:
      'Four methods to choose from, layer by layer, CFOP, Petrus or ZZ, as on a 3x3. Its middle edges, whose way round does not show, make the end lighter.',
  },
  star: {
    summary:
      'The 2-Star Prism, a six-pointed star that turns and flips: the Square-1 family, made gentler. Turn it in 3D and solve it step by step.',
    about:
      'The 2-Star Prism is **a six-pointed star** on two layers: you turn the top or the bottom, then flip a whole half in one sharp move. From the Square-1 family, it has its baffling mechanism, but with only twelve pieces and two colors, it is tamed much sooner. A charming little object, almost a pocket jewel.',
    methodsTitle: 'Sort, then arrange',
    methods:
      'First separate the two colors, one on top, the other below, then arrange everything with a single swap formula.',
  },
  star4: {
    summary:
      'The 4-Star Prism, two nested stars on four layers: a star-shaped Super Square-1. Turn it in 3D and solve it step by step.',
    about:
      'The 4-Star Prism stacks **four layers that each turn on their own**, crossed by the same flip: in truth, two nested 2-Star Prisms sharing their axis. Behind its big-brother looks lies a crystal-clear logic: you only need to solve one star after the other. A fine lesson in breaking a problem down.',
    methodsTitle: 'One star, then the other',
    methods:
      'It is solved as two 2-Star Prisms, one after the other, with the same formula for both.',
  },
  holey: {
    summary:
      'The Holey Megaminx, a Megaminx with no centers, see-through: the same puzzle, in lace. Turn it in 3D and solve it step by step.',
    about:
      'The Holey Megaminx is a Megaminx with **its twelve centers taken out**: holes in their place, through which you see right across the puzzle. Lighter, almost lacy, it turns exactly like its big brother, but with no centers to give the colors, you need to pay extra attention.',
    methodsTitle: 'The extended star',
    methods:
      'The Megaminx’s method, unchanged: layer by layer, gaining a neighboring face at each step, up to the top. The pieces already placed serve as landmarks.',
  },
  void: {
    summary:
      'The Void Cube, a Rubik’s Cube with no centers, see-through: six methods to solve it. Turn it in 3D and pick yours.',
    about:
      'The Void Cube is **a Rubik’s Cube with no centers**, each face pierced by a big hole. Without them, nothing tells a face’s color anymore, and the middle slices turn into real pranksters: they move edges without touching the corners, so two edges sometimes remain to swap at the very end. A very elegant cube, more mischievous than it looks.',
    methodsTitle: 'Six paths to choose from',
    methods:
      'Six methods to choose from: the great 3x3 methods, layer by layer, CFOP, Roux, Petrus and ZZ, and one of its own, starting with the bottom corners to give the colors.',
  },
  tori: {
    summary:
      'The Tori, a Rubik’s Cube with no corners and rounded shapes: nothing but centers and edges. Turn it in 3D and solve it step by step.',
    about:
      'The Tori is **a Rubik’s Cube with no corners**: six ring-shaped centers and twelve edges slender as almonds, in a cube of rounded shapes. It is almost a sculpture, and solving it, freed of the corners, is light and quick.',
    methodsTitle: 'The extended cross',
    methods:
      'Nothing but edges to place around the fixed centers, with very simple commutators: a short method, ideal for fun.',
  },
  edge: {
    summary:
      'The Edge Only, a Rubik’s Cube reduced to its twelve edges, each face pierced by a square hole. Turn it in 3D and solve it step by step.',
    about:
      'The Edge Only takes minimalism all the way: **no centers, no corners**, only the twelve edges of a Rubik’s Cube, each face pierced by a square hole. With no fixed landmark, you first wonder where to start, then the puzzle reveals a delightful simplicity.',
    methodsTitle: 'Nothing but edges',
    methods:
      'Edges, more edges, placed with very simple commutators: the Tori’s method, without even the centers as a guide.',
  },
  square1: {
    summary:
      'The Square-1, a cube that changes shape from the very first turn: getting its shape back is a challenge in itself. Turn it in 3D and solve it step by step.',
    about:
      'The Square-1 looks tame while it is square, but **a single turn is enough to bend it** into unlikely outlines. Its layers turn by notches, its right half flips over, and its pieces of two sizes spread about as you move them. **Getting the cube shape back** is a victory already, then everything falls into place with a few formulas: baffling, and terribly endearing.',
    methodsTitle: 'Two roads to the cube',
    methods:
      'Two methods, both starting by giving it back its cube shape: one sorts the corners before the edges, the other builds a whole face before finishing the second. Pick your road.',
  },
}
