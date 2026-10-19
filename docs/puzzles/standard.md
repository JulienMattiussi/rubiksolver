# Les cubes standards

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/standard/`, méthodes : `src/lib/methods/standard/`, dessins : `src/three/puzzles/standard/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le 2x2, le 3x3 et le 4x4

**Repère du 2x2** (solveur optimal, et le Void Cube lu comme un 2x2) : sans centres, pas de repère fixe. Le coin en **DBL**
(position `[-1,-1,-1]`) joue ce rôle : ses stickers définissent les couleurs
D/L/B (opposées déduites du schéma standard). Les prédicats **recalculent ce
repère sur l'état qu'ils examinent**, donc les algorithmes qui déplacent le
coin-ancre restent corrects par construction. Le solveur optimal est une **BFS
bidirectionnelle** en rotations U/R/F (qui ne bougent jamais DBL), du cube vers
l'orientation du cube résolu qui partage son coin DBL ; la borne de profondeur
(12 > nombre de Dieu du 2x2 = 11) rend l'échec sur cube impossible borné et
rapide, ce qu'exploite la validation. Elle garde sa propre boucle (et non
`solvePieces`) parce qu'elle continue après la première rencontre pour
garantir l'optimalité.

**Le 2x2 par couches** (son tutoriel, `lib/tutorials/standard/cube2.ts`,
d'où sa méthode) suit le manuel du 2x2 (QiYi) : quatre étapes, trois
formules. (1) La face jaune, construite en haut, un coin à la fois, côtés
ignorés (la plus courte suite qui garde les coins déjà jaune en haut,
cherchée sur les quatre coins jaunes seuls) ; (2) sa couche, toujours en
haut, par la formule 1 `R B' R F2 R' B R F2 R2` (`PLL_AB` : trois coins du
haut en cycle, l'arrière gauche fixe), une ou deux fois ; (3) le cube
retourné (`x2`), puis la face blanche : sept cas, chacun joué par la
formule 2 (Antisune) et la formule 3 (Sune) comme le manuel les combine
(2 ; 3 ; 2+2 ; 2+U'+2 ; 2+U2+3 ; 2+U+3 ; 2+U'+3), reconnu en essayant
chaque combinaison depuis chaque tenue et chaque tour du haut ; (4) sa
couche par la formule 1. Les couleurs des côtés se lisent sur la couche
jaune une fois en bas. Environ 42 coups en moyenne.

**Le 4x4 par réduction** (`src/lib/methods/standard/solver4/`) : repère absolu = `FACE_COLOR`
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
3x3 _impossible_ (une arête composite flippée = parité OLL ; deux arêtes
échangées = parité PLL) ; des invariants déterministes les détectent (somme des
flips, signes des permutations) et les algorithmes standards en tranches les
corrigent AVANT la phase 3x3. Une vrille de coin (somme des twists non nulle
mod 3) fait lever une exception : cube réellement impossible. (4) **Phase
3x3** : le 4x4 réduit restreint aux coups externes est isomorphe à un 3x3
(`to3x3` est un homomorphisme) ; les phases 3x3 existantes s'exécutent sur la
projection (`projectPlan`) et leurs coups se rejouent tels quels : zéro duplication
des étapes.

**Coups avancés du 3x3** (`advanced` sur sa carte, lu par `SHAPE_ADVANCED_TURNS` ; `advancedMovesFor`) : `M`,
`E`, `S` et les coups larges, jouables depuis l'onglet « Avancé » du pad,
jamais mélangés (`movesFor`, donc le mélange et les tables de saisie, ne les
voient pas). Ils déplacent les centres, qui servent de repère à toutes les
méthodes 3x3 : chacune commence donc par **Centres remis en place**
(`withCentersHome`, recherche en `<M, E, S>` sur les 6 centres), étape vide
et retirée quand ils n'ont pas bougé. La saisie « depuis l'état actuel »
tourne d'abord le cube entier pour que ses centres (pré-remplis, fixes)
retrouvent leur couleur : même position, vue autrement.

Les tranches du 3x3 ne demandent rien au moteur : sur 3 couches, la couche
`depth: 2` est celle du milieu, donc `M` = `2L` (même sens que L), `E` = `2D`,
`S` = `2F`, et `r` = `Rw`. `formatMove(move, labels, dims)` les affiche `M`,
`E`, `S` quand on lui passe les dimensions.

Le 4x4 et le Super Revenge s'écrivent comme le guide officiel de Rubik's :
la tranche interne seule en minuscule (`r`, FR `d`), la face et sa tranche
ensemble en deux lettres (`Rr`, FR `Dd`), par le `format` de leur modèle
(`lib/puzzles/standard/revenge.ts`). Les formules internes restent écrites
`2R` / `Rw` (`parseMoves`), seul l'affichage change.

## Le 5x5 par réduction (`src/lib/methods/standard/solver5/`)

Le moteur n'a rien de nouveau pour le 5x5 (grille `{-2..2}`, coups `R`,
`2R`, `Rw` déduits de la forme, centres du milieu fixes et pré-remplis en
saisie), sauf la **tranche du milieu** (`3R`, `Move.depth` 3), que seule la
méthode utilise (pas le pad ni le mélange) : le guide la montre via
`methodTurns`. La saisie distingue les deux sortes de centres d'une couleur
(budget 4 chacune).

Une recherche bornée par comptage, comme sur le 4x4, ne suffit pas : une
tranche y déplace trois centres d'un coup, et la dernière pièce d'une face
demande un commutateur. La méthode est donc celle des cubeurs, par
**3-cycles purs** (`cycleLibrary`, voir AGENTS.md).

0. **Centres remis en place** (`stepRecenter`, si nécessaire) : tenu autrement,
   ses centres du milieu ramenés au repère absolu par les tranches du milieu
   (le `M`, `E`, `S` du 3x3), que la phase 3x3 suppose.
1. **Centres** (`centers.ts`) : face par face (D, U, F, R, B ; L forcée),
   deux coups (une tranche, un tour) quand ça suffit, sinon un 3-cycle :
   `[2R, X 2L X']` pour les diagonaux, `[3R, X 2L X']` pour ceux en croix,
   dont le troisième emplacement n'est sur rien de fini.
2. **Arêtes** (`edges.ts`) : chaque milieu d'arête reste en place et appelle
   ses deux ailes (une aile n'a qu'un sens par emplacement, sa chiralité) ;
   elles arrivent par des 3-cycles d'ailes purs (`[2U, L U L']`...), centres
   intacts. Aucun 3-cycle ne prend les deux ailes d'une même arête : au
   besoin on passe par un autre emplacement, ou on en emprunte un juste
   (petite recherche sur les seuls emplacements en jeu).
3. **Parité** : la permutation des ailes est impaire une fois sur deux (une
   tranche en quart de tour fait un 4-cycle d'ailes), ce que les 3-cycles ne
   corrigent pas ; elle est détectée d'avance, l'appariement vise alors
   l'arête UF croisée, et l'algorithme de parité OLL du 4x4 l'échange (sur
   un 5x5 aux centres faits, il n'échange que ces deux ailes).
4. **Phase 3x3** par projection (`projectPlan`, partagé avec le 4x4) : coins,
   milieux d'arêtes et centres fixes forment un vrai 3x3, toujours légal.

## Les super cubes (`super4`, `super5`)

Le Super Revenge et le Super Professor (fan2cube.fr/superrevenge1 et 2,
superprofessor1 et 2) : un 4x4x4 et un 5x5x5 dont chaque centre est une
pièce à lui, qui doit reprendre sa place (un centre n'atteint chaque
emplacement que dans un sens, sauf ceux du milieu du 5x5, qui tournent sur
place). Chaque centre le montre par des bordures sur ses côtés tournés
vers les bords de sa face (deux pour un centre du 4x4 ou un « x » du 5x5,
une pour un « + », quatre pour celui du milieu), chacune de la couleur de
la face au-delà. **Modèle** (`lib/puzzles/standard/superCube.ts`) : une bordure est un
sticker sur ce côté du centre (sa normale en travers de la face), de cette
couleur : résolu, elle regarde comme la face de sa couleur, donc « chaque
direction d'une seule couleur » dit toujours résolu, et un centre se
reconnaît à ses couleurs, la sienne d'abord (`centerKey`). Mêmes coups, guide et
mélange que leurs homologues. **Rendu** (`three/puzzles/standard/superGeometry.ts`) : les
cubies du 4x4 ou du 5x5, chaque centre bordé de bandes de couleur.
**Saisie** des couleurs, comme les cubes, chaque bordure peinte à part
(sa propre facette, plus sombre tant qu'elle est vide) : la saisie guidée
reconnaît un centre à sa couleur et à celles de ses bordures, et complète
le reste dès qu'il est déterminé (les rotations du cube entier suffisent à
donner les placements, puisqu'un centre n'a qu'un sens par emplacement).

**Résolution** (`methods/standard/superCube.ts`, la « méthode des centres » de la
page, prise à l'envers) : la méthode du Revenge ou du Professor (réduction,
par couches ou CFOP) sur leurs couleurs, les bordures mises de côté, puis
leurs « états singuliers » : sur le Professor, les centres du milieu
tournés par (H)+(G)- = Hd*'h*'d*.H'd*'h*d* (d* et h* les trois couches
intérieures : tout le bloc des centres de deux faces tourne) et (H)2+ =
(HDGH²D'G')², vus de chaque tenue (recherche sur leurs tours, 4⁶ états) ;
puis chaque centre à sa place par 3-cycles purs, O = g'HdH'.gHd'H' de la
page (les « x » ; les « + » avec la tranche du milieu). Les couleurs
faites, coins et ailes sont à leur place : les centres ne sont qu'à une
permutation paire de la leur. Sur le 4x4, la page tourne les centres avec
d* et h* les deux couches intérieures.

## Le 6x6 par réduction (`src/lib/methods/standard/solver6/`)

Le moteur le fait tourner tel quel (grille `{-5, -3, -1, 1, 3, 5}`) ; ses
coups ont une couche de plus : la troisième (`3R`) et le coup large de trois
couches (`3Rw`, la moitié du cube), que sa carte déclare (`inner` :
`slice3`, `wide3`, lu par `SHAPE_INNER_TURNS`). Avec cinq sortes de couches, le pad écrit ses onglets
en notation (`R 2R 3R Rw 3Rw`, le nom en infobulle). Aucun centre fixe :
repère absolu comme le 4x4. Quatre sortes de centres par face (« x »
intérieurs et extérieurs, obliques des deux mains, que la saisie distingue
par leur chiralité : `handOf` dans `lib/editor/editorTables.ts`), et deux orbites
d'ailes (externes, près des coins ; internes, au milieu).

1. **Centres** (`solve/centerCycles.ts`, partagé avec le 5x5) : face par face,
   deux coups ou un 3-cycle de la sorte du centre (commutateurs de la
   deuxième couche pour les « x » extérieurs, de la troisième pour les
   intérieurs, des deux pour les obliques).
2. **Arêtes** (`edges.ts`) : sans milieu d'arête, l'appariement choisit
   quelle arête va où (pour chaque emplacement, celle que montrent déjà le
   plus de ses ailes), puis corrige ce choix pour que la phase 3x3 tombe sur
   un vrai 3x3 : deux arêtes échangées si leur ordre et celui des coins ne
   s'accordent pas, une arête retournée si un nombre impair le sont. Plus de
   parité OLL ni PLL. Les ailes arrivent par 3-cycles purs, orbite par
   orbite (`solve/wingPairing.ts`, partagé avec le 5x5).
3. **Parité** : une orbite dont l'arrangement voulu est une permutation
   impaire a sa paire d'UF visée croisée ; l'algorithme de parité OLL du
   4x4 joué sur les tranches de l'orbite (`2R` pour les ailes externes,
   `3R` pour les internes) l'échange, rien d'autre.
4. **Phase 3x3** par projection (`projectPlan`) : coins, une aile externe
   par arête, un centre par face.

## Le cube miroir (`src/lib/core/shape.ts`)

Le **cube miroir** (Mirror Blocks) est un _shape mod_ : mécaniquement un NxN
ordinaire, mais tous ses stickers ont la même couleur et ses couches ont des
épaisseurs différentes, si bien qu'on le résout **par la forme**. C'est donc
**une variante de rendu et rien d'autre** (`CubeVariant`, dans le store à côté
de la taille) : le modèle, les coups, `isSolved`, les solveurs, la saisie et la
validation l'ignorent complètement. Seuls les puzzles miroirs qui existent
vraiment sont proposés (`mirror` sur leur carte, `supportsMirror`, puis `CUBE_KINDS`) :
2x2, 3x3 et 4x4. Le 1x2x3 ne peut pas en
avoir : un axe à une seule couche porte ses deux grandes faces sur les mêmes
pièces, donc elles ne peuvent pas avoir d'épaisseur.

La correspondance est **couleur -> épaisseur** (`LAYER_THICKNESS`), **bijective** :
les six épaisseurs sont distinctes (groupées en fines et épaisses pour garder
l'allure du puzzle, chaque axe ayant sa paire, comme un noyau décentré
différemment sur chaque axe). Une forme désigne donc une pièce et une seule,
ce qui rend la **saisie par épaisseurs** possible et supprime les pièces
d'apparence identique du vrai Mirror Blocks. Cette table suffit à tout déduire :

- l'épaisseur d'un cubie selon un axe est celle de la couleur du sticker qui
  regarde cet axe ; sans sticker sur cet axe, le cubie est dans une couche du
  milieu (épaisseur 1) ;
- sa boîte est **ancrée sur sa face interne** (celle qui regarde le centre) et
  grandit vers l'extérieur : c'est ce qui fait dépasser une pièce épaisse posée
  là où il en faut une fine, donc les **bosses**.

Trois propriétés en découlent, toutes testées (`tests/unit/core/shape.test.ts`) :

- **couleurs opposées de somme 2** : un axe mesure alors
  `épaisseur(-) + 1 par couche du milieu + épaisseur(+) = taille`, donc le cube
  résolu est un cube plein. Les couches du milieu d'un même axe sont
  forcément égales (une pièce circule de l'une à l'autre) : sur 4x4, seules les
  deux couches extrêmes diffèrent, exactement comme sur le vrai puzzle ;
- **rigidité** : la boîte recalculée après un coup est exactement la boîte
  d'avant, tournée. L'animation (qui fait tourner un groupe autour de l'origine
  du réseau) reste donc juste, sans état supplémentaire ni pièce qui saute en
  fin de rotation ;
- **recentrage** : les couches extrêmes étant inégales, le solide résolu est
  décalé de la moitié de leur différence (le noyau décentré du vrai puzzle) ;
  `centeringOffset` le remet au centre via un groupe **externe** au groupe
  animé.

La variante `classic` est le cas dégénéré de la même table (toutes les
épaisseurs à 1) : un seul chemin de rendu, pas de branche.

**La saisie d'un cube miroir se fait en épaisseurs** : par la bijection,
peindre une épaisseur, c'est peindre une couleur, et la saisie est celle des
couleurs. Seul l'habillage diffère : la palette affiche six barres ordonnées
de la plus fine à la plus épaisse, les stickers peints sont dorés, et
`EditView` donne à chaque emplacement la forme de ses stickers **déjà peints**
(un axe non peint garde 1). Comme les pièces ne grandissent que vers
l'extérieur, une saisie à moitié faite ne se chevauche jamais : la pièce prend
sa forme au fur et à mesure.
