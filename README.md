# Rubik Solver

Rubik's Cube 3D interactif et **pédagogique**, 100% front-end, en **2x2
(Pocket), 3x3 ou 4x4**, plus cinq cuboïdes : le **1x2x3**, la **tour 2x2x4**,
la **Slim Tower 2x2x3**, le **Domino 3x3x2** et le **Floppy 3x3x1**, et un
premier puzzle non cubique, le **Star Prism** (étoile à six branches, famille
du Square-1 ; manipulable, pas encore de méthode). On manipule le cube, on le mélange **ou on saisit sa
propre configuration** en peignant les stickers en 3D, puis on le résout selon
**plusieurs vraies méthodes**. La solution est découpée en **étapes nommées**
qu'on joue d'un coup ou **pas à pas**, pour apprendre la méthode.

## Fonctionnalités

- Cube 3D manipulable : rotations de faces, tranches (`M`, `E`, `S` sur 3x3,
  tranches internes sur 4x4) et coups larges, orbite caméra, recentrage animé.
  Au survol d'un bouton, les pièces qui vont tourner s'illuminent.
- **Méthodes de résolution**, chacune avec ses étapes, ses objectifs et ses
  coups autorisés (affichés, et vérifiés par le moteur) :
  - 3x3 : par couches, Fridrich (CFOP), **Roux**, **Petrus**, **ZZ** ;
  - 2x2 : par couches, et **optimale** (11 coups maximum) ;
  - 4x4 : **réduction** (centres, arêtes, parités) puis par couches ou CFOP ;
  - 1x2x3 : optimale ;
  - Floppy : **coins puis arêtes**, et optimale ;
  - tour 2x2x4 : **Deux Pockets** (remise en forme, Pocket intérieur, Pocket
    extérieur) ;
  - Slim Tower : **équateur puis coins** ;
  - Domino : **coins puis arêtes**.
- **Formes non cubiques** : le 1x2x3 (demi-tours seulement), la tour 2x2x4,
  qui se déforme comme la vraie (un coup est bloqué quand sa face n'est pas
  complète), le Domino et le Floppy (une seule couche, demi-tours seulement).
- **Version miroir** du 2x2, du 3x3 et du 4x4 (Mirror Blocks) : couches
  d'épaisseurs différentes et facettes toutes dorées, à résoudre par la forme.
- Mélange aléatoire, ou **saisie guidée** de son propre cube en peignant les
  stickers (aucune configuration incohérente possible, validation de solubilité).
- **Mémoriser / Restaurer** un état, conservé entre deux visites : pratique pour
  comparer deux méthodes sur le même mélange.
- Choix du cube par **vignettes** : les catégories, puis les puzzles, chacun
  avec son image (dessinée à partir de sa forme).
- Bilingue **FR/EN** et notation des mouvements **internationale (U D L R F B,
  par défaut)** ou **française (H B G D F Ar)**.
- Responsive : panneau repliable et cube empilé au-dessus de la saisie sur mobile.

## Démarrage

```bash
make install   # dépendances
make start     # http://localhost:6661
```

## Commandes utiles

| Commande        | Effet                                       |
| --------------- | ------------------------------------------- |
| `make start`    | Serveur de dev (port 6661)                  |
| `make build`    | Build de production                         |
| `make test`     | Tests unitaires + composants (Vitest)       |
| `make test-e2e` | Tests end-to-end (Playwright)               |
| `make check`    | build, lint, format, typecheck, knip, tests |
| `make fix`      | Format (Prettier) + lint                    |

## Stack

React 19 + TypeScript, Vite, React Three Fiber + drei (three.js), Tailwind CSS
v4, Zustand, Vitest + Testing Library, Playwright.

## Architecture

Le moteur du cube est de la **logique pure sans flottants** (`src/lib/`,
entièrement testée) ; le rendu 3D et les solveurs en sont des lecteurs. Voir
[AGENTS.md](./AGENTS.md) pour la documentation détaillée (arborescence,
solveurs, saisie, conventions).
