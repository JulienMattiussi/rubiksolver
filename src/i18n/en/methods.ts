import type { METHODS_FR } from '../fr/methods'

export const METHODS_EN: typeof METHODS_FR = {
  beginner: {
    name: 'Layer by layer',
    desc: 'Floor by floor: whole first layer, middle layer (on 3x3), then the last layer.',
  },
  cfop: {
    name: 'Fridrich (CFOP)',
    desc: 'Cross, then F2L pairs, then orient (OLL) and permute (PLL) the last layer.',
  },
  roux: {
    name: 'Roux',
    desc: 'Two 1x2x3 blocks (the second with R, U, M and r only), the top corners (CMLL), then the last six edges with M and U.',
  },
  petrus: {
    name: 'Petrus',
    desc: '2x2x2 block, extended to 2x2x3, edge orientation, first two layers finished with R and U only, then the last layer.',
  },
  zz: {
    name: 'ZZ',
    desc: 'Every edge oriented and the bottom line first (EOLine), then both blocks without ever turning F or B, then OCLL and PLL.',
  },
  reduction: {
    name: 'Reduction (layer by layer)',
    desc: 'Centers, edge pairing, then a layer-by-layer finish like a 3x3.',
  },
  reductionCfop: {
    name: 'Reduction (CFOP)',
    desc: 'Centers, edge pairing, then Cross, F2L, OLL and PLL like a 3x3.',
  },
  barrelLayers: {
    name: 'Layer by layer',
    desc: 'As a Rubik’s Cube, but for one thing: the four middle edges show one color only, so their way round does not count. The bottom layer, then the middle edges placed with [UR].[U’F’], the top corners twisted then placed, the top edges placed by the 3-cycle R².UFB’.R².BF’U.R², then flipped two at a time (RBLFU.F’UL’B’R’.F’U’FU’) or one alone, with a middle edge whose way round never shows (ULDRF.R’FD’L’U’.R’F’RF’).',
  },
  megaStar: {
    name: 'Extended star',
    desc: 'The Rubik’s Cube layer by layer, one more face each time: the bottom face’s star (F², F.U’RU), its corners (R’D’R, twisted by R’DR.FDF’), the edges around it ([U’F’][UR], [UR][U’F’]), the five faces next to it finished (U’F’²UF², UR²U’R’², URU’R’…), the high equator’s edges, then the top: edges placed (F[UR]F’) and flipped (F[UR]UF’UF.U³F’), corners placed ([UF].B’[FU]B) and twisted ((R’DRFDF’).U’(FD’F’R’D’R)U), the letters of fan2cube’s page (H A D B P G) read as U F R D B L.',
  },
  ftoCornersFirst: {
    name: 'Corners, centers, edges',
    desc: 'Method 2 of fan2cube.fr, with four formulas: the corners placed and twisted (where the page plays O1 = [D A’] and O2 = HD’H’.AHD), then the centers by O4 = AhA’.B.Ah’A’.B’, a 3-cycle of centers touching nothing else, and last the edges by O3 = dHd’h.dH’d’h’, a 3-cycle of edges touching nothing else (fan2cube’s letters). Each formula from every side, set up by a turn undone after.',
  },
  skewbTopFirst: {
    name: 'Top first',
    desc: 'Only the four bottom corners turn (B, O, H, E, fan2cube’s letters): the top center never moves. Skewb: the top corners placed then twisted ([B’O’]), the centers placed ([B’E’][HE], [H’E’][HO]), the bottom corners twisted ([BO’]²). Skewb Ultimate: the top corners placed, then twisted ([BO], [O’B’], [OH], [B’E’]), the centers placed ([OH’], [BO’], [B’E’][HE], [H’E’][HO]) then turned ([HE’]²[EB’]²), and last the bottom corners twisted (K = [BO’]⁴, Z = [OH’]⁴): they follow the top ones, already in place.',
  },
  crystalCornersFirst: {
    name: 'Corners first',
    desc: 'As the Megaminx, but at each step the corners before the edges: the bottom face (take a corner up R’DR, twist it R’DR.FDF’), the low equator’s corners (F’²UF’²) then the high one’s ([UR]), the edges of the five faces around, the top corners placed ([UF].B’[FU]B) and twisted (R’DRFDF’.U’.FD’F’R’D’R.U), last the top edges placed ([L’B]) and flipped (([L’B]U’)².([BL’]U)²), in fan2cube’s letters read as U F R D B L.',
  },
  aiBlocks: {
    name: 'Block method',
    desc: 'Bring it down to a Pocket: the four big blocks at the bottom (the standard position), then each small octant rebuilt around its small corner, edges then centers, as if fused (T = R’D R.F D F’ in halves pivots a block, X swaps two caps, C cycles three centers), and last the eight blocks solved as a 2x2x2, by half cubes.',
  },
  rbCenters: {
    name: 'Centers method',
    desc: 'As a Professor (5x5x5), brought down to a 3x3x3, always arranging to turn the slices wanted: the bars of the faces around an axis laid across it, its slices turn. The middle bars, the edge parity (a quarter of an equator slice), the other bars, the edges grouped three by three, then as a 3x3 (once its colors are home it is solved, its bars either way).',
  },
  quarterEdgesFirst: {
    name: 'Edges first',
    desc: 'Each face only goes a quarter and back: every formula alternates. Every face is first brought back to START, then the edges placed (F[RU]F’), turned two at a time (F[RU]F’.L[UF]L’.R[UB]R’), the corners placed ([[RU], L]) and twisted ([[RU]², L]).',
  },
  camoReduction: {
    name: 'Reduction to a Domino',
    desc: 'The Camouflage put back in shape (its wings an even permutation), then handled as a 4x4x4: the white centers on top, each edge’s two wings brought together with the exchange Rw2 Uw’ R2 Uw Rw2, and what is left is a Domino 3x3x2, solved as one.',
  },
  tower234Steps: {
    name: 'Corners, edges, equator',
    desc: 'First the shape (the side columns stood back up), then all in the box: the centers, the corners by P(H*D.G.H*D)³P (where the columns D and G go out a quarter and back), the top and bottom edges by (D²H)³, (D²A)³ and PB.(D²A)³.BP, and last the equator by ((D²h)²P)², ((G²h)²P)², hA.(D²h)².Ah, (HA)³ (fan2cube’s letters), plus one of our own that leaves the box and comes back: without it, an equator piece can stay swapped left to right.',
  },
  doubleDomino: {
    name: 'Double Domino',
    desc: 'Two Dominos sharing their sides: the outer one (the top and bottom) then the inner one (the two middle layers), each with the Domino’s formulas (descend a corner, swap two corners, descend an edge, cycle three edges). The inner one’s are played two by two, so as to leave the outer one as it is.',
  },
  towerReduction: {
    name: 'Reduction',
    desc: 'The centers brought together, then the pieces of each top and bottom edge (by pure 3-cycles), and the tower becomes one 3 wide: its outer Domino, its inner Domino if it has one, then its equator if it has one. A parity, if any, is undone first, by a slice’s half turn.',
  },
  twoPockets: {
    name: 'Two Pockets',
    desc: 'The tower seen as two stacked Pockets: put it back in shape by pivoting its corners, then finish the inner Pocket, then the outer Pocket, with two Domino formulas (descend a corner, swap two corners).',
  },
  asPocket: {
    name: 'As a Pocket',
    desc: 'The Pyramorphinx is a Pocket (2x2) in disguise: its 8 pieces are a 2x2’s 8 corners and its turns a 2x2’s. Read as such, it is solved like a Pocket, in as few turns as can be, whatever strange shapes it takes.',
  },
  fashionLaid: {
    name: 'Lay down, then two towers',
    desc: 'Every pair is laid down first, by blocks as on a Rubik’s Cube, back to a 3x3x5; the equator is put home about its centers; then it is solved as the towers are: the outer Domino (H and B), then the inner one (h and b), their formulas played twice over so that the equator stays.',
  },
  latchEdgesFirst: {
    name: 'Edges first',
    desc: 'The arrows are on the edges: they lock the faces. A face that is not locked turns either way (the forbidden way played as three quarters the other way, “D’ = D3”). The edges are placed first, one at a time, around the locked faces, the corners let be; then the corners by the page’s 3-cycle [DH].G’[HD]G, and turned by [DH]².G’[HD]²G, in the variants that go, the edges home.',
  },
  copterEdgesFirst: {
    name: 'Edges first',
    desc: 'The edges, which never leave their slots, set the faces’ colors: they are turned the right way up, then the centers are placed (Curvy Copter III), then the corners, then turned, then the leaves, last the petals (Curvy Copter III), each time by the page’s 3-cycles seen from every side.',
  },
  voidCornersFirst: {
    name: 'Bottom corners first',
    desc: 'As a Rubik’s Cube, the missing centers’ colors set by the corners: the bottom corners first, as on the Pocket, then the bottom edges (with the slices), the middle edges, the singularity if any (two edges to swap, which a Rubik’s Cube never asks for), then the top as on a Rubik’s Cube.',
  },
  extendedCross: {
    name: 'Extended cross',
    desc: 'As a Rubik’s Cube whose corners are ignored: the bottom cross, the middle edges placed by a mere commutator ([U’F’] or [UR], no corner to keep), the top cross turned two edges at a time, then the top edges placed by 3-cycles.',
  },
  extendedTriangle: {
    name: 'Extended triangle',
    desc: 'The top triangle’s three pieces first, each extending the squares around it, then all the others with two commutators, “place left” [U’ L’] and “place right” [U R]: once seven triangles are done, the eighth is too.',
  },
  octCornersFirst: {
    name: 'Corners first',
    desc: 'A 4x4x4 cut to an octahedron: the corners (three a face) first, with the Super Revenge’s center commutators, then the edges (three a face) with slice commutators, and last the centers (the middle triangle of each face) with a Rubik’s Cube corner commutator. A parity, if any, takes a quarter turn at the start.',
  },
  jingCornersFirst: {
    name: 'Corners first',
    desc: 'The corners first, a turn each, then the edges placed with a hook (three at a time), flipped two at a time, and last the centers swapped two by two.',
  },
  wingsFirst: {
    name: 'Wings then midges',
    desc: 'Co-tips, tips and centers first, then the wings three at a time with a commutator (reserve, raise, take, lower), then the midges, placed then flipped two at a time (on the Professor: the co-wings, the edges, then the co-centers), and last the centers swapped two by two.',
  },
  centersFirst: {
    name: 'Centers first',
    desc: 'Centers first (and tips, on the Pyraminx), each with a single turn of its corner, then the edges with three formulas: a hook bringing a top edge down to finish the bottom, a cycle of the three top edges, then a formula flipping two edges at a time.',
  },
  isolateFirst: {
    name: 'Isolate then permute',
    desc: 'Separate the green points (up) from the blue ones (down), then finish the bottom and the top with a single formula, K, which swaps two points of each layer.',
  },
  puckIsolate: {
    name: 'Isolate then permute',
    desc: 'Separate the numbered pieces (up) from the others (down), then put the bottom colors and the top numbers in order with the formula K, / D / 1-D / -1 /, which swaps two neighboring pieces of each layer, and its kin that swap pieces further apart; two K on one bottom pair make a 3-cycle on top. Last, align the top on the bottom.',
  },
  twoStars: {
    name: 'Two stars',
    desc: 'The 4-Star Prism is made of two 2-Star Prisms: solve the inner star (u, d), then the outer one (U, D), each like a 2-Star, with the same formula K.',
  },
  equatorFirst: {
    name: 'Equator then corners',
    desc: 'Like a Domino standing up: the four equator edges, then the bottom corners brought down two by two, then the top corners swapped two at a time.',
  },
  cornersFirst: {
    name: 'Corners then edges',
    desc: 'Corners first, then edges, each time with a formula that only touches what is left to do (Domino: bottom then top; Floppy: corners placed, then edges flipped two at a time; Floppy Ghost: corners placed then turned over, then edges flipped two at a time; BigBlock: the two bottom corners, which place the top ones, then the edges by 3-cycles of the top).',
  },
  gemCentersFirst: {
    name: 'Centers first',
    desc: 'Like a Pyraminx: each square turned so the four triangles against it go with their faces (the “radiation hazard” sign), then the edges placed by 3-cycles ([U R], from every side) and last flipped two at a time ([F R’][U’ R]).',
  },
  vtoCentersFirst: {
    name: 'Centers then edges',
    desc: 'Like a Pyraminx: each corner turned so the four centers around it go with their faces, then the edges placed by 3-cycles (three edges of a face, [F R’], or around a corner, F’UF.U.F’U²F, each letter a whole corner, Fw...), flipped two at a time ([F R’][U’ R]), and last the tips turned alone.',
  },
  gearEquatorFirst: {
    name: 'Equator then corners',
    desc: 'The equator and the centers first, intuitively, then the bottom corners lowered one at a time ((R²U)².(R²U²)²), the top ones by a 3-cycle and a swap, the bottom edges isolated at the bottom ((DL²D’L’²)⁵), every edge placed by pairs swapped, the clips turned right way round (R²(R²U)¹²R’²) and last the gears, a third of a turn at a time ((R²U)².R⁸.(U’R’²)²).',
  },
  dinoCylLayers: {
    name: 'Layer by layer',
    desc: 'As the Dino Cube, with two formulas: [GA’] = GA’G’A cycles three edges and leaves the rest be (the corners never move and tell how to hold it): the top, then the equator, then the bottom. Edges turn the right way round on their own once in place; then the corners, turned one at a time by (A)+ = [AD]A’[DA’] (fan2cube’s letters).',
  },
  dinoLayers: {
    name: 'Layer by layer',
    desc: 'One formula only, [GA’] = GA’G’A, which cycles three edges and leaves the rest be: the top, then the equator, then the bottom, an edge at a time. Edges turn the right way round on their own once in place.',
  },
  rexEdgesFirst: {
    name: 'Edges, centers, petals',
    desc: 'The edges first, by 3-cycles ([GA’] = GA’G’A, which stirs centers and petals), then the centers, by 3-cycles ([DG’] = DG’D’G, which stirs petals only), and last the petals, face by face, with [DG’][D’B], which swaps petals and nothing else.',
  },
  gearCornersFirst: {
    name: 'Corners first',
    desc: 'The corners first, intuitively, then the edges placed by pairs swapped (R⁴: two half turns of a face), on the Ultimate the clips turned right way round ((F² R²)³, which turns over in place the edges of two layers) and last the gears spun home, a slice’s a third of a turn at a time (R⁸). The centers follow on their own.',
  },
  shapeFirst: {
    name: 'Shape then colors',
    desc: 'First the fewest turns to make it a cube again, whatever the split corner’s colors; then, from that cube (35 possible cases), the shortest sequence putting its colors back: one algorithm per case. Found by a search over all its states.',
  },
  optimal: {
    name: 'Optimal',
    desc: 'Exhaustive search for the shortest possible solution (2x2, 1x2x3, Floppy, Floppy Ghost and Purple, whose state spaces are small enough).',
  },
  fromStart: {
    name: 'From START',
    desc: 'First the puzzle goes to its START position, the one the page’s formulas start from: its blocks where they belong (its solved form, or another, as ABA’ on the Stripe). Then the pieces are placed with those formulas, which leave START as it is and so always go, and a few turns that lead back to it; last, when START is not the solved form, back to it.',
  },
  skewbFirst: {
    name: 'Skewb first',
    desc: 'Solved first as a Skewb, its corners and centers (its outer layers turn them as a Skewb’s do: “top first”), then its edges (o’.(P’DP).o.(P’D’P) and its mirror) and last its petals (e.(D’GD).e’.(D’G’D) and its mirror), each formula also from a turned corner (conjugation).',
  },
}
