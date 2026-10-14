# Les coupes diagonales

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/diagonal/`, méthodes : `src/lib/methods/diagonal/`, dessins : `src/three/puzzles/diagonal/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Dino Cube (`dino`)

Le Dino Cube (fan2cube.fr/dinocube1 et 2) a la mécanique du Rainbow : chaque sommet tourne d'un tiers de tour et
fait un 3-cycle des trois arêtes autour de lui. Ses 12 pièces sont ces
arêtes, deux triangles chacune (les faces coupées le long de leurs
diagonales), sans centre. Le modèle est celui du Rainbow
(`lib/puzzles/shared/rainbow.ts` : `solvedDino` garde ses arêtes et leurs carrés, `RainbowMove.dino` sa
notation : les lettres de fan2cube, A D P G en haut, B E H O en bas ; UFR...
en anglais). Rendu (`three/puzzles/shared/dinoGeometry.ts`) :
chaque arête est la part du cube où ses deux coordonnées sont les plus
grandes.

**Résolution** (`methods/diagonal/dino.ts`, méthode **Étage par étage**) : une seule
formule, [GA'] = GA'G'A ((HA)->(HD)->(HG)) : le haut, l'équateur,
le bas. Rien n'est fixe : la cible est la tenue du puzzle résolu la plus
proche ; et il se résout de deux façons (gauche et droite échangées, un
miroir), dont une seule à un nombre pair d'échanges, celle qu'on vise.

## Le Rex Cube (`rex`)

Le Rex Cube (fan2cube.fr/rexcube1 et 2) est le Dino
coupé plus profond : un tiers de
tour d'un sommet emporte ses 3 arêtes, les 3 centres autour et 9 pétales
(testé). 12 arêtes, 6 centres, 24 pétales. Même modèle (`solvedRex`, `RainbowMove.rex` : un sommet tourne ce
qui est à au moins 4 le long de sa diagonale, en quarts de demi-côté : centres
à 4, arêtes en (3, 3, 0), pétales en (2, 4, 2)), même notation que le Dino,
boîte de 9 (`dims` de sa carte). Rendu (`three/puzzles/diagonal/rexGeometry.ts`) : chaque face
coupée par quatre cercles, chacun passant par les deux coins voisins du sien,
son centre au-delà du coin (le carré central fait moitié moins que s'il y était) ; une
région est tracée par rayons depuis un point intérieur, puis posée en plaque
épaisse. Pendant un tour, la sphère de coupe du sommet (celle qui porte ses
cercles) est dessinée, immobile, comme sur le Jing (`rexCut`).

**Résolution** (`methods/diagonal/rex.ts`, méthode **Arêtes, centres, pétales**,
d'après la page) : (1) les arêtes par 3-cycles, [GA'] ; (2) les centres par
3-cycles, [DG'] ; (3) les pétales, avec [DG'][D'B], qui échange deux paires
de pétales d'une même face (rien de visible sur une face finie) : préparé
par un ou deux tours puis rejoué, il donne des 3-cycles de pétales. Les
pétales forment deux familles de 12 que rien ne mélange (ceux qui pointent
vers les sommets d'un tétraèdre ou de l'autre) : chacune se place à son
tour, les pétales d'une couleur étant interchangeables. Cible choisie comme
sur le Dino (tenue, et gauche et droite échangées), à permutations paires
d'arêtes et de centres.

## Le Fisher Cube (`fisher`)

Le Fisher Cube (fan2cube.fr/fishercube1 et 2) est « un
Rubik's Cube déguisé » : le mécanisme d'un 3x3x3, taillé dans un cube tourné
d'un huitième autour de la verticale. Vu
de dessus, son carré du haut est posé sur une pointe de la grille du
mécanisme : le centre du haut et celui du bas sont des carrés, dont le quart
de tour ne se voit pas ; les centres de côté sont des coins le long de ses
arêtes verticales, qui montrent le leur (tourné, un coin se couche) ; les
arêtes du milieu sont au milieu de ses faces, d'une seule couleur, sans sens
visible (comme au Barrel). Il se déforme, sans blocage. Modèle
(`lib/puzzles/diagonal/fisher.ts`) : le 3x3, chaque centre de côté portant un sticker caché,
son repère (couleur `H`, jamais dessiné), pointé vers le centre blanc une
fois résolu : tout coup le porte (une tranche aussi), rien d'autre n'a à le
savoir ; ces stickers en plus le distinguent pour `cubeShape`. Rendu
(`three/puzzles/diagonal/fisherGeometry.ts`, `cutSolid.ts`), tourné d'un seizième pour
montrer deux faces. **Saisie** pièce par pièce (un centre de côté prend ses
quatre sens).

**Résolution** (`methods/diagonal/fisher.ts`) : « exactement comme un Rubik's Cube »,
une méthode du 3x3 (par couches, CFOP, Petrus, ZZ) jouée sur ses couleurs
(les repères mis de côté, après « Remettre les centres »), puis **Tourner
les centres** avec la formule de la page (H)+(G)- = Hd'h'd.H'd'hd : elle
tourne le centre de gauche et celui du haut, un carré qui n'en montre rien,
donc un centre de côté seul ; jouée aussi à l'envers, elle tourne
n'importe lequel dans un sens ou l'autre.

Le **Windmill** (`windmill`, fan2cube.fr/windmill1 et 2), le jumeau du
Fisher Cube : le même
mécanisme, son cube tourné seulement de l'angle qui pose chacune de ses
arêtes verticales sur une coupe (cos − sin = 1/3, environ 31,4°,
`three/puzzles/diagonal/windmillGeometry.ts`). Chaque côté montre deux colonnes du
mécanisme : celle d'un coin (ses sommets, qui n'y montrent que deux
couleurs, et son arête du milieu, une seule) et celle d'un centre (son
centre, un rectangle, et ses deux arêtes). Ses centres de côté sont
taillés dans les côtés penchés : tournés, même d'un demi-tour, ils
dépassent ; ils portent le repère du Fisher Cube, plus un second le long de
leur face, qui le suit sans rien dire de plus mais distingue le Windmill
pour `cubeShape`. Ses arêtes du milieu montrent aussi leur sens, sa géométrie
suivant la pièce (`cutSolid.ts` retrouve la rotation d'une pièce sticker
par sticker, ses deux repères ayant la même couleur). Mêmes méthodes, même
saisie que le Fisher Cube, l'« état singulier » de la page (un centre seul
tourné d'un quart) compris.
