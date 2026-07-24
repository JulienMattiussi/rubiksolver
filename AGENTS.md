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
│   └── solver.ts         # Solveur par couches (voir plus bas)
├── store/
│   └── cubeStore.ts      # Zustand : état logique du cube + file de rotations à animer + pilotage de l'animation
├── i18n/                 # i18n custom (FR source de vérité, EN typé complet), locale détectée puis persistée en mémoire
│   ├── translations.ts   # `fr` (source) + `en: Translations`
│   └── i18nStore.ts      # store Zustand `useI18n` (locale, t, setLocale)
├── three/                # Rendu 3D (React Three Fiber)
│   ├── Scene.tsx         # <Canvas> : caméra, lumières, OrbitControls
│   ├── CubeView.tsx      # Rend les 27 cubies depuis le store et anime la rotation active
│   ├── Cubie.tsx         # Un cubie : corps + stickers colorés orientés par leur normale
│   └── colors.ts         # Couleurs des stickers (hex) et plastique
├── components/
│   ├── ui/Button.tsx     # Primitive bouton réutilisable
│   └── Controls.tsx      # Panneau : statut, mélanger/résoudre/reset, vitesse, pad de rotations, solution
├── App.tsx               # Coquille : scène 3D plein écran + panneau de contrôles en overlay
└── main.tsx
tests/
├── helpers.ts            # RNG déterministe (seedRng) pour des scrambles reproductibles
├── unit/                 # Vitest : cube, moves, solver (dont propriété : N scrambles résolus)
├── component/            # Vitest + Testing Library (Controls)
└── e2e/                  # Playwright (smoke : montage 3D, mélange puis résolution)
```

### Le solveur (`src/lib/solver.ts`)

Méthode **par couches (débutant)**. Repère : le jaune (face D) est la première
couche, le blanc (face U) la dernière. Phases :

1. Croix du bas (jaune) - recherche de plus court chemin (BFS) sur les faces.
2. Coins du bas - recherche "aligner U puis appliquer un déclencheur" (jeu de
   gâchettes `R U R'`), sans casser l'acquis.
3. Arêtes de la couche du milieu - même principe (gâchettes d'insertion).
4. Croix du haut (orienter les arêtes) - `F R U R' U' F'` + AUF.
5. Orienter les coins du haut - Sune `R U R' U R U2 R'` + AUF.
6. Permuter les coins - A-perm (3-cycle pur) + AUF.
7. Permuter les arêtes - U-perm (3-cycle pur) + AUF.

Chaque phase trouve ses coups par une **petite recherche** dont l'objectif
inclut « ne pas régresser » : une séquence acceptée satisfait donc son but par
construction. Les solutions sont longues (méthode débutant) mais toujours
correctes ; c'est validé par un test de propriété qui résout des dizaines de
scrambles aléatoires et vérifie `isSolved`.

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
