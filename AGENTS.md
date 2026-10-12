# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif et pédagogique**, en **2x2 (Pocket), 3x3,
4x4 ou 5x5**, **classique ou miroir** (sauf le 5x5), plus cinq cuboïdes : le **1x2x3**, la
**tour 2x2x4** (qui se déforme), la **Slim Tower 2x2x3**, le **Domino 3x3x2**
et le **Floppy 3x3x1**, le **Floppy Ghost** (un Floppy Megaminx découpé en
pentagramme dans un carré, qui se déforme), et des puzzles non cubiques : le **Pyraminx**, le
**Master Pyraminx** (4x4), le **Professor Pyraminx** (5x5), le **Pyraminx Jing** (pièces courbes), le
**Pyramorphinx** (un 2x2 taillé en tétraèdre, qui se déforme), le
**4-Trajber's Octahedron** (un 4x4x4 taillé en octaèdre), le **Rainbow**
(un cuboctaèdre dont les triangles tournent), le **Violet** (un 2x2x2 à
pivot excentré, qui se déforme, encore sans méthode) et les
**Star Prism** à 2 et 4 étages (une étoile à six branches de la famille du
Square-1) (choix par vignettes).
On manipule le cube (rotations de faces à la souris/aux boutons, tranches et
coups larges là où la forme en a, orbite caméra, aperçu des pièces qui vont
tourner au survol d'un bouton ; sur 3x3, un onglet « Avancé » pour `M`, `E`,
`S` et les coups larges), on consulte un **guide des mouvements** (chaque coup
animé sur l'état actuel, avec sa notation et une phrase), on le mélange **ou
on saisit sa propre configuration** en peignant les stickers directement en
3D (sur tous les puzzles, Pyraminx et étoiles compris ; un puzzle déformable
dans la forme où il se trouve, le Floppy Ghost pièce par pièce), on peut **mémoriser un état**
pour y revenir, puis on le résout selon **plusieurs vraies méthodes** (par
couches, CFOP, Roux, Petrus, ZZ, réduction du 4x4, méthodes de la tour, du
Domino, du Pyraminx et des étoiles...). La solution, affichée dès que le cube
est au repos, est découpée en **étapes nommées** qu'on joue d'un coup,
**étape par étape** ou **coup par coup**, dans les deux sens, pour apprendre
la méthode. Le but est
pédagogique, pas l'optimalité du nombre de coups (à l'exception de la méthode
**Optimale** du 2x2, du 1x2x3, du Floppy et du Floppy Ghost, qui exploite leurs espaces
d'états réduits).

Application **100% front-end**, sans backend. Interface **français par défaut**
(bascule anglais), langue détectée depuis le navigateur ; **notation des
mouvements internationale (U D L R F B) par défaut, ou française
(H B G D F Ar)**, avec la même convention dans les deux pour les autres
coups : préfixe `2` pour la tranche interne du 4x4 (`2R` / `2D`), suffixe `w`
pour le coup large (`Rw` / `Dw`), et `M`, `E`, `S` pour les tranches du
milieu du 3x3. Exceptions : le Pyraminx, où chaque notation garde son
propre usage (voir « Le Pyraminx »), et le Floppy Ghost (lettres de
fan2cube, voir « Le Floppy Ghost »).

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
> `depth: 2` (tranche interne ; `3` : la tranche du milieu d'un 5x5) et `wide` (couches 1+2) ; `moveSlab` en déduit
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
│   ├── types.ts          # Types du domaine (CubeShape + SHAPE_DIMS/SHAPE_SHIFTS/SHAPE_INNER_TURNS, Dims, CubeVariant, Face, Color, Axis, Vec3, Sticker, Cubie, Cube, Move avec depth/wide)
│   │                     #   + CUBE_KINDS : les choix exposés (forme x variante), leur id, libellé et catégorie
│   ├── geometry.ts       # Géométrie entière : normales des faces, normalIndex, grilles par axe (layerCoords), rotations exactes
│   ├── cube.ts           # Le puzzle : solvedCube, schéma de couleurs par forme (faceColorsOf), cubeShape (pièces + stickers),
│   │                     #   cubeDims/turnDims, isSolved/isBoxed, stateKey, cubeOrientations, comptages de stickers et de couleurs
│   ├── pieces.ts         # Requêtes de pièces : colorAt, colorsOf, cubieAt, atHome/homeAt/homesOf, listedAs (pièces listées dans le même ordre)
│   ├── morph.ts          # Pyramorphinx : un 2x2 taillé en tétraèdre (coins à 3 stickers, milieux de face à 1)
│   ├── oct4.ts           # 4-Trajber's Octahedron : un 4x4x4 sans cubies internes, un sticker par pièce (face de son octant)
│   ├── violet.ts         # Violet : 2x2x2 dont un coin est coupé en 8, cœur excentré ; blocages, boîte, résolu, symétrie
│   ├── violetStates.ts   # Ses états vus (gros cubes pareils) : atteignables (validation), mélange sans retour
│   ├── rainbow.ts        # Rainbow : cuboctaèdre, 12 pièces aux milieux des arêtes du cube, triangles en tiers de tour, notation
│   ├── cycleLibrary.ts   # 3-cycles purs des grands cubes (commutateurs [A, X Y X'] conjugués), findCycle, placeAll, borrow
│   ├── ghost.ts          # Floppy Ghost : 10 emplacements autour du centre, demi-tours = réflexions entières, notation fan2cube
│   ├── pyraminx.ts       # Pyraminx, Master et Jing : modèle tétraédrique entier (couches, pointes, tranches, moitiés), mélange
│   ├── pyraNotation.ts   # Leur notation hybride (FR fan2cube / US WCA), lecture des formules de fan2cube
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
│   │   ├── pyraminx.ts   #   Pyraminx : centres d'abord (formules de fan2cube.fr)
│   │   ├── pyraminx4.ts  #   Master Pyraminx : ailes puis co-ailes (3-cycles d'ailes, formules de fan2cube.fr)
│   │   ├── pyraminx5.ts  #   Professor Pyraminx : ailes, co-ailes, arêtes, co-centres, centres (fan2cube.fr)
│   │   ├── oct4.ts       #   4-Trajber's Octahedron : parité, sommets, arêtes, centres (3-cycles, fan2cube.fr)
│   │   ├── rainbow.ts    #   Rainbow : triangle du haut, puis les autres par 3-cycles ([H' G'], [H D], fan2cube.fr)
│   │   ├── pyraCycles.ts #   3-cycles d'une sorte de pièce par conjugaison (cycleTable), chiralité (handedHome), placement
│   │   ├── jing.ts       #   Pyraminx Jing : sommets d'abord (crochet [DH] de fan2cube.fr)
│   │   ├── morph.ts      #   Pyramorphinx : comme un Pocket (lu comme un 2x2, solveur optimal du 2x2)
│   │   ├── starPrism.ts  #   Star Prism : isoler puis permuter (formule K de fan2cube.fr)
│   │   ├── starPrism4.ts #   4-Star : deux étoiles (le plan du 2-Star projeté sur l'interne puis l'externe)
│   │   ├── slimTower.ts  #   Slim Tower 2x2x3 : équateur puis coins (formules du Domino, fan2cube.fr)
│   │   ├── domino.ts     #   Domino 3x3x2 : coins puis arêtes (formules de fan2cube.fr, reprises élargies par la tour)
│   │   ├── floppy.ts     #   Floppy 3x3x1 : coins puis arêtes retournées deux par deux (fan2cube.fr)
│   │   └── ghost.ts      #   Floppy Ghost : sommets placés, orientés, puis arêtes (formules de fan2cube, des 5 côtés)
│   ├── solver4/          # Solveur 4x4 par réduction :
│   │   ├── centers.ts    #   centres par comptage (D, U, puis ceinture), recherches bornées sans régression
│   │   ├── edges.ts      #   appariement des ailes (échanges nets FR-bas <-> BR/FL-haut, goal-checkés), flip L2E
│   │   ├── project.ts    #   projection homomorphe du 4x4 réduit vers un 3x3 virtuel (via3x3)
│   │   ├── parity.ts     #   détecteurs (flip, signes de permutation, vrille) + algos de parité OLL/PLL
│   │   └── steps.ts      #   reductionPlan(plan 3x3) : préfixe centres/arêtes/parité + étapes 3x3 projetées (projectPlan, partagé)
│   ├── solver5/          # Solveur 5x5 par réduction :
│   │   ├── kinds.ts      #   sortes de pièces par position (coins, milieux et ailes d'arêtes, centres fixes, en croix, diagonaux)
│   │   ├── centers.ts    #   centres face par face : deux coups si possible, sinon un 3-cycle de centres
│   │   ├── edges.ts      #   ailes amenées sur leur milieu par 3-cycles d'ailes, parité d'arête (algo OLL du 4x4)
│   │   ├── project.ts    #   projection du 5x5 réduit vers un 3x3 (coins, milieux d'arêtes, centres fixes)
│   │   └── steps.ts      #   reduction5Plan(plan 3x3)
│   ├── editorTables.ts   # Tables de saisie par forme : slots, placements valides étiquetés par pièce physique, budgets,
│   │                     #   pièces fixes pré-remplies (centres du 3x3, demi-vis gauche des étoiles), stickers cachés (4-Star)
│   ├── editor.ts         # Saisie guidée : peinture contrainte par placements + budgets, auto-complétion, buildCube/cubeToEdit
│   ├── forms.ts          # Formes d'un puzzle déformable (tour) pour la saisie : formsOf, lookOf
│   ├── pieceEditor.ts    # Saisie pièce par pièce (Floppy Ghost) : poses par emplacement, nextPiece, piecesIn
│   ├── validate.ts       # validateCube : comptage par couleur (déduit du puzzle résolu) + solubilité (résolution bornée ; invariants de pièces + vrille sur 4x4)
│   ├── shape.ts          # Cube miroir : épaisseur de couche par couleur, boîte d'un cubie (cubieBox) déduite de ses stickers
│   ├── moveGuide.ts      # Guide des mouvements : lignes par forme (coup + opposé, puis quantifié), describeMove
│   ├── route.ts          # Adresse `#/<langue>/<puzzle>` (`#/<langue>` : l'accueil) : nom de chaque puzzle (SHAPE_SLUG + -mirror), routeHash, parseRoute
│   ├── snapshot.ts       # encodeCube/decodeCube : forme texte d'un état (mémorisation), décodage qui rejette un texte corrompu
│   ├── easing.ts         # easeInOut (partagé par les animations)
│   ├── speed.ts          # Curseur 0..100 <-> secondes par rotation
│   └── progress.ts       # solveProgress : avancement par étape d'une solution (pour l'UI)
├── hooks/
│   └── useIsDesktop.ts   # Breakpoint `sm` via matchMedia (bascule panneau unique / deux panneaux)
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
│   ├── EditView.tsx      # Mode saisie : stickers peignables cliquables, vides en gris ; en épaisseurs (dorés) sur un miroir
│   ├── Cubie.tsx         # Un cubie : corps + stickers, à la boîte de sa variante, en surbrillance si un coup survolé le tourne
│   ├── layout.ts         # Échelle et position visuelles (coordonnée / pas de la grille : linéaire, juste hors de la boîte)
│   ├── polygons.ts       # Pièces des puzzles sans grille en polygones (corps + stickers), PiecePolygon
│   ├── starGeometry.ts   # Géométrie des pièces de l'étoile (cerfs-volants extrudés), partagée vue 3D / vignette
│   ├── pyraGeometry.ts   # Géométrie des pièces du Pyraminx (petits tétraèdres et octaèdres des cellules du modèle)
│   ├── morphGeometry.ts  # Pièces du Pyramorphinx : case du 2x2 coupée par le tétraèdre (polyèdre convexe)
│   ├── octGeometry.ts    # Pièces du 4-Trajber : case du 4x4x4 coupée par l'octaèdre (polyhedron.ts, partagé avec le Pyramorphinx)
│   ├── violetGeometry.ts # Pièces du Violet : boîtes de deux tailles, violettes sur toutes leurs faces
│   ├── rainbowGeometry.ts # Pièces du Rainbow : cellule de chaque pièce dans le cuboctaèdre (polyhedron.ts)
│   ├── ghostGeometry.ts  # Pièces du Floppy Ghost : régions du carré coupé par le pentagramme, extrudées, posées par réflexions
│   ├── jingGeometry.ts   # Géométrie courbe du Jing : surface arrondie maillée fin, découpée le long des coupes
│   ├── polyDrawing.ts    # Dessin d'un puzzle sans grille : ses polygones, son lacet à l'écran, sa teinte unique (argent du Ghost)
│   ├── CubeModel.tsx     # Rendu d'un puzzle à grille depuis un état (couche qui tourne dans son groupe), partagé scène / guide
│   ├── PolyModel.tsx     # Idem pour les puzzles sans grille (étoiles, Pyraminx)
│   ├── PolyPiece.tsx     # Une de leurs pièces (corps + stickers), partagée vue / saisie / guide
│   ├── noPieces.ts       # NO_PIECES : l'ensemble vide de pièces (rien ne tourne, rien en surbrillance)
│   ├── PolyView.tsx      # Vue 3D d'un puzzle sans grille (PolyModel), animée comme les cubes
│   ├── PolyEditView.tsx  # Saisie d'un puzzle sans grille : stickers cliquables, gris tant que vides (pièces au clic sur le Ghost)
│   ├── GuideCanvas.tsx   # Guide des mouvements : un seul canvas WebGL sous la liste, chaque vignette y dessine sa scène
│   ├── GuideTile.tsx     #   une vignette : scène + caméra propres, scissor sur sa boîte DOM, coup joué en boucle
│   ├── guideCamera.ts    #   point de vue d'une vignette (la couche qui tourne face à la caméra)
│   ├── usePreviewed.ts   # Pièces que le coup survolé ferait tourner (surbrillance, cubes et étoile)
│   ├── isometric.ts      # Vignette d'un puzzle résolu en vue isométrique (polygones SVG), déduite du même layout
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
│   ├── controls/         # Panneau : Controls (orchestrateur), SetupSection, StatusBadge, MovePad / StarPad / PyraPad / GhostPad / RainbowPad (+ PadHeader,
│   │                     #   PadButton : un coup, sa surbrillance au survol), LanguageToggle, NotationToggle,
│   │                     #   RecenterButton, CollapseButton, SpeedSlider
│   ├── picker/           # Choix du cube : CubePicker (bouton + modale), PickerTile, PuzzleIcon (vignette SVG),
│   │                     #   CategoryIcon (plusieurs puzzles groupés : une catégorie se distingue d'un puzzle)
│   ├── guide/            # Guide des mouvements : MoveGuideButton (dans PadHeader), MoveGuideDialog
│   ├── celebration/      # Fireworks : petit feu d'artifice (canvas 2D monté le temps du spectacle) quand un coup résout
│   ├── home/             # Accueil : HomeGallery (galerie de 7 modèles + ce que fait l'app, à la place de la scène)
│   ├── solve/            # Résolution : SolvePanel, MethodSelect, StepList
│   └── edit/             # Saisie : EditPanel, FormPicker (forme d'un puzzle déformable), ColorPalette
├── App.tsx               # Coquille : scène 3D plein écran + panneau en overlay (empilé sur mobile en saisie)
└── main.tsx
tests/
├── helpers.ts            # RNG déterministe (seededRng), coin vrillé (twistedCorner)
├── unit/                 # Vitest : puzzles (conformance : une ligne par forme, voir plus bas), cube (coups, tour),
│                         #   moves, solver + solver4,
│                         #   methods (Roux/Petrus/ZZ : objectifs et jeux de coups), algs, tower, domino (effet de chaque
│                         #   formule), floppy, slimTower, pieceSearch, flat123 (espaces d'états entiers), editor, validate, shape, snapshot,
│                         #   star (modèle, formules fan2cube, méthodes des deux étoiles), starEditor (saisie des étoiles),
│                         #   pyraminx, pyraminx4, pyraminx5, jing (notation, formules fan2cube, états impossibles),
│                         #   moveGuide, isometric, layout, stores, easing, speed, progress
├── component/            # Vitest + Testing Library (Controls, SegmentedToggle)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution (3x3, 2x2, 1x2x3, 4x4), saisie
                          #   depuis un mélange puis résolution (liste ENTERED), miroir, guide sur chaque puzzle)
```

**Tests d'un puzzle** : ce que tout puzzle doit vérifier est écrit une fois,
dans la suite de conformance `tests/unit/puzzles.test.ts`, qui parcourt un
tableau d'une ligne par forme (pièces, stickers, orientations, stickers
saisis, longueur de mélange) : construit résolu et reconnu, chaque tour
défait par son inverse, orientations, mélange défait et snapshot, chaque
méthode résout un mélange (tenu aussi autrement, quand l'éditeur le permet),
étapes et méthodes nommées dans les deux langues, saisie aller-retour validée,
guide complet et décrit. Un nouveau puzzle y ajoute une ligne (et une ligne
dans la liste `ENTERED` de l'e2e) ; son propre fichier ne garde que ce qui
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

- **Par couches** (`beginner`, 3x3 et 2x2) : sur 3x3, 1re couche entière
  (croix + coins), puis arêtes du milieu, puis dernière couche (croix,
  orientation coins, permutation coins, permutation arêtes) - 7 étapes. Sur
  2x2 (pas d'arêtes ni de centres) : coins du bas, orientation du haut,
  permutation du haut - 3 étapes.
- **Fridrich / CFOP** (`cfop`, 3x3) : Croix, puis **F2L** (paires coin+arête
  par colonne), puis **OLL**, puis **PLL** - 4 étapes.
- **Réduction** (`reduction` et `reductionCfop`, 4x4 et 5x5) : Centres,
  Appariement des arêtes, Correction de parité (étape émise seulement si
  nécessaire), puis la phase 3x3 de la méthode choisie (par couches ou CFOP)
  - voir plus bas, et « Le 5x5 par réduction ».
- **Roux** (`roux`, 3x3) : premier bloc 1x2x3 à gauche (arête DL, paire
  avant, paire arrière), second bloc à droite en `<U, R, M, r>` seulement,
  CMLL en 2 temps (orienter avec Sune/Antisune, permuter), puis les six
  dernières arêtes en `<M, U>` : orientation, UL/UR, tranche M en `<M, U2>`
  - 6 étapes.
- **Petrus** (`petrus`, 3x3), les 7 étapes de Lars Petrus : bloc 2x2x2 (DBL),
  extension en 2x2x3 en `<U, R, F>` (ne touchent pas le 2x2x2), arêtes
  orientées (F et B n'apparaissent que dans `F' U F` / `B U B'`, qui
  préservent le bloc), fin du F2L en `<R, U>` seulement, puis coins placés
  (Niklas), coins tournés (Sune/Antisune), arêtes placées (Ua).
- **ZZ** (`zz`, 3x3) : EOLine (les 12 arêtes orientées, puis DF/DB en coups
  qui ne retournent rien : `U D L R F2 B2`), bloc gauche en `<L, U, R>`, bloc
  droit en `<R, U>` (aucun quart de tour de F ou B après l'EOLine), OCLL, PLL
  - 5 étapes.
- **Optimale** (`optimal`, 2x2, 1x2x3, Floppy et Floppy Ghost) : recherche exhaustive,
  solution la plus courte possible (11 coups max sur 2x2, 6 sur 1x2x3, 8 sur
  Floppy, 15 sur Floppy Ghost), une seule étape.
- **Deux Pockets** (`twoPockets`, tour 2x2x4) : remise en forme, Pocket intérieur,
  Pocket extérieur - voir « La tour 2x2x4 ».
- **Équateur puis coins** (`equatorFirst`, Slim Tower 2x2x3) : les arêtes de
  l'équateur, puis les coins du bas descendus deux par deux, puis ceux du haut
  - voir « Le Domino, le Floppy et la Slim Tower ».
- **Isoler puis permuter** (`isolateFirst`, Star Prism) : sommets isolés,
  puis le bas et le haut avec la formule `K` - voir « Le Star Prism ».
- **Deux étoiles** (`twoStars`, 4-Star Prism) : l'étoile interne puis
  l'externe, chacune par « isoler puis permuter », puis alignement.
- **Centres d'abord** (`centersFirst`, Pyraminx) : centres, pointes, arêtes
  du bas, arêtes du haut placées, puis retournées - voir « Le Pyraminx ».
- **Sommets d'abord** (`jingCornersFirst`, Pyraminx Jing) : sommets, arêtes
  placées, retournées, centres - voir « Le Pyraminx Jing ».
- **Comme un Pocket** (`asPocket`, Pyramorphinx) : une étape, la solution
  optimale du 2x2 qu'il est - voir « Le Pyramorphinx ».
- **Sommets d'abord** (`octCornersFirst`, 4-Trajber's Octahedron) : parité,
  sommets, arêtes, centres - voir « Le 4-Trajber's Octahedron ».
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
projection (`via3x3`) et leurs coups se rejouent tels quels : zéro duplication
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
  Impossible donc de créer une pièce, un doublon ou un compte de couleurs
  incohérent pendant la saisie.
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

**Puzzles déformables (la tour)** : on saisit le puzzle dans la forme où il
se trouve physiquement. La saisie commence par **choisir sa forme**
(`FormPicker`) parmi celles qu'il peut prendre (`lib/forms.ts`) : un
parcours en largeur sur l'état sans ses couleurs (où sont les pièces, quelles
faces portent un sticker ; 2 187 pour la tour), puis les formes qui ne
diffèrent que par la façon de tenir le puzzle (rotation entière, miroirs à
part) sont fusionnées : 102, en vignettes (`formDrawing`) groupées par
nombre de petits cubes isolés aux pointes (pièces qui n'en touchent qu'une
autre : ce qu'on remarque d'abord sur une tour déformée), puis par
éloignement de la boîte ; survoler une vignette montre la forme en 3D, et
la suite de coups la plus courte qui l'atteint depuis la boîte
(`Form.moves`, pour la vérifier sur le vrai puzzle). La forme suffit à dire où sont les stickers. Les
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
il reste pré-rempli (`Slot.paintable` : aucun coup ne le déplace ni ne le retourne), les 6 du 3x3 comme ceux du Domino et du Floppy, et la demi-vis gauche des étoiles.
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
(`solveExhaustively`, `methods/exhaustive.ts`, partagé avec le Floppy) rend
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
plus les six du Rainbow).

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
nouvelle machinerie) : le plan du 2-Star est **projeté** (comme `via3x3` sur
le 4x4) sur l'étoile interne (ses pièces ramenées à ±2, ses tours joués sur
`u`/`d`), qui remet aussi la vis, puis sur l'externe. Celle-ci part et finit
vis en place, donc slashe un nombre pair de fois sans tourner l'interne
entre deux slashs : l'étoile interne ne voit rien. Reste à aligner les deux
étoiles (`u` et `d` ensemble), chacune pouvant finir tournée d'un bloc.

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
Catégorie à part, « Octaèdres ».

**Rendu** (`three/octGeometry.ts`) : chaque pièce est sa case du 4x4x4
(ouverte vers l'extérieur sur les couches externes) coupée par l'octaèdre
`|x| + |y| + |z| <= 8`, un polyèdre convexe calculé depuis ses plans
(`polyhedron.ts`, partagé avec le Pyramorphinx) ; une forme ne dépend que de
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
duquel tout tourne. **Pas encore de méthode** : le panneau de résolution
est grisé avec un message (`noMethodYet`), et la suite de conformance saute
ce test (`methodless`).

**Saisie** : comme la tour, par sa forme (388, les rotations du puzzle
entier fusionnées), puis ses couleurs. Les gros cubes arrivent déjà
violets : `emptyEdit` remplit tout sticker que toutes les pièces qui
tiennent dans son emplacement montrent d'une seule couleur (dans la boîte,
les trois mini-cubes de A à un sticker aussi : ils n'y sont jamais
ailleurs). Une face sans sticker à saisir garde sa couleur dans la vue.
Sans méthode, la validation vérifie que l'état est parmi les 41 760
atteignables (`violetReachable`, calculés une fois, environ une seconde).

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
long des coupes sont les joints sombres, chaque sticker est doublé vers
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
  puzzle courant et sa catégorie sont mis en évidence). Catégories (`cubeCategory`), dans
  l'ordre : Standard 2x2 (Pocket)/3x3/4x4/5x5, Miroir 2x2/3x3/4x4, Tower 2x2x3
  (Slim)/2x2x4/3x3x2 (Domino), Plats 1x2x3/3x3x1 (Floppy)/Floppy Ghost (un puzzle d'une
  seule couche d'épaisseur étant plat), Pyramides Pyraminx/Master Pyraminx
  (4x4)/Professor Pyraminx (5x5)/Pyraminx Jing/Pyramorphinx, Octaèdres
  4-Trajber's Octahedron/Rainbow, Étoiles 2-Star Prism (UFO)/4-Star Prism, Bizarre Violet.
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
  la tour reste grisé) avec **recentrage caméra animé** et
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
  (`planKey`).

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
éclaircis) : `MovePad` écrit le coup dans `viewStore.preview`, `CubeView` lit
les pièces concernées avec `turnedBy` (la même fonction que l'animation), sauf
pendant une animation ou si le coup est bloqué.

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
  positions sur la grille entière du mécanisme (`{-3,-1,1,3}` au plus). Ne
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
