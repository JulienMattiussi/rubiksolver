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
pour un coup large (`Rw`), `M`, `E`, `S` pour les tranches du milieu du 3x3 ;
le 4x4 suit le guide officiel de Rubik's (`r` pour la tranche, `Rr` pour les
deux couches).
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
| OpenCV.js                  | Les stickers d'un cube miroir au scan (worker, préchargé)          |

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
> `depth: 2` (tranche interne ; `3` : la troisième couche, tranche du milieu d'un 5x5 ou `3R` du 6x6) et `wide` (couches 1 à `depth`), ou `whole` (le puzzle entier tenu autrement, `x y z`) ; `moveSlab` en déduit
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
`GhostMove`, `PuckMove`, `RainbowMove`, `GearMove`, `MegaMove`, `CopterMove`) ; le code
générique (file d'animation, rendu, notation) prend un `Turn` et demande
à la sorte du coup (`kindOf`, `core/moveKind.ts` : un `MoveKind` dit comment
écrire, inverser, fusionner, jouer et animer ses coups ; les sortes sont
rassemblées par les puzzles dans `puzzles/moveKinds.ts`, comme leurs
modèles), et fait sinon ce que fait un cube. L'animation tourne autour d'un axe
quelconque (`turnRotation` renvoie un vecteur) ; les solveurs des cubes
gardent `Move`.

```
src/
├── lib/                 # Logique pure, zéro React / zéro three.js (entièrement testée)
│   ├── core/            # Le moteur : types (Move, Turn, Cubie...), shapes (CubeShape et les tables lues sur les
│   │                    #   cartes : SHAPE_DIMS, variantes, choix du sélecteur), geometry (normales, rotations entières),
│   │                    #   stickerColors (la teinte de chaque couleur : le rendu, le scan),
│   │                    #   cube (construction, reconnaissance, résolu, boîte, orientations), pieces, turn (coups,
│   │                    #   coups permis, animation), moves (coups d'une forme, mélange), notation (écrire et lire
│   │                    #   un coup : US, FR), moveSet,
│   │                    #   moveKind (les sortes de coups, MoveKind), plane (polygones convexes du plan),
│   │                    #   shape (miroir), pieces (poseOf, sameAt,
│   │                    #   withStickers : prédicats de pièces), guide (sections du guide, MoveDescription), hold (les tenues d'un modèle, HoldFrame, déduites de ses faces : un coup lu depuis
│   │                    #   la face tenue devant)
│   ├── puzzles/         # Les puzzles, un dossier par catégorie (voir « La fiche d'un puzzle ») :
│   │   ├── catalog.ts   #   tous les puzzles, dans l'ordre du sélecteur (catalog.ts de chaque catégorie)
│   │   ├── entry.ts     #   PuzzleEntry : nom, adresse, dimensions, mélange, couches, miroir, couleurs, pad, consigne
│   │   ├── models.ts    #   tous les modèles (models.ts de chaque catégorie)
│   │   ├── moveKinds.ts #   toutes les sortes de coups (celles des familles de puzzles sans grille)
│   │   ├── guides.ts    #   les guides des mouvements de ces familles (le `guide` de leur modèle)
│   │   ├── model.ts     #   PuzzleModel : construction, mécanisme, coups permis, boîte, résolu, symétries,
│   │   │                #     coups et mélange (sans grille), saisie
│   │   ├── <catégorie>/ #   standard, tower, flat, pyramid, polyhedron, round, gear, diagonal, holey, twisted,
│   │   │                #     bandaged (blocks.ts : les blocs de chaque soudé ; bonds.ts : leur modèle commun) :
│   │   │                #     catalog.ts, models.ts et le module de chaque puzzle qui en a un (star.ts, gear.ts...)
│   │   └── shared/      #   ce qui sert à plusieurs catégories (rainbow : le modèle des sommets qui tournent
│   │                    #     et leur notation ; dinoRex et skewbs : les puzzles qui en dérivent ;
│   │                    #     thinEdges : les arêtes sans sens visible)
│   ├── methods/         # Les méthodes, un dossier par catégorie, un fichier par méthode ou famille
│   │   ├── standard/    #   3x3 (algs : le catalogue des formules des cubes, layers3, roux, petrus, zz, recenter, pieces3), 2x2 (cube2), super cubes,
│   │   │                #     solver4/ solver5/ solver6/ (réductions des 4x4, 5x5 et 6x6)
│   │   ├── <catégorie>/ #   les autres (towerLayers et towerReduce : briques des tours, pyraKit,
│   │   │                #     roadblockKit / Bars / Edges : les étapes du RoadBlock, megaminxFormulas...)
│   │   └── shared/      #   ce qui sert à plusieurs catégories (rainbowKit, skewbKit)
│   ├── solve/           # Briques des solveurs : solver (registre des méthodes, solve), solverKit (MethodPlan,
│   │                    #   buildSteps), pieceSearch, cycleLibrary / cycleTable (3-cycles), centerCycles,
│   │                    #   wingPairing, exhaustive (optimal par recherche exhaustive), progress, formulaSearch
│   │                    #   (la plus courte suite de formules vers un but, found ; searchChain : la même,
│   │                    #   formule par formule), everyWay (une formule vue
│   │                    #   de chaque côté), holdings (le puzzle tenu de chaque façon ; bestHolding : celle où il
│   │                    #   se lit, une méthode `asItStands` au registre), permutation (parité),
│   │                    #   once (mémoïsation paresseuse), rotations (les tours en main retirés : Uw' Dw
│   │                    #   sur la 2x2x4), placeTable (places, macros et Dijkstra :
│   │                    #   Megaminx, AI Cube ; stickerPlaces, les places de chaque sticker, et placeChain,
│   │                    #   la plus courte suite de macros : AI Cube, 3x3 croix puis coins)
│   ├── editor/          # La saisie : entry (ce que le modèle déclare : étapes, peinture), steps (leur
│   │                    #   enchaînement), edit (la table de stickers, buildCube), editorTables, validate,
│   │                    #   modes/ (un mode par fichier : form, canvas et faceViews, joints, toggles,
│   │                    #   colors, pieces), scan/ (la saisie à l'appareil photo, docs/scan.md : plan (les faces dans l'ordre,
│   │                    #   `PuzzleModel.scan`) et planFaces (chacune bâtie), layout (grille, anneau, carré, polygone), frame, color, sample, capture,
│   │                    #   anchors (les couleurs), orient (les faces tenues tournées), assign et classify (la lecture),
│   │                    #   read (le point d'entrée), box et forms (les tours), outlines (le Floppy Ghost), sized et
│   │                    #   sizedRead (le miroir))
│   ├── teach/           # Le moteur du tutoriel, sans rien d'un modèle : tutorial (TutorialStep et ses sortes,
│   │                    #   Tutorial), kit (TutorialPlan déclaré, tutorialOf), stages (sortes d'étapes et leurs
│   │                    #   pas), project (étape d'un petit puzzle relevée sur un grand), scene (tons, flèches),
│   │                    #   segments (formule lue en gestes), keep (pièces gardées, formule en cours de pas),
│   │                    #   pieces (les pièces d'un terme : d'une sorte, ou que tourne un coup),
│   │                    #   macros (la plus courte chaîne de gestes appris vers un but, jouée par une étape :
│   │                    #   eachHold, gestureChain, chainFigure, chainedPieces ; asGestures : les formules
│   │                    #   d'une méthode déclinées en gestes), method (la méthode
│   │                    #   qu'un tutoriel enseigne, en MethodPlan)
│   ├── tutorials/       # Les tutoriels : registry (par forme, un par méthode), un dossier par catégorie :
│   │                    #   standard/cube3 et cube3LastLayer (le 3x3), cube2 (le 2x2), cornerTrigger (ce que
│   │                    #   partagent les cubes : coins jaunes, tour du haut, formule lue dans une tenue),
│   │                    #   terms (vocabulaire des cubes), en méthode débutant ; ofapel, ofapelKit et
│   │                    #   ofapelEnd (le 3x3 par Ofapel) ; crossCorners et crossCornersKit (le 3x3
│   │                    #   croix puis coins : une formule par étape, le cube tenu de 24 façons) ;
│   │                    #   cube4 (réduction, puis les étapes du 3x3 projetées), bigCenters (leur étape des
│   │                    #   centres, partagée avec le 5x5), cube5 et pair5 (le 5x5,
│   │                    #   ses arêtes une aile à la fois), reduced (un grand cube réduit lu comme un 3x3),
│   │                    #   termsBig (vocabulaire des grands cubes) ; superCubes (les super cubes : le tutoriel
│   │                    #   du 4x4 ou du 5x5 sur leurs couleurs, puis leurs centres) ;
│   │                    #   pyramid/pyraminx (Centres d'abord), pyraHolds (ses tenues), pyraTerms ;
│   │                    #   pyramid/morph (le Pyramorphinx, Comme un Pocket), morphTerms ;
│   │                    #   flat/floppy, flat/cube123 et flat/ghost (Coins puis arêtes ; le Ghost par sa
│   │                    #   légende), flatKit (ce que partagent le Floppy et le 1x2x3) ;
│   │                    #   diagonal/skewb (Le haut d'abord, de francocube), skewbHolds, skewbTerms ;
│   │                    #   gear/gearUltimate (le Gear Cube Ultimate, Coins d'abord), gearTerms ;
│   │                    #   tower/tower224 (la tour 2x2x4, Deux Pockets), towerTerms
│   └── app/             # Le reste de l'app : route (adresse), snapshot (mémorisé), storage (gardé entre deux
│                        #   visites : états mémorisés, notation, vitesses), moveGuide, speed, easing
├── three/               # Rendu 3D (React Three Fiber)
│   ├── core/            # Scene, CubeView / Cubie / Sticker (puzzles à grille), PolyView / PolyModel / PolyPiece
│   │                    #   (puzzles en polygones), EditView / PolyEditView / CutsView (saisie), polyDrawing (registre des
│   │                    #   dessins), polyhedron, cutSolid, layout, isometric (vignettes), useTurnAnimation,
│   │                    #   TutorialArrow, hatchTexture et usePulse (le tutoriel), scanDrawing (une face scannée
│   │                    #   telle que son dessin la montre)...
│   ├── guide/           # Le guide des mouvements : GuideCanvas, GuideTile, guideCamera
│   └── puzzles/         # Les dessins, un dossier par catégorie : drawings.ts et la géométrie de chaque puzzle
│                        #   (gear/ : pas de drawings.ts, ses pièces, sa vue de saisie et sa vignette sont à lui,
│                        #   déclarées dans views.ts) ; shared/ : dinoGeometry (Dino Cube, Edge Only)
├── components/          # UI : ui/ (primitives), controls/ (panneau, pads de coups faits de useTurnButton, padFor), picker/, guide/, edit/ (scan/ : la caméra),
│                        #   solve/ (SolveArea : la résolution ou le tutoriel), tutorial/, home/, celebration/
├── store/               # Zustand : cubeStore (cube, file de coups, solution), editorStore, savedStore,
│                        #   viewStore, router, scanStore (le scan, face par face), tutorialStore (pick, formules jouées, coups à la main, arrêt),
│                        #   tutorialTrack (étapes montrées, 💪 et fin, coups déjà montrés)
├── hooks/               # useAutoPlan (solution dans le worker), useCamera, useFaceReading et usePreloadStickers (le scan), useIsDesktop,
│                        #   useSolveShortcuts, useTutorial
├── i18n/                # fr/ et en/ (ui, methods, steps, moveSentences : phrases longues du guide et
│                        #   courtes du tutoriel, tutorial : phrases communes, tutorials/ : les textes de chaque tutoriel,
│                        #   tutorialMirror ; EN typé sur FR), tutorialTexts (leur forme), translations
│                        #   (les assemble), i18nStore
├── workers/             # solveWorker : la solution hors du fil de l'interface ; stickersWorker (et findStickers,
│                        #   stickers) : les stickers d'un miroir trouvés par OpenCV ; facesWorker (et
│                        #   findFaces) : la forme retrouvée de ses faces (Camouflage, Purple)
└── assets/gear/         # Masques des pièces du Gear Cube (scripts/gear_face.py)
tests/
├── unit/                # Vitest : conformance de tous les puzzles (puzzles.test.ts), puis rangés comme le code :
│                        #   core/, solve/, editor/, app/, three/, store/, teach/, tutorials/, puzzles/<catégorie>/ (un fichier par
│                        #   puzzle, modèle, méthode et dessin ensemble)
├── component/           # Vitest + Testing Library
├── e2e/                 # Playwright
└── branding/            # Playwright, `make branding` seulement : aperçu de partage et images du README
docs/
├── puzzles/<catégorie>.md # Le détail de chaque puzzle : modèle, rendu, méthode, saisie
├── methods.md           # Chaque méthode, ses puzzles et ses étapes
├── interface.md         # Le détail de l'interface
├── scan.md              # Le scan à l'appareil photo : puzzles, parcours, lecture
├── tutorials.md         # Écrire un bon tutoriel : règles, démarche, vérifications
└── images/              # Les captures du README (en anglais) et sa bannière
public/                  # favicon, apple-touch-icon, og.png (aperçu de partage), robots.txt, sitemap.xml
```

Le site est déployé sur Vercel (`vercel.json` : build Vite servi depuis
`dist/`, cache d'un an sur `assets/`, dont les noms changent à chaque build).
Le référencement et l'aperçu de partage (titre, description, Open Graph,
JSON-LD, URL publique `https://rubiksolver.yavadeus.dev`) sont écrits dans
`index.html`, seule page que voit un robot. L'image `public/og.png`, l'icône
`public/apple-touch-icon.png`, la bannière et les captures de `docs/images/`
sont redessinées par `make branding` (`tests/branding/`, un projet Playwright
que seule cette commande lance, puisqu'il réécrit des fichiers du dépôt) : à
relancer quand l'interface ou le nombre de puzzles change, puis relire le
README (son tableau des puzzles et ses chiffres sont écrits à la main).

### La fiche d'un puzzle

Tout ce qui est propre à un puzzle est rangé dans le dossier de sa catégorie,
dans quatre endroits seulement (ce qui sert à plusieurs catégories sans
appartenir à aucune va dans `shared/` ; un puzzle dérivé d'un autre, comme le
Holey Megaminx du Megaminx, reprend simplement celui de son parent) :

- **sa carte** (`lib/puzzles/<catégorie>/catalog.ts`, type `PuzzleEntry`) :
  nom, adresse, dimensions, longueur de mélange, couches intérieures, coups
  avancés, déformation, miroir, scan essayé en vrai (`scanTried`), couleurs, sorte de coups (`moves`, d'où
  `isStar`, `isPyraminx`, `isGridless`...), clips colorés d'un Gear Cube,
  vignette en tête de sa catégorie (`cover`), pavé de coups (`pad`) et
  consigne de saisie (`editHint`), que l'interface traduit (`padFor`,
  `EditPanel`). Aucun code commun ne teste le nom d'un puzzle : ce qui le
  distingue est un champ de sa carte ou un crochet de son modèle.
  `inner` déclare les couches intérieures que tourne son mécanisme (tranches
  et/ou coups larges, sur tout axe d'au moins 3 couches) ; le pad grise les
  faces sans cette sorte de couche. Sa clé est l'identifiant de forme
  (`CubeShape` est l'ensemble des clés du catalogue) ; les tables de
  `core/shapes.ts` (`SHAPE_DIMS`, `SHAPE_LABEL`...) en sont dérivées ;
- **son modèle** (`lib/puzzles/<catégorie>/models.ts`, type `PuzzleModel`),
  s'il s'écarte d'un cuboïde sur sa grille : construction, mécanisme, coups
  permis, boîte, test de résolution, symétries, coups et mélange d'un puzzle
  sans grille, saisie (`entry` : ses étapes et sa peinture, voir « La
  saisie d'un puzzle », ce que montre l'éditeur, stickers cachés `hidden`,
  tranches qui tournent entières `wholeSlices`), guide des mouvements
  (`guide`, `describe`). Le cœur (`cube.ts`, `turn.ts`, `moves.ts`,
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
`docs/puzzles/<catégorie>.md`. Restent hors de la fiche les sortes de coups
(étoile, Pyraminx, Rainbow..., `puzzles/moveKinds.ts`) et leurs guides
(`puzzles/guides.ts`), qui ne sont pas propres à un puzzle, les pads dédiés (`StarPad`, `PyraPad`... dans
`components/controls/`, choisis par le `pad` de la carte) et les vues des
puzzles dessinés de leurs propres pièces (`three/puzzles/views.ts` : vue de
saisie, pièce, vignette du Gear Cube).

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
résolution : une étape qui s'arrête avant son objectif, glisse un coup
interdit ou un coup que le puzzle bloque à ce moment (`turnAllowed` : un
soudé, le Latch Cube) lève une exception ; la solution n'est simplifiée que
si ses coups passent encore. Une solution complète perd enfin les tours en
main que font ses coups d'étage (`Uw' Dw` sur la 2x2x4 : la tour tournée
d'un bloc), les coups suivants nommés comme le puzzle est alors tenu
(`solve/rotations.ts`), si elle résout toujours. C'est ce qui empêche une méthode de dégénérer en
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

**Méthode enseignée** : sur un puzzle qui a un tutoriel, la méthode qu'il
enseigne est déclarée une seule fois, par le tutoriel : `methodOf`
(`lib/teach/method.ts`) en fait un `MethodPlan`, une étape par étape du
tutoriel, résolue par les formules qu'il propose l'une après l'autre (son
ouverture, `Tutorial.opening`, en étape facultative) ; le registre les
branche (`taught`, `solver.ts`). Une étape qui tourne en rond (un état
revu) abandonne : un puzzle impossible. Comme les recherches d'un tutoriel
ne sont pas faites pour prouver qu'un état est impossible, la validation
peut demander une preuve propre à la forme (`PROOFS` : le 4x4, le
Pyramorphinx lu comme un 2x2).

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

### La saisie d'un puzzle (`src/lib/editor/`)

**Le modèle déclare sa saisie, le code de saisie ne connaît que des modes.**
Un modèle liste ses étapes (`entry.steps`), chacune un mode, puis dit comment
on entre ses couleurs (`entry.paint`) ; la déclaration et ses types sont dans
`lib/editor/entry.ts` (`entryOf`, `stepOf`), l'enchaînement des étapes dans
`lib/editor/steps.ts` (ce que chacune tient, `startSettings` / `settingsOf`,
l'étape suivante). Le store (`editorStore`), le panneau (`EditPanel`, une
étape par mode, `stepTexts`) et les vues 3D (`EditView`, `PolyEditView`,
`CutsView`) déroulent ces étapes sans jamais nommer un puzzle. Les modes,
chacun son module de `lib/editor/modes/` :

| Mode                                   | Ce qu'on fait                                             | Puzzles                                                                        |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `form` (`form.ts`)                     | choisir la forme parmi des vignettes                      | tours 2x2x4 et 2x3x4, Pyramorphinx, AI Cube                                    |
| `canvas` (`canvas.ts`, `faceViews.ts`) | dire sa forme face par face sur des canevas               | Purple, Camouflage                                                             |
| `cuts`                                 | poser ses demi-cubies case par case                       | Fashion-V                                                                      |
| `joints` (`joints.ts`)                 | souder ses pièces joint par joint                         | soudés dont les blocs bougent                                                  |
| `toggles` (`toggles.ts`)               | tourner quelque chose d'un clic (barres, pivots, centres) | RoadBlock-I, Gear Cubes ; Z-Twist et Quarter pendant la peinture               |
| peinture `colors` (`colors.ts`)        | peindre sticker par sticker                               | par défaut                                                                     |
| peinture `pieces` (`pieces.ts`)        | poser les pièces une à une                                | Ghost, Puck, Dino Cylinder, Barrel, Master Morphinx, Z-Twist, Fisher, Windmill |

La peinture peut aussi déclarer des bascules à elle (`paint.toggles`), une
façon de peindre plusieurs stickers d'un coup (`paint.together` : une barre
du RoadBlock-I ; le mode joints peint une face de bloc d'un seul tenant) et
des parties peintes à part (`paint.parts` : les engrenages d'un Gear Cube,
à côté de leurs clips). Ce qui est propre à un puzzle (ses cases, ses
barres, ses engrenages) est dans son dossier et passé au mode
(`fashionEntry.ts`, `roadblockEntry.ts`, `gearEntry.ts`) ; le modèle
reconstruit son état de ce qu'on a saisi (`entry.built`, avec ses bascules
et ses parties ; il peut le refuser, `MarksRefused`). Une étape peut n'être
offerte qu'ensuite (`later` : les faces du Camouflage, son pavé peint
d'abord). Les boutons sont les mêmes partout : le bouton principal avance,
un « Changer... » par étape revient à elle depuis la peinture (les couleurs
gardées tant que la forme ne change pas), « Annuler » quitte la saisie sans
rien appliquer. Un puzzle dessiné de ses propres pièces a sa vue de saisie
(`three/puzzles/views.ts` : le Gear Cube).

On peint les stickers sur le rendu 3D (en épaisseurs sur une variante dont
les stickers disent une taille, le cube miroir : `STICKERS_TELL` dans
`lib/core/shape.ts`, « Le cube miroir » dans
[docs/puzzles/standard.md](docs/puzzles/standard.md)). Deux garde-fous :

- **Saisie guidée** (`modes/colors.ts`) : on précalcule, à partir de toutes
  les orientations du puzzle résolu, tous les placements de pièce valides par
  emplacement, chacun étiqueté par l'**identité de la pièce physique** qu'il
  représente (coins et arêtes uniques ; les deux ailes d'une paire de
  couleurs du 4x4 distinguées par leur chiralité ; les 4 centres d'une
  couleur partagent une identité à **budget 4**). Un clic n'est accepté que
  s'il reste compatible avec un placement dont la pièce a encore du budget ;
  dès qu'une pièce est déterminée (2 stickers d'un coin), les stickers
  restants se complètent automatiquement. Le dernier clic l'emporte : une
  pièce (ou une couleur) déjà toute utilisée ailleurs y est reprise, son
  emplacement vidé, à repeindre (`takeBack`) ; la palette reste donc
  toujours cliquable (une couleur épuisée est juste atténuée), ce qui permet
  de corriger une saisie complète, « depuis l'état actuel » compris.
- **Validation finale** (`validate.ts`) : `validateCube` vérifie le comptage
  des couleurs puis la solubilité (`proveSolvable`, `solve/solver.ts`) : une
  résolution bornée, qui sur un puzzle impossible épuise sa recherche et
  lève une exception, ou la preuve propre à une forme quand elle est plus
  rapide (celle du 4x4, `methods/standard/solver4/proof.ts` : ses centres
  indiscernables absorbent toute contrainte de parité, donc il suffit que
  chaque emplacement porte une vraie pièce, `usesRealPieces`, et que la
  vrille des coins tienne, vérifiée comme un 2x2). Quand la résolution
  échoue sur une étape, le message dit laquelle (`StepFailure`).

**À l'appareil photo** (`lib/editor/scan/`) : une fois que l'utilisateur
a touché « Scanner la face », la caméra prend la face d'elle-même
(`capture.ts`), puis `readScan` lit le puzzle entier (`anchors.ts` : ses
couleurs telles que la lumière les montre ; `orient.ts` : les faces tenues
tournées ; `assign.ts` : les vraies pièces au moindre coût) et le peint
dans l'éditeur, à valider. Tout se déduit des dimensions (`scanPlan`,
`layout.ts`), sauf d'un modèle qui déclare son scan (`PuzzleModel.scan` :
en grille, en carré placé par son dessin, en anneaux, en faces planes
(les pyramides, `pyraScan.ts`), ou par sa forme,
que le scan trouve : `forms.ts`, les tours, calées par leur cœur, `box.ts` ;
le Floppy Ghost, argenté, se lit à ses contours, d'une seule photo, `outlines.ts` ; le 3x3 miroir,
aux tailles de ses stickers, trouvés par OpenCV dans un worker, `sized.ts`, `sizedRead.ts`). Le détail :
[docs/scan.md](docs/scan.md) ; les limites : `AMELIORATIONS.md`.

Ce que toute saisie remplit, quel que soit son mode, est une table de
stickers (`lib/editor/edit.ts` : progression, `isComplete`, `buildCube`,
`cubeToEdit` pour « depuis l'état actuel »). Les tables de saisie
(emplacements, placements étiquetés, budgets) sont **dérivées par forme** du
puzzle résolu et mémoïsées (`tablesFor`, `editorTables.ts`). Une pièce
qu'aucun coup ne déplace ni ne retourne reste pré-remplie
(`Slot.paintable`), comme les centres du 3x3 ; des pièces qui ne bougent
qu'ensemble aussi (`fixedPieces`, les centres du Gear Cube, `wholeSlices`).
Les comptes de couleurs se déduisent du puzzle résolu (`stickersOfColor`,
`shapeColors`) : la saisie marche sur toutes les formes, étoiles comprises
(voir « Le Star Prism » dans [docs/puzzles/round.md](docs/puzzles/round.md)).

**Un puzzle déformable** se saisit dans la forme où il se trouve. Ses
formes (`formsOf`, `modes/form.ts`) viennent d'un parcours en largeur sur
l'état sans ses couleurs, celles qui ne diffèrent que par la façon de tenir
le puzzle fusionnées, proposées en vignettes (voir
[docs/interface.md](docs/interface.md)) ; un futur puzzle déformable n'a
qu'à déclarer l'étape `form`. Les fonctions de saisie prennent cette forme
(`form`, un état de cette forme) ; un emplacement y accepte toute pièce de
son type tournée pour présenter ses stickers sur ses faces, pourvu que la
parité de ses coordonnées soit celle de l'emplacement (un gros cube du
Purple ne va jamais où va un mini-cube) : la validation dit ensuite si
l'état est atteignable. « Modifier » saisit un puzzle déformé dans sa forme.

**Sur canevas** : quatre canevas (ses faces) sur un cube qui bascule vers
soi d'une face à l'autre (`FaceCanvases`, vu de face, `CameraReset`,
`FaceArrows`) ; on peint chaque case d'une couleur ou « absent » et on joint
les cases d'une même face de pièce. L'étape porte le `FaceEntry` du puzzle :
sa grille, la taille du canevas, si un dessin se place où il est (`framed` :
le Camouflage) ou n'importe où (le Purple), et comment retrouver ses états
(`find`, dans un worker : `camoViews.ts`, `purpleViews.ts`) ; voir
[docs/puzzles/tower.md](docs/puzzles/tower.md) et
[docs/puzzles/twisted.md](docs/puzzles/twisted.md). **Par les demi-cubies** :
un clic fait défiler la position des demi-cubies d'une case, puis la
recherche de forme (`methods/twisted/fashionShape.ts`) en trouve un état ;
voir [docs/puzzles/twisted.md](docs/puzzles/twisted.md). **Par les
soudures** : les joints cliqués sont validés contre les formes que l'étape
porte ; voir [docs/puzzles/bandaged.md](docs/puzzles/bandaged.md). **Pièce
par pièce** : un clic pose la pose suivante qui loge (autre pièce, ou la
même retournée), en sautant les pièces déjà posées ; les poses se trouvent
en tournant chaque pièce seule depuis chez elle.

### Interface

Panneau d'overlay en deux blocs (initialisation et choix du puzzle à gauche,
langue et résolution à droite ; une seule carte sur mobile et en saisie),
sélecteur de puzzle en modale par catégories puis puzzles (vignettes SVG
dessinées par le code, `three/core/isometric.ts`), pad de coups construit
depuis les coups de la forme, guide des mouvements, solution jouée dans les
deux sens et au clavier, tutoriel (on résout soi-même, pas à pas, guidé
par une flèche et des pièces mises en valeur), feu d'artifice quand un coup résout, adresse
`#/<langue>/<puzzle>` (l'accueil sinon). Le détail : [docs/interface.md](docs/interface.md).

### Le tutoriel (`src/lib/teach/`, `src/lib/tutorials/`)

**Avant d'écrire ou de retoucher un tutoriel, lire
[docs/tutorials.md](docs/tutorials.md)** : ses règles (un objectif clair
par pas, jamais de recul, pas de pas pour tenir le cube, une flèche par
pièce travaillée et une seule à la fois, coups décrits la première fois),
la démarche et les vérifications.

Un tutoriel est **déclaré, pas codé**, comme une méthode, et le moteur ne
connaît aucun modèle : il manipule n'importe quel coup de l'appli
(`Turn`), lit les positions et les stickers des pièces, et reçoit du
tutoriel ses tenues. Un `TutorialPlan` (`lib/teach/kit.ts`) est une
liste d'étapes, et `tutorialOf` en fait le pas où en est un état (sa sorte,
`TutorialStep.kind` : pièces, formule, figure, déjà faite, à venir) :

- une étape de **pièces** (`PieceStage`) place des pièces une à une : ses
  cibles (`Target` : la pièce, son emplacement, « placée »), la tenue pour
  un choix, le sticker que suit la flèche, les enchaînements appris
  (`Sequence`, chacun en ses gestes) et la façon de trouver la formule (une
  recherche vers l'objectif, ou une recette) ; le moteur fait le reste
  (pièces placées au début du pas et gardées, choix, suggestion,
  avancement) ;
- une étape de **figures** (`FigureStage`) reconnaît une figure (comment la
  tenir, la formule lue dans cette tenue), sans pièce à choisir, ses
  pièces travaillées (`subjects`) fléchées ;
- une étape de **formule** (`FormulaStage`) joue la sienne (le recentrage) ;
- après les étapes, `next` peut annoncer celle qui vient (un tutoriel
  partiel) ; sans `next`, le tutoriel finit sur le puzzle résolu ;
- une étape **projetée** (`projected`, `teach/project.ts`) joue l'étape
  d'un petit puzzle sur la projection d'un grand (celles du 3x3 sur un 4x4
  réduit) : ses pièces, places, flèches et tons sont relevés sur le grand
  (une arête pour ses deux ailes, un centre pour ses quatre), ses coups
  restent les mêmes ; une cible `interchangeable` (un des quatre centres
  d'une couleur) est gardée par ce que montre sa place, pas par sa pièce ;
  tout un plan peut passer par une projection (`projectedStages`, celui du
  4x4 sur les couleurs d'un super cube), ses étapes déjà projetées par les
  deux (`thenProject`) ;
- avant les étapes, le **vocabulaire** (`glossary`, l'étape 0) : chaque
  terme (`Term`) allume ses pièces et dit d'où les regarder, un pas par
  terme, « Passer » les saute ; puis, sur un puzzle dont les pièces se
  reconnaissent à leur forme (le Floppy Ghost, tout argenté), la
  **légende** (`legend` : un nom par pièce, A, B... ou 1, 2...) : une page
  qui les dessine seules, à l'endroit et à l'envers (`pieceDrawing`,
  `three/core/isometric.ts`), à portée de main ensuite par l'icône à droite
  du titre d'étape ; les consignes nomment alors une pièce par son nom,
  sa miniature à côté (`Pictured`), du côté qu'elle montre ; un terme peut être réservé à un rendu
  (`only` : les six épaisseurs d'un miroir, `lib/tutorials/standard/terms.ts`).

Sur un cube miroir, les textes parlent en épaisseurs (très fine, fine,
moins fine, moins épaisse, épaisse, très épaisse) : `i18n/*/tutorialMirror.ts`
remplace ceux qui citent une couleur, et `useTutorialTexts` choisit selon
le rendu.

Un puzzle sans centres (le 2x2) dit la couleur d'une face autrement
(`TutorialPlan.faceColor` : lue sur son coin repère, là où il se
trouve), et la consigne de tenue nomme alors la face plutôt que le centre
(aucune sans repère). Les cibles d'une étape de pièces peuvent se lire sur
l'état où le pas commence (`targets` en fonction : les coins autour du
repère). Une formule qui ne fait que tourner le cube entier (un `Move`
`whole`, noté `x y z` : le 2x2 retourné, jaune en bas) ne montre ni pièce
gênante ni hachures ; une formule qui commence par là se lit depuis la
tenue qu'elle donne (consigne, flèches, hachures : `heldFor`,
`lib/teach/scene.ts`), d'un seul pas. Une figure peut se résoudre par la plus courte chaîne de
gestes appris (`firstGesture`, `lib/teach/macros.ts` : tenue, tour du
haut, algorithme), dont chaque pas joue le premier geste ; à longueur égale,
celui qui avance le plus (`rank`), et une figure « détour » dit quand aucun
n'avance (le 2x2 et ses Sunes).

Chaque étape déclare aussi la face qu'elle travaille (`side`, une normale :
flèches et vue ; lue sur l'état pour une étape de figures dont la face
change d'un pas à l'autre), celle qu'elle achève (`shows` : une croix, une face, vers
laquelle la vue se tourne quand la formule qui finit l'étape est jouée) et si ses coups gardent leur description (`words`) : aucune
règle d'affichage ne dépend d'un numéro d'étape, d'une face ni d'une sorte
de coup écrite dans le code commun. Les **tenues** (`TutorialPlan.frame`,
un `HoldFrame`) disent comment tenir le modèle et lire un coup dans une
tenue : celles d'un cube se déduisent de ses faces (`ringHolds`,
`CUBE_HOLDS` par défaut) ; un modèle aux coups d'une autre sorte donne les
siennes. Le **registre** (`lib/tutorials/registry.ts`) liste par forme un
tutoriel par méthode ; le bouton Tutoriel n'est offert que pour la méthode
choisie qui en a un. Sa méthode de résolution est alors ce tutoriel joué jusqu'au bout
(voir « Méthode enseignée »). **Ajouter un tutoriel** : sa définition dans
`lib/tutorials/<catégorie>/<puzzle>.ts` et sa ligne au registre (sa
méthode) ; les titres, consignes, figures, vérifications, phrases
d'avancement et termes de ses étapes dans son module de textes
(`i18n/{fr,en}/tutorials/<puzzle>.ts`, ajouté à la fusion de `tutorial.ts`),
leurs noms dans `steps.ts` ; ses tests dans `tests/unit/tutorials/` (ceux du moteur dans `tests/unit/teach/`). Le rendu des tons,
du clic et des flèches est commun aux deux vues (`useTutorialScene`, pour
`CubeView` et `PolyView`) : la flèche contourne les plans des faces du
puzzle (`three/core/hull.ts` : sur un cube, les boîtes des pièces telles
que dessinées, bosses d'un miroir comprises) et va du centre dessiné d'un
sticker à celui de la face où il arrive (`faceCenter`, la pièce dans sa
forme une fois la formule jouée) ; la vue se tourne vers une direction du modèle par
`sceneDirection` (le dessin la convertit, `PolyDrawing.direction`). Un
tutoriel déclare aussi le nom de ses sortes de pièces (`pieceKind` : les
pointes du Pyraminx) et sa façon de dire la tenue (`holding` : « Place la
pyramide à plat »), et ses termes peuvent porter un coup animé (`demo`) et n'allumer qu'une partie de leurs pièces (`part` : l'engrenage ou les agrafes d'une arête du Gear Cube). Le comportement du tutoriel du 3x3 est figé pas à pas
par `golden.test.ts` (référence `golden/cube3.json`, écrite par le test :
`-u` pour la réécrire, seulement sur un changement voulu).

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
| `make branding`                              | Redessine `public/og.png` et les images du README           |
| `make fix`                                   | Format + lint                                               |
| `make check`                                 | build + lint + format-check + typecheck + knip + tests      |
| `make clean`                                 | Supprime `dist` et `node_modules`                           |
