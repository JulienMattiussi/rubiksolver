# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif et pédagogique**, en **2x2, 3x3 ou 4x4**
(taille sélectionnable). On manipule le cube (rotations de faces à la
souris/aux boutons, tranches internes et coups larges sur 4x4, orbite caméra),
on le mélange **ou on saisit sa propre configuration** en peignant les stickers
directement en 3D, puis on le résout selon **plusieurs vraies méthodes** (par
couches, Fridrich/CFOP, réduction du 4x4...). La solution est découpée en
**étapes nommées** qu'on joue d'un coup ou **pas à pas**, pour apprendre la
méthode. Le but est pédagogique, pas l'optimalité du nombre de coups (à
l'exception de la méthode **Optimale** du 2x2, qui exploite son espace d'états
réduit).

Application **100% front-end**, sans backend. Interface **français par défaut**
(bascule anglais), langue détectée depuis le navigateur ; **notation des
mouvements internationale (U D L R F B) par défaut, ou française
(H B G D F Ar)**, avec la
même convention dans les deux pour les coups du 4x4 : préfixe `2` pour la
tranche interne (`2R` / `2D`), suffixe `w` pour le coup large (`Rw` / `Dw`).

---

## Stack technique

| Outil | Usage |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Build / dev server |
| React Three Fiber + drei | Rendu 3D déclaratif (three.js) et OrbitControls |
| three | Moteur 3D sous-jacent |
| Tailwind CSS v4 | Styles (via `@tailwindcss/vite`, pas de config JS) |
| Zustand | État global (cube + animation, saisie, vue caméra, i18n/notation) |
| Vitest + Testing Library | Tests unitaires et composants |
| Playwright | Tests e2e |
| Prettier | Formatage |
| ESLint (typescript-eslint) | Linting |
| Knip | Détection du code / dépendances inutilisés |

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
> 8 coins, 24 ailes, 24 centres mobiles, 8 internes). Un `Move` désigne une
> face + éventuellement `depth: 2` (tranche interne) et `wide` (couches 1+2) ;
> `moveLayerCoords` en déduit les coordonnées de couche par taille, source
> unique partagée par `applyMove` et l'animation. Une rotation est une rotation
> entière exacte à 90 degres, donc l'état logique ne dérive jamais. Le rendu 3D
> est une **fonction pure de cet état** (le 2x2 et le 4x4 ne sont que des mises
> à l'échelle, voir `three/layout.ts`) ; le solveur lit le même modèle.

```
src/
├── lib/                  # Logique pure, zéro React / zéro three.js (entièrement testée)
│   ├── types.ts          # Types du domaine (CubeSize, Face, Color, Axis, Vec3, Sticker, Cubie, Cube, Move avec depth/wide)
│   ├── cube.ts           # Modèle cubies : solvedCube(size), applyMove(s), moveLayerCoords, isSolved (faces uniformes),
│   │                     #   moveGeometry, cubeOrientations, stateKey, comptages de stickers, couleurs opposées (source unique)
│   ├── moves.ts          # Notation US/FR (parse/format, 2R/Rw), inversion, simplification (par couches),
│   │                     #   scramble (RNG injectable ; le 4x4 mélange faces, tranches et coups larges), movesFor(size)
│   ├── solverKit.ts      # Briques partagées des solveurs : search (BFS bornée, clé de dédup injectable),
│   │                     #   solveWithAlgs ("aligner U puis algorithme"), relMoves/atEverySide, buildSteps (SolveStep[])
│   ├── solver.ts         # Solveurs 2x2/3x3 + registre des méthodes par taille : methodsFor(size), solve() (validation)
│   ├── solver4/          # Solveur 4x4 par réduction :
│   │   ├── centers.ts    #   centres par comptage (D, U, puis ceinture), recherches bornées sans régression
│   │   ├── edges.ts      #   appariement des ailes (échanges nets FR-bas <-> BR/FL-haut, goal-checkés), flip L2E
│   │   ├── project.ts    #   projection homomorphe du 4x4 réduit vers un 3x3 virtuel (via3x3)
│   │   ├── parity.ts     #   détecteurs (flip, signes de permutation, vrille) + algos de parité OLL/PLL
│   │   └── steps.ts      #   reductionSteps(specs 3x3) : préfixe centres/arêtes/parité + étapes 3x3 projetées
│   ├── editorTables.ts   # Tables de saisie par taille : slots, placements valides étiquetés par pièce physique, budgets
│   ├── editor.ts         # Saisie guidée : peinture contrainte par placements + budgets, auto-complétion, buildCube/cubeToEdit
│   ├── validate.ts       # validateCube : comptage + solubilité (résolution 2x2/3x3 ; invariants de pièces + vrille sur 4x4)
│   ├── easing.ts         # easeInOut (partagé par les animations)
│   ├── speed.ts          # Curseur 0..100 <-> secondes par rotation
│   └── progress.ts       # solveProgress : avancement par étape d'une solution (pour l'UI)
├── store/
│   ├── cubeStore.ts      # Zustand : cube + file de rotations + pilotage animation ; méthode, étapes, jouer tout / pas à pas, loadCube
│   ├── editorStore.ts    # Zustand : mode play/edit, couleur sélectionnée, saisie, apply (build + validate + charge)
│   └── viewStore.ts      # Zustand : pont DOM -> 3D pour recentrer la caméra (resetToken)
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet) ; locale + notation US/FR
│   ├── translations.ts   # `fr` (source) + `en: Translations`
│   └── i18nStore.ts      # store `useI18n` (locale, t, setLocale, notation, setNotation)
├── three/                # Rendu 3D (React Three Fiber) ; un composant/hook par fichier
│   ├── Scene.tsx         # <Canvas> : caméra, lumières, OrbitControls ; bascule CubeView / EditView
│   ├── CubeView.tsx      # Rend les cubies (via useTurnAnimation), à l'échelle de la taille
│   ├── EditView.tsx      # Mode saisie : stickers cliquables ; vides en gris
│   ├── Cubie.tsx         # Un cubie : corps + stickers
│   ├── layout.ts         # Échelle visuelle par taille (le 2x2 resserre ses positions ±1 et grossit)
│   ├── Sticker.tsx       # Sticker orienté à sa normale, mutualisé play/édition (onSelect = cliquable)
│   ├── useTurnAnimation.ts # Hook : pilote la file de rotations (rotation de la couche active)
│   ├── CameraReset.tsx   # Recentrage caméra animé (lit viewStore, dans le <Canvas>)
│   └── colors.ts         # Couleurs des stickers (hex) et plastique
├── components/
│   ├── ui/               # Primitives réutilisables (Button, IconButton, SegmentedToggle)
│   ├── controls/         # Panneau : Controls (orchestrateur), SetupSection, StatusBadge,
│   │                     #   LanguageToggle, NotationToggle, RecenterButton, CollapseButton, SpeedSlider, MovePad
│   ├── solve/            # Résolution : SolvePanel, MethodSelect, StepList
│   └── edit/             # Saisie : EditPanel, ColorPalette
├── App.tsx               # Coquille : scène 3D plein écran + panneau en overlay (empilé sur mobile en saisie)
└── main.tsx
tests/
├── helpers.ts            # RNG déterministe (seedRng) pour des scrambles reproductibles
├── unit/                 # Vitest : cube, moves, solver + solver4 (propriété), editor, validate, easing, speed, progress
├── component/            # Vitest + Testing Library (Controls, SegmentedToggle)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution, saisie)
```

### Les solveurs par méthode (`src/lib/solver.ts`)

Le but est **pédagogique** : proposer plusieurs **vraies méthodes** et faire
**apprendre leurs étapes**, pas minimiser le nombre de coups. Chaque méthode est
définie par son **cheminement propre** (sa suite d'objectifs) et renvoie ses
**étapes nommées** (`SolveStep[]`), que l'UI joue une par une. Repère commun :
le jaune (face D) est la première couche, le blanc (face U) la dernière.

Le registre déclare, pour chaque méthode, **un solveur par taille supportée**
(source unique : pas de dispatch séparé) ; `methodsFor(size)` renvoie les
méthodes disponibles pour une taille, chacune liée à son solveur (l'UI et le
store ne voient que ça) :

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
- **Optimale** (`optimal`, 2x2) : recherche exhaustive, solution la plus
  courte possible (11 coups max), une seule étape.

**Repère du 2x2** : sans centres, pas de repère fixe. Le coin en **DBL**
(position `[-1,-1,-1]`) joue ce rôle : ses stickers définissent les couleurs
D/L/B (opposées déduites du schéma standard). Les prédicats **recalculent ce
repère sur l'état qu'ils examinent**, donc les algorithmes qui déplacent le
coin-ancre restent corrects par construction. Le solveur optimal est une **BFS
bidirectionnelle** en rotations U/R/F (qui ne bougent jamais DBL), du cube vers
l'orientation du cube résolu qui partage son coin DBL ; la borne de profondeur
(12 > nombre de Dieu du 2x2 = 11) rend l'échec sur cube impossible borné et
rapide, ce qu'exploite la validation.

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
3x3 *impossible* (une arête composite flippée = parité OLL ; deux arêtes
échangées = parité PLL) ; des invariants déterministes les détectent (somme des
flips, signes des permutations) et les algorithmes standards en tranches les
corrigent AVANT la phase 3x3. Une vrille de coin (somme des twists non nulle
mod 3) fait lever une exception : cube réellement impossible. (4) **Phase
3x3** : le 4x4 réduit restreint aux coups externes est isomorphe à un 3x3
(`to3x3` est un homomorphisme) ; les phases 3x3 existantes s'exécutent sur la
projection (`via3x3`) et leurs coups se rejouent tels quels : zéro duplication
des étapes.

Les briques de résolution sont partagées (`src/lib/solverKit.ts`) et
**correctes par construction** : la croix par recherche de plus court chemin
(BFS sur des générateurs de coups, clé de déduplication injectable) ; les
insertions et la dernière couche par recherche « aligner U puis appliquer un
algorithme » (gâchettes `R U R'`, `F R U R' U' F'`, Sune, A-perm/U-perm en
3-cycle) dont l'objectif inclut « ne pas régresser ». Ce qui **distingue** les
méthodes, c'est donc leur *découpage en étapes* (le cheminement), pas la
machinerie bas niveau. Les solutions ne sont pas optimisées (longues) mais
toujours correctes ; validé par un test de propriété qui résout des dizaines
de scrambles pour chaque méthode et vérifie `isSolved`.

> Ajouter une méthode à cheminement vraiment différent (ex. "arêtes d'abord",
> Petrus par blocs) demande sa propre machinerie (placer les coins sans casser
> les arêtes, construire des blocs 2x2x2...), pas seulement un réétiquetage.

### La saisie d'un cube (`src/lib/editor.ts`, `validate.ts`)

L'utilisateur peut initialiser le cube depuis une position réelle en peignant
les stickers directement sur le rendu 3D (mode édition). Deux garde-fous :

- **Saisie guidée** : on précalcule, à partir des 24 orientations d'un cube
  résolu, tous les placements de pièce valides par emplacement, chacun
  étiqueté par l'**identité de la pièce physique** qu'il représente (coins et
  arêtes uniques ; les deux ailes d'une paire de couleurs du 4x4 distinguées
  par leur chiralité ; les 4 centres d'une couleur partagent une identité à
  **budget 4**). Un clic n'est accepté que s'il reste compatible avec un
  placement dont la pièce a encore du budget ; dès qu'une pièce est déterminée
  (2 stickers d'un coin), les stickers restants se complètent automatiquement.
  Impossible donc de créer une pièce, un doublon ou un compte de couleurs
  incohérent pendant la saisie.
- **Validation finale** : `validateCube` vérifie le comptage des couleurs puis
  la solubilité. Sur 2x2/3x3, en demandant une résolution : sur un cube
  impossible, le solveur épuise sa recherche bornée et lève une exception,
  qu'on intercepte. Sur 4x4, par **invariants exacts** (les centres
  indiscernables absorbent toute contrainte de parité de permutation, c'est
  d'ailleurs pourquoi les parités OLL/PLL y sont des états légaux) : chaque
  emplacement porte une vraie pièce aux multiplicités exactes
  (`usesRealPieces`), et la vrille des coins est vérifiée en résolvant les 8
  coins renormalisés comme un 2x2 (`solveOptimal2`), rapide et borné.

Les tables de saisie (emplacements + placements étiquetés + budgets) sont
**dérivées par taille** du cube résolu correspondant et mémoïsées
(`tablesFor`, dans `src/lib/editorTables.ts`) ; toutes les fonctions de saisie
prennent la taille avec l'état. Sans centres fixes, la saisie 2x2 part
entièrement vide (24 stickers), et le 4x4 aussi (96 stickers, centres
peignables car mobiles) ; seul le 3x3 garde ses 6 centres pré-remplis.

### Interface

Panneau d'overlay en **deux blocs** :

- **Initialisation** (titre non affiché, `aria-label` seulement) : **choix du
  cube 2x2/3x3/4x4** (liste déroulante ; réinitialise le cube et rabat la
  méthode si besoin) avec le **statut** sur la même ligne, mélanger /
  réinitialiser, saisie d'un cube (vierge ou depuis l'état courant), vitesse
  d'animation, et **pad de rotations** (une gâchette horaire + une anti-horaire
  par face ; sur 4x4, un sélecteur Externe / Tranche / Large choisit la couche
  tournée) avec **recentrage caméra animé** et **bascule de notation FR/US**.
- **Résolution** : choix de la **méthode** (liste déroulante, filtrée par
  taille via `methodsFor`), **Résoudre**
  (joue tout) ou **Pas à pas** (une étape à la fois), et la **liste des étapes**
  nommées avec le total de rotations et le surlignage de l'étape en cours.

**Mobile** : le panneau se **replie** en une barre compacte (Mélanger +
Résoudre) ; en mode saisie, le cube est empilé **au-dessus** du panneau pour
rester entièrement visible pendant la peinture.

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
  positions sur la grille entière de leur taille (`{-3,-1,1,3}` au plus). Ne
  pas introduire de trigonométrie dans la logique du cube ; l'angle visuel est
  calculé par `moveGeometry` uniquement pour l'animation.
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
lint + typecheck + knip + tests unitaires).

---

## Commandes (Makefile)

| Commande | Effet |
|---|---|
| `make install` | Installe les dépendances |
| `make start` | Serveur de dev (http://localhost:6661) |
| `make build` | Build de production |
| `make lint` / `make typecheck` / `make knip` | Vérifications |
| `make format` | Prettier |
| `make test` | Tests unitaires + composants |
| `make test-e2e` | Tests Playwright (installe Chromium au 1er run) |
| `make fix` | Format + lint |
| `make check` | build + lint + typecheck + knip + tests unitaires |

- **Port de dev** : 6661.
