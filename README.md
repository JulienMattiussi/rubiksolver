# Rubik Solver

Rubik's Cube 3D interactif et **pédagogique**, 100% front-end, en **2x2
(Pocket), 3x3, 4x4 ou 5x5**, plus cinq cuboïdes (le **1x2x3**, la **tour 2x2x4**,
la **Slim Tower 2x2x3**, le **Domino 3x3x2** et le **Floppy 3x3x1**), le
**Floppy Ghost** (un Floppy Megaminx découpé en pentagramme, argenté) et des
puzzles non cubiques : le **Pyraminx**, le **Master Pyraminx** (4x4), le **Professor Pyraminx** (5x5), le
**Pyraminx Jing**, le **Pyramorphinx**, le **4-Trajber's Octahedron** (un 4x4x4 en octaèdre),
le **Rainbow** (un cuboctaèdre aux triangles qui tournent),
le **Violet** (un 2x2x2 à pivot excentré qui se déforme, sans méthode pour l'instant)
et les **Star Prism** à 2 et 4 étages.
On manipule le puzzle, on le mélange **ou on saisit sa propre
configuration** en peignant les stickers en 3D, puis on le résout selon
**plusieurs vraies méthodes**. La solution, affichée dès que le puzzle est au
repos, est découpée en **étapes nommées** qu'on joue d'un coup, étape par
étape ou coup par coup, dans les deux sens, pour apprendre la méthode.

## Fonctionnalités

- Puzzle 3D manipulable : rotations de faces, tranches (`M`, `E`, `S` sur 3x3,
  dans un onglet « Avancé » avec les coups larges ; tranches internes sur 4x4)
  et coups larges, orbite caméra, recentrage animé.
  Au survol d'un bouton, les pièces qui vont tourner s'illuminent.
- **Guide des mouvements** : chaque coup du puzzle animé sur le puzzle dans
  son état actuel, avec sa notation et une phrase qui le décrit (le coup et
  son opposé côte à côte, puis le coup quantifié) ; un coup impossible dans la
  configuration est signalé.
- **Méthodes de résolution**, chacune avec ses étapes, ses objectifs et ses
  coups autorisés (vérifiés par le moteur) :
  - 3x3 : par couches, Fridrich (CFOP), **Roux**, **Petrus**, **ZZ** ;
  - 2x2 : par couches, et **optimale** (11 coups maximum) ;
  - 4x4 : **réduction** (centres, arêtes, parités) puis par couches ou CFOP ;
  - 5x5 : **réduction** aussi, centres et arêtes par commutateurs (3-cycles),
    parité d'arête, puis par couches ou CFOP ;
  - 1x2x3 : optimale ;
  - Floppy : **coins puis arêtes**, et optimale ;
  - Floppy Ghost : **coins puis arêtes** (sommets placés, orientés, puis
    arêtes), et optimale ;
  - tour 2x2x4 : **Deux Pockets** (remise en forme, Pocket intérieur, Pocket
    extérieur) ;
  - Slim Tower : **équateur puis coins** ;
  - Domino : **coins puis arêtes** ;
  - Pyraminx : **centres d'abord** ;
  - Master et Professor Pyraminx : **ailes puis co-ailes** ;
  - Pyraminx Jing : **sommets d'abord** ;
  - Pyramorphinx : **comme un Pocket** ;
  - 4-Trajber's Octahedron : **sommets d'abord** ;
  - Rainbow : **triangle prolongé** ;
  - Star Prism : **isoler puis permuter** ;
  - 4-Star Prism : **deux étoiles** (l'interne puis l'externe).
- **Solution pas à pas** : le plan de la méthode dès son choix, puis la vraie
  solution calculée d'avance (en arrière-plan) ; on la joue d'un coup, étape
  par étape ou coup par coup, et on revient en arrière de la même façon, le
  coup en cours surligné dans sa séquence.
- **Formes non cubiques** : le 1x2x3 (demi-tours seulement), la tour 2x2x4,
  qui se déforme comme la vraie (un coup est bloqué quand sa face n'est pas
  complète), la Slim Tower et le Domino (côtés en demi-tours), le Floppy (une
  seule couche, demi-tours seulement), le Floppy Ghost (chaque côté se
  retourne et se couche de travers ; tout argenté, on le lit par la forme),
  les Pyraminx (sommets, tranches,
  pointes ; le Jing aux pièces courbes), le Pyramorphinx (un 2x2 taillé en
  tétraèdre, qui se déforme) et les Star Prism (tours d'étages et slash).
- **Version miroir** du 2x2, du 3x3 et du 4x4 (Mirror Blocks) : couches
  d'épaisseurs différentes et facettes toutes dorées, à résoudre par la forme.
- Mélange aléatoire, ou **saisie guidée** de son propre puzzle (tous) en
  peignant les stickers (aucune configuration incohérente possible,
  validation de solubilité) ; un puzzle déformable se saisit dans la forme où
  il se trouve, choisie parmi des vignettes ; le Floppy Ghost pièce par pièce
  (un clic pose la pièce suivante qui s'y loge).
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
[AGENTS.md](./AGENTS.md) pour la documentation détaillée (arborescence,
solveurs, saisie, conventions).
