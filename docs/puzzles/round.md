# Les cylindriques

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/round/`, méthodes : `src/lib/methods/round/`, dessins : `src/three/puzzles/round/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Star Prism (`src/lib/puzzles/round/star.ts`)

Le 2-Star Prism : une étoile à six branches sur deux étages
(un Rubik's UFO), 12 pièces (une branche chacune) et une vis centrale coupée
en deux. Ses coups (famille du Square-1) : tourner le haut ou le bas d'une
pièce (60°), ou le **slash**, demi-tour de toute la moitié droite, qui échange
ses 3 pièces du haut avec ses 3 du bas et retourne la demi-vis droite. Le
disque central ne tourne pas avec les pièces.

Le modèle reste **entier et exact** : des cubies en coordonnées hexagonales
axiales `[q, y, r]`, où un pas de 60° est l'application linéaire entière
`(q, r) -> (-r, q + r)` et le slash `(q, y, r) -> (-r, -y, -q)`. Chaque creux
de l'étoile a sa normale (`HEX_NORMALS`, indices 6 à 11 après les 6 faces du
cube), partagée par les deux faces qui le forment : « résolu » reste « chaque
direction d'une seule couleur » (`isSolved` inchangé). Couleurs : vert dessus,
bleu dessous, et sur les côtés orange, blanc, jaune, rouge, violet, rose (ces
deux dernières, `P` et `V`, propres à l'étoile).

Ses coups sont des `StarMove` (`RingMove` | slash) dans le `Turn` générique
(voir AGENTS.md). Vue 3D (`PolyView`, partagée avec les Pyraminx), vignette et pad (`StarPad` : chaque
étage, deux ou quatre, par paire +1 / -1, puis le slash) dédiés ; notation de fan2cube (`3`, `-2B`/`-2D`, `/`). Les
formules de fan2cube.fr/2-star1 sont vérifiées sur le modèle (`K =
/-1/1+B/-B/` échange deux sommets en haut et les deux du dessous ; `/3/3/`
retourne la demi-vis, le haut à remettre d'un `3`).

**Résolution** (`methods/round/starPrism.ts`, méthode **Isoler puis permuter**) :
(1) isoler les sommets (verts en haut, bleus en bas), recherche keyée sur la
seule répartition des couleurs, avec le slash et les deux placements de la
page (`/-1/1`, `/1+3B/`) ; (2) finir le bas avec `K` et des tours du bas ;
(3) finir le haut avec `K` et des tours du haut (deux `K` remettent le bas),
plus les deux cas singuliers de la page en formules : la demi-vis (`/3/3/`)
et l'échange de deux sommets du haut (`4(1+K)`).

**Saisie** : la saisie guidée des cubes ; les orientations du puzzle entier
sont ses symétries (`STAR_SYMMETRIES` : un sixième de tour et le demi-tour du
slash, 12 orientations), donc chaque emplacement de branche accepte les 12
branches dans le seul sens où elles y tiennent ; la demi-vis droite se peint
dans un sens ou l'autre. Sur le 4-Star, une
branche interne ne montre que ses deux côtés : une fois peints, leur ordre
dit dans quel sens elle est posée, et l'éditeur complète sa face cachée
(`SlotSticker.hidden`, jamais affichée ni comptée : `progress` ne compte que
les stickers visibles). La palette
montre les couleurs de la forme (`shapeColors` : rose et violet en plus).

**Le 4-Star Prism** (`star4`, fan2cube.fr/4-star1) : un Super Square-1 en
étoile, quatre étages (H, h, b, B ; `U`, `u`, `d`, `D` dans le modèle) qui
tournent chacun seul, le slash traversant tout. Les étages externes sont à
`y = ±2`, les internes à `y = ±1` (le 2-Star a donc aussi ses étages à ±2).
Le slash envoie l'externe sur l'externe et l'interne sur l'interne : ce sont
**deux 2-Stars** qui partagent la vis. Une pièce interne ne montre que ses
deux côtés, mais elle garde son sens (ses deux couleurs se lisent dans un
ordre ou l'autre) et le slash, qui la change d'étage, la retourne aussi :
elle reste à jamais une pièce « du haut » ou « du bas ». Le modèle lui donne
donc le sticker caché qui le dit (jamais dessiné), ce qui en fait exactement
une pièce externe un cran plus bas : `isSolved` reste juste. Notation : les
internes en minuscules (`2h`, `-b` ; `2u`, `-d` en US).

**Résolution** (`methods/round/starPrism4.ts`, méthode **Deux étoiles**, sans
nouvelle machinerie) : le plan du 2-Star est **projeté** (comme `projectPlan` sur
le 4x4) sur l'étoile interne (ses pièces ramenées à ±2, ses tours joués sur
`u`/`d`), qui remet aussi la vis, puis sur l'externe. Celle-ci part et finit
vis en place, donc slashe un nombre pair de fois sans tourner l'interne
entre deux slashs : l'étoile interne ne voit rien. Reste à aligner les deux
étoiles (`u` et `d` ensemble), chacune pouvant finir tournée d'un bloc.

## Le Hockey Puck (`puck`)

Le Hockey Puck a la mécanique des étoiles : un disque de deux étages de
douze pièces autour d'un centre
noir ; chaque étage tourne sur l'autre par crans de 30°, et le slash
(le pivot) retourne la moitié droite autour de l'axe perpendiculaire à sa
coupe : ses six pièces de chaque étage changent d'étage. Les pièces du haut
portent leur numéro (1 à 12) sur le dessus, celles du bas leur seule
couleur ; les couleurs vont par paires (1-2 rouge, 3-4 vert, 5-6 jaune, 7-8
orange, 9-10 bleu, 11-12 violet), le bas sous le haut, comme le vrai
puzzle. (fan2cube.fr/puck1 décrit un autre puck, d'un seul étage.)

**Modèle entier** (`lib/puzzles/round/puck.ts`, puzzle sans grille) : secteur m (0 à 11)
dans le plan x, y, l'étage du haut à z = 1, celui du bas à z = -1 ; un tour
de k crans envoie m sur m + k, le slash le secteur m (0 à 5) de chaque
étage sur le secteur 5 - m de l'autre. La face cachée d'une pièce (contre
l'autre étage) dit, pour le modèle seul, laquelle c'est (`puckNumber`) ; le
dessin la peint sombre. `puckSolved` : les numéros dans l'ordre en haut,
chaque paire sur sa couleur, le tout tourné comme on veut. Notation des
étoiles : `1`, `-2` en haut, `B`, `-2B` en bas (`D` en anglais), `/`.

**Rendu** (`three/puzzles/round/puckGeometry.ts`) : chaque pièce est un secteur d'anneau
de son étage, posé à plat (`PUCK_ORIENT`), le numéro en décalcomanie sur
sa face numérotée (`PolyDrawing.decal`, dont l'image dépend de la pièce) ;
le centre, deux demi-disques ronds aux faces graphite tenues à l'écart de la
coupe (un trait noir y montre l'axe du pivot, comme la vis des étoiles), sa
moitié droite basculant avec le slash.
**Saisie** pièce par pièce.

**Résolution** (`methods/round/puck.ts`, méthode **Isoler puis permuter**, aucune
page ne l'enseignant) : (1) isoler les pièces numérotées en haut, par une
recherche sur leur répartition, chaque pas étant des tours puis le slash ;
(2) ranger les couleurs du bas par échanges : K = / B / 1-B / -1 / échange
les deux pièces du haut de part et d'autre de la coupe et les deux du bas,
et sa famille `SWAPS` (/ dB / 1-B / -1 (1-d)B /) en échange d'éloignées de
d crans, des
tours avant et après visant n'importe quelle paire ; (3) ranger les numéros
du haut par 3-cycles, deux échanges de la même paire du bas (qui revient) ;
(4) aligner le haut sur le bas.

## Le Dino Cylinder (`dinoCyl`)

Le Dino Cylinder (fan2cube.fr/dinocylinder1 et 2) est
« comme un Dino mais il a des sommets en plus », taillé en cylindre aussi
haut que large. Ses sommets tournent d'un
tiers, chacun emportant ses trois arêtes et sa pièce de sommet, qui ne
bouge pas mais pivote. **Modèle** (`lib/puzzles/round/dinoCyl.ts`) : celui du Dino, ses
8 sommets ajoutés en (1, 1, 1)... aux couleurs de leurs trois faces ; les
tours du Dino (ce qui est à au moins 2 le long de la diagonale) les font
pivoter. **Rendu** (`three/puzzles/round/dinoCylGeometry.ts`) : un cylindre (normales
lissées) coupé par les plans des sommets, x + y + z = 1... (ceux
du Dino) ; chaque pièce dessinée chez elle puis portée par la rotation qui
l'amène où elle est, si bien qu'il se déforme : un sommet pivoté, une
arête changée de rangée, dépasse du cylindre. Disques du haut et du bas :
les quarts des arêtes du haut et du bas ; sur le flanc, les petits
triangles des sommets et les « yeux » des arêtes du milieu ; chaque pan
de la couleur du sticker qu'il regarde le plus. Tenu un sommet devant,
comme la page. **Saisie** pièce par pièce (ses formes, des centaines de
milliers, ne tiendraient pas en vignettes).

**Résolution** (`methods/round/dinoCyl.ts`, méthode **Étage par étage**, d'après
la page) : les trois étages du Dino par [GA'] (`dinoLayers` de
`methods/diagonal/dino.ts` : deux arêtes d'un étage restées échangées, il se finit
avec celles d'en dessous), la cible donnée par les sommets (qui ne bougent
jamais : la page n'a qu'une solution ici, nos couleurs étant celles du
cube) ; puis les sommets pivotés un à un par (A)+ = [AD]A'[DA'], qui ne
tourne que le sommet A, joué aussi à l'envers.

## Le Barrel (`barrel`)

Le Barrel (fan2cube.fr/barrel1 et 2) est un 3x3x3 dont les quatre
arêtes verticales sont tronquées jusqu'à la colonne du milieu de chaque
face : un prisme octogonal. Chaque coupe est une
face de sa couleur (rose, violet, turquoise, vert citron), faite d'un coin
du haut, d'une arête du milieu et d'un coin du bas, chacun réduit à un
triangle : un coin ne montre que son haut (ou son bas) et sa coupe, une
arête du milieu sa coupe seule, si bien que son sens ne se voit pas : ce
sont les arêtes fines du Z-Twist (`lib/puzzles/shared/thinEdges.ts`, voir
[twisted.md](twisted.md)). Le modèle est le 3x3 aux couleurs standard,
sans son cœur caché (ce qui le distingue du 3x3 pour `cubeShape`) ; tourné
hors de sa colonne, un coin coupé laisse une encoche, une arête entière
dépasse : il se déforme, sans blocage. Rendu (`three/core/cutSolid.ts`, partagé
avec le Fisher Cube) : chaque pièce est sa case du 3x3 (ouverte vers
l'extérieur) coupée par les plans du solide, portée par la rotation qui
l'amène où elle est. **Saisie** pièce par pièce.

**Résolution** (`methods/round/barrel.ts`, méthode **Par couches**, d'après la
page) : la couche du bas comme un Rubik's Cube ; les arêtes du milieu
placées par [HD].[H'A'], dans un sens ou l'autre ; les coins du haut
tournés (Sune) puis placés (Aa) ; les arêtes du haut placées par le 3-cycle
D².HAP'.D².PA'H.D² ; retournées deux par deux par DPGAH.A'HG'P'D'.A'H'AH',
ou une seule par HGBDA.D'AB'G'H'.D'A'DA', qui retourne avec elle une arête
du milieu (la singularité de la page). Les méthodes du 3x3 (CFOP, Petrus,
ZZ) le résolvent aussi telles quelles.
