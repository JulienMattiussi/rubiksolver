# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif et pédagogique**, en **2x2 (Pocket), 3x3
ou 4x4**, **classique ou miroir**, plus trois cuboïdes : le **1x2x3**, la **tour
2x2x4** (qui se déforme) et le **Domino 3x3x2** (choix dans une liste unique).
On manipule le cube (rotations de faces à la souris/aux boutons, tranches et
coups larges là où la forme en a, orbite caméra, aperçu des pièces qui vont
tourner au survol d'un bouton), on le mélange **ou on saisit sa propre
configuration** en peignant les stickers directement en 3D, on peut
**mémoriser un état** pour y revenir, puis on le résout selon **plusieurs
vraies méthodes** (par couches, CFOP, Roux, Petrus, ZZ, réduction du 4x4,
méthodes de la tour et du Domino...). La solution est découpée en **étapes
nommées** qu'on joue d'un coup ou **pas à pas**, pour apprendre la méthode. Le
but est pédagogique, pas l'optimalité du nombre de coups (à l'exception de la
méthode **Optimale** du 2x2 et du 1x2x3, qui exploite leurs espaces d'états
réduits).

Application **100% front-end**, sans backend. Interface **français par défaut**
(bascule anglais), langue détectée depuis le navigateur ; **notation des
mouvements internationale (U D L R F B) par défaut, ou française
(H B G D F Ar)**, avec la même convention dans les deux pour les autres
coups : préfixe `2` pour la tranche interne du 4x4 (`2R` / `2D`), suffixe `w`
pour le coup large (`Rw` / `Dw`), et `M`, `E`, `S` pour les tranches du
milieu du 3x3.

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
> `depth: 2` (tranche interne) et `wide` (couches 1+2) ; `moveSlab` en déduit
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
│   ├── types.ts          # Types du domaine (CubeShape + SHAPE_DIMS, Dims, CubeVariant, Face, Color, Axis, Vec3, Sticker, Cubie, Cube, Move avec depth/wide)
│   │                     #   + CUBE_KINDS : les choix exposés (forme x variante), leur id, libellé et catégorie
│   ├── geometry.ts       # Géométrie entière : normales des faces, normalIndex, grilles par axe (layerCoords), rotations exactes
│   ├── cube.ts           # Le puzzle : solvedCube, cubeShape/cubeDims/turnDims, isSolved/isBoxed, stateKey, cubeOrientations,
│   │                     #   requêtes de pièces (colorAt, colorsOf, cubieAt, atHome/homeAt), comptages de stickers et de couleurs
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
│   │   ├── layers3.ts    #   3x3 par couches et CFOP (prédicats et phases réutilisés par Petrus et ZZ)
│   │   ├── roux.ts       #   Roux : blocs 1x2x3, CMLL, LSE en <M, U>
│   │   ├── petrus.ts     #   Petrus : 2x2x2, 2x2x3 en <U, R, F>, arêtes, F2L en <R, U>, dernière couche en 3 temps
│   │   ├── zz.ts         #   ZZ : EOLine, blocs en <L, U, R> puis <R, U>, OCLL, PLL
│   │   ├── cube2.ts      #   2x2 : par couches (repère DBL) et optimal (BFS bidirectionnelle)
│   │   ├── flat123.ts    #   1x2x3 : optimal (BFS exhaustive via solvePieces)
│   │   ├── tower.ts      #   tour 2x2x4 : Deux Pockets (forme, Pocket intérieur, Pocket extérieur)
│   │   └── domino.ts     #   Domino 3x3x2 : coins puis arêtes (formules de fan2cube.fr, reprises élargies par la tour)
│   ├── solver4/          # Solveur 4x4 par réduction :
│   │   ├── centers.ts    #   centres par comptage (D, U, puis ceinture), recherches bornées sans régression
│   │   ├── edges.ts      #   appariement des ailes (échanges nets FR-bas <-> BR/FL-haut, goal-checkés), flip L2E
│   │   ├── project.ts    #   projection homomorphe du 4x4 réduit vers un 3x3 virtuel (via3x3)
│   │   ├── parity.ts     #   détecteurs (flip, signes de permutation, vrille) + algos de parité OLL/PLL
│   │   └── steps.ts      #   reductionPlan(plan 3x3) : préfixe centres/arêtes/parité + étapes 3x3 projetées
│   ├── editorTables.ts   # Tables de saisie par forme : slots, placements valides étiquetés par pièce physique, budgets,
│   │                     #   centres fixes (sur l'axe de leur face) pré-remplis
│   ├── editor.ts         # Saisie guidée : peinture contrainte par placements + budgets, auto-complétion, buildCube/cubeToEdit
│   ├── validate.ts       # validateCube : comptage par face + solubilité (résolution bornée ; invariants de pièces + vrille sur 4x4)
│   ├── shape.ts          # Cube miroir : épaisseur de couche par couleur, boîte d'un cubie (cubieBox) déduite de ses stickers
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
│   ├── savedStore.ts     # Zustand : un état mémorisé par forme, persisté en localStorage (try/catch : sans stockage, juste la session)
│   └── viewStore.ts      # Zustand : pont DOM -> 3D (recentrage caméra : resetToken ; coup survolé : preview)
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet) ; locale + notation US/FR
│   ├── translations.ts   # `fr` (source) + `en: Translations`
│   └── i18nStore.ts      # store `useI18n` (locale, t, setLocale, notation, setNotation) + selectMoveLabels
├── three/                # Rendu 3D (React Three Fiber) ; un composant/hook par fichier
│   ├── Scene.tsx         # <Canvas> : caméra, lumières, OrbitControls ; bascule CubeView / EditView
│   ├── CubeView.tsx      # Rend les cubies (via useTurnAnimation), à l'échelle de la forme, recentré selon la variante,
│   │                     #   pièces du coup survolé en surbrillance
│   ├── EditView.tsx      # Mode saisie : stickers peignables cliquables, vides en gris ; en épaisseurs (dorés) sur un miroir
│   ├── Cubie.tsx         # Un cubie : corps + stickers, à la boîte de sa variante, en surbrillance si un coup survolé le tourne
│   ├── layout.ts         # Échelle et position visuelles (coordonnée / pas de la grille : linéaire, juste hors de la boîte)
│   ├── Sticker.tsx       # Sticker orienté à sa normale et dimensionné à sa face, mutualisé play/édition (onSelect = cliquable)
│   ├── useTurnAnimation.ts # Hook : pilote la file de rotations (rotation de la couche active)
│   ├── camera.ts         # Cadrage caméra de référence (position de départ et de recentrage)
│   ├── CameraReset.tsx   # Recentrage caméra animé (lit viewStore, dans le <Canvas>)
│   └── colors.ts         # Couleurs des stickers (hex), plastique, doré du cube miroir
├── components/
│   ├── ui/               # Primitives réutilisables (Button, IconButton, SegmentedToggle, Select, ConfirmDialog)
│   │                     #   + styles.ts : classes partagées (SECTION_BOX, SECTION_LABEL)
│   ├── controls/         # Panneau : Controls (orchestrateur), SetupSection, StatusBadge,
│   │                     #   LanguageToggle, NotationToggle, RecenterButton, CollapseButton, SpeedSlider, MovePad
│   ├── solve/            # Résolution : SolvePanel, MethodSelect, StepList
│   └── edit/             # Saisie : EditPanel, ColorPalette
├── App.tsx               # Coquille : scène 3D plein écran + panneau en overlay (empilé sur mobile en saisie)
└── main.tsx
tests/
├── helpers.ts            # RNG déterministe (seededRng), coin vrillé (twistedCorner)
├── unit/                 # Vitest : cube (coups, tour), moves, solver (registre : chaque méthode de chaque forme) + solver4,
│                         #   methods (Roux/Petrus/ZZ : objectifs et jeux de coups), algs, tower, domino (effet de chaque
│                         #   formule), pieceSearch, flat123 (espace d'états entier), editor, validate, shape, snapshot,
│                         #   layout, stores, easing, speed, progress
├── component/            # Vitest + Testing Library (Controls, SegmentedToggle)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution sur chaque forme, saisie, miroir)
```

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
`<R, U>` pour le F2L de Petrus...) sont imposés, et affichés à l'apprenant
dans la liste des étapes quand ils restreignent vraiment.

Le registre (`solver.ts`) déclare, pour chaque méthode, **un plan par forme
supportée** (source unique : pas de dispatch séparé) ; `methodsFor(shape)`
renvoie les méthodes disponibles pour une forme, chacune liée à son plan (l'UI
et le store ne voient que ça) :

- **Par couches** (`beginner`, 3x3 et 2x2) : sur 3x3, 1re couche entière
  (croix + coins), puis arêtes du milieu, puis dernière couche (croix,
  orientation coins, permutation coins, permutation arêtes) - 7 étapes. Sur
  2x2 (pas d'arêtes ni de centres) : coins du bas, orientation du haut,
  permutation du haut - 3 étapes.
- **Fridrich / CFOP** (`cfop`, 3x3) : Croix, puis **F2L** (paires coin+arête
  par colonne), puis **OLL**, puis **PLL** - 4 étapes.
- **Réduction** (`reduction` et `reductionCfop`, 4x4) : Centres, Appariement
  des arêtes, Correction de parité (étape émise seulement si nécessaire), puis
  la phase 3x3 de la méthode choisie (par couches ou CFOP) - voir plus bas.
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
- **Optimale** (`optimal`, 2x2 et 1x2x3) : recherche exhaustive, solution la
  plus courte possible (11 coups max sur 2x2, 6 sur 1x2x3), une seule étape.
- **Deux Pockets** (`twoPockets`, tour 2x2x4) : remise en forme, Pocket intérieur,
  Pocket extérieur - voir « La tour 2x2x4 ».
- **Coins puis arêtes** (`cornersFirst`, Domino 3x3x2) : coins du bas, coins
  du haut, arêtes du bas, arêtes du haut - voir « Le Domino ».

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

Les tranches du 3x3 ne demandent rien au moteur : sur 3 couches, la couche
`depth: 2` est celle du milieu, donc `M` = `2L` (même sens que L), `E` = `2D`,
`S` = `2F`, et `r` = `Rw`. `formatMove(move, labels, dims)` les affiche `M`,
`E`, `S` quand on lui passe les dimensions.

**Ajouter une méthode à un puzzle** : (1) écrire son plan dans
`src/lib/methods/<méthode>.ts` (étapes avec objectif, jeu de coups et phases ;
réutiliser `buildBlock`, `solvePieces`, `solveWithAlgs`, les prédicats
existants, et ajouter les algorithmes au catalogue) ; (2) l'ajouter au registre
de `solver.ts` sous les formes qu'elle couvre ; (3) nommer la méthode et ses
étapes dans les deux langues. Le test de registre résout alors des mélanges
avec elle, sans rien toucher d'autre ; y ajouter un test qui fige ses jeux de
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

Les tables de saisie (emplacements + placements étiquetés + budgets) sont
**dérivées par forme** du puzzle résolu correspondant et mémoïsées
(`tablesFor`, dans `src/lib/editorTables.ts`) ; toutes les fonctions de saisie
prennent la forme avec l'état. Une saisie est complète quand chaque emplacement
est peint (`isComplete`) : une tour déformée, dont des pièces sont hors des
emplacements, ne l'est jamais (« Depuis l'état actuel » y est grisé). Sans centres fixes, la saisie 2x2 part
entièrement vide (24 stickers), et le 4x4 aussi (96 stickers, centres
peignables car mobiles). Un centre posé sur l'axe de sa face ne bouge jamais :
il reste pré-rempli (`centersArePaintable`), les 6 du 3x3 comme les 2 du Domino.

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
(`solveFlat123`) rend la solution la plus courte, exposée par la méthode
**Optimale** (partagée avec le 2x2). La borne de recherche vaut 7 : un état
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

### Le Domino 3x3x2

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
  cube** (liste déroulante groupée par catégorie, `cubeCategory` : Standard
  2x2 (Pocket)/3x3/4x4, Miroir 2x2/3x3/4x4, Tower 1x2x3/2x2x4/3x3x2 (Domino) ;
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
  Large sur la tour), choisit la couche tournée ; un coup bloqué par l'état de
  la tour reste grisé) avec **recentrage caméra animé** et
  **bascule de notation FR/US**.
- **Résolution** : choix de la **méthode** (liste déroulante, filtrée par
  forme via `methodsFor`), **Résoudre**
  (joue tout) ou **Pas à pas** (une étape à la fois ; « Arrêter » abandonne la
  solution en cours), et la **liste des étapes**
  nommées avec le total de rotations, le surlignage de l'étape en cours et,
  quand l'étape est restreinte, ses **coups autorisés** (`<M, U>`...).

**Mobile** : le panneau se **replie** en une barre compacte (Mélanger +
Résoudre) ; en mode saisie, le cube est empilé **au-dessus** du panneau pour
rester entièrement visible pendant la peinture.

**Aperçu d'un coup** : survoler (ou focaliser au clavier) un bouton du pad met
en surbrillance les pièces que ce coup tournerait (corps bleu ciel, stickers
éclaircis) : `MovePad` écrit le coup dans `viewStore.preview`, `CubeView` lit
les pièces concernées avec `turnedBy` (la même fonction que l'animation), sauf
pendant une animation ou si le coup est bloqué.

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
