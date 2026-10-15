# Rubik Solver

Rubik's Cube 3D interactif et **pédagogique**, 100% front-end, sur plus de
50 puzzles en 11 catégories : les cubes standards du 2x2 au 6x6 (et leurs
versions miroir), des tours et cuboïdes (Domino, Floppy, 2x2x4...), des
pyramides (Pyraminx et sa famille), des polyèdres (octaèdres, Megaminx,
Rainbow...), des cylindriques (Star Prism, Hockey Puck...), des Gear Cubes,
des coupes diagonales (Dino, Rex...), des troués et des puzzles torturés.
On manipule le puzzle, on le mélange **ou on saisit sa propre
configuration** en peignant les stickers en 3D, puis on le résout selon
**plusieurs vraies méthodes**. La solution, affichée dès que le puzzle est au
repos, est découpée en **étapes nommées** qu'on joue d'un coup, étape par
étape ou coup par coup, dans les deux sens, pour apprendre la méthode.

## Fonctionnalités

- Puzzle 3D manipulable : rotations de faces, tranches (`M`, `E`, `S` sur 3x3,
  dans un onglet « Avancé » avec les coups larges ; tranches internes sur les
  grands cubes et les tours)
  et coups larges, orbite caméra, recentrage animé.
  Au survol d'un bouton, les pièces qui vont tourner s'illuminent.
- **Guide des mouvements** : chaque coup du puzzle animé sur le puzzle dans
  son état actuel, avec sa notation et une phrase qui le décrit (le coup et
  son opposé côte à côte, puis le coup quantifié) ; un coup impossible dans la
  configuration est signalé.
- **Méthodes de résolution**, chacune avec ses étapes, ses objectifs et ses
  coups autorisés (vérifiés par le moteur) :
  - 3x3 : par couches, Fridrich (CFOP), **Roux**, **Petrus**, **ZZ** ;
  - 2x2 : par couches ; 2x2 et petits puzzles (1x2x3, Floppy, Purple...) :
    **optimale** aussi ;
  - 4x4, 5x5 et 6x6 : **réduction** (centres, arêtes, parité), puis par couches ou CFOP ;
  - chaque autre puzzle : une méthode à lui, le plus souvent celle de
    fan2cube.fr (voir [docs/methods.md](./docs/methods.md)).
- **Solution pas à pas** : le plan de la méthode dès son choix, puis la vraie
  solution calculée d'avance (en arrière-plan) ; on la joue d'un coup, étape
  par étape ou coup par coup, et on revient en arrière de la même façon, le
  coup en cours surligné dans sa séquence.
- **Puzzles qui se déforment** (tours, Purple, Pyramorphinx, Barrel...) : un
  coup que la forme bloque est grisé.
- **Version miroir** du 2x2, du 3x3 et du 4x4 (Mirror Blocks) : couches
  d'épaisseurs différentes et facettes toutes dorées, à résoudre par la forme.
- Mélange aléatoire, ou **saisie guidée** de son propre puzzle (tous) en
  peignant les stickers (aucune configuration incohérente possible,
  validation de solubilité) ; un puzzle déformable se saisit dans la forme où
  il se trouve, choisie parmi des vignettes, et certains pièce par pièce.
- Un petit **feu d'artifice** quand le puzzle arrive résolu.
- **Page d'accueil** : une galerie de modèles à choisir, et ce qu'on peut
  faire avec (saisie, guide, résolution).
- **Une adresse par puzzle et par langue** : `#/fr/floppy-ghost`,
  `#/en/3x3-mirror`... à partager ; les boutons précédent / suivant du
  navigateur passent d'un puzzle à l'autre.
- **Mémoriser / Restaurer** un état, conservé entre deux visites : pratique pour
  comparer deux méthodes sur le même mélange.
- Choix du puzzle par **vignettes** : les catégories, puis les puzzles, chacun
  avec son image (dessinée à partir de sa forme).
- Bilingue **FR/EN** et notation des mouvements **internationale (U D L R F B,
  par défaut)** ou **française (H B G D F Ar)**.
- Responsive : panneau repliable et puzzle empilé au-dessus de la saisie sur
  mobile.

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
[AGENTS.md](./AGENTS.md) pour l'architecture (arborescence, fiche d'un puzzle,
solveurs, saisie, conventions), et [docs/](./docs) pour le détail de chaque
puzzle (`docs/puzzles/<catégorie>.md`), des méthodes et de l'interface.
