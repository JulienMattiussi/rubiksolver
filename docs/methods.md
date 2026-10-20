# Les méthodes de résolution

Chaque méthode, ses puzzles et ses étapes (registre : `src/lib/solve/solver.ts`). Les principes communs (plans déclarés, contrat des étapes, briques) sont dans [AGENTS.md](../AGENTS.md).

**Méthodes enseignées.** Sur un puzzle qui a un tutoriel, la méthode qu'il
enseigne est ce tutoriel joué jusqu'au bout (`lib/teach/method.ts`) : ses
étapes sont celles du tutoriel, chacune résolue par les formules qu'il
propose l'une après l'autre ; la solution affichée est donc ce qu'il
enseigne. C'est le cas de **Par couches** sur le 3x3 et le 2x2, d'**Ofapel** sur le 3x3, de la
**Réduction** du 4x4, du 5x5 et des super cubes, de **Centres d'abord** sur le Pyraminx et de **Comme
un Pocket** sur le Pyramorphinx ; leurs étapes sont décrites avec leur
tutoriel ([standard](puzzles/standard.md), [pyramid](puzzles/pyramid.md)).
Les mêmes méthodes sur les autres puzzles (le 3x3 par couches comme phase
du Void Cube, du 6x6...) gardent leur plan déclaré.

## Les méthodes du 3x3 et des cubes

Sur le 3x3, le Fisher Cube, le Windmill et le Master Morphinx (pas le
Z-Twist, le Barrel ni le Void Cube, sans centres : voir
[holey](puzzles/holey.md)), toutes les méthodes 3x3 commencent par **Cube tenu comme
il faut** (une rotation du cube entier, `withCentersHome`, voir « Coups avancés du 3x3 »,
[standard](puzzles/standard.md)), étape retirée quand elle est vide ; les
nombres d'étapes ci-dessous ne la comptent pas.

- **Par couches** (`beginner`, 3x3, Void Cube, Z-Twist, Fisher Cube, Windmill, Master Morphinx et 2x2 ; aussi
  le Fused et le Squarebik, voir [bandaged](puzzles/bandaged.md)) : sur 3x3, 1re couche entière
  (croix + coins), puis arêtes du milieu, puis dernière couche (croix,
  orientation coins, permutation coins, permutation arêtes) - 7 étapes,
  celles de son plan déclaré, que suivent les autres puzzles ; le 3x3 et
  le 2x2 jouent leur tutoriel (voir plus haut).
- **Ofapel** (`ofapel`, 3x3, d'après francocube.com/ofapel) : une variante
  « coins d'abord » qui joue son tutoriel (voir plus haut) : croix, coins
  du bas, coins du haut placés puis tournés, arêtes du haut remontées de la
  couronne du milieu, puis la fin en tranche `M` - 6 étapes.
- **Fridrich / CFOP** (`cfop`, 3x3, Void Cube, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx) : Croix, puis **F2L** (paires coin+arête
  par colonne), puis **OLL**, puis **PLL** - 4 étapes.
- **Réduction** (`reduction` et `reductionCfop`, 4x4, 5x5 et 6x6, Super
  Revenge et Super Professor) : Centres, Appariement des arêtes, Correction
  de parité (étape émise seulement si nécessaire), puis la phase 3x3 de la
  méthode choisie (par couches ou CFOP) ; sur les super cubes, leurs centres
  ensuite ([standard](puzzles/standard.md)). La réduction par couches du
  4x4, du 5x5 et des super cubes joue son tutoriel (ses parités, chacune
  son étape, là où elles se voient) ; le plan du solveur sert alors à
  prouver qu'un état saisi est soluble (`PROOFS`).
- **Roux** (`roux`, 3x3, Void Cube) : premier bloc 1x2x3 à gauche (arête DL, paire
  avant, paire arrière), second bloc à droite en `<U, R, M, r>` seulement,
  CMLL en 2 temps (orienter avec Sune/Antisune, permuter), puis les six
  dernières arêtes en `<M, U>` : orientation, UL/UR, tranche M en `<M, U2>` -
  6 étapes.
- **Petrus** (`petrus`, 3x3, Void Cube, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx), les 7 étapes de Lars Petrus : bloc 2x2x2 (DBL),
  extension en 2x2x3 en `<U, R, F>` (ne touchent pas le 2x2x2), arêtes
  orientées (F et B n'apparaissent que dans `F' U F` / `B U B'`, qui
  préservent le bloc), fin du F2L en `<R, U>` seulement, puis coins placés
  (Niklas), coins tournés (Sune/Antisune), arêtes placées (Ua).
- **ZZ** (`zz`, 3x3, Void Cube, Z-Twist, Barrel, Fisher Cube, Windmill et Master Morphinx) : EOLine (les 12 arêtes orientées, puis DF/DB en coups
  qui ne retournent rien : `U D L R F2 B2`), bloc gauche en `<L, U, R>`, bloc
  droit en `<R, U>` (aucun quart de tour de F ou B après l'EOLine), OCLL, PLL -
  5 étapes.
- **Optimale** (`optimal`, 2x2, 1x2x3, Floppy, Floppy Ghost et Purple) : recherche exhaustive,
  solution la plus courte possible (11 coups max sur 2x2, 6 sur 1x2x3, 8 sur
  Floppy, 15 sur Floppy Ghost, 30 sur Purple), une seule étape.

## Les méthodes des autres puzzles

Leurs étapes sont décrites dans la fiche de chaque puzzle (section
« Résolution »).

| Méthode (id)                                    | Puzzles                                                                        | Fiche                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Coins d'abord (`gearCornersFirst`)              | Gear Cube, Gear Cube Ultimate                                                  | [gear](puzzles/gear.md)                                                             |
| Équateur puis coins (`gearEquatorFirst`)        | Gear Cube Extreme                                                              | [gear](puzzles/gear.md)                                                             |
| Par couches (`dinoCylLayers`)                   | Dino Cylinder                                                                  | [round](puzzles/round.md)                                                           |
| Par couches (`dinoLayers`)                      | Dino Cube                                                                      | [diagonal](puzzles/diagonal.md)                                                     |
| Arêtes, centres, pétales (`rexEdgesFirst`)      | Rex Cube                                                                       | [diagonal](puzzles/diagonal.md)                                                     |
| Croix prolongée (`extendedCross`)               | Tori, Edge Only                                                                | [holey](puzzles/holey.md)                                                           |
| Les sommets du bas d'abord (`voidCornersFirst`) | Void Cube                                                                      | [holey](puzzles/holey.md)                                                           |
| Les arêtes d'abord (`copterEdgesFirst`)         | Curvy Copter, Curvy Copter III                                                 | [diagonal](puzzles/diagonal.md)                                                     |
| Les arêtes d'abord (`quarterEdgesFirst`)        | Quarter Cube                                                                   | [twisted](puzzles/twisted.md)                                                       |
| Les arêtes d'abord (`latchEdgesFirst`)          | Latch Cube                                                                     | [twisted](puzzles/twisted.md)                                                       |
| Coucher puis deux tours (`fashionLaid`)         | Fashion-V                                                                      | [twisted](puzzles/twisted.md)                                                       |
| Forme puis couleurs (`shapeFirst`)              | Purple                                                                         | [twisted](puzzles/twisted.md)                                                       |
| Méthode des blocs (`aiBlocks`)                  | AI Cube                                                                        | [bandaged](puzzles/bandaged.md)                                                     |
| Méthode des centres (`rbCenters`)               | RoadBlock-I                                                                    | [bandaged](puzzles/bandaged.md)                                                     |
| Depuis START (`fromStart`)                      | QuadStripe, Detour, Diamond, Bandage Cube, Quad, Stripe, FusedStripe, Alcatraz | [bandaged](puzzles/bandaged.md)                                                     |
| Réduction en Domino (`camoReduction`)           | Camouflage 4x4x2                                                               | [tower](puzzles/tower.md)                                                           |
| Deux Pockets (`twoPockets`)                     | tour 2x2x4                                                                     | [tower](puzzles/tower.md)                                                           |
| Sommets, arêtes, équateur (`tower234Steps`)     | tour 2x3x4                                                                     | [tower](puzzles/tower.md)                                                           |
| Double Domino (`doubleDomino`)                  | tour 3x3x4                                                                     | [tower](puzzles/tower.md)                                                           |
| Réduction (`towerReduction`)                    | tours 4x4x3, 4x4x5, 5x5x4                                                      | [tower](puzzles/tower.md)                                                           |
| Équateur puis coins (`equatorFirst`)            | Slim Tower 2x2x3                                                               | [tower](puzzles/tower.md)                                                           |
| Coins puis arêtes (`cornersFirst`)              | Domino, Floppy, Floppy Ghost, BigBlock                                         | [tower](puzzles/tower.md), [flat](puzzles/flat.md), [bandaged](puzzles/bandaged.md) |
| Isoler puis permuter (`isolateFirst`)           | 2-Star Prism                                                                   | [round](puzzles/round.md)                                                           |
| Deux étoiles (`twoStars`)                       | 4-Star Prism                                                                   | [round](puzzles/round.md)                                                           |
| Isoler puis permuter (`puckIsolate`)            | Hockey Puck                                                                    | [round](puzzles/round.md)                                                           |
| Par couches (`barrelLayers`)                    | Barrel                                                                         | [round](puzzles/round.md)                                                           |
| Centres d'abord (`centersFirst`)                | Pyraminx, Tetraminx                                                            | [pyramid](puzzles/pyramid.md)                                                       |
| Ailes puis co-ailes (`wingsFirst`)              | Master et Professor Pyraminx                                                   | [pyramid](puzzles/pyramid.md)                                                       |
| Sommets d'abord (`jingCornersFirst`)            | Pyraminx Jing                                                                  | [pyramid](puzzles/pyramid.md)                                                       |
| Comme un Pocket (`asPocket`)                    | Pyramorphinx                                                                   | [pyramid](puzzles/pyramid.md)                                                       |
| Sommets d'abord (`octCornersFirst`)             | 4-Trajber's Octahedron                                                         | [polyhedron](puzzles/polyhedron.md)                                                 |
| Centres puis arêtes (`vtoCentersFirst`)         | Octahedron VTO                                                                 | [polyhedron](puzzles/polyhedron.md)                                                 |
| Centres d'abord (`gemCentersFirst`)             | GEM-0                                                                          | [polyhedron](puzzles/polyhedron.md)                                                 |
| Sommets, centres, arêtes (`ftoCornersFirst`)    | FTO                                                                            | [polyhedron](puzzles/polyhedron.md)                                                 |
| Triangle prolongé (`extendedTriangle`)          | Rainbow                                                                        | [polyhedron](puzzles/polyhedron.md)                                                 |
| L'étoile prolongée (`megaStar`)                 | Megaminx, Holey Megaminx                                                       | [polyhedron](puzzles/polyhedron.md)                                                 |
| Les sommets d'abord (`crystalCornersFirst`)     | Pyraminx Crystal                                                               | [polyhedron](puzzles/polyhedron.md)                                                 |
| Le haut d'abord (`skewbTopFirst`)               | Skewb, Skewb Ultimate                                                          | [diagonal](puzzles/diagonal.md), [polyhedron](puzzles/polyhedron.md)                |
| Skewb d'abord (`skewbFirst`)                    | Master Skewb                                                                   | [diagonal](puzzles/diagonal.md)                                                     |
