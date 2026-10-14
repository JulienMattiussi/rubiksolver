# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif et pédagogique**, en **2x2 (Pocket), 3x3,
4x4, 5x5 ou 6x6**, **classique ou miroir** (sauf le 5x5 et le 6x6), le **Super Revenge** et le
**Super Professor** (leurs centres chacun à sa place), plus onze cuboïdes : le **1x2x3**, la
**tour 2x2x4** (qui se déforme), la **tour 2x3x4** (qui se déforme aussi), la **Slim Tower 2x2x3**, le **Domino 3x3x2**, les tours **3x3x4**, **4x4x3**, **4x4x5** et **5x5x4**, le **Camouflage 4x4x2** (un 4x4x4 bandé, qui se déforme)
et le **Floppy 3x3x1**, le **Floppy Ghost** (un Floppy Megaminx découpé en
pentagramme dans un carré, qui se déforme), et des puzzles non cubiques : le **Pyraminx**, le **Tetraminx** (un Pyraminx sans pointes), le
**Master Pyraminx** (4x4), le **Professor Pyraminx** (5x5), le **Pyraminx Jing** (pièces courbes), le
**Pyramorphinx** (un 2x2 taillé en tétraèdre, qui se déforme), le **Master Morphinx** (un 3x3x3 taillé en tétraèdre), le
**4-Trajber's Octahedron** (un 4x4x4 taillé en octaèdre), l'**Octahedron VTO**
(un 3x3x3 taillé en octaèdre), le **GEM-0** (le VTO sans pointes), le **FTO** (un octaèdre dont les faces tournent), le **Rainbow**
(un cuboctaèdre dont les triangles tournent), le **Megaminx** (un dodécaèdre), le **Holey Megaminx** (sans ses centres), le **Pyraminx Crystal** (un Megaminx coupé plus profond), le **Dino Cube** et le **Rex Cube** (leurs sommets
tournent), le **Dino Cylinder** (un Dino aux sommets en plus, taillé en cylindre, qui se déforme), le **Fisher Cube** (un 3x3x3 taillé en cube tourné d'un huitième, qui se déforme), le **Windmill** (son jumeau, tourné moins), le **Skewb Ultimate** (un Skewb taillé en dodécaèdre), le **Violet** (un 2x2x2 à
pivot excentré, qui se déforme), le **Z-Twist** (un 3x3x3 à la forme tordue), le **Tori** (un 3x3x3 sans coins, aux faces percées), l'**Edge Only** (ses seules arêtes), le **Quarter Cube** (des faces qui ne font qu'aller et revenir d'un quart), l'**AI Cube** (un 4x4x4 dont quatre octants sont soudés), le **RoadBlock-I** (un 5x5x5 aux centres soudés en barres), le **Gear Cube**, le **Gear Cube Ultimate** et le **Gear Cube Extreme** (des 3x3x3 à engrenages),
le **Hockey Puck** (deux disques de 12 pièces, de la famille des étoiles), le **Barrel** (un 3x3x3 aux arêtes verticales tronquées, qui se déforme) et les
**Star Prism** à 2 et 4 étages (une étoile à six branches de la famille du
Square-1) (choix par vignettes).
On manipule le cube (rotations de faces à la souris/aux boutons, tranches et
coups larges là où la forme en a, orbite caméra, aperçu des pièces qui vont
tourner au survol d'un bouton ; sur 3x3, un onglet « Avancé » pour `M`, `E`,
`S` et les coups larges), on consulte un **guide des mouvements** (chaque coup
animé sur l'état actuel, avec sa notation et une phrase), on le mélange **ou
on saisit sa propre configuration** en peignant les stickers directement en
3D (sur tous les puzzles, Pyraminx et étoiles compris ; un puzzle déformable
dans la forme où il se trouve, le Floppy Ghost, le Z-Twist, le Hockey Puck, le Barrel, le Fisher Cube, le Windmill et le Dino Cylinder pièce par pièce), on peut **mémoriser un état**
pour y revenir, puis on le résout selon **plusieurs vraies méthodes** (par
couches, CFOP, Roux, Petrus, ZZ, réduction du 4x4, du 5x5 et du 6x6, méthodes de la tour, du
Domino, du Pyraminx et des étoiles...). La solution, affichée dès que le cube
est au repos, est découpée en **étapes nommées** qu'on joue d'un coup,
**étape par étape** ou **coup par coup**, dans les deux sens, pour apprendre
la méthode. Le but est
pédagogique, pas l'optimalité du nombre de coups (à l'exception de la méthode
**Optimale** du 2x2, du 1x2x3, du Floppy, du Floppy Ghost et du Violet, qui exploite leurs espaces
d'états réduits).

Application **100% front-end**, sans backend. Interface **français par défaut**
(bascule anglais), langue détectée depuis le navigateur ; **notation des
mouvements internationale (U D L R F B) par défaut, ou française
(H B G D F Ar)**, avec la même convention dans les deux pour les autres
coups : préfixe `2` pour la tranche interne du 4x4 (`2R` / `2D`), suffixe `w`
pour le coup large (`Rw` / `Dw`), et `M`, `E`, `S` pour les tranches du
milieu du 3x3. Exceptions : les puzzles qui ne tournent pas comme un cube
ont leur propre notation, le plus souvent celle de fan2cube : le Pyraminx,
où chaque notation garde son propre usage (voir « Le Pyraminx »), les
étoiles (`3`, `/`), le Floppy Ghost, le Rainbow, le Dino et le Rex (lettres
de fan2cube), le Megaminx et le Holey (`U F R BR BL L` et le bas en anglais, `H A D G P B` et leurs opposées soulignées en français) et les Gear Cubes (`D²`).

---

## Stack technique

| Outil                      | Usage                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| React 19 + TypeScript      | UI                                                                 |
| Vite                       | Build / dev server                                                 |
| React Three Fiber + drei   | Rendu 3D déclaratif (three.js) et OrbitControls                    |
| three                      | Moteur 3D sous-jacent                                              |
| Tailwind CSS v4            | Styles (via `@tailwindcss/vite`, pas de config JS)                 |
| Zustand                    | État global (cube + animation, saisie, états mémorisés, vue, i18n) |
| Vitest + Testing Library   | Tests unitaires et composants                                      |
| Playwright                 | Tests e2e                                                          |
| Prettier                   | Formatage                                                          |
| ESLint (typescript-eslint) | Linting                                                            |
| Knip                       | Détection du code / dépendances inutilisés                         |

Standard maison React + Vite + Zustand + Tailwind, aligné sur les dépôts
voisins (ex : `big-bang-clicker`).

> `three` est **épinglé à `0.176.0`** : les versions plus récentes déprécient
> `THREE.Clock` (utilisé en interne par React Three Fiber), ce qui émettrait un
> avertissement en dev tant que R3F n'a pas migré vers `THREE.Timer`.

---

## Architecture

> Principe : **le moteur du cube est de la logique pure, sans flottants**. Le
> cube est modélisé par des cubies à coordonnées entières : `{-1,0,1}^3` pour
> le 3x3 (27 cubies), `{-1,1}^3` pour le 2x2 (8 coins, il saute la coordonnée
> 0), `{-3,-1,1,3}^3` pour le 4x4 (64 cubies espacés de 2 pour rester entiers :
> 8 coins, 24 ailes, 24 centres mobiles, 8 internes). **Rien n'y suppose un
> cube** : une forme n'est qu'un triplet de nombres de couches (`SHAPE_DIMS`),
> une grille par axe, ce qui donne le 1x2x3 (`{-1,0,1} x {-1,1} x {0}`, 6
> pièces), la tour et le Domino. Un `Move` désigne une face + éventuellement
> `depth: 2` (tranche interne ; `3` : la troisième couche, tranche du milieu d'un 5x5) et `wide` (couches 1 à `depth`) ; `moveSlab` en déduit
> la tranche tournée (l'intervalle entre deux plans de coupe), source unique
> partagée par `applyMove`, l'animation et l'aperçu (`turnedBy`). Les coups
> agissent sur le **mécanisme** (`turnDims`) : le puzzle lui-même, sauf la tour,
> qui tourne comme un 4x4x4 dont il manque des pièces. Une rotation est une
> rotation entière exacte à 90 degrés, donc l'état logique ne dérive jamais. Le
> rendu 3D est une **fonction pure de cet état** (chaque forme n'est qu'une
> mise à l'échelle, voir `three/layout.ts` ; la variante miroir n'est qu'une
> table d'épaisseurs, voir `lib/shape.ts`) ; les solveurs lisent le même modèle.

```
src/
├── lib/                  # Logique pure, zéro React / zéro three.js (entièrement testée)
│   ├── types.ts          # Types du domaine (CubeShape + SHAPE_DIMS/SHAPE_SHIFTS/SHAPE_INNER_TURNS, Dims, CubeVariant, Face, Color, Axis, Vec3, Sticker, Cubie (+ spin), Cube, Move avec depth/wide)
│   │                     #   + CUBE_KINDS : les choix exposés (forme x variante), leur id, libellé et catégorie
│   ├── geometry.ts       # Géométrie entière : normales des faces, normalIndex, grilles par axe (layerCoords), rotations exactes
│   ├── cube.ts           # Le puzzle : solvedCube, schéma de couleurs par forme (faceColorsOf), cubeShape (pièces + stickers),
│   │                     #   cubeDims/turnDims, isSolved/isBoxed, stateKey, cubeOrientations, comptages de stickers et de couleurs
│   ├── pieces.ts         # Requêtes de pièces : colorAt, colorsOf, cubieAt, atHome/homeAt/homesOf, listedAs (pièces listées dans le même ordre)
│   ├── morph.ts          # Pyramorphinx : un 2x2 taillé en tétraèdre (coins à 3 stickers, milieux de face à 1)
│   ├── oct4.ts           # 4-Trajber's Octahedron : un 4x4x4 sans cubies internes, un sticker par pièce (face de son octant)
│   ├── vto.ts            # Octahedron VTO et GEM-0 : un 3x3x3 taillé en octaèdre (pointes à part sur le VTO, carrés sur le GEM-0)
│   ├── dinoCyl.ts        # Dino Cylinder : le Dino et ses 8 sommets, qui pivotent sur place
│   ├── fto.ts            # FTO : l'octaèdre aux faces qui tournent (modèle du Rainbow), tours, mélange, lecture des formules
│   ├── gear.ts           # Gear Cubes : coups d'engrenage (demi-tour de face, quart de tranche), pivot des arêtes (Cubie.spin), réalignement
│   ├── violet.ts         # Violet : 2x2x2 dont un coin est coupé en 8, cœur excentré ; blocages, boîte, résolu, symétrie
│   ├── tower234.ts       # Tour 2x3x4 : colonnes de côté en quarts (elles la déforment), couches bloquées si incomplètes, boîte
│   ├── camo.ts           # Camouflage 4x4x2 : boîte de chaque pièce (épaisse ou fine, tournée avec elle), coups bloqués
│   ├── camoShape.ts      # Sa forme seule (axe haut de chaque pièce) : retour dans la boîte par les deux bouts, formules qui y reviennent
│   ├── ai.ts             # AI Cube : 4x4x4 aux quatre octants soudés en gros blocs, coups qui n'en coupent aucun, mélange
│   ├── superCube.ts      # Super Revenge et Super Professor : les bordures des centres en stickers de côté, identité d'un centre
│   ├── roadblock.ts      # RoadBlock-I : 5x5x5 aux centres soudés en barres (marque cachée), tranches permises, START, mélange
│   ├── roadblockEditor.ts # Sa saisie : une barre peinte d'un clic, une face aux barres tournées d'un quart (couleurs comprises)
│   ├── quarter.ts        # Quarter Cube : l'état de chaque face (Cubie.spin des centres), coups permis
│   ├── mmorph.ts         # Master Morphinx : un 3x3 aux centres marqués (sticker caché), petits sommets sans sens visible, résolu
│   ├── fisher.ts         # Fisher Cube et Windmill : un 3x3 dont les centres de côté portent un repère caché (leur sens), résolu
│   ├── megaminx.ts       # Megaminx, Holey et Pyraminx Crystal : modèle combinatoire (emplacements = faces touchées), coups par permutations, notation
│   ├── twist.ts          # Z-Twist : un 3x3 dont les centres de côté gardent leur quart de tour (Cubie.spin)
│   ├── violetStates.ts   # Ses états vus (gros cubes pareils) : arbre des plus courts chemins (solutions), mélange sans retour
│   ├── rainbow.ts        # Rainbow : cuboctaèdre, 12 pièces aux milieux des arêtes du cube, triangles en tiers de tour, notation ;
│   │                     #   le Dino Cube, même mécanique (ses arêtes seules, notation de fan2cube) ; le Rex Cube, coupé plus profond
│   ├── cycleLibrary.ts   # 3-cycles purs des grands cubes (commutateurs [A, X Y X'] conjugués), findCycle, placeAll, borrow
│   ├── ghost.ts          # Floppy Ghost : 10 emplacements autour du centre, demi-tours = réflexions entières, notation fan2cube
│   ├── pyraminx.ts       # Pyraminx, Tetraminx, Master, Professor et Jing : modèle tétraédrique entier (couches, pointes, tranches, moitiés), mélange
│   ├── pyraNotation.ts   # Leur notation hybride (FR fan2cube / US WCA), lecture des formules de fan2cube
│   ├── puck.ts           # Hockey Puck : deux étages de 12 secteurs, tours par crans et slash, numéro de chaque pièce
│   ├── star.ts           # Star Prism 2 et 4 étages : modèle hexagonal entier (anneaux + slash), notation fan2cube, mélange
│   ├── turn.ts           # Les coups : moveSlab/inSlab, applyMove(s), turnAllowed (tour), turnedBy, turnRotation (animation)
│   ├── moves.ts          # Notation US/FR (parse/format, 2R/Rw, M/E/S sur 3x3), sameLayer, inversion, simplification,
│   │                     #   movesFor(shape) déduit de la forme, scramble (RNG injectable, joué depuis l'état courant pour la tour)
│   ├── solverKit.ts      # Briques partagées des solveurs : search (BFS bornée sur le cube entier, clé de dédup injectable),
│   │                     #   solveWithAlgs ("aligner U puis algorithme"), relMoves/atEverySide, OUTER_GENERATORS,
│   │                     #   StepSpec/MethodPlan + buildSteps (vérifie objectif et coups autorisés de chaque étape)
│   ├── moveSet.ts        # Jeux de coups d'une étape (`moveSet('M U')`, `'M U2'` = demi-tours seuls), allows
│   ├── pieceSearch.ts    # solvePieces : recherche sur les seules pièces suivies, avec les coups de l'étape
│   │                     #   (bidirectionnelle vers "pièces à leur place", ou BFS vers un objectif + clé projetée ;
│   │                     #   macros = formules utilisées comme un seul générateur)
│   ├── solver.ts         # Registre des méthodes par forme (une ligne par méthode) : methodsFor(shape), solve() (validation)
│   ├── methods/          # Un fichier par famille de méthodes, chacune déclarée comme un MethodPlan :
│   │   ├── algs.ts       #   catalogue des algorithmes nommés (Sune, Aa, Ua, T, Y, Niklas, CMLL...), effets testés
│   │   ├── pieces3.ts    #   pièces du 3x3 nommées par leurs faces ('DFL', 'UR', 'L' : homeOf), piecesHome, buildBlock,
│   │   │                 #   orientation des arêtes (axe F/B, partagée avec la parité du 4x4), orientAllEdges, F2L en <R, U>
│   │   ├── recenter.ts   #   préfixe des méthodes 3x3 : remettre les centres (M, E, S), étape vide sinon
│   │   ├── layers3.ts    #   3x3 par couches et CFOP (prédicats et phases réutilisés par Petrus et ZZ)
│   │   ├── roux.ts       #   Roux : blocs 1x2x3, CMLL, LSE en <M, U>
│   │   ├── petrus.ts     #   Petrus : 2x2x2, 2x2x3 en <U, R, F>, arêtes, F2L en <R, U>, dernière couche en 3 temps
│   │   ├── zz.ts         #   ZZ : EOLine, blocs en <L, U, R> puis <R, U>, OCLL, PLL
│   │   ├── cube2.ts      #   2x2 : par couches (repère DBL) et optimal (BFS bidirectionnelle)
│   │   ├── exhaustive.ts #   optimal des petits puzzles (1x2x3, Floppy, Floppy Ghost) : BFS exhaustive via solvePieces
│   │   ├── tower.ts      #   tour 2x2x4 : Deux Pockets (forme, Pocket intérieur, Pocket extérieur)
│   │   ├── pyraKit.ts    #   briques des Pyraminx : couleurs des faces, coins tournés en place, formules vues de chaque côté
│   │   ├── pyraminx.ts   #   Pyraminx et Tetraminx : centres d'abord (formules de fan2cube.fr)
│   │   ├── pyraminx4.ts  #   Master Pyraminx : ailes puis co-ailes (3-cycles d'ailes, formules de fan2cube.fr)
│   │   ├── pyraminx5.ts  #   Professor Pyraminx : ailes, co-ailes, arêtes, co-centres, centres (fan2cube.fr)
│   │   ├── oct4.ts       #   4-Trajber's Octahedron : parité, sommets, arêtes, centres (3-cycles, fan2cube.fr)
│   │   ├── vto.ts        #   VTO et GEM-0 : centres, arêtes placées (3-cycles), retournées par paires, pointes (fan2cube.fr)
│   │   ├── fto.ts        #   FTO : sommets, centres (O4), arêtes (O3), 3-cycles purs de fan2cube.fr
│   │   ├── rainbow.ts    #   Rainbow : triangle du haut, puis les autres par 3-cycles ([H' G'], [H D], fan2cube.fr)
│   │   ├── dino.ts       #   Dino Cube : étage par étage, par le 3-cycle [GA'] (fan2cube.fr), partagé avec le Dino Cylinder
│   │   ├── dinoCyl.ts    #   Dino Cylinder : les étages du Dino, puis les sommets pivotés ((A)+ = [AD]A'[DA'])
│   │   ├── rex.ts        #   Rex Cube : arêtes, centres, pétales, par 3-cycles (fan2cube.fr)
│   │   ├── pyraCycles.ts #   3-cycles d'une sorte de pièce par conjugaison (cycleTable), chiralité (handedHome), placement
│   │   ├── jing.ts       #   Pyraminx Jing : sommets d'abord (crochet [DH] de fan2cube.fr)
│   │   ├── morph.ts      #   Pyramorphinx : comme un Pocket (lu comme un 2x2, solveur optimal du 2x2)
│   │   ├── puck.ts       #   Hockey Puck : isoler, puis ranger le bas et le haut par la formule K et sa famille
│   │   ├── starPrism.ts  #   Star Prism : isoler puis permuter (formule K de fan2cube.fr)
│   │   ├── starPrism4.ts #   4-Star : deux étoiles (le plan du 2-Star projeté sur l'interne puis l'externe)
│   │   ├── slimTower.ts  #   Slim Tower 2x2x3 : équateur puis coins (formules du Domino, fan2cube.fr)
│   │   ├── domino.ts     #   Domino 3x3x2 : coins puis arêtes (formules de fan2cube.fr, reprises élargies par la tour)
│   │   ├── tower234.ts   #   Tour 2x3x4 : forme, centres, sommets, arêtes, équateur (formules de fan2cube.fr, plus une de parité)
│   │   ├── towerLayers.ts #  Tours de 3 de large : Domino extérieur (lu comme un Domino), Domino intérieur (M S M S'), équateur
│   │   ├── tower334.ts   #   Tour 3x3x4 : double Domino, l'extérieur puis l'intérieur
│   │   ├── towerReduce.ts #  Réduction des grandes tours : 3-cycles purs trouvés au chargement, cibles par couleur, ailes, parités
│   │   ├── tower44.ts    #   Tours 4x4x3 et 4x4x5 : parité, centres, ailes appariées, puis Dominos et équateur
│   │   ├── tower554.ts   #   Tour 5x5x4 : parité, centres, ailes près de leur milieu, puis comme un 3x3x4
│   │   ├── floppy.ts     #   Floppy 3x3x1 : coins puis arêtes retournées deux par deux (fan2cube.fr)
│   │   ├── ghost.ts      #   Floppy Ghost : sommets placés, orientés, puis arêtes (formules de fan2cube, des 5 côtés)
│   │   ├── gear.ts       #   Gear Cube : coins, arêtes placées, agrafes, engrenages (formules de fan2cube.fr)
│   │   ├── gearExtreme.ts #  Gear Cube Extreme : équateur, coins, arêtes, agrafes, engrenages (fan2cube.fr)
│   │   ├── twist.ts      #   Z-Twist : une méthode 3x3 sur les couleurs, puis les centres de côté remis
│   │   ├── camo.ts       #   Camouflage : forme (et parité des ailes), centres, arêtes, puis la méthode du Domino
│   │   ├── ai.ts         #   AI Cube : position standard, octants reconstitués (arêtes, centres), puis comme un Pocket
│   │   ├── superCube.ts  #   Super cubes : la méthode du 4x4 ou du 5x5 sur les couleurs, puis centres du milieu tournés, centres rangés (3-cycles)
│   │   ├── roadblock.ts  #   RoadBlock-I : barres du milieu, parité, barres, arêtes (3-cycles de START à START), puis comme un 3x3
│   │   ├── quarter.ts    #   Quarter Cube : les arêtes d'abord (4 formules alternées de fan2cube.fr)
│   │   ├── tori.ts       #   Tori : croix prolongée (formules de fan2cube.fr)
│   │   ├── barrel.ts     #   Barrel : par couches, arêtes du milieu sans sens (formules de fan2cube.fr)
│   │   ├── mmorph.ts     #   Master Morphinx : une méthode 3x3 sur les couleurs, puis les centres tournés ((H)+(G)-, (H)2+)
│   │   ├── fisher.ts     #   Fisher Cube et Windmill : une méthode 3x3 sur les couleurs, puis les centres tournés ((H)+(G)-)
│   │   ├── megaminx.ts   #   Megaminx (l'étoile prolongée) et Crystal (les sommets d'abord) : formules de toutes les tenues, pièce par pièce
│   │   ├── skewbU.ts     #   Skewb Ultimate : le haut d'abord, les seuls sommets du bas (formules de fan2cube.fr)
│   │   ├── edgeOnly.ts   #   Edge Only : lu comme le Tori de la tenue la plus proche, résolu par sa méthode
│   │   └── violet.ts     #   Violet : forme puis couleurs, et optimale (arbre de recherche de violetStates.ts)
│   ├── solver4/          # Solveur 4x4 par réduction :
│   │   ├── centers.ts    #   centres par comptage (D, U, puis ceinture), recherches bornées sans régression
│   │   ├── edges.ts      #   appariement des ailes (échanges nets FR-bas <-> BR/FL-haut, goal-checkés), flip L2E
│   │   ├── project.ts    #   projection homomorphe du 4x4 réduit vers un 3x3 virtuel (to3x3)
│   │   ├── parity.ts     #   détecteurs (flip, signes de permutation, vrille) + algos de parité OLL/PLL
│   │   └── steps.ts      #   reductionPlan(plan 3x3) : préfixe centres/arêtes/parité + étapes 3x3 projetées (projectPlan, partagé)
│   ├── solver5/          # Solveur 5x5 par réduction :
│   │   ├── kinds.ts      #   sortes de pièces par position (coins, milieux et ailes d'arêtes, centres fixes, en croix, diagonaux)
│   │   ├── centers.ts    #   centres face par face : deux coups si possible, sinon un 3-cycle de centres
│   │   ├── edges.ts      #   ailes amenées sur leur milieu par 3-cycles d'ailes, parité d'arête (algo OLL du 4x4)
│   │   ├── project.ts    #   projection du 5x5 réduit vers un 3x3 (coins, milieux d'arêtes, centres fixes)
│   │   └── steps.ts      #   reduction5Plan(plan 3x3)
│   ├── solver6/          # Solveur 6x6 par réduction : kinds, centers, edges (choix des arêtes, parités d'orbite), project, steps
│   ├── centerCycles.ts   # Centres des grands cubes face par face (deux coups, sinon un 3-cycle), partagé 5x5 / 6x6
│   ├── wingPairing.ts    # Ailes amenées où on les veut par 3-cycles purs, partagé 5x5 / 6x6
│   ├── editorTables.ts   # Tables de saisie par forme : slots, placements valides étiquetés par pièce physique, budgets,
│   │                     #   pièces fixes pré-remplies (centres du 3x3, demi-vis gauche des étoiles), stickers cachés (4-Star)
│   ├── gearEditor.ts     # Saisie des Gear Cubes à agrafes colorées (Ultimate, Extreme) : engrenages peints à part de leurs agrafes, retournés ou non
│   ├── editor.ts         # Saisie guidée : peinture contrainte par placements + budgets, auto-complétion, buildCube/cubeToEdit
│   ├── forms.ts          # Formes d'un puzzle déformable (tour, Violet, Pyramorphinx) pour la saisie : formsOf, lookOf
│   ├── pieceEditor.ts    # Saisie pièce par pièce (Floppy Ghost, Z-Twist, Hockey Puck, Barrel, Fisher) : poses par emplacement, nextPiece, piecesIn
│   ├── validate.ts       # validateCube : comptage par couleur (déduit du puzzle résolu) + solubilité (résolution bornée ; invariants de pièces + vrille sur 4x4)
│   ├── shape.ts          # Cube miroir : épaisseur de couche par couleur, boîte d'un cubie (cubieBox) déduite de ses stickers
│   ├── moveGuide.ts      # Guide des mouvements : lignes par forme (coup + opposé, puis quantifié), describeMove
│   ├── route.ts          # Adresse `#/<langue>/<puzzle>` (`#/<langue>` : l'accueil) : nom de chaque puzzle (SHAPE_SLUG + -mirror), routeHash, parseRoute
│   ├── snapshot.ts       # encodeCube/decodeCube : forme texte d'un état (mémorisation), décodage qui rejette un texte corrompu
│   ├── easing.ts         # easeInOut (partagé par les animations)
│   ├── speed.ts          # Curseur 0..100 <-> secondes par rotation (exponentiel, de 2,5 s à 0,06 s)
│   └── progress.ts       # solveProgress : avancement par étape d'une solution (pour l'UI)
├── hooks/
│   ├── useAutoPlan.ts    # Solution calculée d'avance dans le worker dès que le cube est au repos (prête ou non)
│   ├── useIsDesktop.ts   # Breakpoint `sm` via matchMedia (bascule panneau unique / deux panneaux)
│   └── useSolveShortcuts.ts # Clavier de la solution : ← → un coup, Pg↑ Pg↓ une étape, Espace pause, Entrée tout
├── store/
│   ├── cubeStore.ts      # Zustand : cube + variante de rendu + file de rotations + pilotage animation ;
│   │                     #   méthode, étapes, jouer tout / pas à pas, loadCube ; sélecteurs selectBusy / selectSolved
│   ├── editorStore.ts    # Zustand : mode play/edit, couleur sélectionnée, saisie, apply (build + validate + charge)
│   ├── router.ts         # Routeur par hash : useRoute (accueil ou puzzle), followRoute (stores <- adresse), goTo (nouvelle entrée), startRouter
│   ├── savedStore.ts     # Zustand : un état mémorisé par forme, persisté en localStorage (try/catch : sans stockage, juste la session)
│   └── viewStore.ts      # Zustand : pont DOM -> 3D (recentrage caméra : resetToken ; coup survolé : preview)
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet) ; locale + notation US/FR
│   ├── translations.ts   # `fr` (source) + `en: Translations`
│   ├── moveSentences.ts  # Noms des faces et des étages, phrases du guide des mouvements (describeFr / describeEn)
│   └── i18nStore.ts      # store `useI18n` (locale, t, setLocale, notation, setNotation) + selectMoveLabels
├── three/                # Rendu 3D (React Three Fiber) ; un composant/hook par fichier
│   ├── Scene.tsx         # <Canvas> : caméra, lumières, OrbitControls ; bascule CubeView / PolyView, ou EditView / PolyEditView
│   ├── CubeView.tsx      # Rend les cubies (via useTurnAnimation), à l'échelle de la forme, recentré selon la variante,
│   │                     #   pièces du coup survolé en surbrillance
│   ├── EditView.tsx      # Mode saisie : stickers peignables cliquables, vides en gris, face survolée en surbrillance ; en épaisseurs (dorés) sur un miroir
│   ├── Cubie.tsx         # Un cubie : corps + stickers, à la boîte de sa variante, en surbrillance si un coup survolé le tourne
│   ├── layout.ts         # Échelle et position visuelles (coordonnée / pas de la grille : linéaire, juste hors de la boîte)
│   ├── polygons.ts       # Pièces des puzzles sans grille en polygones (corps + stickers), PiecePolygon
│   ├── puckGeometry.ts   # Pièces du Hockey Puck : secteurs d'anneau de leur étage, numéros dorés en décalcomanie
│   ├── starGeometry.ts   # Géométrie des pièces de l'étoile (cerfs-volants extrudés), partagée vue 3D / vignette
│   ├── pyraGeometry.ts   # Géométrie des pièces du Pyraminx (petits tétraèdres et octaèdres des cellules du modèle)
│   ├── morphGeometry.ts  # Pièces du Pyramorphinx : case du 2x2 coupée par le tétraèdre (polyèdre convexe)
│   ├── polyhedron.ts     # Polyèdre convexe depuis ses plans (Pyramorphinx, octaèdres, Rainbow, Dino)
│   ├── octGeometry.ts    # Pièces des octaèdres (4-Trajber, VTO, GEM-0) : case du cube coupée par l'octaèdre (polyhedron.ts)
│   ├── ftoGeometry.ts    # Pièces du FTO : l'octaèdre coupé par ses quatre paires de plans (polyhedron.ts)
│   ├── gemEmblem.ts      # L'emblème rond des carrés dorés du GEM-0, dessiné sur un canvas
│   ├── gearFace.ts       # La face du Gear Cube convenue : masques des 4 sortes de pièce (src/assets/gear), plaques tournées en place
│   ├── GearPlate.tsx     # Une plaque d'une pièce du Gear Cube, découpée par son masque
│   ├── GearEdge.tsx      # Une arête du Gear Cube : deux agrafes, l'engrenage (deux plaques et son corps à sa forme) qui pivote
│   ├── GearCorner.tsx    # Un coin ou un centre du Gear Cube : plaques sur des corps à leur forme
│   ├── tower234Geometry.ts # Pièces de la tour 2x3x4 : boîtes (1 de large, 2 de haut et de profondeur), stickers sur leurs faces extérieures
│   ├── camoGeometry.ts   # Pièces du Camouflage : leur boîte telle qu'elle se tient
│   ├── aiGeometry.ts     # Pièces de l'AI Cube : boîtes d'une case ou de deux
│   ├── superGeometry.ts  # Pièces des super cubes : cubies d'un 4x4 ou d'un 5x5, centres bordés (biseautés aux coins) de la couleur des faces voisines
│   ├── roadblockGeometry.ts # Pièces du RoadBlock-I : couches externes épaisses, barres d'un seul sticker
│   ├── quarterGeometry.ts # Pièces du Quarter Cube : cubies et repère tourné de chaque centre
│   ├── toriGeometry.ts   # Pièces du Tori : cube arrondi coupé par les plans du 3x3, faces percées en anneaux
│   ├── twistGeometry.ts  # Pièces du Z-Twist : la case du 3x3 dans le solide tordu, portée par la pièce
│   ├── cutSolid.ts       # Pièces d'un 3x3 taillé dans un solide convexe (Barrel, Fisher), portées par la pièce
│   ├── barrelGeometry.ts # Le solide du Barrel (prisme octogonal) et la couleur de ses coupes
│   ├── mmorphGeometry.ts # Le solide du Master Morphinx (tétraèdre), à facettes planes
│   ├── fisherGeometry.ts # Le solide du Fisher Cube (cube tourné d'un huitième) et ses couleurs
│   ├── windmillGeometry.ts # Le solide du Windmill (cube tourné d'environ 31°, ses arêtes sur les coupes)
│   ├── megaGeometry.ts   # Pièces du Megaminx (et du Crystal, coupé plus profond) : dodécaèdre coupé par les plans de ses couches
│   ├── skewbUGeometry.ts # Pièces du Skewb Ultimate : dodécaèdre coupé par les quatre plans du Skewb
│   ├── violetGeometry.ts # Pièces du Violet : boîtes de deux tailles, violettes sur toutes leurs faces
│   ├── Decal.tsx         # Une image posée sur la face de pièces choisies, qui tourne avec elles (PolyDrawing.decal)
│   ├── rainbowGeometry.ts # Pièces du Rainbow : cellule de chaque pièce dans le cuboctaèdre (polyhedron.ts)
│   ├── dinoCylGeometry.ts # Pièces du Dino Cylinder : le cylindre coupé par les plans des sommets, portées par la pièce
│   ├── dinoGeometry.ts   # Pièces du Dino Cube : le cube coupé le long des diagonales de ses faces ; l'Edge Only, percé au milieu
│   ├── rexGeometry.ts    # Pièces du Rex Cube : chaque face coupée par quatre cercles, régions tracées par rayons
│   ├── ghostGeometry.ts  # Pièces du Floppy Ghost : régions du carré coupé par le pentagramme, extrudées, posées par réflexions
│   ├── jingGeometry.ts   # Géométrie courbe du Jing : surface arrondie maillée fin, découpée le long des coupes
│   ├── polyDrawing.ts    # Dessin d'un puzzle sans grille : ses polygones, son lacet à l'écran, sa teinte unique (argent du Ghost)
│   ├── CubeModel.tsx     # Rendu d'un puzzle à grille depuis un état (couche qui tourne dans son groupe), partagé scène / guide
│   ├── PolyModel.tsx     # Idem pour les puzzles sans grille (étoiles, Pyraminx, octaèdres...)
│   ├── PolyPiece.tsx     # Une de leurs pièces (corps + stickers), partagée vue / saisie / guide
│   ├── noPieces.ts       # NO_PIECES : l'ensemble vide de pièces (rien ne tourne, rien en surbrillance)
│   ├── PolyView.tsx      # Vue 3D d'un puzzle sans grille (PolyModel), animée comme les cubes
│   ├── PolyEditView.tsx  # Saisie d'un puzzle sans grille : stickers cliquables, gris tant que vides, survolé éclairci (pièces au clic sur le Ghost et le Z-Twist)
│   ├── GuideCanvas.tsx   # Guide des mouvements : un seul canvas WebGL sous la liste, chaque vignette y dessine sa scène
│   ├── GuideTile.tsx     #   une vignette : scène + caméra propres, scissor sur sa boîte DOM, coup joué en boucle
│   ├── guideCamera.ts    #   point de vue d'une vignette (la couche qui tourne face à la caméra)
│   ├── usePreviewed.ts   # Pièces que le coup survolé ferait tourner (surbrillance, tous les puzzles ; demi-tours du Gear Cube)
│   ├── isometric.ts      # Vignette d'un puzzle résolu en vue isométrique (polygones SVG), déduite du même layout
│   ├── paintable.ts      # Props de clic d'un mesh peignable en saisie (curseur, clic pour lui seul, survol)
│   ├── Sticker.tsx       # Sticker orienté à sa normale et dimensionné à sa face, mutualisé play/édition (onSelect = cliquable)
│   ├── useTurnAnimation.ts # Hook : pilote la file de rotations (rotation de la couche active)
│   ├── camera.ts         # Cadrage caméra de référence (position de départ et de recentrage)
│   ├── CameraReset.tsx   # Recentrage caméra animé (lit viewStore, dans le <Canvas>)
│   └── colors.ts         # Couleurs des stickers (hex), plastique, doré du cube miroir, argent du Floppy Ghost
├── components/
│   ├── ui/               # Primitives réutilisables (Button, IconButton, SegmentedToggle, Select, Modal, ConfirmDialog)
│   │                     #   + styles.ts : classes partagées (SECTION_BOX, SECTION_LABEL, TURN_PAIR)
│   │                     #   + features.ts : icône et couleur des 3 fonctionnalités (saisie bleu ciel, guide violet,
│   │                     #     résolution ambre), partagées par les cartes de l'accueil et les boutons (variantes de Button)
│   ├── controls/         # Panneau : Controls (orchestrateur), SetupSection, StatusBadge, MovePad / StarPad / PyraPad / GhostPad / PuckPad / RainbowPad / FtoPad / GearPad / MegaPad (+ PadHeader,
│   │                     #   PadButton : un coup, sa surbrillance au survol), LanguageToggle, NotationToggle,
│   │                     #   RecenterButton, CollapseButton, SpeedSlider, Credit (« Fait avec ❤️ par YavaDeus », lien vers yavadeus.dev)
│   ├── picker/           # Choix du cube : CubePicker (bouton + modale), PickerTile, PuzzleIcon (vignette SVG),
│   │                     #   CategoryIcon (plusieurs puzzles groupés : une catégorie se distingue d'un puzzle)
│   ├── guide/            # Guide des mouvements : MoveGuideButton (dans PadHeader), MoveGuideDialog
│   ├── celebration/      # Fireworks : petit feu d'artifice (canvas 2D monté le temps du spectacle) quand un coup résout
│   ├── home/             # Accueil : HomeGallery (galerie de 7 modèles, dont le Gear Cube Ultimate, + ce que fait l'app)
│   ├── solve/            # Résolution : SolvePanel, MethodSelect, PlanOutline, StepList
│   └── edit/             # Saisie : EditPanel, FormPicker (forme d'un puzzle déformable), ColorPalette, BarToggles (sens des barres du RoadBlock-I)
├── assets/gear/          # Masques et contours des pièces du Gear Cube (générés par scripts/gear_face.py)
├── workers/
│   └── solveWorker.ts    # Calcul de la solution hors du fil de l'interface (useAutoPlan)
├── App.tsx               # Coquille : scène 3D plein écran + panneau en overlay (empilé sur mobile en saisie)
└── main.tsx
tests/
├── setup.ts              # Configuration de Vitest (jest-dom)
├── helpers.ts            # RNG déterministe (seededRng), coin vrillé (twistedCorner)
├── unit/                 # Vitest : puzzles (conformance : une ligne par forme, voir plus bas), cube (coups, tour),
│                         #   moves, solver + solver4 + solver6,
│                         #   methods (Roux/Petrus/ZZ : objectifs et jeux de coups), algs, tower, domino (effet de chaque
│                         #   formule), floppy, slimTower, towers (parités des grandes tours), pieceSearch, flat123 (espaces d'états entiers), editor, validate, shape, snapshot,
│                         #   star (modèle, formules fan2cube, méthodes des deux étoiles), starEditor (saisie des étoiles),
│                         #   pyraminx, pyraminx4, pyraminx5, jing (notation, formules fan2cube, états impossibles),
│                         #   tetra/oct4/vto/rainbow/gear/ghost/ghostGeometry/morph/violet/twist (un fichier par puzzle),
│                         #   solver5, forms, route, moveGuide, isometric, layout, stores, easing, speed, progress
├── component/            # Vitest + Testing Library (Controls, SegmentedToggle, raccourcis de la solution)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution (3x3, 2x2, 1x2x3, 4x4), saisie
                          #   depuis un mélange puis résolution (liste ENTERED : un modèle par sorte), miroir, guide sur chaque puzzle,
                          #   accueil, adresse et retour arrière, saisie de la tour par sa forme, éditeurs 3x3 et 4x4)
```

**Tests d'un puzzle** : ce que tout puzzle doit vérifier est écrit une fois,
dans la suite de conformance `tests/unit/puzzles.test.ts`, qui parcourt un
tableau d'une ligne par forme (pièces, stickers, orientations, stickers
saisis, longueur de mélange) : construit résolu et reconnu, chaque tour
défait par son inverse, orientations, mélange défait et snapshot, chaque
méthode résout un mélange (tenu aussi autrement, quand l'éditeur le permet),
étapes et méthodes nommées dans les deux langues, saisie aller-retour validée,
guide complet et décrit. Un nouveau puzzle y ajoute une ligne (et une ligne
dans la liste `ENTERED` de l'e2e s'il est d'une sorte nouvelle : l'e2e
saisit un exemplaire de chaque sorte de modèle, pas chaque puzzle) ; son propre fichier ne garde que ce qui
lui est propre : notation, effet de chaque formule de fan2cube, jeux de coups
de sa méthode, états impossibles, particularités de saisie. Inutile d'y
re-tester « chaque étape atteint son but » : `buildSteps` le vérifie déjà à
chaque résolution.

### Les solveurs par méthode (`src/lib/solver.ts`)

Le but est **pédagogique** : proposer plusieurs **vraies méthodes** et faire
**apprendre leurs étapes**, pas minimiser le nombre de coups. Chaque méthode est
définie par son **cheminement propre** (sa suite d'objectifs) et renvoie ses
**étapes nommées** (`SolveStep[]`), que l'UI joue une par une. Repère commun :
le jaune (face D) est la première couche, le blanc (face U) la dernière.

Une méthode est **déclarée, pas codée en dur** : un `MethodPlan` est une liste
d'étapes (`StepSpec`), chacune avec sa clé i18n, **l'objectif qu'elle doit
atteindre** (`goal`), **les coups qu'elle a le droit d'utiliser** (`moves`, un
`MoveSet`) et ses phases (le travail). `buildSteps` vérifie ce contrat à chaque
résolution : une étape qui s'arrête avant son objectif ou glisse un coup
interdit lève une exception. C'est ce qui empêche une méthode de dégénérer en
« par couches déguisé » : les jeux de coups (`<M, U>` pour la fin de Roux,
`<R, U>` pour le F2L de Petrus...) sont imposés.

Le registre (`solver.ts`) déclare, pour chaque méthode, **un plan par forme
supportée** (source unique : pas de dispatch séparé) ; `methodsFor(shape)`
renvoie les méthodes disponibles pour une forme, chacune liée à son plan (l'UI
et le store ne voient que ça) :

Toutes les méthodes 3x3 commencent par **Remettre les centres**
(`withCentersHome`, voir « Coups avancés du 3x3 »), étape retirée quand elle
est vide ; les nombres d'étapes ci-dessous ne la comptent pas.

- **Par couches** (`beginner`, 3x3, Z-Twist, Fisher Cube, Windmill, Master Morphinx et 2x2) : sur 3x3, 1re couche entière
  (croix + coins), puis arêtes du milieu, puis dernière couche (croix,
  orientation coins, permutation coins, permutation arêtes) - 7 étapes. Sur
  2x2 (pas d'arêtes ni de centres) : coins du bas, orientation du haut,
  permutation du haut - 3 étapes.
- **Fridrich / CFOP** (`cfop`, 3x3, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx) : Croix, puis **F2L** (paires coin+arête
  par colonne), puis **OLL**, puis **PLL** - 4 étapes.
- **Réduction** (`reduction` et `reductionCfop`, 4x4, 5x5 et 6x6) : Centres,
  Appariement des arêtes, Correction de parité (étape émise seulement si
  nécessaire), puis la phase 3x3 de la méthode choisie (par couches ou CFOP)
  - voir plus bas, « Le 5x5 par réduction » et « Le 6x6 par réduction ». Sur
    le Super Revenge et le Super Professor, la même sur leurs couleurs, puis
    leurs centres - voir « Les super cubes ».
- **Roux** (`roux`, 3x3) : premier bloc 1x2x3 à gauche (arête DL, paire
  avant, paire arrière), second bloc à droite en `<U, R, M, r>` seulement,
  CMLL en 2 temps (orienter avec Sune/Antisune, permuter), puis les six
  dernières arêtes en `<M, U>` : orientation, UL/UR, tranche M en `<M, U2>`
  - 6 étapes.
- **Petrus** (`petrus`, 3x3, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx), les 7 étapes de Lars Petrus : bloc 2x2x2 (DBL),
  extension en 2x2x3 en `<U, R, F>` (ne touchent pas le 2x2x2), arêtes
  orientées (F et B n'apparaissent que dans `F' U F` / `B U B'`, qui
  préservent le bloc), fin du F2L en `<R, U>` seulement, puis coins placés
  (Niklas), coins tournés (Sune/Antisune), arêtes placées (Ua).
- **ZZ** (`zz`, 3x3, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx) : EOLine (les 12 arêtes orientées, puis DF/DB en coups
  qui ne retournent rien : `U D L R F2 B2`), bloc gauche en `<L, U, R>`, bloc
  droit en `<R, U>` (aucun quart de tour de F ou B après l'EOLine), OCLL, PLL
  - 5 étapes.
- **Optimale** (`optimal`, 2x2, 1x2x3, Floppy, Floppy Ghost et Violet) : recherche exhaustive,
  solution la plus courte possible (11 coups max sur 2x2, 6 sur 1x2x3, 8 sur
  Floppy, 15 sur Floppy Ghost, 30 sur Violet), une seule étape.
- **Coins d'abord** (`gearCornersFirst`, Gear Cube et Ultimate) : coins, arêtes
  placées, agrafes (Ultimate), engrenages - voir « Le Gear Cube Ultimate ».
- **Équateur puis coins** (`gearEquatorFirst`, Gear Cube Extreme) : équateur et
  centres, coins du bas puis du haut, arêtes isolées puis placées, agrafes,
  engrenages - voir « Le Gear Cube Extreme ».
- **Étage par étage** (`dinoCylLayers`, Dino Cylinder) : les étages du Dino,
  puis les sommets pivotés - voir « Le Dino Cylinder ».
- **Étage par étage** (`dinoLayers`, Dino Cube) : le haut, l'équateur, le bas,
  avec le seul 3-cycle [GA'] - voir « Le Dino Cube ».
- **Arêtes, centres, pétales** (`rexEdgesFirst`, Rex Cube) : par 3-cycles - voir
  « Le Rex Cube ».
- **Croix prolongée** (`extendedCross`, Tori et Edge Only) : croix du bas, arêtes du milieu,
  croix du haut, arêtes du haut placées - voir « Le Tori ».
- **Les arêtes d'abord** (`quarterEdgesFirst`, Quarter Cube) : faces au départ,
  arêtes placées, retournées, coins placés, tournés - voir « Le Quarter Cube ».
- **Forme puis couleurs** (`shapeFirst`, Violet) : redevenir un cube, puis
  les couleurs du coin composé - voir « Le Violet ».
- **Réduction en Domino** (`camoReduction`, Camouflage 4x4x2) : forme, centres,
  arêtes appariées, puis le Domino - voir « Le Camouflage 4x4x2 ».
- **Deux Pockets** (`twoPockets`, tour 2x2x4) : remise en forme, Pocket intérieur,
  Pocket extérieur - voir « La tour 2x2x4 ».
- **Sommets, arêtes, équateur** (`tower234Steps`, tour 2x3x4) : forme, centres,
  sommets, arêtes, équateur - voir « La tour 2x3x4 ».
- **Double Domino** (`doubleDomino`, tour 3x3x4) : le Domino extérieur, puis
  l'intérieur - voir « Les tours 3x3x4, 4x4x3, 4x4x5 et 5x5x4 ».
- **Réduction** (`towerReduction`, tours 4x4x3, 4x4x5 et 5x5x4) : parité,
  centres, arêtes reformées, puis la tour de 3 de large qu'elles sont
  devenues - même section.
- **Équateur puis coins** (`equatorFirst`, Slim Tower 2x2x3) : les arêtes de
  l'équateur, puis les coins du bas descendus deux par deux, puis ceux du haut
  - voir « Le Domino, le Floppy et la Slim Tower ».
- **Isoler puis permuter** (`isolateFirst`, Star Prism) : sommets isolés,
  puis le bas et le haut avec la formule `K` - voir « Le Star Prism ».
- **Isoler puis permuter** (`puckIsolate`, Hockey Puck) : isoler, ranger le bas,
  puis le haut, aligner - voir « Le Hockey Puck ».
- **Deux étoiles** (`twoStars`, 4-Star Prism) : l'étoile interne puis
  l'externe, chacune par « isoler puis permuter », puis alignement.
- **Centres d'abord** (`centersFirst`, Pyraminx et Tetraminx) : centres, pointes
  (Pyraminx), arêtes du bas, arêtes du haut placées, puis retournées - voir « Le Pyraminx ».
- **Sommets d'abord** (`jingCornersFirst`, Pyraminx Jing) : sommets, arêtes
  placées, retournées, centres - voir « Le Pyraminx Jing ».
- **Comme un Pocket** (`asPocket`, Pyramorphinx) : une étape, la solution
  optimale du 2x2 qu'il est - voir « Le Pyramorphinx ».
- **Sommets d'abord** (`octCornersFirst`, 4-Trajber's Octahedron) : parité,
  sommets, arêtes, centres - voir « Le 4-Trajber's Octahedron ».
- **Centres puis arêtes** (`vtoCentersFirst`, Octahedron VTO ; `gemCentersFirst`,
  GEM-0) : centres, arêtes placées, retournées, pointes du VTO - voir
  « L'Octahedron VTO et le GEM-0 ».
- **Par couches** (`barrelLayers`, Barrel) : couche du bas, arêtes du milieu
  (dans un sens ou l'autre), coins du haut, arêtes du haut placées puis
  retournées - voir « Le Barrel ».
- **L'étoile prolongée** (`megaStar`, Megaminx et Holey Megaminx) : étoile et sommets du
  dessous, équateur bas, cinq faces voisines, équateur haut, puis la face du
  haut - voir « Le Megaminx ».
- **Les sommets d'abord** (`crystalCornersFirst`, Pyraminx Crystal) : comme le
  Megaminx, chaque couche ses sommets avant ses arêtes - voir « Le Pyraminx
  Crystal ».
- **Le haut d'abord** (`skewbTopFirst`, Skewb Ultimate) : sommets du haut
  placés puis tournés, centres placés puis retournés, sommets du bas tournés -
  voir « Le Skewb Ultimate ».
- **Sommets, centres, arêtes** (`ftoCornersFirst`, FTO) : sommets placés et
  tournés, centres par 3-cycles purs, arêtes de même - voir « Le FTO ».
- **Méthode des blocs** (`aiBlocks`, AI Cube) : position standard, arêtes et
  centres des petits octants, puis comme un Pocket - voir « L'AI Cube ».
- **Méthode des centres** (`rbCenters`, RoadBlock-I) : barres du milieu,
  parité, autres barres, arêtes, puis comme un 3x3 -
  voir « Le RoadBlock-I ».
- **Triangle prolongé** (`extendedTriangle`, Rainbow) : le triangle du haut,
  puis les autres par 3-cycles - voir « Le Rainbow ».
- **Ailes puis co-ailes** (`wingsFirst`, Master et Professor Pyraminx) :
  co-sommets, pointes, centres, ailes, co-ailes (puis arêtes et co-centres
  sur le Professor), fin des centres - voir « Le Master Pyraminx » et « Le
  Professor Pyraminx ».
- **Coins puis arêtes** (`cornersFirst`, Domino 3x3x2, Floppy 3x3x1 et
  Floppy Ghost) : sur le Domino, coins du bas, coins du haut, arêtes du bas,
  arêtes du haut ; sur le Floppy, coins placés puis arêtes retournées - voir
  « Le Domino et le Floppy » ; sur le Floppy Ghost, sommets placés, sommets
  orientés, arêtes retournées - voir « Le Floppy Ghost ».

**Repère du 2x2** : sans centres, pas de repère fixe. Le coin en **DBL**
(position `[-1,-1,-1]`) joue ce rôle : ses stickers définissent les couleurs
D/L/B (opposées déduites du schéma standard). Les prédicats **recalculent ce
repère sur l'état qu'ils examinent**, donc les algorithmes qui déplacent le
coin-ancre restent corrects par construction. Le solveur optimal est une **BFS
bidirectionnelle** en rotations U/R/F (qui ne bougent jamais DBL), du cube vers
l'orientation du cube résolu qui partage son coin DBL ; la borne de profondeur
(12 > nombre de Dieu du 2x2 = 11) rend l'échec sur cube impossible borné et
rapide, ce qu'exploite la validation. Elle garde sa propre boucle (et non
`solvePieces`) parce qu'elle continue après la première rencontre pour
garantir l'optimalité.

**Le 4x4 par réduction** (`src/lib/solver4/`) : repère absolu = `FACE_COLOR`
(les centres d'une couleur étant indiscernables, le schéma standard est
toujours constructible). (1) **Centres** : par comptage, pièce par pièce (D,
U, puis la ceinture), recherches bornées dont l'objectif interdit toute
régression ; la déduplication se fait par une clé projetée sur les seuls
centres (les pièces de même couleur se confondent), ce qui écrase l'espace de
recherche. (2) **Appariement des ailes** : les séquences « tranche, échange
externe, tranche inverse » ont un effet net minuscule et vérifié (échanger
l'aile FR-bas avec BR-haut ou FL-haut, tout le reste intact, centres compris) ;
comme le partenaire amené est par définition non apparié, chaque application
gagne exactement une arête. Le cas « croisé » final (flip) passe par un
algorithme dédié. (3) **Parités** : un 4x4 réduit peut projeter sur un état de
3x3 _impossible_ (une arête composite flippée = parité OLL ; deux arêtes
échangées = parité PLL) ; des invariants déterministes les détectent (somme des
flips, signes des permutations) et les algorithmes standards en tranches les
corrigent AVANT la phase 3x3. Une vrille de coin (somme des twists non nulle
mod 3) fait lever une exception : cube réellement impossible. (4) **Phase
3x3** : le 4x4 réduit restreint aux coups externes est isomorphe à un 3x3
(`to3x3` est un homomorphisme) ; les phases 3x3 existantes s'exécutent sur la
projection (`projectPlan`) et leurs coups se rejouent tels quels : zéro duplication
des étapes.

Les briques de résolution sont partagées et **correctes par construction** :

- **algorithmes** (`solverKit.ts`) : recherche « aligner U puis appliquer un
  algorithme » (gâchettes `R U R'`, Sune, A-perm/U-perm...) dont l'objectif
  inclut « ne pas régresser » ; les algorithmes viennent tous du catalogue
  `methods/algs.ts`, et chacun a son effet vérifié par un test ;
- **construction de blocs et formules** (`pieceSearch.ts`) : une recherche
  qui ne fait tourner **que les pièces suivies** (avec
  `applyMove(..., mechanism)` sur un sous-ensemble de cubies), donc minuscule
  même avec un jeu de coups restreint ; des formules (`macros`) peuvent y
  servir de générateurs, ce que font la tour, le Domino et l'orientation des
  arêtes de Petrus. Vers « ces pièces à leur place », l'objectif est un état unique :
  la recherche part des deux bouts et se rejoint au milieu (profondeur divisée
  par deux). Vers un objectif plus large (« toutes les arêtes orientées »),
  BFS avec une clé projetée sur ce que l'objectif lit (`orientationKey` :
  2^11 motifs au lieu de milliards d'états). `buildBlock(noms, coups)` en fait
  une phase : il faut relister les pièces déjà construites que ces coups
  pourraient déranger.

**Coups avancés du 3x3** (`SHAPE_ADVANCED_TURNS`, `advancedMovesFor`) : `M`,
`E`, `S` et les coups larges, jouables depuis l'onglet « Avancé » du pad,
jamais mélangés (`movesFor`, donc le mélange et les tables de saisie, ne les
voient pas). Ils déplacent les centres, qui servent de repère à toutes les
méthodes 3x3 : chacune commence donc par **Remettre les centres**
(`withCentersHome`, recherche en `<M, E, S>` sur les 6 centres), étape vide
et retirée quand ils n'ont pas bougé. La saisie « depuis l'état actuel »
tourne d'abord le cube entier pour que ses centres (pré-remplis, fixes)
retrouvent leur couleur : même position, vue autrement.

Les tranches du 3x3 ne demandent rien au moteur : sur 3 couches, la couche
`depth: 2` est celle du milieu, donc `M` = `2L` (même sens que L), `E` = `2D`,
`S` = `2F`, et `r` = `Rw`. `formatMove(move, labels, dims)` les affiche `M`,
`E`, `S` quand on lui passe les dimensions.

**Ajouter une méthode à un puzzle** : (1) écrire son plan dans
`src/lib/methods/<méthode>.ts` (étapes avec objectif, jeu de coups et phases ;
réutiliser `buildBlock`, `solvePieces`, `solveWithAlgs`, les prédicats
existants, et ajouter les algorithmes au catalogue) ; (2) l'ajouter au registre
de `solver.ts` sous les formes qu'elle couvre ; (3) nommer la méthode et ses
étapes dans les deux langues. La suite de conformance résout alors des
mélanges avec elle, sans rien toucher d'autre ; y ajouter un test qui fige ses jeux de
coups (voir `tests/unit/methods.test.ts`). Une méthode 3x3 n'utilisant que des
coups externes peut aussi servir de phase 3x3 au 4x4 (`reductionPlan`, qui
refuse les tranches : `M` sur un 3x3 n'est pas un coup du 4x4 réduit).

Les solutions ne sont pas optimisées mais toujours correctes ; validé par des
tests de propriété qui résolvent des dizaines de mélanges par méthode en
vérifiant l'objectif de chaque étape.

### La saisie d'un cube (`src/lib/editor.ts`, `validate.ts`)

L'utilisateur peut initialiser le cube depuis une position réelle en peignant
les stickers directement sur le rendu 3D (mode édition), en couleurs ou en
épaisseurs sur un cube miroir (même code, voir plus haut). Deux garde-fous :

- **Saisie guidée** : on précalcule, à partir de toutes les orientations du
  puzzle résolu, tous les placements de pièce valides par emplacement, chacun
  étiqueté par l'**identité de la pièce physique** qu'il représente (coins et
  arêtes uniques ; les deux ailes d'une paire de couleurs du 4x4 distinguées
  par leur chiralité ; les 4 centres d'une couleur partagent une identité à
  **budget 4**). Un clic n'est accepté que s'il reste compatible avec un
  placement dont la pièce a encore du budget ; dès qu'une pièce est déterminée
  (2 stickers d'un coin), les stickers restants se complètent automatiquement.
  Le dernier clic l'emporte : une pièce (ou une couleur) déjà toute utilisée
  ailleurs y est reprise, son emplacement vidé, à repeindre (`takeBack`) ;
  la palette reste donc toujours cliquable (une couleur épuisée est juste
  atténuée), ce qui permet de corriger une saisie complète, « depuis l'état
  actuel » compris. Impossible donc de créer une pièce, un doublon ou un
  compte de couleurs incohérent pendant la saisie.
- **Validation finale** : `validateCube` vérifie le comptage des couleurs puis
  la solubilité. Sur toutes les formes sauf le 4x4, en demandant une
  résolution bornée (`solve`) : sur un cube
  impossible, le solveur épuise sa recherche bornée et lève une exception,
  qu'on intercepte. Sur 4x4, par **invariants exacts** (les centres
  indiscernables absorbent toute contrainte de parité de permutation, c'est
  d'ailleurs pourquoi les parités OLL/PLL y sont des états légaux) : chaque
  emplacement porte une vraie pièce aux multiplicités exactes
  (`usesRealPieces`), et la vrille des coins est vérifiée en résolvant les 8
  coins renormalisés comme un 2x2 (`solveOptimal2`), rapide et borné.

**Puzzles déformables (tour, Violet, Pyramorphinx)** : on saisit le puzzle dans la forme où il
se trouve physiquement. La saisie commence par **choisir sa forme**
(`FormPicker`) parmi celles qu'il peut prendre (`lib/forms.ts`) : un
parcours en largeur sur l'état sans ses couleurs (où sont les pièces, quelles
faces portent un sticker ; 2 187 pour la tour), puis les formes qui ne
diffèrent que par la façon de tenir le puzzle (rotation entière, miroirs à
part) sont fusionnées : 102, en vignettes (`formDrawing`) groupées par
nombre de petits cubes isolés aux pointes (pièces qui n'en touchent qu'une
autre : ce qu'on remarque d'abord sur une tour déformée), puis par
éloignement de la boîte ; survoler une vignette montre la forme en 3D. La forme suffit à dire où sont les stickers. Les
fonctions de saisie prennent cette forme (`form`, un état de cette forme) ;
ses emplacements sont les siens, et un emplacement accepte toute pièce de
son type tournée pour présenter ses stickers sur ses faces (aucune
orientation du puzzle entier ne l'y met, la boîte étant rompue), pourvu
que la parité de ses coordonnées soit celle de l'emplacement (aucun coup ne
la change : un gros cube du Violet ne va jamais où va un mini-cube) : la
validation dit ensuite si l'état est atteignable. Il en va de même dans sa
boîte : un puzzle déformable peut y revenir avec des pièces tournées sur
elles-mêmes (le coin de A du Violet), que les seules rotations du puzzle
entier n'y mettraient pas. « Depuis l'état actuel »
saisit un puzzle déformé dans sa forme, sans passer par le choix. Un futur
puzzle déformable n'a rien à ajouter : `formsOf` se déduit de ses coups.

Les tables de saisie (emplacements + placements étiquetés + budgets) sont
**dérivées par forme** du puzzle résolu correspondant et mémoïsées
(`tablesFor`, dans `src/lib/editorTables.ts`) ; toutes les fonctions de saisie
prennent la forme avec l'état. Une saisie est complète quand chaque emplacement
est peint (`isComplete`), ceux de sa forme pour un puzzle déformable. Sans centres fixes, la saisie 2x2 part
entièrement vide (24 stickers), et le 4x4 aussi (96 stickers, centres
peignables car mobiles). Un centre posé sur l'axe de sa face ne bouge jamais :
il reste pré-rempli (`Slot.paintable` : aucun coup ne le déplace ni ne le retourne), les 6 du 3x3 comme ceux du Domino, du Floppy et du milieu du 5x5, et la demi-vis gauche des étoiles ; les centres du Gear Cube aussi, qui ne bougent qu'ensemble (`fixedPieces`).
Les comptes de couleurs se déduisent du puzzle résolu (`stickersOfColor`,
`shapeColors`), pas des faces d'un cube : la saisie marche sur toutes les
formes, étoiles comprises (voir « Le Star Prism »).

### Les formes non cubiques (le 1x2x3)

Une forme est un triplet de nombres de couches (`SHAPE_DIMS`), pas une taille :
le 1x2x3 est `[3, 2, 1]`, posé 3 de large, 2 de haut et 1 d'épaisseur, si bien
que le rectangle 3x2 qu'on regarde est sa face avant. Tout le reste **se déduit
de ces trois nombres**, sans cas particulier :

- **grille** : une liste de coordonnées par axe (`layerCoords`), centrée, sur
  les entiers pour un nombre impair de couches et de deux en deux pour un
  nombre pair. Les cubes existants retrouvent exactement leurs coordonnées ;
- **coups légaux** (`movesFor`) : un quart de tour autour d'un axe échange ses
  deux autres axes, donc il n'est possible que si leurs dimensions sont égales
  (`quarterTurnFits`) ; et un axe à une seule couche n'a aucun coup, puisque
  tourner sa couche unique revient à tourner le puzzle entier. Le 1x2x3 se
  retrouve ainsi avec exactement **U2, D2, L2, R2**, et les cubes gardent leurs
  18 (2x2/3x3) et 54 (4x4) coups ;
- **orientations** (`cubeOrientations`) : même critère, donc 24 pour un cube,
  4 pour le 1x2x3 et 8 pour la tour et le Domino, ce qui suffit à dériver
  leurs tables de saisie ;
- **comptage des stickers** : une face porte le produit des deux dimensions
  qu'elle couvre, donc les six faces d'un cuboïde n'ont pas le même nombre de
  facettes (2, 3 et 6 sur le 1x2x3, soit 22 en tout) ;
- **rendu** : chaque cubie occupe une cellule d'une unité, quel que soit son
  axe, et l'échelle ramène le plus grand côté à 3 unités.

Comme son axe fin expose ses deux côtés, les pièces d'extrémité du 1x2x3 portent
**quatre stickers** (les autres trois) : elles restent des « coins » pour la
saisie, c'est-à-dire des pièces uniques et orientées.

**Résolution** : 96 états seulement, diamètre 6, donc une BFS exhaustive
(`solveExhaustively`, `methods/exhaustive.ts`, partagé avec le Floppy et le Floppy Ghost) rend
la solution la plus courte, exposée par la méthode **Optimale**. La borne de recherche vaut 7 : un état
solvable est toujours trouvé avant, donc l'échec prouve un puzzle impossible,
ce dont la validation se sert. Le test parcourt **tout l'espace d'états** et
vérifie que chacun se résout, et que 6 coups suffisent toujours.

> La tranche du milieu (la colonne centrale) n'est volontairement pas proposée :
> la tourner équivaut à `L2 R2` suivi d'une rotation du puzzle entier, qui ne
> change pas ce que « résolu » veut dire (pas de centre fixe pour ancrer un
> repère). Aucun état n'est donc perdu.

### La tour 2x2x4 (forme qui se déforme)

La tour (`[2, 4, 2]`, `SHAPE_SHIFTS`) sort de sa boîte : son mécanisme est **un
4x4x4 auquel il manque des pièces**. Ses coups se calculent donc sur la grille
du 4x4 (`turnDims` : `[4, 4, 4]`, coordonnées `{-3,-1,1,3}` qui contiennent
celles de la tour) et seules ses pièces existent :

- **coups larges** (`Rw`, `Uw`...) : la moitié du mécanisme, **toujours
  possibles**. Dans la boîte, `Rw` tourne toute la moitié droite, qui se couche
  et dépasse devant et derrière ;
- **coups externes** (`R`, `U`...) : la tranche d'extrémité du 4x4, possible
  seulement si cette tranche est un **2x2 complet** (`turnAllowed`), quelle
  que soit la hauteur derrière elle. Dans la boîte : U et D seulement ; après
  `Rw`, plus aucun (le haut n'a plus que deux cubes) ;
- **pas de tranches internes** : un coup large puis un coup externe en font
  une, et elles servent rarement.

Le pad grise les coups bloqués, le mélange ne tire que des coups possibles
(il simule l'état depuis le cube courant), et le rendu place linéairement les
pièces sorties de la boîte (`visualPosition`).

**Résolution** (`methods/tower.ts`, méthode **Deux Pockets**, d'après
fan2cube.fr/tower2242.php et domino2.php) : la tour est deux Pockets empilés,
un intérieur (les 8 pièces du milieu) et un extérieur (les 8 coins).

1. **Remettre en forme** (`Uw Dw Rw Fw`) : vue comme un long Pocket dont les
   « sommets » sont des barres (un coin + la pièce du milieu voisine), on
   redresse chaque barre avec la formule de pivot de la page (deux barres à la
   fois), amenée par des coups larges. Clé de recherche : la façon dont chaque
   barre est couchée (3^8 motifs).
2. **Pocket intérieur** (`Uw Dw Rw2 Fw2`), comme un Domino : sommets du bas
   (« descendre un sommet »), puis du haut (« permuter deux sommets »). h et b
   s'y jouent en `Uw`/`Dw`, comme la page le suggère.
3. **Pocket extérieur** (`U D Rw2 Fw2`), mêmes formules. Descendre un sommet
   retourne la moitié avant du Pocket intérieur : la recherche, qui exige le
   Pocket intérieur intact, descend donc les coins **deux par deux**, comme le
   prescrit la page.

Correspondance des notations : H B A P G D = U D F B L R, H\* B\* = Uw Dw, une
face latérale de la tour en est la moitié (A = Fw), « D = D² » en parties II
et III. Les deux pièces du milieu d'une colonne sont **jumelles** (mêmes
couleurs) : objectifs et clés comparent des couleurs, pas des identités
(`pieceSearch` sait suivre des jumelles). L'effet de chaque formule est testé
(`tests/unit/tower.test.ts`).

### La tour 2x3x4 (`234`)

La tour 2x3x4 (fan2cube.fr/tower2341 et 2, MF8, 2012) : 3 de large, 4 de
haut, 2 de profondeur. Ses colonnes de gauche et de droite tournent d'un
quart (`R`, `L`) : debout (4 de haut, 2 de profondeur), une colonne se
couche (2 de haut, 4 de profondeur) et dépasse devant et derrière, la tour
se déforme. Le reste ne tourne que d'un demi-tour : les couches du haut et
du bas et leurs voisines (`U2`, `2U2`), les moitiés (`Uw2`, `Fw2`) ; comme
sur le 2x2x4, une couche (ou sa voisine) ne tourne que si elle est entière,
ses six pièces debout à leur place (`tower234Turns`), les moitiés et les
colonnes toujours. **Modèle** (`lib/tower234.ts`) : la grille du 3x4x2,
chaque pièce large de 1 sur x et de 2 sur y et z, si bien qu'une colonne
couchée met ses pièces en y = ±1, z de -3 à 3 ; le mécanisme
(`TOWER234_MECHANISM`, `[3, 4, 4]`) coupe z comme y. Dans la boîte
(`tower234Boxed`) quand toutes ses pièces sont à |z| <= 1. 22 formes, saisie
par sa forme comme la tour 2x2x4. Rendu : `three/tower234Geometry.ts`
(boîtes).

**Résolution** (`methods/tower234.ts`, méthode **Sommets, arêtes,
équateur**, d'après la page) : (A) la forme, le moins de coups pour revenir
dans la boîte (recherche sur la forme seule) ; (B) les centres ; (C) les
sommets par P(H*D.G.H*D)³P et P(H*G'.D'.H*G')³P (D et G, sans exposant, y
sont des quarts de colonne : la page écrit D² quand c'est un demi-tour) ;
(D) les arêtes par (D²H)³, (D²A)³, PB.(D²A)³.BP ; (E) l'équateur par
((D²h)²P)², ((G²h)²P)², hA.(D²h)².Ah, (HA)³. Ces formules restent dans la
boîte et n'atteignent qu'un tiers des équateurs possibles une fois le reste
fait (96 sur 288) : une pièce peut rester échangée de gauche à droite (la
« brick parity » des cuboïdes). Une formule à nous, qui sort de la boîte et
y revient, les atteint tous (`equatorParity`, 20 coups, la plus courte de
quelques centaines tirées d'un mélange suivi des étapes d'avant, qui ne
laissaient que l'équateur faux). Chaque formule vue de chaque côté
(conjuguée par un coup de la boîte qui ne dérange rien d'autre), effet de
chacune testé (`tests/unit/tower234.test.ts`). Moins de 0,3 s.

### Les tours 3x3x4, 4x4x3, 4x4x5 et 5x5x4 (`334`, `443`, `445`, `554`)

Des cuboïdes réguliers (fan2cube.fr/tower3341, tower4431, tower4451,
tower5541) : base carrée, le haut et le bas et leurs couches intérieures en
quarts de tour, les côtés (et leurs tranches intérieures, sauf sur la 3x3x4)
en demi-tours seulement ; aucune ne se déforme. Le moteur les fait tourner
tels quels (`SHAPE_DIMS`, `movesFor`) ; la tranche du milieu d'un axe impair
n'est nommée qu'une fois, par R, U ou F (`2U` sur la 4x4x3, que le guide
garde ainsi), et la 3x3x4 n'a pas de tranche entre ses côtés
(`layerVariants`).

**3x3x4, méthode Double Domino** (`methods/tower334.ts`, d'après la page,
« c'est donc un Super Domino ») : deux Dominos qui partagent leurs côtés,
l'extérieur (H, B) et l'intérieur (h, b), résolus avec les formules du Domino
(`methods/towerLayers.ts`). L'extérieur se lit comme un Domino (projection,
pièces toutes différentes) ; l'intérieur joue les mêmes formules en h et b,
ses pièces allant par jumelles (celle du haut et celle du bas pareilles).
Ses formules tournent aussi les côtés, que l'extérieur partage : chacune
vient deux fois, h ou b tournés entre les deux et défaits après
(`M S M S'` : les côtés d'une formule du Domino se lisent pareil dans les
deux sens, donc deux fois ils s'annulent), sauf celles dont les côtés
s'annulent déjà (les « deux par deux » de la page). La page fait
l'intérieur d'abord ; ici l'extérieur d'abord : ses pièces uniques
laisseraient sinon une parité qu'aucune formule gardant l'intérieur ne
défait, alors que les jumelles de l'intérieur l'absorbent. Environ 200
coups.

**4x4x3, 4x4x5 et 5x5x4, méthode Réduction** (`methods/tower44.ts`,
`methods/tower554.ts`, d'après les pages : « on le transforme d'abord en un
3x3x4 », « transformer la Tour 5x5x4 en 3x3x4 ») : les centres du haut et du
bas, ceux des côtés (4x4x5, 5x5x4), puis les arêtes reformées (deux ailes
ensemble sur les 4x4, autour de leur milieu sur la 5x5x4) ; chaque pièce par
un 3-cycle pur de sa sorte (`methods/towerReduce.ts` : commutateurs d'une
couche intérieure et d'un ou deux tours, `[A, B]`, `[A, BCB']`, `[ABA',
C]`, trouvés au chargement, conjugués par un tour, `cycleTable`), les
cibles par couleur, bloc par bloc (les pièces d'une sorte peuvent former
deux blocs que les 3-cycles ne mêlent pas). Puis la tour de 3 de large
devenue : la 5x5x4 est un 3x3x4 (projection sur ses pièces des milieux), la
4x4x5 un Domino extérieur, un intérieur et un équateur, la 4x4x3 un Domino
et un équateur (`towerLayers.ts` : l'équateur par son quart de tour, mis en
place par les côtés et défait après, puis ses centres par 3-cycles). D'abord
une **parité** (étape retirée quand elle est vide) : sur la 5x5x4, les ailes
en permutation impaire de leurs milieux (un demi-tour de tranche intérieure
en échange une de chaque bloc, comme la parité d'arête du 5x5) ; sur les
4x4, les « étrangetés » de la page, lues avant de réduire (permutations des
sommets, des ailes et des arêtes du milieu, et sens de ces dernières,
impairs ensemble : un tour de face en change deux, le quart du milieu deux,
une tranche intérieure les ailes seules), réglées par le même demi-tour.
De 200 à 450 coups, quelques secondes au plus la première fois (le temps des
tables).

### Le Camouflage 4x4x2 (`camo`)

Le Camouflage 4x4x2 (fan2cube.fr/camouflage4421 et 2, WitEden, 2012) est
un 4x4x4 bandé : vu de dessus un 4x4 aux rangées externes épaisses et
internes fines (un Domino 3x3x2 dont la couche du milieu est coupée en
deux), haut de deux pièces, chacune collée sur une couche fine et une
épaisse du 4x4x4. Le modèle garde le mécanisme du 4x4x4 (`turnDims`),
chaque pièce à sa case des deux couches du milieu (`SHAPE_DIMS`
`[4, 2, 4]`, `SHAPE_SHIFTS`) ; ce qu'elle montre et ce qu'elle bloque est
sa boîte (`lib/camo.ts`, `camoBox` : épaisseurs 1 et 0,5, hauteur 1, la
boîte résolue tournée comme la pièce, retrouvée sur sa case et ses
stickers). `isBoxed` lit ces boîtes : une pièce peut être dans sa case
mais couchée.

**Coups** (`camoTurns`) : un coup passe quand aucune boîte ne chevauche
une de ses coupes. Chaque pièce n'est haute d'une unité que sur un axe (son
étage), et c'est là seulement qu'elle chevauche la coupe de la couche
externe : les blocs (la moitié du puzzle, H*, A* : `Uw`, `Fw`) tournent
toujours, une couche seule (`R`, `2R`) tant qu'aucune pièce n'est debout
sur son axe de son côté. Dans la boîte, le haut ne tourne donc qu'en bloc ;
les côtés tournent couche par couche, et la déforment.

**Saisie** dans la boîte seulement (`notEnterable`, `formsOf`) : ses formes
se comptent par centaines de milliers (six fois plus à chaque coup), trop
pour des vignettes ; « Depuis l'état actuel » attend qu'il y soit revenu.

**Résolution** (`methods/camo.ts`, méthode **Réduction en Domino**,
d'après la page) : (A) la forme (« au feeling », dit la page) : une
recherche sur la forme seule (`lib/camoShape.ts` : case par case, l'axe sur
lequel la pièce est haute ; une couche bloquée par les seules pièces debout
sur son axe), par les deux bouts, de la boîte une fois (5 coups, gardés),
puis de la forme jusqu'à la rencontre : 9 coups au plus, même après 1 000
de mélange. Les quarts de tour d'une couche peuvent laisser les ailes en
permutation impaire, que les formules suivantes, toutes paires, ne défont
pas : une formule de 10 coups qui sort de la boîte et y revient
(`WING_PARITY`, trouvée par la même recherche, aucune de 6 coups ou moins)
la change. (B) les centres blancs en haut ; (C) les deux ailes de chaque
arête réunies, une arête après l'autre, avec l'échange D*²H'D²HD*² de la
page vu de chaque côté et des allers-retours hors de la boîte (`2R Uw 2R'`,
« comme dans le Revenge ») ; (D) c'est alors un Domino 3x3x2, lu sur ses
pièces (une aile par arête, un centre par face) et résolu par sa méthode
(`DOMINO_PLAN`), son haut et son bas devenant les blocs du Camouflage.
Environ 130 coups, quelques secondes au plus. La page note X pour X* ou X²
« pour ne pas alourdir » : seules ses formules sans ambiguïté sont reprises.

### Le Domino, le Floppy et la Slim Tower

Le Domino (`[3, 2, 3]`) est un 3x3 sans couche du milieu, et rien n'y est
spécial : ses coups se déduisent de la forme (U et D en quarts de tour, les
faces latérales en demi-tours seulement), ses deux centres sont fixes, ses
pièces sont uniques et sans orientation.

**Résolution** (`methods/domino.ts`, méthode **Coins puis arêtes**, d'après
fan2cube.fr/domino1.php et domino2.php) : (A) coins du bas, descendus un à un
(`F2 U' F2 U F2`) ; (B) coins du haut, échangés deux à deux ; (C) arêtes du
bas, descendues une à une (`D2 R2 (D2 F2)3 R2 D2`, qui ne touche rien
d'autre) ; (D) arêtes du haut, par 3-cycle ou échange. Chaque phase cherche
parmi ses seules formules, U et D plaçant les pièces dessous, avec une
recherche bidirectionnelle vers « ces pièces à leur place ». La tour réutilise
les formules A et B pour ses deux Pockets.

Le **Floppy** (`[3, 1, 3]`, `methods/floppy.ts`, d'après fan2cube.fr/floppy1)
est un 3x3 d'une seule couche : seulement `R2 L2 F2 B2`, 192 états, diamètre
8 (tout est vérifié en parcourant l'espace entier). Les arêtes ne quittent
jamais leur place, un demi-tour les retourne ; seuls les coins voyagent. Même
méthode **Coins puis arêtes** : (1) coins placés en demi-tours, (2) arêtes
retournées deux par deux par `(F2 R2)3`, qui retourne l'avant et la droite
sans rien toucher d'autre. En saisie, son centre (deux stickers, jamais
touché) reste pré-rempli, ses arêtes (qui se retournent) se peignent.

La **Slim Tower** (`[2, 3, 2]`, `methods/slimTower.ts`, d'après
fan2cube.fr/tower2231 et tower2232) est un Domino debout : U et D en quarts de
tour, avec leurs blocs `Uw`/`Dw` (le `H*` de fan2cube, qui fait tourner
l'équateur avec), et les côtés en demi-tours seulement ; elle ne se déforme
pas. Le coup large sur son axe de 3 couches vient de `SHAPE_INNER_TURNS`
(types.ts), qui déclare par forme les couches intérieures que tourne le
mécanisme (tranches et/ou coups larges, sur tout axe d'au moins 3 couches) :
le pad grise les faces sans cette sorte de couche. Méthode **Équateur puis
coins** : (I) l'équateur, intuitivement ; (II) les coins du bas avec la
formule de descente du Domino, qui échange au passage deux arêtes de
l'équateur, d'où une descente deux par deux ; (III) les coins du haut avec
l'échange du Domino, pur sur ce puzzle. Le modèle compte 1 935 360 états,
soit les 241 920 de fan2cube fois les 8 façons de poser la tour.

### Le Star Prism (`src/lib/star.ts`)

Le 2-Star Prism, premier puzzle **non cubique** : une étoile à six branches sur deux étages
(un Rubik's UFO), 12 pièces (une branche chacune) et une vis centrale coupée
en deux. Ses coups (famille du Square-1) : tourner le haut ou le bas d'une
pièce (60°), ou le **slash**, demi-tour de toute la moitié droite, qui échange
ses 3 pièces du haut avec ses 3 du bas et retourne la demi-vis droite. Le
disque central ne tourne pas avec les pièces.

Le modèle reste **entier et exact** : des cubies en coordonnées hexagonales
axiales `[q, y, r]`, où un pas de 60° est l'application linéaire entière
`(q, r) -> (-r, q + r)` et le slash `(q, y, r) -> (-r, -y, -q)`. Chaque creux
de l'étoile a sa normale (`HEX_NORMALS`, indices 6 à 11 après les 6 faces du
cube), partagée par les deux faces qui le forment : « résolu » reste « chaque
direction d'une seule couleur » (`isSolved` inchangé). Couleurs : vert dessus,
bleu dessous, et sur les côtés orange, blanc, jaune, rouge, violet, rose (les
deux dernières sont propres à l'étoile : `Color` = `CubeColor` + `P`, `V`,
plus les six du Rainbow, le doré du GEM-0, `C`, et le graphite du centre du
Hockey Puck, `H`, qu'aucun sticker ne porte).

Intégration : un coup est un `Turn` = `Move` (cubes) | `StarMove` (`RingMove` |
slash) dans le code générique (file d'animation, rendu, notation) ; les
solveurs des cubes gardent `Move`. `turn.ts` et `moves.ts` aiguillent vers
`star.ts` ; l'animation tourne autour d'un axe quelconque (`turnRotation`
renvoie un vecteur). Vue 3D (`PolyView`, partagée avec les Pyraminx), vignette et pad (`StarPad` : chaque
étage, deux ou quatre, par paire +1 / -1, puis le slash) dédiés ; notation de fan2cube (`3`, `-2B`/`-2D`, `/`). Les
formules de fan2cube.fr/2-star1 sont vérifiées sur le modèle (`K =
/-1/1+B/-B/` échange deux sommets en haut et les deux du dessous ; `/3/3/`
retourne la demi-vis, le haut à remettre d'un `3`).

**Résolution** (`methods/starPrism.ts`, méthode **Isoler puis permuter**) :
(1) isoler les sommets (verts en haut, bleus en bas), recherche keyée sur la
seule répartition des couleurs, avec le slash et les deux placements de la
page (`/-1/1`, `/1+3B/`) ; (2) finir le bas avec `K` et des tours du bas ;
(3) finir le haut avec `K` et des tours du haut (deux `K` remettent le bas),
plus les deux cas singuliers de la page en formules : la demi-vis (`/3/3/`)
et l'échange de deux sommets du haut (`4(1+K)`). La recherche par pièces, les
jeux de coups et les étapes acceptent n'importe quel `Turn`.

**Saisie** : la même saisie guidée que les cubes, rien de propre à l'étoile
dans `editor.ts` : les orientations du puzzle entier sont ses symétries
(`STAR_SYMMETRIES` : un sixième de tour et le demi-tour du slash, 12
orientations), donc chaque emplacement de branche accepte les 12 branches
dans le seul sens où elles y tiennent ; la demi-vis gauche, qu'aucun coup ne
bouge, reste pré-remplie ; la droite se peint dans un sens ou l'autre. Vue
dédiée (`PolyEditView`, `PolyPiece` en mode saisie). Sur le 4-Star, une
branche interne ne montre que ses deux côtés : une fois peints, leur ordre
dit dans quel sens elle est posée, et l'éditeur complète sa face cachée
(`SlotSticker.hidden`, jamais affichée ni comptée : `progress` ne compte que
les stickers visibles, 64 sur le 4-Star, 40 sur le 2-Star). La palette
montre les couleurs de la forme (`shapeColors` : rose et violet en plus).

**Le 4-Star Prism** (`star4`, fan2cube.fr/4-star1) : un Super Square-1 en
étoile, quatre étages (H, h, b, B ; `U`, `u`, `d`, `D` dans le modèle) qui
tournent chacun seul, le slash traversant tout. Les étages externes sont à
`y = ±2`, les internes à `y = ±1` (le 2-Star a donc aussi ses étages à ±2).
Le slash envoie l'externe sur l'externe et l'interne sur l'interne : ce sont
**deux 2-Stars** qui partagent la vis. Une pièce interne ne montre que ses
deux côtés, mais elle garde son sens (ses deux couleurs se lisent dans un
ordre ou l'autre) et le slash, qui la change d'étage, la retourne aussi :
elle reste à jamais une pièce « du haut » ou « du bas ». Le modèle lui donne
donc le sticker caché qui le dit (jamais dessiné), ce qui en fait exactement
une pièce externe un cran plus bas : `isSolved` reste juste. Notation : les
internes en minuscules (`2h`, `-b` ; `2u`, `-d` en US).

**Résolution** (`methods/starPrism4.ts`, méthode **Deux étoiles**, sans
nouvelle machinerie) : le plan du 2-Star est **projeté** (comme `projectPlan` sur
le 4x4) sur l'étoile interne (ses pièces ramenées à ±2, ses tours joués sur
`u`/`d`), qui remet aussi la vis, puis sur l'externe. Celle-ci part et finit
vis en place, donc slashe un nombre pair de fois sans tourner l'interne
entre deux slashs : l'étoile interne ne voit rien. Reste à aligner les deux
étoiles (`u` et `d` ensemble), chacune pouvant finir tournée d'un bloc.

### Le Hockey Puck (`puck`)

Le Hockey Puck, dans les « Cylindriques » avec les étoiles, dont il a la
mécanique : un disque de deux étages de douze pièces autour d'un centre
noir ; chaque étage tourne sur l'autre par crans de 30°, et le slash
(le pivot) retourne la moitié droite autour de l'axe perpendiculaire à sa
coupe : ses six pièces de chaque étage changent d'étage. Les pièces du haut
portent leur numéro (1 à 12) sur le dessus, celles du bas leur seule
couleur ; les couleurs vont par paires (1-2 rouge, 3-4 vert, 5-6 jaune, 7-8
orange, 9-10 bleu, 11-12 violet), le bas sous le haut, comme le vrai
puzzle. (fan2cube.fr/puck1 décrit un autre puck, d'un seul étage.)

**Modèle entier** (`lib/puck.ts`, puzzle sans grille) : secteur m (0 à 11)
dans le plan x, y, l'étage du haut à z = 1, celui du bas à z = -1 ; un tour
de k crans envoie m sur m + k, le slash le secteur m (0 à 5) de chaque
étage sur le secteur 5 - m de l'autre. La face cachée d'une pièce (contre
l'autre étage) dit, pour le modèle seul, laquelle c'est (`puckNumber`) ; le
dessin la peint sombre. `puckSolved` : les numéros dans l'ordre en haut,
chaque paire sur sa couleur, le tout tourné comme on veut. Notation des
étoiles : `1`, `-2` en haut, `B`, `-2B` en bas (`D` en anglais), `/`.

**Rendu** (`three/puckGeometry.ts`) : chaque pièce est un secteur d'anneau
de son étage, posé à plat (`PUCK_ORIENT`), le numéro en décalcomanie sur
sa face numérotée (`PolyDrawing.decal`, dont l'image dépend de la pièce) ;
le centre, deux demi-disques ronds aux faces graphite tenues à l'écart de la
coupe (un trait noir y montre l'axe du pivot, comme la vis des étoiles), sa
moitié droite basculant avec le slash.
**Saisie** pièce par pièce, comme le Floppy Ghost.

**Résolution** (`methods/puck.ts`, méthode **Isoler puis permuter**, aucune
page ne l'enseignant) : (1) isoler les pièces numérotées en haut, par une
recherche sur leur répartition, chaque pas étant des tours puis le slash ;
(2) ranger les couleurs du bas par échanges : K = / B / 1-B / -1 / échange
les deux pièces du haut de part et d'autre de la coupe et les deux du bas,
et sa famille `SWAPS` (/ dB / 1-B / -1 (1-d)B /, trouvée en essayant tous
les tours entre quatre slashs) en échange d'éloignées de d crans, des
tours avant et après visant n'importe quelle paire ; (3) ranger les numéros
du haut par 3-cycles, deux échanges de la même paire du bas (qui revient) ;
(4) aligner le haut sur le bas. Environ 300 coups, quelques millisecondes.

### Le Pyraminx (`src/lib/pyraminx.ts`)

Un tétraèdre dont chaque sommet tourne par tiers de tour : toute la
**couche** sous le sommet (sa pointe, son centre et ses trois arêtes) ou sa
**pointe** seule. 14 pièces : 4 pointes et 4 centres (trois triangles d'une
seule pièce, un octaèdre) qui ne font que pivoter sur place, 6 arêtes qui
voyagent, plus le noyau caché (15 cubies : `cubeShape` reconnaît les formes
à leur nombre de pièces, et le 2-Star en a déjà 14).

Le modèle reste **entier et exact** : les sommets sont aux coins alternés
d'un cube (`PYRA_CORNERS` : U (1,1,1), L, R, B), donc un tiers de tour
autour de l'un d'eux est une permutation signée des coordonnées
(`(x, y, z) -> (y, z, x)` autour de (1,1,1), conjuguée par les signes du
sommet pour les autres). Découpé en cellules unitaires : pointes en 2v,
centres en v, arêtes en v + w, noyau à l'origine ; une couche prend ce qui
est du côté du sommet (produit scalaire positif), une pointe ce qui est au
bout (produit scalaire 6). Les normales des faces sont `TET_NORMALS`
(indices 12 à 15). Couleurs : jaune dessous, vert devant, rouge à droite,
bleu à gauche. Un coup est un `PyraMove` (`vertex`, `amount` 1 ou 2,
`tip`) dans le `Turn` générique.

**Notation hybride**, chacune selon son usage : en international (WCA), la
couche est la majuscule (`R`) et la pointe la minuscule (`r`) ; en français,
comme l'écrit fan2cube, la pointe (« sommet ») est la majuscule et la couche
(« tranche ») la minuscule, sommets H G D P (Haut, Gauche, Droite,
Postérieur). `parsePyraMoves` lit les formules du site telles quelles
(`[gd'][h'd]`, `dhd'hdhd'`, `²`).

**Résolution** (`methods/pyraminx.ts`, méthode **Centres d'abord**, d'après
fan2cube.fr/pyraminx2) : pointes et centres ne quittent jamais leur sommet,
donc disent quelle couleur prend chaque face (celle qui manque au centre du
sommet opposé), ce qui accepte un puzzle tenu dans n'importe quel sens.
(1) **centres** : un tour de chaque couche ; (2) **pointes** : un tour de
chaque pointe ; (3) **arêtes du bas** avec le crochet `[gd']`
((AG)->(BA)->(AD)), aussi précédé d'un `h` défait ensuite ; (4) **arêtes du
haut** placées par `d h d' h d h d'` ((AG)->(AD)->(GD)) ; (5) **retournées**
deux par deux par `[gd'][h'd]`. Chaque formule est jouée depuis les trois
côtés autour du haut, et ne touche ni centres ni pointes (chaque couche
revient). Les recherches ne portent que sur les 6 arêtes (11 520 états) et
s'épuisent sur un puzzle impossible, ce dont la validation se sert. L'effet
de chaque formule de la page est testé, superflip `(hd'g)3` compris.

**Rendu** : comme l'étoile, en polygones (`PolyModel`, `PolyPiece`,
`polyDrawing`) ; chaque pièce est la cellule du modèle (petit tétraèdre ou
octaèdre) ramenée à l'écran par `pyraToCartesian`. Pad dédié (`PyraPad` :
couches ou pointes), saisie des 36 stickers (aucune pièce fixe), guide
(couches puis pointes).

**Le Tetraminx** (`tetra`, fan2cube.fr/tetraminx1) : « exactement un
Pyraminx sans sommets ». Ses pièces sont celles du Pyraminx moins les quatre
pointes (`solvedPyra`), ses coups ses couches seules (`PYRA_LAYERS`), et
sa méthode celle du Pyraminx sans l'étape des pointes (`centersFirst`,
`TETRAMINX_PLAN`). Le dessin reprend les mêmes cellules ; chaque pointe tronquée y porte une
couleur voisine, chacune la sienne (celle de la face opposée au sommet
suivant, U L R B ; `pyraPolygons(3, true)`). 933 120 positions (6!·2⁶·3⁴/4), selon la page.

### Le Master Pyraminx (`pyra4`)

Le Pyraminx 4x4 (fan2cube.fr/pyraminx41) : quatre tranches par sommet, qui
tournent **une à une** (`PyraMove.slice` 1 à 3, `tip` pour la pointe), la
troisième étant la face opposée. Même modèle que le Pyraminx, tétraèdre de 4
couches : les cellules de surface sont les sommes de 3 vecteurs de sommets
(petits tétraèdres : pointes en 3v, ailes en 2v + w, centres en u + v + w)
et de 2 (octaèdres : co-sommets en 2v, co-ailes en v + w), 30 pièces ; une
tranche est l'intervalle entre deux plans espacés de 4 en produit scalaire
(`pyraTurns`, commun aux deux tailles, la taille lue sur `SHAPE_DIMS` par
`pyraSize`). Les 12 ailes sont des jumelles deux à deux, distinguées par
leur chiralité (le signe du déterminant position / normales, qu'un tour
conserve) ; les 4 centres voyagent de face en face.

**Notation** : en français, celle de fan2cube, tranches numérotées
(`H'₁`, `D₂`, `P₃` pour la face soulignée du site ; `h` = `H₁` et `H'1` se
lisent aussi) ; en international, préfixe SiGN comptant la pointe comme
première couche (`u`, `2U`, `3U`, `4U`).

**Résolution** (`methods/pyraminx4.ts`, méthode **Ailes puis co-ailes**,
d'après fan2cube.fr/pyraminx42), sans jamais tourner une face (une face,
c'est tout le puzzle tourné avec les trois autres tranches, ce que
`faceColors` absorbe) : (1) co-sommets et (2) pointes tournés en place ;
(3) centres placés en 2e tranche, car les formules des co-ailes ne les
échangent que deux à deux ; (4) **ailes** une à une par 3-cycles :
`[H'₁ D₂]`, `[H₁ G'₂]`, `[H₂ G'₁]`, `[H'₂ D₁]` vus de chaque côté puis
conjugués par des tours, jusqu'à couvrir les 440 3-cycles (`wingCycles`) ;
(5) **co-ailes** placées par `[H'₂ D₂]` et `D₂ H₂ D'₂ H₂ D₂ H₂ D'₂`, puis
retournées par `[G₂ D'₂][H'₂ D₂]` ; (6) centres finis par `[G₂ D'₂]³`
(A,B)(G,D). Ailes et co-ailes portant les mêmes couleurs, `solvePieces`
prend un filtre `among` pour ne suivre qu'une sorte de pièce.

### Le 4-Trajber's Octahedron (`oct4`)

Un **4x4x4 taillé en octaèdre** (fan2cube.fr/4-trajber-oct1 et 2, Hidetoshi
Takeji, 2010) : les six sommets de l'octaèdre sont les six faces du cube
(H, B, G, D, A, P), et il tourne exactement comme un 4x4x4. Le moteur des
cubes le fait donc tourner tel quel (`SHAPE_DIMS` `[4, 4, 4]`, pad, guide,
mélange) ; seules ses pièces diffèrent (`lib/oct4.ts`) : un seul sticker
chacune, sur la face de l'octaèdre de leur octant (les diagonales,
`TET_NORMALS` et leurs opposées). Les 8 coins du cube sont les triangles
au milieu des faces (les « centres » de la page), ses 24 ailes les pièces le
long des arêtes (« arêtes »), ses 24 centres celles des sommets
(« sommets ») ; ses 8 cubies intérieurs, cachés, sont omis. 8 couleurs, les
faces opposées par paires. Pas de coup large : il tourne quatre faces
entières (le puzzle reste résolu, couleurs permutées), la page n'en use que
comme raccourci (`A* = A a`) ; `SHAPE_INNER_TURNS` n'a que la tranche.
Catégorie à part, « Polyèdres ».

**Rendu** (`three/octGeometry.ts`) : chaque pièce est sa case du 4x4x4
(ouverte vers l'extérieur sur les couches externes) coupée par l'octaèdre
`|x| + |y| + |z| <= 8`, un polyèdre convexe calculé depuis ses plans
(`polyhedron.ts`, partagé avec le Pyramorphinx, le Rainbow et le Dino) ; une forme ne dépend que de
l'emplacement, donc la pièce est dessinée où elle est.

**Résolution** (`methods/oct4.ts`, méthode **Sommets d'abord**) : rien n'est
fixe, la couleur de chaque face se lit sur les centres (la tenue du puzzle
résolu qui en place le plus, figée au début de chaque étape ; aucun 3-cycle
de sommets ou d'arêtes ne les bouge). (0) **Parité** : un quart de tour si
les centres sont dans une permutation impaire (les 3-cycles sont pairs ; la
page la rencontre à la fin). (1) **Sommets**, (2) **arêtes**, (3)
**centres**, par 3-cycles purs (`cycleLibrary.ts`, partagée avec le 5x5 :
`placeAll`, en empruntant un ou deux emplacements justes quand il ne reste
que deux pièces d'une même arête de l'octaèdre). Les sommets se font avec
les commutateurs de la page (T, K) ; les arêtes, une à une par commutateurs
de tranches (comme les ailes du 5x5), et non par paires avec les formules
du VTO de la page, dont l'effet est tout de même vérifié en test. Environ
250 coups.

### L'Octahedron VTO (`vto`) et le GEM-0 (`gem`)

Le Vertex Turning Octahedron (fan2cube.fr/VTO1 et 2) est un **3x3x3 taillé
en octaèdre**, à la profondeur de ses coupes (un tiers depuis chaque sommet)
: chaque face se découpe comme celle d'un Pyraminx, en 9 triangles. Ses six
sommets sont les centres du cube et tournent d'un quart de tour, avec leur
pointe, les quatre triangles qui l'entourent (les « centres » de la page) et
leurs quatre arêtes ; les **pointes tournent aussi seules** (la page compte
leurs tours à part, 4⁶ deux fois, et dit qu'elles « ne servent à rien »).
Il tourne donc sur la grille d'un 5x5 (`SHAPE_DIMS` `[5, 5, 5]`) : pointe à
2 sur son axe, triangles à 1, arêtes du cube en (1, 1, 0) ; le coup large
(`Rw`) est celui du sommet, l'externe (`R`) celui de la pointe seule. Le pad
les présente en onglets « Sommets » (d'abord) et « Pointes ». Les coins du
cube, cachés (ils ne touchent les faces qu'en leur milieu), sont omis avec
le cœur. Les cases n'ont pas la même taille (`VTO_CELL` : 1/2 autour du
cœur, de 1/2 à 1, puis la pointe au-delà, dans les unités de l'octaèdre
|x| + |y| + |z| <= 3/2) ; une pièce porte un sticker par face dont le plan
coupe sa case, aux couleurs du 4-Trajber (`OCT_FACE_COLOR`).

Le **GEM-0** (Jewel, fan2cube.fr/GEM-O1 et 2, Christoph Bandelow, 2010) est
« un VTO sans sommet » : ses pointes sont rabotées en carrés (|x|, |y|, |z|
<= 1, `truncate`), dorés avec un emblème rond comme sur le vrai puzzle
(`gemEmblem.ts`, posé par `PolyDrawing.decal`). Sans pointes, il tourne
comme un 3x3x3 (`GEM_CELL`), et chaque centre porte son carré en plus de
ses quatre triangles. La page annonce des tours de 120°, mais son propre
décompte (4⁶ orientations de centres) et le mécanisme donnent des quarts.

**Rendu** (`octGeometry.ts`, partagé avec le 4-Trajber) : chaque pièce est
sa case coupée par l'octaèdre (et, au GEM-0, par les plans des carrés) ; les
vignettes n'en gardent que les faces extérieures (`outside`), sans quoi les
faces entre pièces passent devant dans l'ordre du peintre.

**Résolution** (`methods/vto.ts`, `centersThenEdges`, d'après les pages) :
la page du VTO tient le puzzle une face vers soi, le sommet P en haut, G en
bas à gauche, D en bas à droite, soit U, F et R du cube ; celle du GEM-0
nomme ses carrés comme nos lettres françaises (A, D, H = F, R, U). (1) chaque
sommet tourné jusqu'à ce que ses triangles aillent avec leurs faces (la
tenue se lit sur eux, qui ne quittent jamais leur place) ; (2) arêtes
placées par 3-cycles (`pyraCycles.ts`) : au VTO `[G D']` et `G'PG.P.G'P²G`,
au GEM-0 `[H D]` ((HP) -> (HD) -> (AD)), de chaque côté puis conjugués ;
(3) retournées deux par deux, `[G D'][P' D]` (`[A D'][H' D]` au GEM-0) ;
(4) au VTO, les pointes tournées seules. Les sommets faits, les arêtes sont
en permutation paire (un quart de tour est un 4-cycle d'arêtes et un quart
de sommet) : les 3-cycles suffisent. Effet de chaque formule testé.

### Le FTO (`fto`)

Le FTO, Face Turning Octahedron (fan2cube.fr/FTO1 et 2, Jürgen Brandt, 2009) : un octaèdre comme le VTO, mais ce sont ses huit faces qui tournent,
par tiers de tour. Chaque face est découpée en 9 triangles par les coupes
des faces voisines, au tiers de la profondeur : 6 sommets (quatre
triangles), 12 arêtes (deux, sans sens) et 24 centres (un, en deux
familles que rien ne mélange), et entre chaque face et son opposée une
tranche qui tourne aussi. **Modèle** (`lib/fto.ts`) : celui du Rainbow
(`RainbowMove.fto`, `slice` pour une tranche), les faces regardant les
diagonales du cube ; l'octaèdre |x| + |y| + |z| <= 6, coupé à 2 le long de
chaque diagonale ; une pièce tient en un point de sa case (sommets en
(3, 0, 0), arêtes en (2, 2, 0), centres en (2, 1, 1)...), une face prend ce
qui est à au moins 2 le long de sa diagonale, sa tranche ce qui est à moins
de 2 du milieu (`rainbowTurns`). Couleurs du 4-Trajber, 24 tenues (les
rotations du cube). **Notation** de la page : H, A, G, D, P, B et les
faces opposées à G et D, soulignées ; tranches h, a, g, d ; en anglais
celle de la WCA (U, F, L, R, B, D, BR, BL ; u, f, l, r). Une tranche
nommée par la face opposée est la même, à l'envers (`namedSlice`). Pad
dédié (`FtoPad` : faces du haut, du bas, tranches). **Rendu**
(`three/ftoGeometry.ts`) : chaque pièce est l'octaèdre coupé par ses
couches le long des quatre axes, posé sur sa face du bas (`FTO_ORIENT`),
comme la page le tient. **Saisie** des couleurs, comme le Rainbow.

**Résolution** (`methods/fto.ts`, méthode **Sommets, centres, arêtes**, la
méthode 2 de la page) : (1) les sommets placés et tournés, le moins de
coups sur les seuls sommets (la page joue O1 = [D A'] et O2 = HD'H'.AHD) ;
leur tenue dit celle du puzzle résolu ; (2) les centres par O4 =
AhA'.B.Ah'A'.B', un 3-cycle de centres qui ne touche rien d'autre, une
famille après l'autre, ceux d'une couleur pareils (`placeByCycles`, comme
les pétales du Rex) ; (3) les arêtes par O3 = dHd'h.dH'd'h', un 3-cycle
d'arêtes pur. Chaque formule vue de chaque côté, préparée par un coup
défait ensuite. Environ 150 coups, moins d'une seconde ; effet de chaque
formule testé.

### Le Rainbow (`rainbow`)

Le Rainbow (fan2cube.fr/rainbow1 et 2) est un **cuboctaèdre** : 6 carrés et
8 triangles. Chaque triangle tourne par tiers de tour, son centre fixe, et
emporte les trois pièces de ses coins : un 3-cycle. Les 12 pièces sont aux
sommets du cuboctaèdre et montrent quatre couleurs (un quart de deux carrés,
un coin de deux triangles) ; une pièce n'a qu'une pose par emplacement, d'où
12!/2 états (chaque tour est un 3-cycle, donc pair).

**Modèle entier** (`lib/rainbow.ts`, puzzle sans grille) : les carrés
regardent les axes du cube, les triangles ses diagonales (`TET_NORMALS` et
leurs opposées) ; les pièces sont aux milieux des arêtes du cube
(`(1, 1, 0)`...), les 8 centres fixes à ses coins. Un tiers de tour autour
d'une diagonale est une permutation signée des coordonnées ; il prend ce dont
le produit scalaire avec la diagonale vaut au moins 2. Couleurs : les carrés aux couleurs du cube, chaque
triangle la sienne (violet en haut, comme sur la page ; puis rose, bleu
foncé, turquoise, rose pâle, vert citron, vert foncé, marron, les six
dernières propres au Rainbow) ; les centres fixes tiennent le repère. Les
triangles de devant touchent tous le carré vert, ceux de derrière le bleu :
le bleu foncé est devant, le vert foncé derrière. Le puzzle est tenu un carré devant, tourné d'un
huitième pour avoir des triangles en haut, en bas et sur les côtés.

**Notation** : celle de fan2cube en français, H B G D pour les triangles de
devant, h b g d pour ceux de derrière ; U D L R / u d l r en anglais ; `'`
pour le sens inverse. `parseRainbowMoves` lit les formules de la page
(`[H' G']`). Pad dédié (`RainbowPad` : Devant / Derrière), guide en section
« Triangles ».

**Rendu** (`three/rainbowGeometry.ts`) : le solide est le cuboctaèdre
(`polyhedron.ts`), chaque pièce sa cellule de Voronoï autour de son sommet,
coupée par les plans qui la séparent des centres ; un centre fixe est le
reste sous ses trois coupes.

**Résolution** (`methods/rainbow.ts`, méthode **Triangle prolongé**,
d'après la page) : (1) le triangle du haut, ses trois pièces placées par
recherche (`solvePieces`) ; (2) les autres par 3-cycles (`pyraCycles.ts`),
avec les deux commutateurs de la page, « placer à gauche » `[H' G']` et
« placer à droite » `[H D]`, vus de chaque côté et conjugués par un tour.
Environ 25 coups.

### Le Dino Cube (`dino`)

Le Dino Cube (fan2cube.fr/dinocube1 et 2, Robert Webb et Stephen Harvey, 1995) a la mécanique du Rainbow : chaque sommet tourne d'un tiers de tour et
fait un 3-cycle des trois arêtes autour de lui. Ses 12 pièces sont ces
arêtes, deux triangles chacune (les faces coupées le long de leurs
diagonales), sans centre : 12!/2 positions. Le modèle est celui du Rainbow
(`solvedDino` garde ses arêtes et leurs carrés, `RainbowMove.dino` sa
notation : les lettres de fan2cube, A D P G en haut, B E H O en bas ; UFR...
en anglais). Catégorie « Coupes diagonales ». Rendu (`three/dinoGeometry.ts`) :
chaque arête est la part du cube où ses deux coordonnées sont les plus
grandes.

**Résolution** (`methods/dino.ts`, méthode **Étage par étage**) : une seule
formule, [GA'] = GA'G'A ((HA)->(HD)->(HG), testée), vue de chaque côté et
préparée par un tour (`cycleTable`, `placeByCycles`) : le haut, l'équateur,
le bas. Rien n'est fixe : la cible est la tenue du puzzle résolu la plus
proche ; et il se résout de deux façons (gauche et droite échangées, un
miroir), dont une seule à un nombre pair d'échanges, celle qu'on vise.

### Le Dino Cylinder (`dinoCyl`)

Le Dino Cylinder (fan2cube.fr/dinocylinder1 et 2, Li Chung Man, 2011) est
« comme un Dino mais il a des sommets en plus », taillé en cylindre aussi
haut que large (catégorie « Cylindriques »). Ses sommets tournent d'un
tiers, chacun emportant ses trois arêtes et sa pièce de sommet, qui ne
bouge pas mais pivote. **Modèle** (`lib/dinoCyl.ts`) : celui du Dino, ses
8 sommets ajoutés en (1, 1, 1)... aux couleurs de leurs trois faces ; les
tours du Dino (ce qui est à au moins 2 le long de la diagonale) les font
pivoter. **Rendu** (`three/dinoCylGeometry.ts`) : un cylindre (48 pans,
normales lissées) coupé par les plans des sommets, x + y + z = 1... (ceux
du Dino) ; chaque pièce dessinée chez elle puis portée par la rotation qui
l'amène où elle est, si bien qu'il se déforme : un sommet pivoté, une
arête changée de rangée, dépasse du cylindre. Disques du haut et du bas :
les quarts des arêtes du haut et du bas ; sur le flanc, les petits
triangles des sommets et les « yeux » des arêtes du milieu ; chaque pan
de la couleur du sticker qu'il regarde le plus. Tenu un sommet devant,
comme la page. **Saisie** pièce par pièce (ses formes, des centaines de
milliers, ne tiendraient pas en vignettes).

**Résolution** (`methods/dinoCyl.ts`, méthode **Étage par étage**, d'après
la page) : les trois étages du Dino par [GA'] (`dinoLayers` de
`methods/dino.ts` : deux arêtes d'un étage restées échangées, il se finit
avec celles d'en dessous), la cible donnée par les sommets (qui ne bougent
jamais : la page n'a qu'une solution ici, nos couleurs étant celles du
cube) ; puis les sommets pivotés un à un par (A)+ = [AD]A'[DA'], qui ne
tourne que le sommet A, vu de chaque côté et à l'envers. Effet des
formules testé.

### Le Rex Cube (`rex`)

Le Rex Cube (fan2cube.fr/rexcube1 et 2, Andrew Cormier, 2010) est le Dino
coupé plus profond (le Master Skewb sans coins, selon Jaap) : un tiers de
tour d'un sommet emporte ses 3 arêtes, les 3 centres autour et 9 pétales
(testé). 12 arêtes, 6 centres, 24 pétales ; 11!/2 × 6!/2 × 24!/4!⁶
positions. Même modèle (`solvedRex`, `RainbowMove.rex` : un sommet tourne ce
qui est à au moins 4 le long de sa diagonale, en quarts de demi-côté : centres
à 4, arêtes en (3, 3, 0), pétales en (2, 4, 2)), même notation que le Dino,
boîte de 9 (`SHAPE_DIMS`). Rendu (`three/rexGeometry.ts`) : chaque face
coupée par quatre cercles, chacun passant par les deux coins voisins du sien,
son centre au-delà du coin (le carré central fait moitié moins que s'il y était) ; une
région est tracée par rayons depuis un point intérieur, puis posée en plaque
épaisse. Pendant un tour, la sphère de coupe du sommet (celle qui porte ses
cercles) est dessinée, immobile, comme sur le Jing (`rexCut`).

**Résolution** (`methods/rex.ts`, méthode **Arêtes, centres, pétales**,
d'après la page) : (1) les arêtes par 3-cycles, [GA'] ; (2) les centres par
3-cycles, [DG'] ; (3) les pétales, avec [DG'][D'B], qui échange deux paires
de pétales d'une même face (rien de visible sur une face finie) : préparé
par un ou deux tours puis rejoué, il donne des 3-cycles de pétales. Les
pétales forment deux familles de 12 que rien ne mélange (ceux qui pointent
vers les sommets d'un tétraèdre ou de l'autre) : chacune se place à son
tour, les pétales d'une couleur étant interchangeables. Cible choisie comme
sur le Dino (tenue, et gauche et droite échangées), à permutations paires
d'arêtes et de centres. Environ 300 coups, moins d'une demi-seconde.

### Le Gear Cube Ultimate (`gearU`)

Les Gear Cubes (Oskar van Deventer, fan2cube.fr/gearcube1 et 2, Jaap) sont
des 3x3x3 dont les arêtes sont des engrenages : les deux faces d'un axe sont
des planétaires, la tranche entre elles leur porte-satellites, ses quatre
arêtes les satellites. La tranche reste donc toujours à mi-chemin de ses
faces : un **demi-tour de face** (l'opposée tenue) la fait tourner d'un
**quart**, dans le même sens. C'est le seul coup (`GearMove`, le D² de
fan2cube, le R de Jaap) : un quart de tour de face laisserait la tranche à
45°, où plus rien ne tourne. L'**Ultimate** (le vrai, à 12 engrenages ; la
page « Ultimate » de fan2cube montre en fait l'Extreme, à 8) a la mécanique
du Gear Cube, mais ses engrenages ne retrouvent la forme du cube que tous
les trois coups (six quarts de tour de face).

**Modèle** (`lib/gear.ts`) : un 3x3x3, chaque arête un engrenage. Ses
couleurs sont celles du vrai puzzle (`SHAPE_SCHEME`) : vert foncé devant,
violet à la place du rouge, rouge à la place de l'orange. Les quatre
engrenages de la tranche pivotent sur leurs agrafes de cinq sixièmes de
tour par coup (300°, `GEAR_SPIN` ; environ 135° par quart de tour de face
mesurés sur le vrai puzzle), dans le même sens pour un coup horaire de
l'une ou l'autre face : ce pivot, qu'aucune rotation du cube ne dit, est
`Cubie.spin` (en sixièmes), gardé par la clé d'état, le mémorisé (`@n`) et
les rotations du puzzle entier ; « résolu » l'exige à zéro. Les stickers des
arêtes sont leur base (les « agrafes ») ; l'engrenage porte les mêmes
couleurs, tourné de son pivot : au bout de trois coups (900°), il est
retourné sur ses agrafes, ses couleurs à l'envers des leurs. Le
modèle est vérifié contre Jaap : 4 × 41 472 et 4 × 165 888 positions (le
facteur 4 : les tenues que les coups atteignent, la « téléportation » de
fan2cube), et les formules de la page (D⁸ pivote d'un cran, un tiers, les 4
engrenages d'une tranche, (A²D²)³ échange les agrafes des 8 arêtes du haut
et du bas, engrenages revenus tels quels, G'²D² retourne le cube). Deux
effets vérifiés sur le vrai puzzle : `R2 R2 R2` laisse les 4 engrenages de la
tranche retournés sur leurs agrafes, `(F2 R2)³` n'échange que les agrafes.

**Animation à deux vitesses** : `halfTurnedBy` donne les pièces qui tournent
à moitié (la tranche), dans leur propre groupe (`halfRef`) ; leurs
engrenages pivotent en suivant l'avancement du coup (`turnSpin`,
`progress`). **Rendu** : la face convenue avec l'utilisateur, pièce par
pièce sur un dessin à plat (`scripts/gear_face.py`, qui produit aussi les
masques de `src/assets/gear`), 13 pièces : 4 coins encochés (deux petites
dents à angle droit vers le centre), 4 engrenages (un demi-disque sur le
bord, une dent fine au milieu et deux dents évasées à 60°), le petit carré
central et ses 4 agrafes en U (pattes penchées, barre creusée en arc) ; tout
angle saillant arrondi. En 3D (`gearFace.ts`, `GearPlate.tsx`), chaque pièce
est une plaque sur sa face, découpée par le masque de sa sorte tourné à sa
place (alpha test), sur un corps noir à sa forme (`pieceBody` : le contour
de sa sorte, `outlines.json` produit par le même script, enfoncé dans le
cube sous chacune de ses faces : un bloc cacherait les dents des engrenages
qui sortent), un noyau noir comblant le milieu. La vignette du sélecteur
dessine la même face (`drawGear`, depuis `outlines.json`). Le guide montre
aussi chaque coup trois fois de suite (`3U2`, `GearMove.times`) : les
engrenages font deux tours et demi et le cube reprend sa forme. L'engrenage
d'une arête (ses deux plaques et son corps) pivote autour de l'axe de
l'arête (du centre du cube à travers elle) : hors de sa place il sort du
cube en biais, et ne s'y réemboîte qu'à un demi-tour près, tous les trois
coups ; ses agrafes suivent la pièce, pas l'engrenage.

**Résolution** (`methods/gear.ts`, méthode **Coins d'abord**, d'après
fan2cube.fr/gearcube2) : chaque étape cherche parmi les seules formules de
la page, qui laissent les étapes d'avant intactes : (1) coins, par tous les
coups ; (2) arêtes placées, D⁴ et P²D⁴P'² ; (3) agrafes, (A²D²)³ ; (4)
engrenages, D⁸. Les centres suivent. **Saisie** en forme de cube, engrenages réalignés
(la consigne le dit ; tourner une face jusqu'à ce que sa tranche reprenne
sa place les remet) : les stickers comme un 3x3, centres pré-remplis
(les tranches les déplacent, mais toujours ensemble, comme un cube tourné :
l'éditeur tient le cube centres en place, `fixedPieces`), sur ses propres pièces (`EditView` les
dessine comme en jeu, un clic sur le corps d'une pièce la peint ;
`paintable.ts`, partagé avec `Sticker`). Agrafes et engrenages se peignent à
part : les agrafes sont les stickers, les engrenages des couleurs gardées
à côté (`gear`, par les mêmes identifiants ; `lib/gearEditor.ts`). Un
engrenage porte la paire de ses agrafes dans un sens ou dans l'autre : une
fois celle-ci connue, une face de l'engrenage donne l'autre et une couleur
hors de la paire est refusée (`paintGear`, `completeGears`). À la
validation, `turnedOf` dit quels engrenages sont retournés sur leurs
agrafes (ou qu'un engrenage n'a pas leurs couleurs), et `buildCube` les pose
(`withTurnedGears` ; `gearColorsOf` en sens inverse). « Depuis l'état actuel » est grisé tant qu'un engrenage est
de travers (`gearsAligned` : pivot nul ou d'un demi-tour). La validation demande une solution :
coin vrillé ou arête retournée seule sont refusés, et le message dit à
quelle étape la résolution bloque (`StepFailure` de `buildSteps`, lu par
`validateCube`). Le décompte et la palette comptent aussi les faces des
engrenages (`gearFaces`).

**Le Gear Cube** (`gearCube`) : la même mécanique, agrafes sans couleur
(noires) et couleurs standard. Seul l'engrenage se voit : des agrafes
retournées d'un demi-tour, l'engrenage d'un demi-tour en arrière dessus,
c'est la même arête. Ses arêtes portent `Cubie.plainClips` (ce qui le
distingue de l'Ultimate pour `cubeShape`, et `*` dans le mémorisé), et
`applyGearMove` les écrit toujours pivot sous 3 (`asSeen` : la pièce
retournée sur son axe, le pivot moins 3). 4 × 41 472 positions, comme Jaap
(testé). La méthode perd l'étape des agrafes ((A²D²)³ n'y change rien de
visible) ; ses arêtes se placent dans le bon sens avec D⁴ et D⁸. Saisie :
les engrenages sont les stickers (`hasColoredClips` décide de la saisie à
part de l'Ultimate).

**Le Gear Cube Extreme** (`gearX`, fan2cube.fr/gearultimate1 et 2, qui le
nomment Ultimate) : la tranche du milieu n'a pas d'engrenages, ses quatre
arêtes sont des blocs (`gearAt`, dessinés comme un bloc qui finit en
agrafe : la sorte `block` de `scripts/gear_face.py`). Le haut et le bas
tournent donc d'un quart, comme sur un 3x3 (des `Move` parmi les coups
d'engrenage, `gearTurnsOf` ; `applyMove` garde le pivot des pièces), les
côtés par engrenages, comme l'Ultimate (trois coups pour retrouver la
forme). Méthode **Équateur puis coins** (`methods/gearExtreme.ts`, d'après
la page) : (A) l'équateur et les centres, par tous les coups ; (B) les coins
du bas descendus un à un, (D²H)².(D²H²)² ; (C) ceux du haut, 3-cycle et
échange ; (D) les arêtes du bas isolées en bas, (BG²B'G'²)⁵ ; (E) toutes
placées, (HA,HD)(BA,BD) ; (F) les agrafes, D²(D²H)¹²D'² ; (G) les
engrenages, (D²H)².D⁸.(H'D'²)². Chaque formule vue de chaque côté (et à
l'envers), préparée par des tours du haut et du bas défaits ensuite, sur
les seules pièces de l'étape, une pièce à la fois ; l'effet de chacune est
testé (`parseGearFormula` lit la notation de la page). Quelques secondes
de calcul, parfois plus (dans le worker ; pistes dans `AMELIORATIONS.md`). **Saisie** comme l'Ultimate, en
forme de cube (engrenages réalignés), ses blocs peints comme des stickers ;
ses centres se peignent (les tranches les sortent du haut et du bas, que sa
couche du milieu, immobile, tient en place).

### Le Violet (`violet`)

Un puzzle dont le nom s'est perdu, décrit de mémoire et validé à l'écran :
un **2x2x2** dont le coin A (haut, avant, droite) est lui-même coupé en
2x2x2 mini-cubes, et dont le **cœur** est le mini-cube de A tourné vers le
centre, invisible. Ses faces tournent autour de ce cœur, décalé d'un quart
de la largeur : chaque quart de tour sort sa couche de la boîte, il se
**déforme**. Tout violet sauf les trois faces extérieures de A (vert
citron dessus, bleu devant, jaune à droite) : résolu quand il redevient un cube, chaque couleur de A sur une
face (`violetSolved` ; ses faces n'étant pas unies, `isSolved` lui laisse
la main).

**Modèle entier** (`lib/violet.ts`) : coordonnées en demi-mini-cubes autour
du cœur. Un mini-cube fait 2 de large, centré sur des coordonnées paires
(0 ou 2 une fois résolu, le cœur à l'origine) ; un gros cube 4, sur des
impaires (-3 ou 1). Chaque axe est coupé de part et d'autre du cœur, en -1
et 1, et une face tourne ce qui est au-delà de sa coupe (2 ou plus) :
exactement la tranche externe d'un 5x5 (`SHAPE_DIMS` `[5, 5, 5]`), donc le
moteur des cubes le fait tourner tel quel (`Move`, pad, guide, mélange,
`SHAPE_SHIFTS`). Seul `turnAllowed` lui est propre : un gros cube centré sur
une coupe la chevauche et bloque la face (`violetTurns`). Résolu, seules L,
D et B tournent. `isBoxed` lit sa propre boîte (de -5 à 3, `violetBoxed`) ;
une seule symétrie, le tiers de tour autour de sa diagonale par A (3
orientations).

**1 160 formes** atteignables (les gros cubes étant pareils), à 13 coups
au plus, aucune bloquée ; avec les couleurs de A, **41 760 états**, à 30
coups au plus, dont 35 en forme de cube mais pas résolus : testé en
parcourant tout l'espace.

**Mélange** (`violetStates.ts`) : des coups au hasard se défont l'un
l'autre (la plupart sont bloqués) et le replient en cube, A entier. Le
sien ne repasse jamais par un état déjà vu (départ compris) et continue
au-delà de sa longueur tant que A n'est pas disloqué.

**Rendu** (`three/violetGeometry.ts`) : chaque pièce est une boîte, violette
sur toutes ses faces (comme le vrai puzzle, aussi celles qu'un coup fait
apparaître) sauf les stickers de A ; `PolyDrawing.offset` recentre la boîte, décalée du cœur autour
duquel tout tourne.

**Résolution** (`methods/violet.ts`), aucune méthode humaine n'étant
connue : tout vient d'un parcours de ses 41 760 états depuis le résolu
(`violetStates.ts`, une fois, environ une seconde, dans le worker), un arbre
des chemins les plus courts. **Forme puis couleurs** (`shapeFirst`) : (1)
le moins de coups pour redevenir un cube (`violetToCube`), (2) depuis ce
cube (un des 35 cas), la suite la plus courte vers le résolu (`solveViolet`,
le chemin de l'arbre défait : un coup qui est passé repasse dans l'autre
sens) ; **Optimale** : la plus courte d'un coup. Le test vérifie sur tout
l'espace que chaque solution a exactement la longueur de sa distance.

**Saisie** : comme la tour, par sa forme (388, les rotations du puzzle
entier fusionnées), puis ses couleurs. Les gros cubes arrivent déjà
violets (et la palette ne propose pas le violet : `paletteColors` écarte
une couleur que les stickers pré-remplis prennent tous) : `emptyEdit` remplit tout sticker que toutes les pièces qui
tiennent dans son emplacement montrent d'une seule couleur (dans la boîte,
les trois mini-cubes de A à un sticker aussi : ils n'y sont jamais
ailleurs). Une face sans sticker à saisir garde sa couleur dans la vue.
La validation demande une solution, comme partout : un état hors de
l'arbre lève une exception.

### Le Z-Twist (`twist`)

Un 3x3x3 de forme tordue, _shape mod_ comme le cube miroir : mêmes pièces,
couleurs et coups qu'un 3x3, chaque pièce taillée dans sa case du solide
résolu. Ce solide a le carré du haut en place, celui du bas tourné d'un quart, et
ses arêtes verticales droites entre eux (un peu arrondies, `ROUND`) : chaque
section est un carré, tourné et réduit (un losange par le milieu des faces
à mi-hauteur), jamais hors du cube. Le mécanisme reste celui d'un 3x3, aux
coupes planes : une pièce est sa case du 3x3 découpée dans ce solide
(`three/twistGeometry.ts` : sa part des côtés tordus, colorée comme chaque
côté, si bien qu'une face du cube peut montrer deux couleurs, ses coupes en
plastique), puis portée par la rotation qui l'amène où elle est (lue sur
ses couleurs). Arêtes et coins se reconnaissent à leurs couleurs, mais un
centre de côté montre par sa forme s'il est tourné d'un quart (un demi-tour
ne se voit pas) : `Cubie.spin` (0 ou 1, `lib/twist.ts`), changé par chaque
quart de tour de sa face (`applyMove`) ; résolu, tous à 0. À l'inverse,
les 4 arêtes fines de la couche du milieu ne montrent qu'une couleur : leur
sens ne se voit pas et ne compte pas. `isSolved` (`twistSolved`) les
accepte dans un sens ou l'autre, la saisie ne propose qu'une pose par
emplacement (`asSeenTwist`, aussi pour « Depuis l'état actuel ») et
`buildCube` choisit le sens qui rend la position atteignable
(`withRealThinEdges` : un nombre pair d'arêtes retournées).

**Résolution** (`methods/twist.ts`) : les méthodes du 3x3 sans tranches (par
couches, CFOP, Petrus, ZZ ; pas Roux, dont les `M` mêleraient centres
orientés et non orientés), jouées sur ses couleurs (`twistPlan` : les centres mis de côté), puis
**Les centres tordus** : des suites qui ne déplacent aucune pièce (un
mélange fixe puis sa résolution 3x3) retournent chacune certains centres ;
assemblées (sur GF(2)), elles en retournent n'importe quel ensemble.
Plusieurs centaines de coups pour cette étape. **Saisie** pièce par pièce, comme le Floppy Ghost (`entersByPieces` : ses
pièces montrent les couleurs des côtés tordus, pas des stickers de 3x3) ;
un clic sur un centre de côté le tourne d'un quart (`twisted` de l'éditeur).

### Le Tori (`tori`)

Le Tori (fan2cube.fr/tori1 et 2, QiYi, 2023) est « un Rubik's Cube sans
sommets » : 6 centres fixes et 12 arêtes, soit 12!·2¹²/2 positions. Le
modèle est celui du 3x3 sans ses coins (`solvedCube`), coups compris : rien
d'autre à lui apprendre. Catégorie « Troués ».

**Rendu** (`three/toriGeometry.ts`) : le solide est un cube arrondi
(|x|³ + |y|³ + |z|³ <= R³), coupé par les plans du 3x3 assez loin du
centre pour qu'il ne reste rien là où seraient les coins. Chaque centre est
un grand carré arrondi, percé jusqu'au cœur (un anneau, coloré jusque dans
le trou comme le plastique du vrai puzzle), chaque arête une mince amande
le long d'une arête du cube, de la couleur de chaque face de part et
d'autre de son arête vive. La surface est maillée en polaire autour du
milieu de chaque face (trous ronds), normales lissées. La vignette prend
quelques grandes pièces (anneaux en quarts, amandes en moitiés), ombrées
d'un bloc par face.

**Résolution** (`methods/tori.ts`, méthode **Croix prolongée**, d'après
la page) : comme un Rubik's Cube dont on ignore les coins. (1) croix du
bas : A², BDB'A et DHD' ; (2) arêtes du milieu, d'un simple commutateur,
[H'A'] ou [HD], aucun coin à préserver ; (3) croix du haut, deux arêtes
retournées à la fois par A[HD]A'H' ; (4) arêtes du haut par deux 3-cycles.
Chaque formule vue de chaque côté, H plaçant les pièces dessous ; effet de
chacune testé. Saisie des stickers comme un 3x3, centres pré-remplis.

### L'Edge Only (`edge`)

L'Edge Only (fan2cube.fr/edgeonly1 et 2, Jürgen Brandt, 2009) : « comme le
Void Cube mais sans sommets », les 12 arêtes d'un 3x3 seules, chaque face
percée d'un trou carré. Le modèle est le 3x3 réduit à ses arêtes et à son
cœur caché : sans lui, rien ne le distinguerait du Dino Cube (12 pièces à
deux stickers aux mêmes places). Rendu (`three/dinoGeometry.ts`) : les
pièces du Dino, le cube coupé le long des diagonales de ses faces, chacune
coupée en plus par le trou (un tiers de la face) : un prisme le long de son
arête, un trapèze sur chacune de ses deux faces.

**Résolution** (`methods/edgeOnly.ts`, méthode **Croix prolongée**) : la
page le résout « comme un Void Cube en ignorant les sommets », c'est-à-dire
comme le Tori, dont il reprend les formules. Sans centres, rien ne fixe les
couleurs : la cible est la tenue du puzzle résolu la plus proche parmi
celles que ses arêtes peuvent atteindre (même parité de retournements),
et l'Edge Only est lu comme le Tori qu'il serait avec les centres de cette
tenue, ses couleurs renommées ; le plan du Tori le résout, mêmes coups. Une
arête retournée seule reste impossible, quelle que soit la tenue (testé).

### Le Quarter Cube (`quarter`)

Le Quarter Cube (fan2cube.fr/quarter1 et 2, Katsuhiko Okamoto et Takafumi
Haseda, 2011) : un 3x3 dont chaque face ne fait qu'aller d'un quart et
revenir (A puis A', jamais A² ni deux A de suite). Chaque centre porte un
repère qui dit où en est sa face : dans le modèle, son `spin` (0 où le
quart horaire passe, le START de la page ; 1 un quart plus loin, où seul
le retour passe), changé par chaque quart de tour de la face, comme les
centres du Z-Twist. `turnAllowed` lit ce repère (`quarterTurns`), le
mélange joue le seul coup permis de faces tirées au hasard, et « résolu »
ne regarde que les couleurs (les faces peuvent rester d'un côté ou de
l'autre). Rendu (`three/quarterGeometry.ts`) : les cubies d'un 3x3, chaque
centre portant le repère des dessins de la page : un anneau ouvert là où
pointe le repère (il tourne avec la face) et un quart d'anneau épais, de là
vers le sens où la face peut aller (horaire au START, retour un quart plus
loin). **Saisie**
des stickers comme un 3x3, centres pré-remplis ; un clic sur un centre
tourne son repère d'un quart (`twisted` de l'éditeur, comme le Z-Twist).

**Résolution** (`methods/quarter.ts`, méthode **Les arêtes d'abord**,
d'après la page) : (0) chaque face ramenée au START ; (1) arêtes placées
par le 3-cycle A[DH]A' ; (2) retournées deux à deux par
A[DH]A'.G[HA]G'.D[HP]D' ; (3) coins placés par [[DH], G] ; (4) tournés par
[[DH]², G]. Toutes alternent sur chaque face et la laissent au START :
chaque formule est vue de chaque tenue et préparée par un quart de face
défait après, les variantes qui n'alternent pas écartées ; la recherche
(`solvePieces`, ces seules formules) place une pièce après l'autre. Les
permutations restent paires (chaque face tourne autant dans un sens que
dans l'autre), les 3-cycles suffisent. Environ 300 coups, chacun vérifié
jouable ; effet de chaque formule testé.

### Le Barrel (`barrel`)

Le Barrel (fan2cube.fr/barrel1 et 2, 1981) est un 3x3x3 dont les quatre
arêtes verticales sont tronquées jusqu'à la colonne du milieu de chaque
face : un prisme octogonal, dans les « Cylindriques ». Chaque coupe est une
face de sa couleur (rose, violet, turquoise, vert citron), faite d'un coin
du haut, d'une arête du milieu et d'un coin du bas, chacun réduit à un
triangle : un coin ne montre que son haut (ou son bas) et sa coupe, une
arête du milieu sa coupe seule, si bien que son sens ne se voit pas, comme
les arêtes fines du Z-Twist (`twistSolved`, `asSeenTwist`,
`withRealThinEdges`, partagés). Le modèle est le 3x3 aux couleurs standard,
sans son cœur caché (ce qui le distingue du 3x3 pour `cubeShape`) ; tourné
hors de sa colonne, un coin coupé laisse une encoche, une arête entière
dépasse : il se déforme, sans blocage. Rendu (`three/cutSolid.ts`, partagé
avec le Fisher Cube) : chaque pièce est sa case du 3x3 (ouverte vers
l'extérieur) coupée par les plans du solide, portée par la rotation qui
l'amène où elle est. **Saisie** pièce par pièce, comme le Floppy Ghost.

**Résolution** (`methods/barrel.ts`, méthode **Par couches**, d'après la
page) : la couche du bas comme un Rubik's Cube ; les arêtes du milieu
placées par [HD].[H'A'], dans un sens ou l'autre ; les coins du haut
tournés (Sune) puis placés (Aa) ; les arêtes du haut placées par le 3-cycle
D².HAP'.D².PA'H.D² ; retournées deux par deux par DPGAH.A'HG'P'D'.A'H'AH',
ou une seule par HGBDA.D'AB'G'H'.D'A'DA', qui retourne avec elle une arête
du milieu (la singularité de la page). Les méthodes du 3x3 (CFOP, Petrus,
ZZ) le résolvent aussi telles quelles. Effet de chaque formule testé.

### Le Fisher Cube (`fisher`)

Le Fisher Cube (fan2cube.fr/fishercube1 et 2, Tony Fisher, 1985) est « un
Rubik's Cube déguisé » : le mécanisme d'un 3x3x3, taillé dans un cube tourné
d'un huitième autour de la verticale (catégorie « Coupes diagonales »). Vu
de dessus, son carré du haut est posé sur une pointe de la grille du
mécanisme : le centre du haut et celui du bas sont des carrés, dont le quart
de tour ne se voit pas ; les centres de côté sont des coins le long de ses
arêtes verticales, qui montrent le leur (tourné, un coin se couche) ; les
arêtes du milieu sont au milieu de ses faces, d'une seule couleur, sans sens
visible (comme au Barrel). Il se déforme, sans blocage. Modèle
(`lib/fisher.ts`) : le 3x3, chaque centre de côté portant un sticker caché,
son repère (couleur `H`, jamais dessiné), pointé vers le centre blanc une
fois résolu : tout coup le porte (une tranche aussi), rien d'autre n'a à le
savoir ; ses 58 stickers le distinguent pour `cubeShape`. Rendu
(`three/fisherGeometry.ts`, `cutSolid.ts`), tourné d'un seizième pour
montrer deux faces. **Saisie** pièce par pièce (un centre de côté prend ses
quatre sens).

**Résolution** (`methods/fisher.ts`) : « exactement comme un Rubik's Cube »,
une méthode du 3x3 (par couches, CFOP, Petrus, ZZ) jouée sur ses couleurs
(les repères mis de côté, après « Remettre les centres »), puis **Tourner
les centres** avec la formule de la page (H)+(G)- = Hd'h'd.H'd'hd : elle
tourne le centre de gauche et celui du haut, un carré qui n'en montre rien,
donc un centre de côté seul ; vue de chaque côté et à l'envers, elle tourne
n'importe lequel dans un sens ou l'autre. Effet testé.

Le **Windmill** (`windmill`, fan2cube.fr/windmill1 et 2, Hidetoshi Takeji,
2006), « pratiquement le frère jumeau du Fisher's Cube » : le même
mécanisme, son cube tourné seulement de l'angle qui pose chacune de ses
arêtes verticales sur une coupe (cos − sin = 1/3, environ 31,4°,
`three/windmillGeometry.ts`). Chaque côté montre deux colonnes du
mécanisme : celle d'un coin (ses sommets, qui n'y montrent que deux
couleurs, et son arête du milieu, une seule) et celle d'un centre (son
centre, un rectangle, et ses deux arêtes). Ses centres de côté sont
taillés dans les côtés penchés : tournés, même d'un demi-tour, ils
dépassent ; ils portent le repère du Fisher Cube, plus un second le long de
leur face, qui le suit sans rien dire de plus mais distingue le Windmill
(62 stickers). Ses arêtes du milieu montrent aussi leur sens, sa géométrie
suivant la pièce (`cutSolid.ts` retrouve la rotation d'une pièce sticker
par sticker, ses deux repères ayant la même couleur). Mêmes méthodes, même
saisie que le Fisher Cube ; la page tourne aussi les centres par
(H)+(G)-, l'« état singulier » d'un centre seul tourné d'un quart compris.

### Le Megaminx (`megaminx`)

Le Megaminx (fan2cube.fr/megaminx1 et 2) : un dodécaèdre dont les douze
faces tournent par cinquièmes de tour, 12 centres fixes, 30 arêtes et 20
sommets (catégorie « Polyèdres »). Aucune grille entière ne lui va : le
modèle (`lib/megaminx.ts`) est combinatoire. Un emplacement est l'ensemble
des faces qu'il touche, un sticker regarde une des douze faces ; le tour
d'une face fait avancer d'un cran les faces autour d'elle (dans le sens
horaire vu d'elle), ce qui envoie chaque emplacement et chaque sticker de sa
couche : une permutation exacte. Pour le reste du code, un emplacement a une
position entière (son numéro, qui ne dit rien de sa place) et une face une
normale de la table des cubes (des étiquettes). Tenu le haut (U) en haut, F
devant, puis L, BL, BR, R autour du haut, la couronne du bas (DR sous F et R,
DBR, B, DBL, DL) et D ; 60 façons de le tenir (`MEGA_SYMMETRIES`). Les axes
réels des faces ne servent qu'à l'animation et au dessin (`MEGA_AXES`).
Notation : U F R... en anglais (`R2'` deux cinquièmes à l'envers) ; en
français, celle de la page, A devant, H au-dessus, puis D, B, P (souligné),
G autour de A dans le sens horaire, P derrière H et D, les faces opposées
soulignées (un trait bas combinant). Rendu (`three/megaGeometry.ts`) :
chaque pièce est le dodécaèdre coupé par les plans de ses couches, dessinée
où elle est ; pad dédié (`MegaPad` : moitié haute, moitié basse). **Saisie**
des couleurs, comme les cubes : ses 60 tenues donnent les placements
valides, ses centres restent pré-remplis.

**Résolution** (`methods/megaminx.ts`, méthode **L'étoile prolongée**,
d'après la page) : l'étoile du dessous (A², A.H'DH), ses sommets (D'B'D,
tournés par D'BD.ABA'), l'équateur bas ([H'A'][HD], [HD][H'A']), les cinq
faces voisines (H'A'²HA², H'A'H²A, HD²H'D'², HDH'²D', HDH'D'), l'équateur
haut, puis le haut : arêtes placées (A[HD]A') et retournées
(A[HD]HA'HA.H³A'), sommets placés ([HA].P'[AH]P) et tournés
((D'BDABA').H'(AB'A'D'B'D)H). Chaque formule est vue des 60 tenues, seule ou
préparée par un coup défait ensuite (X F X'), et son effet, qui ne dépend
pas de l'état, est lu une fois sur le puzzle résolu sous forme de table
(emplacement et face du premier sticker d'une pièce). Une pièce rentre par le
plus court enchaînement de celles qui laissent en place tout ce qui est fait
(Dijkstra sur ses places), pièce après pièce. La cible est la tenue que
disent ses centres. Environ 400 coups, en moins d'une seconde. Effet de
chaque formule de la page testé.

Le **Holey Megaminx** (`holey`, fan2cube.fr/holeymegaminx1, Lee Tutt, 2009) est
le Megaminx sans ses centres, des trous à leur place (catégorie « Troués »,
avec le Tori et l'Edge Only) : 50 pièces, mêmes coups, même méthode. Sans
centres, la cible est la tenue du puzzle résolu avec laquelle s'accordent le
plus d'étapes, puis le plus de pièces ; ses tours étant des permutations
paires, les 60 tenues sont atteignables (« pas de singularité », dit la
page).

Le **Pyraminx Crystal** (`crystal`, fan2cube.fr/pyraminxcrystal1 et 2, Aleh
Hladzilin, 2009) est le Megaminx coupé plus profond : chaque coupe passe par
le centre des faces voisines, si bien qu'il n'a plus de centres (20 sommets,
30 arêtes, un cœur caché qui le distingue du Holey Megaminx). Une face
emporte ses 5 sommets, ses 5 arêtes et les 5 arêtes qui partent de ses
sommets : les mêmes emplacements et la même notation que le Megaminx, le coup
marqué `MegaMove.crystal` (`megaTurns`). Dessin : `megaGeometry.ts`, coupe à
1/√5. Méthode **Les sommets d'abord** (d'après la page, « calquée sur le
Mégaminx ») : sommets puis arêtes du dessous, sommets des équateurs bas et
haut, arêtes des cinq faces voisines, sommets du haut placés ([HA].P'[AH]P)
et tournés (D'BDABA'.H'.AB'A'D'B'D.H), équateur haut, arêtes du haut placées
([G'P], un 3-cycle pur de trois arêtes non voisines ; avec son inverse tourné
d'un cran du haut, il en fait un de trois voisines) et retournées
(([G'P]H')².([PG']H)², la formule n'étant que dans une image de la page).
Sur les étapes du haut, seules les formules tenues le haut en haut servent
(tout le reste est fait), ce qui garde le calcul court.

### Le Skewb Ultimate (`skewbU`)

Le Skewb Ultimate (fan2cube.fr/skewbultimate1 et 2, Uwe Mèffert, 1982) est un
Skewb taillé en dodécaèdre (catégorie « Polyèdres ») : chaque sommet
du cube (aussi sommet du dodécaèdre) tourne d'un tiers de tour toute la moitié
du puzzle de son côté. 6 centres montrant chacun les quatre faces penchées
vers leur axe, 8 sommets les trois faces qui s'y rejoignent. Modèle entier,
celui du Dino (`rainbow.ts` : `solvedSkewbU`, `RainbowMove.skewb`, notation
des sommets de fan2cube) : centres sur les axes, sommets en (1, 1, 1)..., un
tour prend ce qui a un produit scalaire positif avec sa diagonale. Les 12
faces ont pour normales (0, ±1, ±2) et leurs permutations circulaires (2 pour
φ), que les tiers de tour permutent comme les vraies (`DODECA_NORMALS`,
indices 36 à 47 : deux chiffres en base 36 dans `stateKey` et le mémorisé) ;
12 tenues seulement (`SKEWB_SYMMETRIES` : les quarts de tour du cube ne
gardent pas le dodécaèdre). Rendu (`three/skewbUGeometry.ts`) : le dodécaèdre
coupé par les quatre plans du Skewb.

**Résolution** (`methods/skewbU.ts`, méthode **Le haut d'abord**, d'après la
page) : seuls les sommets du bas tournent (B, O, H, E), le centre du haut ne
bouge jamais et dit comment le tenir (le puzzle est lu dans cette tenue, les
coups trouvés rejoués depuis la sienne) ; (1) sommets du haut placés, (2)
tournés par [BO], [O'B'], [OH], [B'E'] ; (3) centres placés par [OH'],
[BO'], [B'E'][HE], [H'E'][HO] ; (4) retournés par [HE']²[EB']² (conjugué par
les précédentes) ; (5) sommets du bas tournés par K = [BO']⁴ et Z = [OH']⁴,
déjà à leur place (« les sommets libres suivent les sommets liés »). Effet de
chaque formule testé.

### L'AI Cube (`ai`)

L'AI Cube (fan2cube.fr/AIcube1 et 2) est « un bandaged du Revenge 4x4x4 » :
des huit octants du 4x4x4 (2x2x2 chacun), les quatre d'un tétraèdre sont
soudés en gros blocs, en quinconce une fois résolu ; les quatre autres
restent en petits cubes (un petit sommet, trois arêtes, une par arête du
cube, et trois centres, deux par couleur). Modèle (`lib/ai.ts`) : les petits
cubes du 4x4x4, un gros bloc étant un seul cubie au milieu de son octant
((2, 2, 2)...) ; un coup ne passe que s'il ne coupe aucun gros bloc
(`aiTurns`) : une moitié du cube toujours, une couche externe ou une tranche
seulement quand aucun bloc n'est à cheval sur ses coupes. Les blocs changeant
d'octant, les emplacements à peindre dépendent de l'état : il est déclaré
déformable (`SHAPE_SHIFTS`), saisi en choisissant d'abord sa forme (7). Le
mélange (`scrambleAi`) joue surtout des couches fines dès qu'il le peut, et
libère une moitié de ses blocs quand aucune ne passe (au hasard, il ne
tournerait presque que des moitiés), et finit les gros blocs dispersés, deux
par moitié du cube sur chaque axe. Rendu (`three/aiGeometry.ts`) : des
boîtes d'une case ou de deux.

**Résolution** (`methods/ai.ts`, méthode **des blocs**, d'après la page) :
(0) les quatre gros blocs en bas, par demi-cubes (la position standard de la
page : le haut tourne alors seul, H, et sa tranche, h) ; (1) chaque petit
octant reconstitué autour de son petit sommet, les arêtes d'abord (recherche
par les deux bouts sur les pièces suivies, avec H, h et T = D'BD.ABA', qui
pivote un octant, vu de chaque coin ; un h d'abord si leur permutation est
impaire), (2) puis les centres par 3-cycles purs : C =
Th².(Th²T'h²)².T'h².(T'h²Th²)², préparé de deux coups, et les produits de
deux d'entre eux qui ne bougent que trois centres (tous les trios), les deux
centres d'une couleur affectés pour une permutation paire ; (3) les huit
octants résolus comme un Pocket (solveur optimal du 2x2), par demi-cubes.
De 300 à 900 coups, surtout les centres (« c'est long », dit la page).

### Le RoadBlock-I (`roadblock`)

Le RoadBlock-I (fan2cube.fr/roadblock-I1 et 2, WitEden, 2012) est un 5x5x5
dont les neuf centres de chaque face sont soudés trois par trois en barres
parallèles (les « I »), ses couches externes épaisses et les trois
internes fines. Une face tourne toujours ; une tranche seulement si elle
ne coupe aucune barre, c'est-à-dire si aucune barre qu'elle emporte n'est
dans l'axe du coup (`roadblockTurns`). Modèle (`lib/roadblock.ts`) : les
cubies du 5x5x5, chaque centre portant un sticker caché (`H`, jamais
dessiné ni peint, comme les marques du Fisher Cube) le long de sa barre.
Le sens des barres d'une face ne change qu'avec ses quarts de tour : en
position **START** (le résolu), les barres des côtés sont horizontales et
les trois tranches de l'équateur tournent ; quelques quarts de tour des
faces autour d'un autre axe y couchent leurs barres en travers, ses
tranches tournent, et les mêmes quarts défaits ramènent START. « Résolu »
ne regarde que les couleurs : une face unie l'est, ses barres dans un sens
ou dans l'autre. Le mélange (`scrambleRoadblock`)
joue surtout des tranches permises, et libère un axe quand aucune ne
l'est. **Saisie** dans tout état (`lib/roadblockEditor.ts`) : les stickers d'un
5x5, sans centre fixe (les tranches du milieu les déplacent) ; un clic sur
un centre peint sa barre entière (`paintBar`, `barCells`), et six boutons
disent quelles faces ont leurs barres tournées d'un quart par rapport à
START (`BarToggles`, l'état `twisted` de l'éditeur ; basculer une face
tourne ses centres d'un quart avec leurs couleurs, `turnFace`). « Depuis
l'état actuel » les lit sur le cube (`barsTurned`), `buildCube` les pose
(`withBars`) ; la validation refuse un sens des barres impossible. Rendu (`three/roadblockGeometry.ts`) : couches externes
épaisses, un sticker par barre.

**Résolution** (`methods/roadblock.ts`, méthode **des centres**, d'après la
page) : chaque formule va de START à START (`legal`, qui la rejoue en
suivant le sens des barres), jouée dans le « mode » qui couche les barres
en travers de l'axe de sa tranche (`SETUP`). (0) START ; (1) les barres du
milieu (le centre de chaque face), par les tranches du milieu ; (2) la
parité : les ailes sont en permutation impaire de leur place près de leur
milieu une fois sur deux, ce que les 3-cycles ne corrigent pas ; un quart
de tranche de l'équateur (un 4-cycle d'ailes, START gardé) la change ; (3)
les autres barres par 3-cycles purs (commutateurs d'une tranche et d'un
coup de son mode) ; (4) les deux ailes de chaque arête amenées près de son
milieu par 3-cycles d'ailes (commutateurs d'une tranche interne et d'un
`F U F'` de son mode, leurs produits, et au besoin conjugués l'un par
l'autre) ; (5) comme un 3x3 (`projectPlan`, la projection du 5x5), ses
barres finissant dans un sens ou dans l'autre. Environ 400 à 700 coups, moins d'une seconde (trois la
première fois, le temps des tables).

### Le Professor Pyraminx (`pyra5`)

Le Pyraminx 5x5x5 (fan2cube.fr/profpyraminx1 et 2, Timur Evbatyrov, 2011) :
le même modèle que le Master, à 5 couches (positions jusqu'à ±4, d'où une
`stateKey` en base 9), cinq tranches par sommet (`PyraMove.slice` 1 à 4, la
4e étant la face opposée, `isOppositeFace` : « Faces » dans le pad et le
guide, comme la 3e du Master). 54 pièces de sept sortes, 25 stickers par
face : pointes et co-sommets (qui ne font que pivoter), 12 ailes et 12
co-ailes (jumelles deux à deux, départagées par leur chiralité), 6 arêtes,
12 co-centres (3 par couleur, interchangeables) et 4 centres. Notation :
`H'₁`, `D₃`, `G₄` en français, `2U'`, `4R`, `5L` en anglais.

**Résolution** (`methods/pyraminx5.ts`, méthode **Ailes puis co-ailes**,
d'après la page) : co-sommets, pointes, centres placés en 3e tranche,
puis les **ailes** (`[H'₁ D₃]`...), les **co-ailes** (`[H'₂ D₃]`..., qui
brassent les co-centres), les **arêtes** (`[G₂ D'₂]`, `D₂H₂D'₂H₂D₂H₂D'₂`,
retournées par `[G₂ D'₂][H'₂ D₂]`), les **co-centres**
(`[H₃ G'₃]² G₄ [H₃ G'₃] G'₄` : le `G` seul de la page est la face opposée
au sommet gauche, son « G(auche-opposé) » ; c'est la seule étape qui tourne
une face, aussitôt remise) et enfin les centres (`[G₃ D'₃]³`). Ailes,
co-ailes et co-centres se placent un à un par 3-cycles (`pyraCycles.ts`,
partagé avec le Master) : les formules de la page de chaque côté, puis
conjuguées par un tour jusqu'à couvrir tous les 3-cycles ; des co-centres
d'une couleur étant interchangeables, deux restants échangés passent par un
emplacement juste. Environ 200 coups.

### Le Pyraminx Jing (`jing`)

Le Jing (fan2cube.fr/pyraminxjing1) coupe **au-delà du centre** : chaque
sommet tourne sa moitié du puzzle (`PyraMove.deep`), soit son coin, ses
trois arêtes et les trois centres autour. 14 pièces : 4 coins qui ne font
que pivoter, 6 arêtes, 4 centres qui voyagent (plus le cœur, caché). Une
pièce est l'ensemble des moitiés auxquelles elle appartient, posée à la
somme de leurs sommets : coin en v, arête en (v + w) / 2 (un axe unitaire),
centre en u + v + w (moins le sommet absent) ; un tour prend donc ce qui est
du côté du sommet, comme la couche du Pyraminx. Le Jing a autant de pièces
que le Pyraminx (15 avec le cœur) : `cubeShape` les départage par le nombre
de stickers (28 contre 36). Notation : majuscules dans les deux notations
(`D`, `R`), comme fan2cube.

**Rendu courbe** (`three/jingGeometry.ts`) : un tétraèdre aux faces bombées
et aux pointes arrondies en dômes, maillé finement. Chaque coupe est une
**sphère** centrée sur l'axe de son sommet, loin derrière la pointe (une
sphère autour de l'axe tourne en elle-même, comme la moitié qu'elle borde) :
ses joints courbent un peu plus que le contour du puzzle, comme des cercles
vers leur centre. Chaque petit triangle est **coupé exactement** le long de
ces sphères et des arêtes du tétraèdre, puis attribué à la pièce des
moitiés où il se trouve, avec des normales lissées par sommet
(`PiecePolygon.normals` : pas de facettes dans les reflets). Les bandes le
long des coupes sont les joints sombres, enfoncées sous la surface en
rainures (`GROOVE` : à fleur, elles dépasseraient de l'autre moitié pendant
un tour), chaque sticker est doublé vers
l'intérieur en plastique ; pendant qu'une moitié tourne, sa sphère de
coupe est dessinée, immobile (`PolyDrawing.cut`) : une sphère autour de
l'axe tourne en elle-même, donc une seule calotte ferme les deux parties,
comme la surface de coupe qu'on voit sur le vrai puzzle. `PolyPiece` fusionne
les polygones d'une pièce par couleur (un mesh par sticker), et la vignette
du sélecteur prend un maillage plus grossier, sans doublure
(`PolyDrawing.thumbnail`).

**Résolution** (`methods/jing.ts`, méthode **Sommets d'abord**, d'après
fan2cube.fr/pyraminxjing2) : (1) sommets tournés en place ; (2) arêtes
placées par le crochet `[DH]` ((BA)->(AD)->(GD)) vu de chaque côté ; (3)
retournées par `[DH'][G'H]` ; (4) centres par `[DH]³` (B,A)(G,D). Les
crochets échangent aussi les centres deux à deux, ce que (4) règle : coins
en place, les centres ne peuvent être que deux à deux mal placés (loi des
twists de la page, testée).

### Le Pyramorphinx (`morph`)

Le Pyramorphinx (fan2cube.fr/pyramorphinx1, le « Mini Pyraminx ») est un
**2x2 taillé dans le tétraèdre inscrit** : mêmes positions, mêmes coups
(`SHAPE_DIMS` `[2, 2, 2]`, pad du 2x2), mais 4 cubies gardent un coin du
tétraèdre (3 stickers) et 4 le milieu d'une face (1 sticker). Les stickers
regardent selon les diagonales (`TET_NORMALS`, et après un quart de tour
leurs opposées, indices 16 à 19). Une grosse pièce posée à la place d'une
petite le **déforme** : c'est un puzzle déformable (`SHAPE_SHIFTS`), saisi
par sa forme comme la tour, avec **7 formes** seulement. Même nombre de
pièces que le 2x2 : `cubeShape` les départage par les stickers. `isSolved`
compte aussi les faces : un quart de tour laisse chaque moitié unie, mais
sur deux tétraèdres (8 faces au lieu de 4).

**Rendu** (`three/morphGeometry.ts`, `isPolyDrawn`) : chaque pièce est sa
case du 2x2 coupée par le tétraèdre, un polyèdre convexe calculé depuis ses
plans ; dessinée tournée comme la pièce, dans le repère du modèle que
`PolyDrawing.orient` pose sur une face (ses coups restent ceux d'un 2x2).

**Résolution** (`methods/morph.ts`, méthode **Comme un Pocket**, d'après
fan2cube.fr/pyramorphinx3) : lu comme le 2x2 qu'il est (chaque pièce reçoit
les couleurs de son cubie, tournée comme elle se tient), résolu par le
solveur optimal du 2x2, et les mêmes coups le résolvent. Un milieu de face
étant symétrique autour de son sticker, sa vrille ne se voit pas : on essaie
les 81 lectures jusqu'à un 2x2 réel (vrilles des coins de somme nulle).
D'où la « singularité » de fan2cube : un coin vrillé seul est légal.

### Le Master Morphinx (`mmorph`)

Le Master Morphinx (fan2cube.fr/mastermorphinx1 et 2, Aleh Hladzilin et Adam
Cowan, 2009) est « un Super 3x3x3 déguisé » : le mécanisme d'un 3x3x3 taillé
dans un tétraèdre (catégorie « Pyramides »), comme le Pyramorphinx l'est d'un
2x2. Ses 4 gros sommets portent les pointes du tétraèdre (trois couleurs),
ses 4 petits sont au milieu de ses faces (une couleur : leur rotation ne se
voit pas), ses 6 centres sur ses arêtes (deux couleurs : chaque quart de tour
se voit), ses 12 arêtes entre eux ; il se déforme, sans blocage. Modèle
(`lib/mmorph.ts`) : le 3x3, chaque centre marqué d'un sticker caché (comme
le Fisher Cube) ; « résolu » ignore la rotation des petits sommets et accepte
toute tenue (les 24 du 3x3, le tétraèdre tournant avec). Le vrai puzzle est
bombé : le dessin est droit, à la demande (`three/mmorphGeometry.ts`, chaque
case du 3x3 coupée par le tétraèdre, `cutSolid.ts`), posé sur une face comme
le Pyramorphinx. **Saisie** pièce par pièce, les petits sommets d'un seul
sens (`asSeenMorphinx`), leur rotation choisie pour rendre la position
atteignable (`withRealCorners`).

**Résolution** (`methods/mmorph.ts`, « style Rubik's Cube », la première
méthode de la page) : une méthode du 3x3 (par couches, CFOP, Petrus, ZZ) sur
ses couleurs, puis **Tourner les centres** par les formules de la page,
(H)+(G)- = Hd'h'd.H'd'hd et (H)2+ = (H.DGH²D'G')², vues de chaque tenue
(recherche sur les seuls centres). Effet de chaque formule testé.

### Le 5x5 par réduction (`src/lib/solver5/`)

Le moteur n'a rien de nouveau pour le 5x5 (grille `{-2..2}`, coups `R`,
`2R`, `Rw` déduits de la forme, centres du milieu fixes et pré-remplis en
saisie), sauf la **tranche du milieu** (`3R`, `Move.depth` 3), que seule la
méthode utilise (pas le pad ni le mélange) : le guide la montre via
`methodTurns`. La saisie distingue les deux sortes de centres d'une couleur
(budget 4 chacune).

Une recherche bornée par comptage, comme sur le 4x4, ne suffit pas : une
tranche y déplace trois centres d'un coup, et la dernière pièce d'une face
demande un commutateur. La méthode est donc celle des cubeurs, par
**3-cycles purs** (`lib/cycleLibrary.ts`) : des commutateurs `[A, X Y X']` trouvés au
chargement (ceux qui ne bougent que trois pièces d'une sorte), conjugués par
un tour, indexés par le déplacement qu'ils font (`a>b`) avec le troisième
emplacement qu'ils touchent.

0. **Remettre les centres** (`stepRecenter`, si nécessaire) : tenu autrement,
   ses centres du milieu ramenés au repère absolu par les tranches du milieu
   (le `M`, `E`, `S` du 3x3), que la phase 3x3 suppose.
1. **Centres** (`centers.ts`) : face par face (D, U, F, R, B ; L forcée),
   deux coups (une tranche, un tour) quand ça suffit, sinon un 3-cycle :
   `[2R, X 2L X']` pour les diagonaux, `[3R, X 2L X']` pour ceux en croix,
   dont le troisième emplacement n'est sur rien de fini.
2. **Arêtes** (`edges.ts`) : chaque milieu d'arête reste en place et appelle
   ses deux ailes (une aile n'a qu'un sens par emplacement, sa chiralité) ;
   elles arrivent par des 3-cycles d'ailes purs (`[2U, L U L']`...), centres
   intacts. Aucun 3-cycle ne prend les deux ailes d'une même arête : au
   besoin on passe par un autre emplacement, ou on en emprunte un juste
   (petite recherche sur les seuls emplacements en jeu).
3. **Parité** : la permutation des ailes est impaire une fois sur deux (une
   tranche en quart de tour fait un 4-cycle d'ailes), ce que les 3-cycles ne
   corrigent pas ; elle est détectée d'avance, l'appariement vise alors
   l'arête UF croisée, et l'algorithme de parité OLL du 4x4 l'échange (sur
   un 5x5 aux centres faits, il n'échange que ces deux ailes).
4. **Phase 3x3** par projection (`projectPlan`, partagé avec le 4x4) : coins,
   milieux d'arêtes et centres fixes forment un vrai 3x3, toujours légal.

Résolution en environ 500 coups (dont 200 de centres et 150 d'arêtes),
calculée en un peu plus d'une seconde (bibliothèques comprises).

### Les super cubes (`super4`, `super5`)

Le Super Revenge et le Super Professor (fan2cube.fr/superrevenge1 et 2,
superprofessor1 et 2) : un 4x4x4 et un 5x5x5 dont chaque centre est une
pièce à lui, qui doit reprendre sa place (un centre n'atteint chaque
emplacement que dans un sens, sauf ceux du milieu du 5x5, qui tournent sur
place). Chaque centre le montre par des bordures sur ses côtés tournés
vers les bords de sa face (deux pour un centre du 4x4 ou un « x » du 5x5,
une pour un « + », quatre pour celui du milieu), chacune de la couleur de
la face au-delà. **Modèle** (`lib/superCube.ts`) : une bordure est un
sticker sur ce côté du centre (sa normale en travers de la face), de cette
couleur : résolu, elle regarde comme la face de sa couleur, donc « chaque
direction d'une seule couleur » dit toujours résolu, et un centre se
reconnaît à ses couleurs, la sienne d'abord (`centerKey`) ; leurs 144 et
246 stickers les distinguent pour `cubeShape`. Mêmes coups, guide et
mélange que leurs homologues. **Rendu** (`three/superGeometry.ts`) : les
cubies du 4x4 ou du 5x5, chaque centre bordé de bandes de couleur.
**Saisie** des couleurs, comme les cubes, chaque bordure peinte à part
(sa propre facette, plus sombre tant qu'elle est vide) : la saisie guidée
reconnaît un centre à sa couleur et à celles de ses bordures, et complète
le reste dès qu'il est déterminé (les rotations du cube entier suffisent à
donner les placements : un centre n'atteint chaque emplacement que dans un
sens).

**Résolution** (`methods/superCube.ts`, la « méthode des centres » de la
page, prise à l'envers) : la méthode du Revenge ou du Professor (réduction,
par couches ou CFOP) sur leurs couleurs, les bordures mises de côté, puis
leurs « états singuliers » : sur le Professor, les centres du milieu
tournés par (H)+(G)- = Hd*'h*'d*.H'd*'h*d* (d* et h* les trois couches
intérieures : tout le bloc des centres de deux faces tourne) et (H)2+ =
(HDGH²D'G')², vus de chaque tenue (recherche sur leurs tours, 4⁶ états) ;
puis chaque centre à sa place par 3-cycles purs, O = g'HdH'.gHd'H' de la
page (les « x » ; les « + » avec la tranche du milieu), préparés par un
coup (`cycleTable`, `placeByCycles`). Les couleurs faites, coins et ailes
sont à leur place : les centres ne sont qu'à une permutation paire de la
leur. Environ 350 coups sur le Super Revenge, 800 sur le Super Professor ;
effet de chaque formule testé (sur le 4x4, la page tourne les centres
avec d* et h* les deux couches intérieures).

### Le 6x6 par réduction (`src/lib/solver6/`)

Le moteur le fait tourner tel quel (grille `{-5, -3, -1, 1, 3, 5}`) ; ses
coups ont une couche de plus : la troisième (`3R`) et le coup large de trois
couches (`3Rw`, la moitié du cube), que `SHAPE_INNER_TURNS` déclare
(`slice3`, `wide3`). Avec cinq sortes de couches, le pad écrit ses onglets
en notation (`R 2R 3R Rw 3Rw`, le nom en infobulle). Aucun centre fixe :
repère absolu comme le 4x4. Quatre sortes de centres par face (« x »
intérieurs et extérieurs, obliques des deux mains, que la saisie distingue
par leur chiralité : `handOf` dans `editorTables.ts`), et deux orbites
d'ailes (externes, près des coins ; internes, au milieu).

1. **Centres** (`centerCycles.ts`, partagé avec le 5x5) : face par face,
   deux coups ou un 3-cycle de la sorte du centre (commutateurs de la
   deuxième couche pour les « x » extérieurs, de la troisième pour les
   intérieurs, des deux pour les obliques).
2. **Arêtes** (`edges.ts`) : sans milieu d'arête, l'appariement choisit
   quelle arête va où (pour chaque emplacement, celle que montrent déjà le
   plus de ses ailes), puis corrige ce choix pour que la phase 3x3 tombe sur
   un vrai 3x3 : deux arêtes échangées si leur ordre et celui des coins ne
   s'accordent pas, une arête retournée si un nombre impair le sont. Plus de
   parité OLL ni PLL. Les ailes arrivent par 3-cycles purs, orbite par
   orbite (`wingPairing.ts`, partagé avec le 5x5).
3. **Parité** : une orbite dont l'arrangement voulu est une permutation
   impaire a sa paire d'UF visée croisée ; l'algorithme de parité OLL du
   4x4 joué sur les tranches de l'orbite (`2R` pour les ailes externes,
   `3R` pour les internes) l'échange, rien d'autre (testé).
4. **Phase 3x3** par projection (`projectPlan`) : coins, une aile externe
   par arête, un centre par face.

Environ 770 coups (400 de centres, 230 d'arêtes), en moins d'une seconde
(trois la première fois, le temps des bibliothèques).

### Le Floppy Ghost (`ghost`)

Le Floppy Ghost (fan2cube.fr/floppyghost1, le Floppy Megaminx Ghost) est
une plaque carrée découpée le long des cinq droites d'un **pentagramme**.
Sa mécanique est un Floppy Megaminx : un centre fixe (le pentagone), cinq
arêtes (les branches de l'étoile) et cinq sommets (entre deux branches). Un
coup **retourne un côté** d'un demi-tour, autour de l'axe qui passe par le
centre perpendiculairement à sa coupe : son arête se retourne sur place,
ses deux sommets s'échangent en se retournant. Le pentagramme est incliné
(9° comme sur le schéma de la page) et un peu décentré : chaque pièce a sa
forme, qu'un coup couche de travers, donc le puzzle se déforme.

**Modèle entier** (`lib/ghost.ts`, puzzle sans grille, `isGridless`) : 10
emplacements tous les 36° autour du centre (pairs : arêtes, impairs :
sommets), des positions entières qui ne servent qu'à les distinguer
(`GHOST_SLOTS`, `SHAPE_DIMS` `[7, 7, 1]`). Les normales des côtés sont des
directions du plan tous les 18° (`PLANE_NORMALS` de geometry.ts, indices 20
à 35 hors des 4 faces du cube), devant et derrière restent `F` et `B`. Le
demi-tour du côté k est une **réflexion** : emplacement m -> 4k - m (mod 10),
direction j -> 9 - 8k - j (mod 20), z -> -z. Un seul sens de tenue
(`cubeOrientations` : le carré n'a aucune symétrie qui garde la mécanique).
Les couleurs (celles du cube, dessinées en argent) ne servent qu'à identifier
les pièces ; deux paires arête/sommet partagent les mêmes, d'où les arêtes
listées avant les sommets (elles ne quittent jamais leur emplacement et
prennent les leurs en premier dans `pieceSearch`).

**30 720 états**, diamètre 15, tout l'espace parcouru par les tests. La page
annonce 5!·2⁵/2 = 1 920 en oubliant le sens des sommets (×16), que sa propre
méthode fait pourtant tourner.

**Notation** : lettres de fan2cube en français (H, D, B, P, G : haut,
droite, bas à droite, bas à gauche, gauche), U R D B L en anglais, toujours
avec `2` (un demi-tour, le `H²` de la page). `parseGhostMoves` lit les
formules de la page.

**Rendu** (`three/ghostGeometry.ts`) : chaque pièce est sa région du carré
(découpée par demi-plans), extrudée, dessinée chez elle puis posée par
l'élément du groupe diédral qui l'a amenée (rotation d'un cinquième ou
retournement autour d'un axe), retrouvé depuis son emplacement et le sens de
son sticker avant. Tout est argenté (`PolyDrawing.skin`). Un test vérifie
que la géométrie donne à chaque pièce les côtés du carré que disent ses
stickers, et que **chaque pose d'un emplacement a sa propre forme** :
l'argent suffit à tout distinguer.

**Résolution** (`methods/ghost.ts`, méthode **Coins puis arêtes**, d'après
la page) : (1) sommets placés avec le 3-cycle `(H²D²)²` ; (2) sommets
orientés avec `D²B²P²G².P²B²D²H²` (retourne les deux sommets du haut, et
deux arêtes) ; (3) arêtes retournées deux par deux avec `(H²D²)³`. Chaque
formule sert de générateur depuis les cinq côtés (la mécanique est la même
vue de chacun), conjuguée par des coups simples. Aussi la méthode
**Optimale** (BFS exhaustive).

**Saisie pièce par pièce** (`lib/pieceEditor.ts`) : des milliers de formes,
impossibles à proposer en vignettes. Un clic sur un emplacement y pose la
pose suivante qui s'y loge (autre pièce, ou la même retournée), en sautant
les pièces déjà posées ailleurs ; un emplacement vide montre sa pièce
d'origine en gris. Les poses se trouvent en tournant chaque pièce seule
depuis chez elle. La saisie reste la table de stickers habituelle
(`isComplete`, `buildCube`, `progress` y passent la main), donc « Depuis
l'état actuel » et la validation marchent tels quels.

### Le cube miroir (`src/lib/shape.ts`)

Le **cube miroir** (Mirror Blocks) est un _shape mod_ : mécaniquement un NxN
ordinaire, mais tous ses stickers ont la même couleur et ses couches ont des
épaisseurs différentes, si bien qu'on le résout **par la forme**. C'est donc
**une variante de rendu et rien d'autre** (`CubeVariant`, dans le store à côté
de la taille) : le modèle, les coups, `isSolved`, les solveurs, la saisie et la
validation l'ignorent complètement. Seuls les puzzles miroirs qui existent
vraiment sont proposés (`SHAPE_MIRROR` / `supportsMirror`, puis `CUBE_KINDS`) :
2x2, 3x3 et 4x4. Le 2x2x4 n'a pas de version miroir, et le 1x2x3 ne peut pas en
avoir : un axe à une seule couche porte ses deux grandes faces sur les mêmes
pièces, donc elles ne peuvent pas avoir d'épaisseur.

La correspondance est **couleur -> épaisseur** (`LAYER_THICKNESS`), **bijective** :
les six épaisseurs sont distinctes (groupées en fines et épaisses pour garder
l'allure du puzzle, chaque axe ayant sa paire, comme un noyau décentré
différemment sur chaque axe). Une forme désigne donc une pièce et une seule,
ce qui rend la **saisie par épaisseurs** possible et supprime les pièces
d'apparence identique du vrai Mirror Blocks. Cette table suffit à tout déduire :

- l'épaisseur d'un cubie selon un axe est celle de la couleur du sticker qui
  regarde cet axe ; sans sticker sur cet axe, le cubie est dans une couche du
  milieu (épaisseur 1) ;
- sa boîte est **ancrée sur sa face interne** (celle qui regarde le centre) et
  grandit vers l'extérieur : c'est ce qui fait dépasser une pièce épaisse posée
  là où il en faut une fine, donc les **bosses**.

Trois propriétés en découlent, toutes testées (`tests/unit/shape.test.ts`) :

- **couleurs opposées de somme 2** : un axe mesure alors
  `épaisseur(-) + 1 par couche du milieu + épaisseur(+) = taille`, donc le cube
  résolu est un cube plein. Les couches du milieu d'un même axe sont
  forcément égales (une pièce circule de l'une à l'autre) : sur 4x4, seules les
  deux couches extrêmes diffèrent, exactement comme sur le vrai puzzle ;
- **rigidité** : la boîte recalculée après un coup est exactement la boîte
  d'avant, tournée. L'animation (qui fait tourner un groupe autour de l'origine
  du réseau) reste donc juste, sans état supplémentaire ni pièce qui saute en
  fin de rotation ;
- **recentrage** : les couches extrêmes étant inégales, le solide résolu est
  décalé de la moitié de leur différence (le noyau décentré du vrai puzzle) ;
  `centeringOffset` le remet au centre via un groupe **externe** au groupe
  animé.

La variante `classic` est le cas dégénéré de la même table (toutes les
épaisseurs à 1) : un seul chemin de rendu, pas de branche.

**La saisie d'un cube miroir se fait en épaisseurs**, et c'est _exactement_ la
saisie en couleurs : la bijection couleur <-> épaisseur fait que peindre une
épaisseur, c'est peindre une couleur. `lib/editor.ts`, `editorTables.ts` et
`validate.ts` sont donc inchangés, avec les mêmes garde-fous (placements
valides, budgets par pièce, auto-complétion). Seul l'habillage diffère : la
palette affiche six barres ordonnées de la plus fine à la plus épaisse (échelle
étirée pour rester lisible dans une puce), les stickers peints sont dorés, et
`EditView` donne à chaque emplacement la forme de ses stickers **déjà peints**
(un axe non peint garde 1). Comme les pièces ne grandissent que vers
l'extérieur, une saisie à moitié faite ne se chevauche jamais : la pièce prend
sa forme au fur et à mesure.

### Interface

Panneau d'overlay en **deux blocs** (sur desktop, deux cartes séparées : le
titre et l'initialisation à gauche, la langue et la résolution à droite ; sur
mobile et en saisie, une seule carte) :

- **Initialisation** (titre non affiché, `aria-label` seulement) : **choix du
  cube** : un bouton montre le puzzle courant (vignette + nom) et ouvre un
  sélecteur en modale, d'abord les **catégories** en vignettes, puis les
  **puzzles** de la catégorie choisie (toujours ouvert sur les catégories ; le
  puzzle courant et sa catégorie sont mis en évidence ; la vignette d'une catégorie montre trois
  de ses puzzles, devant le 3x3, le 4-Star Prism ou le Megaminx s'il en est, `COVERS`). Catégories (`cubeCategory`), dans
  l'ordre, tous au pluriel : Standards 2x2 (Pocket)/3x3/4x4 (Revenge)/Super Revenge/5x5 (Professor)/Super Professor/6x6, Miroirs 2x2/3x3/4x4, Tours 2x2x3
  (Slim)/2x2x4/2x3x4/3x3x2 (Domino)/3x3x4/4x4x3/4x4x5/5x5x4/Camouflage 4x4x2, Plats 1x2x3/3x3x1 (Floppy)/Floppy Ghost (un puzzle d'une
  seule couche d'épaisseur étant plat), Pyramides Pyraminx/Tetraminx/Master Pyraminx
  (4x4)/Professor Pyraminx (5x5)/Pyraminx Jing/Pyramorphinx/Master Morphinx, Polyèdres
  4-Trajber's Octahedron/Octahedron VTO/GEM-0 (Jewel)/FTO/Rainbow/Megaminx/Pyraminx Crystal/Skewb Ultimate, Cylindriques Dino Cylinder/Hockey Puck/Barrel/2-Star Prism (UFO)/4-Star Prism, Engrenages Gear Cube/Gear Cube Ultimate/Gear Cube Extreme, Coupes diagonales Dino Cube/Rex Cube/Fisher Cube/Windmill, Troués Holey Megaminx/Tori/Edge Only, Torturés Violet/Z-Twist/Quarter Cube/AI Cube/RoadBlock-I.
  Les vignettes sont des SVG **dessinés par le code** (`three/isometric.ts`)
  depuis la forme et la variante : un nouveau puzzle a la sienne sans dessin ;
  changer de forme réinitialise le cube et rabat la méthode si besoin, changer
  de variante conserve l'état) avec le **statut** sur la même ligne, mélanger /
  réinitialiser, saisie d'un cube (vierge ou depuis l'état courant),
  **Mémoriser / Restaurer** (un état par forme, gardé entre deux visites,
  pour comparer deux méthodes sur le même mélange ; remplacer un autre état
  mémorisé demande confirmation dans une modale), vitesse
  d'animation, et **pad de rotations** construit à partir des coups que la
  forme autorise, lus dans `movesFor` (une gâchette horaire + une anti-horaire
  par face ; un seul bouton de demi-tour là où la forme n'a pas de quart de
  tour ; rien pour une face dont l'axe n'a qu'une couche ; un sélecteur
  Externe / Tranche / Large, limité aux sortes de coups de la forme (Externe /
  Large sur la tour), choisit la couche tournée, plus un onglet « Avancé »
  sur le 3x3 (`M`, `E`, `S`, coups larges) ; un coup bloqué par l'état de
  la tour reste grisé ; en arrivant sur un puzzle, le pad s'ouvre sur le
  premier onglet où un coup passe, « Large » sur l'AI Cube résolu) avec
  **recentrage caméra animé** et
  **bascule de notation FR/US**.
- **Résolution** : choix de la **méthode** (liste déroulante, filtrée par
  forme via `methodsFor`), **Résoudre**
  (joue le reste de la solution), puis la solution parcourue dans les deux
  sens : **étape précédente / suivante** et **coup précédent / suivant** (le
  plus didactique : le coup en cours ou le prochain est surligné dans sa
  séquence, ceux déjà joués s'estompent). Au milieu d'une étape, ses boutons
  deviennent **Défaire l'étape** et **Finir l'étape**. Reculer rejoue les
  coups à l'envers, sans quitter la solution. Pendant qu'elle joue,
  Résoudre devient **Arrêter** (dans ce même panneau) : le mouvement en
  cours se termine, la suite attend, et les boutons reprennent de là ;
  l'Arrêter de gauche ne sert plus qu'au mélange, et la **liste des étapes**
  nommées avec le total de rotations et le surlignage de l'étape en cours ;
  sur desktop, seule cette liste défile (le reste du panneau reste en place),
  et elle suit le coup en cours pendant que la solution joue.
  Les étapes s'affichent sans attendre : le **plan** de la méthode dès son
  choix (`PlanOutline`, « si nécessaire » sur les étapes qu'on saute
  souvent : `StepSpec.optional`), puis la **vraie solution** dès que le cube
  est au repos, calculée d'avance dans un worker (`useAutoPlan`,
  `workers/solveWorker.ts`) pour ne jamais figer la page ; Résoudre et Pas à
  pas la réutilisent tant qu'elle vaut pour l'état et la méthode
  (`planKey`) ; tant qu'elle n'est pas prête, Résoudre dit « Calcul de la
  solution… » et ses boutons restent grisés (`useAutoPlan` le renvoie).
  **Clavier** (`useSolveShortcuts`, rappelé dans l'infobulle de chaque bouton) :
  flèches droite / gauche un coup en avant / en arrière, Page suivante /
  précédente une étape (en arrière, une solution qui joue s'arrête d'abord,
  puis le dernier coup ou l'étape sont défaits), Espace met en pause ou reprend, Entrée joue tout le
  reste ; rien pendant une saisie, dans un champ ou une fenêtre ouverte, ni
  ce que le bouton correspondant ne pourrait pas faire.

En bas du panneau de gauche (de l'unique carte sur mobile), « Fait avec ❤️ par
YavaDeus », un lien vers https://yavadeus.dev (`Credit`).

**Mobile** : le panneau se **replie** en une barre compacte (Mélanger +
Résoudre) ; en mode saisie, le cube est empilé **au-dessus** du panneau pour
rester entièrement visible pendant la peinture.

**Guide des mouvements** (bouton au-dessus du pad, modale) : chaque coup de
la forme, montré **sur le cube dans son état actuel**, avec sa notation et une
phrase qui le décrit. Une ligne par couche et par sens : le coup et son
opposé côte à côte (`R` / `R'`, `1` / `-1`), puis le coup quantifié (`R2` ;
`2` / `-2` puis `3` sur l'étoile, où trois crans font un demi-tour dans les
deux sens). Les couches sont celles du pad (onglet « Avancé » compris) plus
celles que tournent les méthodes de la forme (`methodTurns`), groupées par sections (faces, tranches du milieu,
tranches internes, coups larges ; étages et slash sur l'étoile), sans
sélecteur : tout défile verticalement. Le contenu est **pur et dérivé**
(`lib/moveGuide.ts`) : `moveGuide(shape)` et `describeMove` (une description
structurée que `t.describeMove` met en phrase), donc un nouveau puzzle a son
guide sans travail. Rendu : **un seul contexte WebGL** (`GuideCanvas`, posé
sous la liste, transparent) ; chaque vignette a sa scène et sa caméra et se
dessine en scissor dans sa boîte DOM, les vignettes hors de la zone visible
sont sautées. Seules les lignes au **centre** de la liste s'animent
(IntersectionObserver sur une bande centrale) : le coup se joue, marque une
pause, puis le cube revient à l'état actuel et le coup recommence, jamais
rejoué à l'envers. Un coup bloqué dans l'état (la tour) reste figé, avec la
mention « Ce mouvement n'est pas possible dans cette configuration ». La
caméra d'une vignette est le cadrage de la scène, rapproché et retourné pour
que la couche qui tourne soit face à elle (dessous pour `D`, derrière pour
`B`), reculée sur une vignette étroite.

**Aperçu d'un coup** : survoler (ou focaliser au clavier) un bouton du pad met
en surbrillance les pièces que ce coup tournerait (corps bleu ciel, stickers
éclaircis) : `PadButton` (sur tous les pads) écrit le coup dans
`viewStore.preview`, `usePreviewed` (lu par `CubeView` et `PolyView`) en
déduit les pièces avec `turnedBy` et `halfTurnedBy` (les mêmes fonctions que
l'animation), sauf pendant une animation ou si le coup est bloqué.

**Feu d'artifice** (`components/celebration/Fireworks.tsx`) : quand un coup
amène le puzzle résolu (`solvedByTurn` du store : le coup qui finit, depuis
un état non résolu ; pas une réinitialisation, un changement de puzzle ni
une restauration), quelques fusées montent et éclatent aux couleurs du cube
pendant trois secondes, sur un canvas qui laisse passer les clics et
n'existe que le temps du spectacle (rien au repos). Rien pour
qui demande moins d'animations (`prefers-reduced-motion`).

**Adresse** (`lib/route.ts`, `store/router.ts`, sans bibliothèque) : l'URL
dit la langue et le puzzle, `#/fr/floppy-ghost`, `#/en/3x3-mirror`, ou
l'**accueil** quand elle ne nomme pas de puzzle (`#/fr`, et la racine du
site, complétée en `#/<langue détectée>`). L'accueil (`useRoute.home`)
remplace la scène 3D par une galerie (`HomeGallery` : 7 modèles variés, un
clic ouvre le puzzle, puis la saisie, le guide et la résolution présentés en
trois cartes) ; le panneau de gauche n'y garde que le choix du cube, sur
« Choisissez un modèle », et celui de droite le bloc de résolution grisé
avec une invitation (`SolvePanel home`, sans calcul de solution). Le titre
« Rubik Solver » ramène à l'accueil. Le nom
d'un puzzle (`SHAPE_SLUG`, plus `-mirror`) est le même dans les deux langues,
pour qu'un lien marche chez tout le monde. Le sélecteur de cube et la bascule
de langue ne touchent pas les stores : ils vont à une adresse (`goTo`, une
entrée d'historique), et les stores la suivent (`followRoute`, lancé avant
le premier rendu puis à chaque `popstate` / `hashchange`), donc les boutons
précédent / suivant du navigateur changent de puzzle. Une langue absente ou
inconnue est complétée par celle de l'app, un puzzle inconnu mène à
l'accueil (`replaceState`, sans entrée d'historique) ; on ne change ni de
puzzle ni de page pendant une animation ou une saisie (l'adresse est
remise). La notation et la vitesse restent hors de
l'adresse.

Tout mouvement affiché passe par `formatMove` (notation US ou FR) ;
tout texte passe par `t`. Le recentrage caméra transite par `viewStore`
(`resetToken`) lu par `CameraReset` dans le `<Canvas>`.

---

## Contraintes techniques

- **100% front-end** : aucun appel réseau, pas de backend.
- **Pas de SSR** : Vite SPA uniquement.
- **Alias `@/`** vers `src/`. Toujours l'utiliser pour les imports internes.
- **`src/lib/` est pur** : aucun import React ni three.js. Le rendu et le store
  dépendent de `lib`, jamais l'inverse.
- **État entier, sans flottants** : les normales restent unitaires et les
  positions sur la grille entière du mécanisme (bornée par son `SHAPE_DIMS` :
  `{-3,-1,1,3}` sur le 4x4, jusqu'à ±4 sur le Professor et le Rex). Ne
  pas introduire de trigonométrie dans la logique du cube ; l'angle visuel est
  calculé par `turnRotation` uniquement pour l'animation.
- **Tailwind v4** : `@import 'tailwindcss'`, pas de `tailwind.config.js`.
- **TypeScript strict** : `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedIndexedAccess`. Ne pas les désactiver.
- **i18n** : parité FR/EN garantie par le type `Translations` ; tout texte
  affiché passe par `t`.

---

## Règles de développement

- **Code en anglais** (identifiants, commentaires) ; seules les valeurs de
  traduction sont localisées.
- **Factoriser, pas dupliquer** ; un composant par fichier ; viser < ~300
  lignes par fichier.
- **Pas de code mort** : tout export est utilisé ou testé (`make knip`).
- **Logique pure entièrement testée** (cube, moves, solver, editor, validate,
  easing, speed, progress).
- **Éléments factorisables isolés** : chaque brique réutilisable est un
  composant, un hook ou une fonction dans son propre fichier, testé quand la
  logique le justifie (voir `components/ui/`, `three/`, `lib/`).
- **Accessibilité** : cliquables = boutons étiquetés (infobulle `title` +
  `aria-label` sur les boutons icônes et de rotation), focus visible, icônes
  décoratives en `aria-hidden`, `lang` du document = langue courante.
- **Commits** : pas de trailer `Co-Authored-By`.
- **Typographie** : ne jamais introduire de tiret long (`—` / `–`).

Les limites connues et leurs pistes sont notées dans `AMELIORATIONS.md`.

Avant de considérer une tâche terminée : `make check` doit passer (build +
lint + formatage + typecheck, tests compris + knip + tests unitaires).

---

## Commandes (Makefile)

| Commande                                     | Effet                                                       |
| -------------------------------------------- | ----------------------------------------------------------- |
| `make install`                               | Installe les dépendances                                    |
| `make start`                                 | Serveur de dev (http://localhost:6661)                      |
| `make build` / `make preview`                | Build de production / le servir en local                    |
| `make lint` / `make typecheck` / `make knip` | Vérifications (le typecheck couvre `src` et `tests`)        |
| `make format` / `make format-check`          | Prettier sur tout le dépôt (écrire / vérifier)              |
| `make test` (= `make test-unit`)             | Tests unitaires + composants                                |
| `make test-watch` / `make test-coverage`     | Tests en continu / avec couverture                          |
| `make test-e2e` / `make test-e2e-ui`         | Tests Playwright (installe Chromium au 1er run) / avec l'UI |
| `make fix`                                   | Format + lint                                               |
| `make check`                                 | build + lint + format-check + typecheck + knip + tests      |
| `make clean`                                 | Supprime `dist` et `node_modules`                           |

- **Port de dev** : 6661.
