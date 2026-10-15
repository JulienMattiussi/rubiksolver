# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif et pédagogique**, sur des dizaines de
puzzles rangés en catégories, celles du sélecteur et des dossiers du code :
standard, miroirs (une variante de rendu des standards, sans dossier à elle),
tower, flat, pyramid, polyhedron, round, gear, diagonal, holey, twisted,
bandaged (les soudés). La
liste fait foi dans les catalogues (`lib/puzzles/<catégorie>/catalog.ts`).

On manipule le puzzle, on le mélange ou on saisit sa propre configuration,
puis on le résout selon **plusieurs vraies méthodes**, découpées en **étapes
nommées** jouées dans les deux sens. Le but est pédagogique, pas l'optimalité
(sauf la méthode **Optimale** des petits puzzles).

Application **100% front-end**, sans backend. Interface **en français par
défaut** (bascule anglais), langue détectée depuis le navigateur ; notation
des mouvements **internationale (U D L R F B) par défaut, ou française
(H B G D F Ar)** : préfixe `2` pour une tranche interne (`2R`), suffixe `w`
pour un coup large (`Rw`), `M`, `E`, `S` pour les tranches du milieu du 3x3.
Les puzzles qui ne tournent pas comme un cube ont leur propre notation, le
plus souvent celle de fan2cube (voir leur fiche dans `docs/puzzles/`).

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

> `three` est **épinglé à `0.176.0`** : les versions plus récentes déprécient
> `THREE.Clock` (utilisé en interne par React Three Fiber), ce qui émettrait un
> avertissement en dev tant que R3F n'a pas migré vers `THREE.Timer`.

---

## Architecture

> Principe : **le moteur du cube est de la logique pure, sans flottants**. Le
> cube est modélisé par des cubies à coordonnées entières (`{-1,0,1}` par axe
> sur le 3x3 ; de deux en deux sur un nombre pair de couches, `{-3,-1,1,3}`
> sur le 4x4, pour rester entier). **Rien n'y suppose un cube** : une forme
> n'est qu'un triplet de nombres de couches (`SHAPE_DIMS`). Un `Move` désigne une face + éventuellement
> `depth: 2` (tranche interne ; `3` : la troisième couche, tranche du milieu d'un 5x5 ou `3R` du 6x6) et `wide` (couches 1 à `depth`) ; `moveSlab` en déduit
> la tranche tournée (l'intervalle entre deux plans de coupe), source unique
> partagée par `applyMove`, l'animation et l'aperçu (`turnedBy`). Les coups
> agissent sur le **mécanisme** (`turnDims`) : le puzzle lui-même, sauf un
> puzzle qui se déforme, qui tourne comme un cube complet dont il manque des
> pièces (la tour 2x2x4 et le Camouflage comme un 4x4x4 ; la tour 2x3x4 a le
> sien, `PuzzleModel.mechanism`). Une rotation est une
> rotation entière exacte à 90 degrés, donc l'état logique ne dérive jamais. Le
> rendu 3D est une **fonction pure de cet état** (chaque forme n'est qu'une
> mise à l'échelle, voir `three/core/layout.ts` ; la variante miroir n'est qu'une
> table d'épaisseurs, voir `lib/core/shape.ts`) ; les solveurs lisent le même modèle.

**Une forme, trois nombres** : tout se déduit de `SHAPE_DIMS`, sans cas
particulier. La grille est une liste de coordonnées par axe (`layerCoords`),
centrée. Un quart de tour autour d'un axe échange les deux autres, donc il
n'existe que si leurs dimensions sont égales (`quarterTurnFits`), sinon seul
le demi-tour reste ; un axe à une seule couche n'a aucun coup (le tourner,
c'est tourner le puzzle entier). Les orientations du puzzle entier
(`cubeOrientations`, qui dérivent les tables de saisie) suivent le même
critère. Une face porte le produit des deux dimensions qu'elle couvre en
stickers. Au rendu, chaque cubie occupe une cellule d'une unité et l'échelle
ramène le plus grand côté à 3.

**Reconnaître un puzzle** : `cubeShape` le lit à son nombre de pièces, puis à
son nombre de stickers quand deux puzzles en ont autant ; deux puzzles
indiscernables ainsi font échouer le chargement du module (`core/cube.ts`).

**Les coups** : un coup est un `Turn`, l'union de `Move` (les cubes) et des
coups des puzzles qui ne tournent pas comme un cube (`StarMove`, `PyraMove`,
`GhostMove`, `PuckMove`, `RainbowMove`, `GearMove`, `MegaMove`) ; le code
générique (file d'animation, rendu, notation) prend un `Turn`, et `turn.ts`
et `moves.ts` aiguillent selon sa sorte. L'animation tourne autour d'un axe
quelconque (`turnRotation` renvoie un vecteur) ; les solveurs des cubes
gardent `Move`.

```
src/
├── lib/                 # Logique pure, zéro React / zéro three.js (entièrement testée)
│   ├── core/            # Le moteur : types (CubeShape, Move, Turn...), geometry (normales, rotations entières),
│   │                    #   cube (construction, reconnaissance, résolu, boîte, orientations), pieces, turn (coups,
│   │                    #   coups permis, animation), moves (notation, coups d'une forme, mélange), moveSet, shape (miroir)
│   ├── puzzles/         # Les puzzles, un dossier par catégorie (voir « La fiche d'un puzzle ») :
│   │   ├── catalog.ts   #   tous les puzzles, dans l'ordre du sélecteur (catalog.ts de chaque catégorie)
│   │   ├── entry.ts     #   PuzzleEntry : nom, adresse, dimensions, mélange, couches, miroir, couleurs, pad, consigne
│   │   ├── models.ts    #   tous les modèles (models.ts de chaque catégorie)
│   │   ├── model.ts     #   PuzzleModel : construction, mécanisme, coups permis, boîte, résolu, symétries,
│   │   │                #     coups et mélange (sans grille), saisie
│   │   ├── <catégorie>/ #   standard, tower, flat, pyramid, polyhedron, round, gear, diagonal, holey, twisted,
│   │   │                #     bandaged (blocks.ts : les blocs de chaque soudé ; bonds.ts : leur modèle commun) :
│   │   │                #     catalog.ts, models.ts et le module de chaque puzzle qui en a un (star.ts, gear.ts...)
│   │   └── shared/      #   ce qui sert à plusieurs catégories (rainbow : le modèle des sommets qui tournent ;
│   │                    #     thinEdges : les arêtes sans sens visible)
│   ├── methods/         # Les méthodes, un dossier par catégorie, un fichier par méthode ou famille
│   │   ├── standard/    #   3x3 (algs, layers3, roux, petrus, zz, recenter, pieces3), 2x2 (cube2), super cubes,
│   │   │                #     solver4/ solver5/ solver6/ (réductions des 4x4, 5x5 et 6x6)
│   │   ├── <catégorie>/ #   les autres (towerLayers et towerReduce : briques des tours, pyraKit...)
│   │   └── shared/      #   ce qui sert à plusieurs catégories (rainbowKit)
│   ├── solve/           # Briques des solveurs : solver (registre des méthodes, solve), solverKit (MethodPlan,
│   │                    #   buildSteps), pieceSearch, cycleLibrary / cycleTable (3-cycles), centerCycles,
│   │                    #   wingPairing, exhaustive (optimal par recherche exhaustive), progress
│   ├── editor/          # La saisie : editor, editorTables, pieceEditor, forms (formes d'un déformable),
│   │                    #   validate, gearEditor, roadblockEditor
│   └── app/             # Le reste de l'app : route (adresse), snapshot (mémorisé), moveGuide, speed, easing
├── three/               # Rendu 3D (React Three Fiber)
│   ├── core/            # Scene, CubeView / Cubie / Sticker (puzzles à grille), PolyView / PolyModel / PolyPiece
│   │                    #   (puzzles en polygones), EditView / PolyEditView (saisie), polyDrawing (registre des
│   │                    #   dessins), polyhedron, cutSolid, layout, isometric (vignettes), useTurnAnimation...
│   ├── guide/           # Le guide des mouvements : GuideCanvas, GuideTile, guideCamera
│   └── puzzles/         # Les dessins, un dossier par catégorie : drawings.ts et la géométrie de chaque puzzle
│                        #   (gear/ : pas de drawings.ts, les pièces du Gear Cube sont des composants que dessine
│                        #   Cubie) ; shared/ : dinoGeometry (Dino Cube, Edge Only)
├── components/          # UI : ui/ (primitives), controls/ (panneau, pads de coups, padFor), picker/, guide/, edit/,
│                        #   solve/, home/, celebration/
├── store/               # Zustand : cubeStore (cube, file de coups, solution), editorStore, savedStore,
│                        #   viewStore, router
├── hooks/               # useAutoPlan (solution dans le worker), useIsDesktop, useSolveShortcuts
├── i18n/                # fr/ et en/ (ui, methods, steps ; EN typé sur FR), translations (les assemble),
│                        #   moveSentences, i18nStore
├── workers/             # solveWorker : la solution hors du fil de l'interface
└── assets/gear/         # Masques des pièces du Gear Cube (scripts/gear_face.py)
tests/
├── unit/                # Vitest : conformance de tous les puzzles (puzzles.test.ts), puis rangés comme le code :
│                        #   core/, solve/, editor/, app/, three/, store/, puzzles/<catégorie>/ (un fichier par
│                        #   puzzle, modèle, méthode et dessin ensemble)
├── component/           # Vitest + Testing Library
└── e2e/                 # Playwright
docs/
├── puzzles/<catégorie>.md # Le détail de chaque puzzle : modèle, rendu, méthode, saisie
├── methods.md           # Chaque méthode, ses puzzles et ses étapes
└── interface.md         # Le détail de l'interface
```

### La fiche d'un puzzle

Tout ce qui est propre à un puzzle est rangé dans le dossier de sa catégorie,
dans quatre endroits seulement (ce qui sert à plusieurs catégories sans
appartenir à aucune va dans `shared/` ; un puzzle dérivé d'un autre, comme le
Holey Megaminx du Megaminx, reprend simplement celui de son parent) :

- **sa carte** (`lib/puzzles/<catégorie>/catalog.ts`, type `PuzzleEntry`) :
  nom, adresse, dimensions, longueur de mélange, couches intérieures, coups
  avancés, déformation, miroir, couleurs, pavé de coups (`pad`) et consigne
  de saisie (`editHint`), que l'interface traduit (`padFor`, `EditPanel`).
  `inner` déclare les couches intérieures que tourne son mécanisme (tranches
  et/ou coups larges, sur tout axe d'au moins 3 couches) ; le pad grise les
  faces sans cette sorte de couche. Sa clé est l'identifiant de forme
  (`CubeShape` est l'ensemble des clés du catalogue) ; les tables de
  `core/types.ts` (`SHAPE_DIMS`, `SHAPE_LABEL`...) en sont dérivées ;
- **son modèle** (`lib/puzzles/<catégorie>/models.ts`, type `PuzzleModel`),
  s'il s'écarte d'un cuboïde sur sa grille : construction, mécanisme, coups
  permis, boîte, test de résolution, symétries, coups et mélange d'un puzzle
  sans grille, saisie. Le cœur (`cube.ts`, `turn.ts`, `moves.ts`,
  `moveSet.ts`, `editor.ts`) demande d'abord au modèle et fait sinon ce que
  fait un cuboïde. Un crochet appelle ce que définit le cœur au moment où il
  est appelé, jamais au chargement (import circulaire) ;
- **son dessin** (`three/puzzles/<catégorie>/drawings.ts`), s'il est dessiné
  en polygones plutôt qu'en cubies ;
- **ses méthodes** (`lib/methods/<catégorie>/`), déclarées dans le registre
  `lib/solve/solver.ts`.

**Ajouter un puzzle** : une ligne au catalogue de sa catégorie ; son module
et son modèle s'il en a besoin ; son dessin s'il n'est pas fait de cubies ;
sa méthode et sa ligne au registre ; le nom de la méthode et de ses étapes
dans les deux langues (`i18n/fr/` et `i18n/en/`, `methods.ts` et
`steps.ts`) ; une ligne à la suite de conformance et ses tests dans
`tests/unit/puzzles/<catégorie>/` ; sa fiche dans
`docs/puzzles/<catégorie>.md`. Restent hors de la fiche les distinctions par
sorte de coup (étoile, Pyraminx, Rainbow...) dans le cœur, qui ne sont pas
propres à un puzzle, les pads dédiés (`StarPad`, `PyraPad`... dans
`components/controls/`, choisis par le `pad` de la carte) et quelques détails
de saisie (`PolyEditView`, `lib/editor/gearEditor.ts`,
`lib/editor/roadblockEditor.ts`).

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

### Les solveurs par méthode (`src/lib/solve/solver.ts`)

Chaque méthode est définie par son **cheminement propre** (sa suite
d'objectifs) et renvoie ses
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
et le store ne voient que ça). Chaque méthode, ses puzzles et ses étapes :
[docs/methods.md](docs/methods.md) ; le 2x2, le 3x3 et la réduction du 4x4 :
[docs/puzzles/standard.md](docs/puzzles/standard.md).

Les briques de résolution sont partagées et **correctes par construction** :

- **algorithmes** (`solverKit.ts`) : recherche « aligner U puis appliquer un
  algorithme » (gâchettes `R U R'`, Sune, A-perm/U-perm...) dont l'objectif
  inclut « ne pas régresser » ; les algorithmes viennent tous du catalogue
  `methods/standard/algs.ts`, et chacun a son effet vérifié par un test ;
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
  pourraient déranger ;
- **formules de la page** : les méthodes des puzzles autres que les cubes
  reprennent les formules de leur page fan2cube, chacune vue de chaque côté
  (chaque tenue du puzzle) et préparée par un coup défait ensuite
  (conjugaison), jusqu'à couvrir les cas ; c'est ce que font `cycleTable` /
  `placeByCycles` (`lib/solve/cycleTable.ts`) pour les 3-cycles d'une sorte de
  pièce, et `cycleLibrary` pour les commutateurs des grands cubes. L'effet de
  chaque formule est vérifié dans le fichier de test du puzzle
  (`tests/unit/puzzles/<catégorie>/`) ; les fiches ne signalent que les
  exceptions.

**Ajouter une méthode à un puzzle** : (1) écrire son plan dans
`src/lib/methods/<catégorie>/<méthode>.ts` (étapes avec objectif, jeu de coups et phases ;
réutiliser `buildBlock`, `solvePieces`, `solveWithAlgs`, les prédicats
existants, et ajouter les algorithmes au catalogue) ; (2) l'ajouter au registre
de `solver.ts` sous les formes qu'elle couvre ; (3) nommer la méthode et ses
étapes dans les deux langues. La suite de conformance résout alors des
mélanges avec elle, sans rien toucher d'autre ; y ajouter un test qui fige ses jeux de
coups (voir `tests/unit/solve/methods.test.ts`). Une méthode 3x3 n'utilisant que des
coups externes peut aussi servir de phase 3x3 au 4x4 (`reductionPlan`, qui
refuse les tranches : `M` sur un 3x3 n'est pas un coup du 4x4 réduit).

### La saisie d'un cube (`src/lib/editor/editor.ts`, `validate.ts`)

On peint les stickers sur le rendu 3D (en épaisseurs sur un cube miroir, même
code : « Le cube miroir » dans
[docs/puzzles/standard.md](docs/puzzles/standard.md)). Deux garde-fous :

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
  coins renormalisés comme un 2x2 (`solveOptimal2`), rapide et borné. Quand
  la résolution échoue sur une étape, le message dit laquelle (`StepFailure`
  de `buildSteps`, lu par `validateCube`).

**Puzzles déformables (tours 2x2x4 et 2x3x4, Purple, Pyramorphinx, AI Cube ;
le Camouflage, aux formes trop nombreuses, dans sa boîte seulement)** : on saisit le puzzle dans la forme où il
se trouve physiquement. La saisie commence par **choisir sa forme**
(`FormPicker`) parmi celles qu'il peut prendre (`lib/editor/forms.ts`) : un
parcours en largeur sur l'état sans ses couleurs (où sont les pièces, quelles
faces portent un sticker), puis les formes qui ne
diffèrent que par la façon de tenir le puzzle (rotation entière, miroirs à
part) sont fusionnées, proposées en vignettes (voir
[docs/interface.md](docs/interface.md)). La forme suffit à dire où sont les stickers. Les
fonctions de saisie prennent cette forme (`form`, un état de cette forme) ;
ses emplacements sont les siens, et un emplacement accepte toute pièce de
son type tournée pour présenter ses stickers sur ses faces (aucune
orientation du puzzle entier ne l'y met, la boîte étant rompue), pourvu
que la parité de ses coordonnées soit celle de l'emplacement (aucun coup ne
la change : un gros cube du Purple ne va jamais où va un mini-cube) : la
validation dit ensuite si l'état est atteignable. Il en va de même dans sa
boîte : un puzzle déformable peut y revenir avec des pièces tournées sur
elles-mêmes (le coin de A du Purple), que les seules rotations du puzzle
entier n'y mettraient pas. « Modifier »
saisit un puzzle déformé dans sa forme, sans passer par le choix. Un futur
puzzle déformable n'a rien à ajouter : `formsOf` se déduit de ses coups.

Les tables de saisie (emplacements + placements étiquetés + budgets) sont
**dérivées par forme** du puzzle résolu correspondant et mémoïsées
(`tablesFor`, dans `src/lib/editor/editorTables.ts`) ; toutes les fonctions de saisie
prennent la forme avec l'état. Une saisie est complète quand chaque emplacement
est peint (`isComplete`), ceux de sa forme pour un puzzle déformable. Une
pièce qu'aucun coup ne déplace ni ne retourne reste pré-remplie
(`Slot.paintable`), comme les centres du 3x3 ; des pièces qui ne bougent
qu'ensemble aussi (`fixedPieces`, les centres du Gear Cube).
Les comptes de couleurs se déduisent du puzzle résolu (`stickersOfColor`,
`shapeColors`), pas des faces d'un cube : la saisie marche sur toutes les
formes, étoiles comprises (voir « Le Star Prism » dans
[docs/puzzles/round.md](docs/puzzles/round.md)).

**Saisie par les soudures** (`lib/editor/jointsEditor.ts`), pour un soudé
dont les blocs bougent : on clique d'abord ses joints (validés contre ses
formes), puis on peint ses couleurs, les pièces dessinées soudées ; voir
[docs/puzzles/bandaged.md](docs/puzzles/bandaged.md).

**Saisie pièce par pièce** (`entry.byPieces` dans le modèle,
`lib/editor/pieceEditor.ts`), pour un puzzle aux formes trop nombreuses pour
des vignettes : un clic sur un emplacement y pose la pose suivante qui s'y
loge (autre pièce, ou la même retournée), en sautant les pièces déjà posées
ailleurs ; un emplacement vide montre sa pièce d'origine en gris. Les poses
se trouvent en tournant chaque pièce seule depuis chez elle. La saisie reste
la table de stickers habituelle, donc `isComplete`, `buildCube`, « Depuis
l'état actuel » et la validation marchent tels quels.

### Interface

Panneau d'overlay en deux blocs (initialisation et choix du puzzle à gauche,
langue et résolution à droite ; une seule carte sur mobile et en saisie),
sélecteur de puzzle en modale par catégories puis puzzles (vignettes SVG
dessinées par le code, `three/core/isometric.ts`), pad de coups construit
depuis les coups de la forme, guide des mouvements, solution jouée dans les
deux sens et au clavier, feu d'artifice quand un coup résout, adresse
`#/<langue>/<puzzle>` (l'accueil sinon). Le détail : [docs/interface.md](docs/interface.md).

---

## Contraintes techniques

- **100% front-end** : aucun appel réseau, pas de backend.
- **Pas de SSR** : Vite SPA uniquement.
- **Alias `@/`** vers `src/`. Toujours l'utiliser pour importer d'un autre
  dossier de premier niveau de `src/` ; `src/lib/` importe en relatif, comme
  `three/` et `i18n/` entre leurs propres sous-dossiers.
- **`src/lib/` est pur** : aucun import React ni three.js. Le rendu et le store
  dépendent de `lib`, jamais l'inverse.
- **État entier, sans flottants** : les normales restent unitaires et les
  positions sur la grille entière du mécanisme (bornée par son `SHAPE_DIMS` :
  `{-3,-1,1,3}` sur le 4x4, ±4 sur le Professor Pyraminx et le Rex, ±6 sur
  le Hockey Puck). Ne
  pas introduire de trigonométrie dans la logique du cube ; l'angle visuel est
  calculé par `turnRotation` uniquement pour l'animation.
- **Tailwind v4** : `@import 'tailwindcss'`, pas de `tailwind.config.js`.
- **TypeScript strict** : `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedIndexedAccess`. Ne pas les désactiver.
- **i18n** : parité FR/EN garantie par le type `Translations` ; tout texte
  affiché passe par `t`, tout mouvement affiché par `formatMove` (notation US
  ou FR).

---

## Règles de développement

- **Code en anglais** (identifiants, commentaires) ; seules les valeurs de
  traduction sont localisées.
- **Factoriser, pas dupliquer** ; un composant par fichier ; viser < ~300
  lignes par fichier.
- **Pas de code mort** : tout export est utilisé ou testé (`make knip`).
- **Logique pure entièrement testée** (`src/lib/`).
- **Éléments factorisables isolés** : chaque brique réutilisable est un
  composant, un hook ou une fonction dans son propre fichier, testé quand la
  logique le justifie (voir `components/ui/`, `three/`, `lib/`).
- **Accessibilité** : cliquables = boutons étiquetés (infobulle `title` +
  `aria-label` sur les boutons icônes et de rotation), focus visible, icônes
  décoratives en `aria-hidden`, `lang` du document = langue courante.
- **Commits** : pas de trailer `Co-Authored-By`.
- **Typographie** : ne jamais introduire de tiret long (`—` / `–`).

Les limites connues et leurs pistes sont notées dans `AMELIORATIONS.md`.

Avant de considérer une tâche terminée : `make check` doit passer.

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
