# Rubik Solver - Agent File

## Description du projet

POC d'un **Rubik's Cube 3D interactif** avec **solveur automatique**. On
manipule le cube (rotations de faces à la souris/aux boutons, orbite caméra),
on le mélange, puis un solveur calcule une suite de rotations qui le résout et
l'animation la joue pas à pas.

Application **100% front-end**, sans backend. Interface **français par défaut**
(bascule anglais), langue détectée depuis le navigateur.

---

## Stack technique

| Outil | Usage |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Build / dev server |
| React Three Fiber + drei | Rendu 3D déclaratif (three.js) et OrbitControls |
| three | Moteur 3D sous-jacent |
| Tailwind CSS v4 | Styles (via `@tailwindcss/vite`, pas de config JS) |
| Zustand | État global (cube, file d'animation, i18n) |
| Vitest + Testing Library | Tests unitaires et composants |
| Playwright | Tests e2e |
| Prettier | Formatage |
| ESLint (typescript-eslint) | Linting |
| Knip | Détection du code / dépendances inutilisés |

Standard maison React + Vite + Zustand + Tailwind, aligné sur les dépôts
voisins (ex : `big-bang-clicker`).

---

## Architecture

> Principe : **le moteur du cube est de la logique pure, sans flottants**. Le
> cube est modélisé par 27 cubies à coordonnées entières dans `{-1,0,1}^3` ;
> une rotation de face est une rotation entière exacte à 90 degres, donc l'état
> logique ne dérive jamais. Le rendu 3D est une **fonction pure de cet état** ;
> le solveur lit le même modèle.

```
src/
├── lib/                  # Logique pure, zéro React / zéro three.js (entièrement testée)
│   ├── types.ts          # Types du domaine (Face, Color, Axis, Vec3, Sticker, Cubie, Cube, Move)
│   ├── cube.ts           # Modèle 27-cubies : solvedCube, applyMove(s), isSolved, moveGeometry (axe/couche/angle pour l'animation)
│   ├── moves.ts          # Notation (parse/format), inversion, simplification, mélange (scramble) avec RNG injectable
│   ├── solver.ts         # Solveurs par méthode (voir plus bas) : SOLVE_METHODS, chaque méthode renvoie ses étapes nommées (SolveStep[])
│   ├── editor.ts         # Saisie guidée : 24 orientations -> placements valides par emplacement, peinture contrainte + auto-complétion, buildCube/cubeToEdit
│   └── validate.ts       # validateCube : comptage des couleurs + solubilité (via une tentative de résolution)
├── store/
│   ├── cubeStore.ts      # Zustand : état logique du cube + file de rotations à animer + pilotage de l'animation ; méthode choisie, étapes de la solution, jouer tout / pas à pas (loadCube pour charger un état)
│   └── editorStore.ts    # Zustand : mode play/edit, couleur sélectionnée, état de saisie, apply (build + validate + charge dans le jeu)
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet), locale détectée puis persistée en mémoire
│   ├── translations.ts   # `fr` (source) + `en: Translations`
│   └── i18nStore.ts      # store Zustand `useI18n` (locale, t, setLocale)
├── three/                # Rendu 3D (React Three Fiber)
│   ├── Scene.tsx         # <Canvas> : caméra, lumières, OrbitControls ; bascule CubeView / EditView selon le mode
│   ├── CubeView.tsx      # Rend les 27 cubies depuis le store et anime la rotation active
│   ├── EditView.tsx      # Mode saisie : stickers cliquables (peinture) ; vides en gris
│   ├── Cubie.tsx         # Un cubie : corps + stickers colorés orientés par leur normale
│   └── colors.ts         # Couleurs des stickers (hex) et plastique
├── components/
│   ├── ui/Button.tsx     # Primitive bouton réutilisable
│   ├── Controls.tsx      # Panneau : statut, mélanger/reset, saisie, vitesse, pad de rotations
│   ├── SolvePanel.tsx    # Choix de méthode + Résoudre / Pas à pas + liste des étapes nommées (apprentissage)
│   └── EditPanel.tsx     # Panneau de saisie : palette (couleurs + restants), progression, effacer, utiliser/annuler
├── App.tsx               # Coquille : scène 3D plein écran + panneau de contrôles en overlay
└── main.tsx
tests/
├── helpers.ts            # RNG déterministe (seedRng) pour des scrambles reproductibles
├── unit/                 # Vitest : cube, moves, solver (dont propriété : N scrambles résolus)
├── component/            # Vitest + Testing Library (Controls)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution)
```

### Les solveurs par méthode (`src/lib/solver.ts`)

Le but est **pédagogique** : proposer plusieurs **vraies méthodes** et faire
**apprendre leurs étapes**, pas minimiser le nombre de coups. Chaque méthode est
définie par son **cheminement propre** (sa suite d'objectifs) et renvoie ses
**étapes nommées** (`SolveStep[]`), que l'UI joue une par une. Repère commun :
le jaune (face D) est la première couche, le blanc (face U) la dernière.

Méthodes (`SOLVE_METHODS`) :

- **Par couches** (`beginner`) : 1re couche entière (croix + coins), puis arêtes
  du milieu, puis dernière couche (croix, orientation coins, permutation coins,
  permutation arêtes) - 7 étapes, cheminement étage par étage.
- **Fridrich / CFOP** (`cfop`) : Croix, puis **F2L** (paires coin+arête par
  colonne), puis **OLL**, puis **PLL** - 4 étapes.

Les briques de résolution sont partagées et **correctes par construction** :
la croix par recherche de plus court chemin (BFS sur les faces) ; les insertions
et la dernière couche par recherche « aligner U puis appliquer un algorithme »
(gâchettes `R U R'`, `F R U R' U' F'`, Sune, A-perm/U-perm en 3-cycle) dont
l'objectif inclut « ne pas régresser ». Ce qui **distingue** les méthodes, c'est
donc leur *découpage en étapes* (le cheminement), pas la machinerie bas niveau.
Les solutions ne sont pas optimisées (longues) mais toujours correctes ; validé
par un test de propriété qui résout des dizaines de scrambles pour chaque
méthode et vérifie `isSolved`.

> Ajouter une méthode à cheminement vraiment différent (ex. "arêtes d'abord",
> Petrus par blocs) demande sa propre machinerie (placer les coins sans casser
> les arêtes, construire des blocs 2x2x2...), pas seulement un réétiquetage.

### La saisie d'un cube (`src/lib/editor.ts`, `validate.ts`)

L'utilisateur peut initialiser le cube depuis une position réelle en peignant
les stickers directement sur le rendu 3D (mode édition). Deux garde-fous :

- **Saisie guidée** : on précalcule, à partir des 24 orientations d'un cube
  résolu, tous les placements de pièce valides par emplacement. Un clic n'est
  accepté que s'il reste compatible avec un placement valide non déjà utilisé ;
  dès qu'une pièce est déterminée (2 stickers d'un coin), les stickers restants
  se complètent automatiquement. Impossible donc de créer une pièce ou un
  compte de couleurs incohérent pendant la saisie.
- **Validation finale** : `validateCube` vérifie le comptage des couleurs puis
  la solubilité (parités). La solubilité est testée en demandant une résolution :
  sur un cube impossible (mauvaise parité, pièce en trop/manquante), les phases
  du solveur épuisent leurs options et lèvent une exception, qu'on intercepte.

---

## Contraintes techniques

- **100% front-end** : aucun appel réseau, pas de backend.
- **Pas de SSR** : Vite SPA uniquement.
- **Alias `@/`** vers `src/`. Toujours l'utiliser pour les imports internes.
- **`src/lib/` est pur** : aucun import React ni three.js. Le rendu et le store
  dépendent de `lib`, jamais l'inverse.
- **État entier, sans flottants** : positions et normales restent dans
  `{-1,0,1}`. Ne pas introduire de trigonométrie dans la logique du cube ;
  l'angle visuel est calculé par `moveGeometry` uniquement pour l'animation.
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
- **Logique pure entièrement testée** (cube, moves, solver).
- **Accessibilité** : cliquables = boutons étiquetés, focus visible, icônes
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
