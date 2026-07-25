# Rubik Solver

Rubik's Cube 3D interactif et **pédagogique**, 100% front-end, en **2x2 ou
3x3**. On manipule le cube, on le mélange **ou on saisit sa propre
configuration** en peignant les stickers en 3D, puis on le résout selon
**plusieurs vraies méthodes** (par couches, Fridrich/CFOP, optimale sur 2x2).
La solution est découpée en **étapes nommées** qu'on joue d'un coup ou **pas à
pas**, pour apprendre la méthode.

## Fonctionnalités

- Cube 3D manipulable (rotations de faces, orbite caméra, recentrage animé).
- **Choix de la taille** : 2x2 ou 3x3, avec les méthodes adaptées à chacune
  (dont une résolution **optimale** du 2x2, 11 coups maximum).
- Mélange aléatoire, ou **saisie guidée** de son propre cube en peignant les
  stickers (aucune configuration incohérente possible, validation de solubilité).
- **Résolution par méthode** au choix, expliquée **étape par étape**.
- Bilingue **FR/EN** et notation des mouvements **française (H B G D F Ar)** ou
  **internationale (U D L R F B)**.
- Responsive : panneau repliable et cube empilé au-dessus de la saisie sur mobile.

## Démarrage

```bash
make install   # dépendances
make start     # http://localhost:6661
```

## Commandes utiles

| Commande | Effet |
|---|---|
| `make start` | Serveur de dev (port 6661) |
| `make build` | Build de production |
| `make test` | Tests unitaires + composants (Vitest) |
| `make test-e2e` | Tests end-to-end (Playwright) |
| `make check` | build + lint + typecheck + knip + tests |
| `make fix` | Format (Prettier) + lint |

## Stack

React 19 + TypeScript, Vite, React Three Fiber + drei (three.js), Tailwind CSS
v4, Zustand, Vitest + Testing Library, Playwright.

## Architecture

Le moteur du cube est de la **logique pure sans flottants** (`src/lib/`,
entièrement testée) ; le rendu 3D et les solveurs en sont des lecteurs. Voir
[AGENTS.md](./AGENTS.md) pour la documentation détaillée (arborescence,
solveurs, saisie, conventions).
