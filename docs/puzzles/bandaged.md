# Les soudés

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/bandaged/`, méthodes : `src/lib/methods/bandaged/`, dessins : `src/three/puzzles/bandaged/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

Les « Bandaged » de fan2cube.fr : des 3x3x3 dont des cubies voisins sont
soudés en blocs (onze, de BigBlock à Alcatraz, dans l'ordre de difficulté
de la page), puis deux autres soudés qui ne sont pas des 3x3x3 (l'AI Cube,
le RoadBlock-I). Une barre (un coin et une arête), une languette (une arête
et un centre), un carré (quatre cubies d'une face), un 2x2x2 (le Fused).
Un coup ne passe que s'il ne coupe aucun bloc : chaque bloc entièrement
dans la couche tournée, ou entièrement dehors.

## Le modèle commun (`bonds.ts`)

Le 3x3x3 lui-même (ses 27 cubies, cœur caché compris), chaque cubie soudé
portant une **marque** cachée tournée vers chacun de ses voisins de bloc
(comme les barres du RoadBlock-I) : les coups emportent les marques, donc
un état dit où sont ses blocs. Les marques ne sont ni dessinées ni
peintes.

- **Coups permis** (`cutsNoBlock`) : un coup est bloqué dès qu'une marque
  traverse sa coupe. Le pad grise les coups bloqués.
- **Formes** (`formsOfBlocks`) : les états sans couleurs, trouvés par un
  parcours en largeur sur les blocs seuls. Les coups du puzzle
  (`turnsEver`) sont ceux qui passent dans au moins une forme : une face
  tenue par un 2x2x2 n'en a aucun, et ses pièces restent pré-remplies à la
  saisie.
- **Résolu** : ses couleurs seules le disent (chaque pièce d'un 3x3 est
  unique, ses blocs sont alors chez eux).
- **Reconnaissance** : une marque compte selon la pièce qui la porte
  (`stickerCount`, `core/cube.ts`), ce qu'aucun coup ne change : deux
  soudés avec autant de marques se distinguent par l'endroit de leurs blocs.
- **Mélange** (`scrambleBandaged`) : des coups au hasard parmi ceux que
  l'état laisse passer, sans repasser par un état déjà vu tant qu'un autre
  coup va ailleurs (avec si peu de coups possibles, une marche au hasard se
  défait sans cesse) ; la même face deux fois seulement quand elle seule
  tourne, ses coups alors fusionnés.
- **Saisie** (`lib/editor/jointsEditor.ts`) : quand ses blocs bougent, on
  commence par ses **soudures** : sur le puzzle dessiné en gris, une barre
  sur chaque joint qui peut être soudé (celui de deux pièces qu'une forme
  soude et une autre non), allumée quand on la clique ; les soudures que
  toutes les formes ont (le 2x2x2 de l'Alcatraz) sont déjà en place.
  « Valider les soudures » refuse celles qu'aucune forme n'a. On peint
  ensuite les couleurs comme sur un 3x3, les pièces dessinées soudées comme
  on l'a dit (« Changer les soudures » y revient) ; à la fin, les marques se
  retrouvent par les couleurs (`marksFromColors`, chaque pièce d'un 3x3
  étant unique) et doivent donner les soudures saisies, sinon un message le
  dit. « Modifier » reprend les soudures de l'état. Un soudé à une seule
  forme (BigBlock, Squarebik, Fused) se peint directement, ses blocs
  pré-remplis.
- **Rendu** (`bandagedGeometry.ts`) : chaque cubie va jusqu'au bout de sa
  case, sans jour, du côté de ses voisins de bloc, son sticker aussi : un
  bloc se lit comme une seule pièce, ses stickers comme une seule tuile,
  comme sur le Z-Cube. Dans la vignette, le corps s'arrête un peu avant et
  le sticker déborde un peu, sans quoi un trait resterait visible. Certains
  sont tournés pour montrer leurs blocs (`YAW`, `drawings.ts`) : BigBlock et
  Squarebik d'un quart (blanc, orange, vert), Fused, FusedStripe et
  QuadStripe d'un demi-tour (blanc, bleu, orange).

Les blocs de chaque puzzle (`blocks.ts`) sont relevés sur les images de sa
page. Chaque formule de résolution de la page s'y joue sans coup bloqué, et
le nombre de formes est celui de la page quand elle le donne.

**Méthodes** (`methods/bandaged/kit.ts`) : les étapes de la page, chacune
trouvant ses coups parmi les formules de la page et les faces qui
tournent (`placing`, `reaching` pour les puzzles à une forme). Pour les
autres, **Depuis START** (`fromStart`) : (0) la position **START** de la
page, les blocs où ils doivent être (`toStart`, un parcours en largeur sur
les blocs seuls, chacun reconnu ou seulement sa forme) ; puis chaque étape
amène ses places à ce qu'elles tiennent à START (`phaseAs`, `target` et
`legal` de `pieceSearch` : tous les blocs suivis, les coups qu'ils bloquent
écartés), avec les formules de la page qui laissent START tel quel et, à
certaines étapes, les coups libres ; enfin, si START n'est pas la forme
résolue, son inverse. Une formule qui ramène ses blocs où ils
étaient reste jouable de partout où elle l'était : seuls les blocs
bloquent un coup, jamais les couleurs. La suite de conformance vérifie que
chaque coup d'une solution passe là où il est joué. Les places sont nommées
comme elles sont à START.

## Le BigBlock (`bigBlock`)

fan2cube.fr/bigblock1 et 2 : un 2x2x3 soudé (le 2x2x2 du Fused, prolongé
vers l'avant), seules H et D tournent. Une seule forme.

**Résolution** (`methods/bandaged/bigBlock.ts`, méthode **Coins puis
arêtes**) : (1) les deux coins du bas, (BDP) par [D'H'] et (BAD) par [DH] :
les quatre du haut sont alors placés, à H près (propriété du groupe
<H, D> des coins, vérifiée sur des mélanges) ; (2) les coins du haut
tournés trois à la fois par DHD'H.DH²D'H² ; (3) l'arête du bas, (4) celles
du milieu, (5) celles du haut, chacune par un 3-cycle du haut
(D²H'D'H'D².(HD)².H²D ou D.(DH)²(D'H')².D'HD'), amenée par D et défait
ensuite. <H, D> ne retourne jamais une arête.

## Le Squarebik (`squarebik`)

fan2cube.fr/squarebik1 et 2 : l'équateur bridé à la façon d'un Square-1,
sa moitié gauche soudée (A, AG, G, PG, P), seules H, B et D tournent. Une
seule forme.

**Résolution** (`methods/bandaged/squarebik.ts`, méthode **Par couches**) :
(1) croix du bas, (2) coins du bas par [DH] (et [DH]² pour les tourner),
(3) arêtes du milieu (AD) et (PD) par le 3-cycle du haut E =
D².HDHD'.(H'D')².HD' amené par D (DED', D'ED), (4) coins du haut placés par
H²DHD²B.D'HDB'.(D'H')².D'H, qui échange (HAG) et (HDA), (5) tournés par
DHD'H.DH²D'H², (6) arêtes du haut par E.

## Le Fused (`fused`)

fan2cube.fr/fused1 et 2 : un 2x2x2 soudé en (BPG), seules H, A et D
tournent. Une seule forme.

**Résolution** (`methods/bandaged/fused.ts`, méthode **Par couches**, « un
mélange entre Pétrus et Fridrich » selon la page) : (1) le bas, ses deux
arêtes puis ses trois coins ([HA], [H'D'], [HD]) ; (2) les trois arêtes du
milieu ; (3) croix du haut, deux arêtes retournées par A[HD]A' ; (4) coins
placés par V = HDH²A.H'D'HD.HA'HD', qui échange (HDA) et (HPD) ; (5)
tournés par DHD'H.DH²D'H² ; (6) arêtes glissées par E =
D.(DH)²(D'H')².D'HD'.

## Le QuadStripe (`quadStripe`)

fan2cube.fr/quadstripe1 et 2 : trois carrés et trois barres autour d'un
petit cube intérieur (HDA), « style Bandage Cube ». 580 formes (comme la
page). START : sa forme résolue (G, B et P tournent). Étapes : START ;
former le cube intérieur (ses trois arêtes et ses deux coins isolés à leur
place, à l'ordre près : coups libres) ; placer les barres ((HGP)(BGA) et
(BGA)(BDP)) ; placer les arêtes ((HA)(HD) et le 3-cycle « supplémentaire »
(HA)->(HD)->(AD) : l'échange fixe ne suffit pas) ; les pivoter
((HA)°(HD)°, combiné aux deux autres) ; pivoter les sommets ((HDA)+(BPG)-).
Chaque formule échange aussi les deux coins isolés et deux arêtes : les
étapes visent des ensembles de places jusqu'aux arêtes.

## Le Detour (`detour`)

fan2cube.fr/detour1 et 2 : deux barres et cinq languettes, dont le « ∟ »
(B et P soudés par leur arête). 4 732 formes. START = D²H'D²HD, où H tourne
librement. Étapes : START ; (BPG) et (BG) (coups libres et [AD'],
[HD], [HD][H'A'], [H'A'][HD], J) ; (BAD) et (AD) ; arêtes du haut (J =
A[DH]A'H) ; sommets du haut ([AD'].G[D'A]G' et son carré) ; retour
D'H'D²HD².

## Le Diamond (`diamond`)

fan2cube.fr/diamond1 et 2 : deux carrés (G et D) et deux languettes (A et
son arête du haut, B et son arête arrière). 110 formes. START = GD'A², où H
tourne. Étapes : START ; sommets du bas ([HD], et [HA] pour le cube tenu
d'un quart, t H') ; équateur ([HD][H'A'], [H'A'][HD] et leurs versions
tenues d'un quart) ; arêtes du haut (J) ; sommets du haut ([AD'].G[D'A]G'
et son carré) ; retour A²DG'.

## Le Bandage Cube (`bandage`)

fan2cube.fr/bandagecube1 à 3 : sept barres, un sommet seul, quatre
languettes et la double languette « ∟ » (BP). 440 formes (comme la page).
START : sa forme résolue (le « ∟ » en BP, le sommet seul en HDA, H, D et A
tournent). Étapes (méthode 1) : START ; les barres une à une, (BPG) par X
et Q, (BDP) par Q et S, (BGA) par S, (BAD) par Y et T, (HGP) par T, les deux
dernières suivent.

## Le Quad (`quad`)

fan2cube.fr/quad1 et 2 : les trois carrés du QuadStripe, sans ses barres.
25 formes. START : celui du QuadStripe. Étapes : START ; former le cube
intérieur ; l'orienter (formules du QuadStripe, et les coups libres : ses
arêtes ne se retournent que par deux) ; les arêtes des barres, leurs
sommets, puis les pivoter (K), avec les formules de la page jouées « cube
retourné » (t D² t H' : ses H A D P G B deviennent D L B R F U).

## Le Stripe (`stripe`)

fan2cube.fr/stripe1 et 2 : trois barres en Y autour de BDA. 1 296 formes.
START = ABA', où H tourne. Étapes : START (chaque barre à sa place) ; le
bas (arêtes puis sommets : la page tourne la tranche h, ici les coups
libres) ; l'équateur, arête par arête ; sommets du haut placés (T et son
3-cycle) ; croix du haut (D[PH]²D', qui ici retourne des arêtes du haut en
en faisant tourner trois, et non l'échange annoncé par la page) ; sommets
tournés ; arêtes glissées ; retour AB'A'.

## Le FusedStripe (`fusedStripe`)

fan2cube.fr/fusedstripe1 et 2 : le 2x2x2 du Fused et trois barres en Y
autour de HDA. 450 formes (comme la page). START : sa forme résolue,
chaque barre chez elle. Étapes : les barres (coups libres) ; sommets placés
(AD[A'H']DHD²A' et les coups libres : les formules en START ne déplacent
pas ces sommets-là) ; arêtes placées ; puis tout orienté par **l'état m**
de la page (M = DHA'.DH²D', où H tourne et où J² retourne deux arêtes, J⁴
tourne trois sommets), chaque passage étant M, une formule, M'. Le plus
lent des soudés : jusqu'à 3 s environ.

## L'Alcatraz (`alcatraz`)

fan2cube.fr/alcatraz1 et 2 : le 2x2x2, trois barres, deux languettes et un
carré en haut. 1 449 formes. START : sa forme résolue. Étapes : START ; les
barres ((BAD)(BDP) et (BGA)(BAD) : les arêtes du haut suivent) ; sommets du
haut ((HPD)->(HAG)->(HDA)) ; arêtes du haut retournées (Q) ; sommets tournés
(Q² et les deux longues formules).

## Les autres soudés

Deux puzzles soudés qui ne sont pas des 3x3x3, chacun avec son propre
modèle (`ai.ts`, `roadblock.ts` dans `lib/puzzles/bandaged/`).

### L'AI Cube (`ai`)

L'AI Cube (fan2cube.fr/AIcube1 et 2) est « un bandaged du Revenge 4x4x4 » :
des huit octants du 4x4x4 (2x2x2 chacun), les quatre d'un tétraèdre sont
soudés en gros blocs, en quinconce une fois résolu ; les quatre autres
restent en petits cubes (un petit sommet, trois arêtes, une par arête du
cube, et trois centres, deux par couleur). Modèle (`lib/puzzles/bandaged/ai.ts`) : les petits
cubes du 4x4x4, un gros bloc étant un seul cubie au milieu de son octant
((2, 2, 2)...) ; un coup ne passe que s'il ne coupe aucun gros bloc
(`aiTurns`) : une moitié du cube toujours, une couche externe ou une tranche
seulement quand aucun bloc n'est à cheval sur ses coupes. Les blocs changeant
d'octant, les emplacements à peindre dépendent de l'état : il est déclaré
déformable (`shifts` de sa carte), saisi en choisissant d'abord sa forme (7). Le
mélange (`scrambleAi`) joue surtout des couches fines dès qu'il le peut, et
libère une moitié de ses blocs quand aucune ne passe (au hasard, il ne
tournerait presque que des moitiés), et finit les gros blocs dispersés, deux
par moitié du cube sur chaque axe. Rendu (`three/puzzles/bandaged/aiGeometry.ts`) : des
boîtes d'une case ou de deux.

**Résolution** (`methods/bandaged/ai.ts`, méthode **des blocs**, d'après la page) :
(0) les quatre gros blocs en bas, par demi-cubes (la position standard de la
page : le haut tourne alors seul, H, et sa tranche, h) ; (1) chaque petit
octant reconstitué autour de son petit sommet, les arêtes d'abord (recherche
par les deux bouts sur les pièces suivies, avec H, h et T = D'BD.ABA', qui
pivote un octant, vu de chaque coin ; un h d'abord si leur permutation est
impaire), (2) puis les centres par 3-cycles purs : C =
Th².(Th²T'h²)².T'h².(T'h²Th²)², préparé de deux coups, et les produits de
deux d'entre eux qui ne bougent que trois centres (tous les trios), les deux
centres d'une couleur affectés pour une permutation paire ; (3) les huit
octants résolus comme un Pocket (solveur optimal du 2x2), par demi-cubes.
Les centres font l'essentiel de la longueur.

### Le RoadBlock-I (`roadblock`)

Le RoadBlock-I (fan2cube.fr/roadblock-I1 et 2) est un 5x5x5
dont les neuf centres de chaque face sont soudés trois par trois en barres
parallèles (les « I »), ses couches externes épaisses et les trois
internes fines. Une face tourne toujours ; une tranche seulement si elle
ne coupe aucune barre, c'est-à-dire si aucune barre qu'elle emporte n'est
dans l'axe du coup (`roadblockTurns`). Modèle (`lib/puzzles/bandaged/roadblock.ts`) : les
cubies du 5x5x5, chaque centre portant un sticker caché (`H`, jamais
dessiné ni peint, comme les marques du Fisher Cube) le long de sa barre.
Le sens des barres d'une face ne change qu'avec ses quarts de tour : en
position **START** (le résolu), les barres des côtés sont horizontales et
les trois tranches de l'équateur tournent ; quelques quarts de tour des
faces autour d'un autre axe y couchent leurs barres en travers, ses
tranches tournent, et les mêmes quarts défaits ramènent START. « Résolu »
ne regarde que les couleurs : une face unie l'est, ses barres dans un sens
ou dans l'autre. Le mélange (`scrambleRoadblock`)
joue surtout des tranches permises, et libère un axe quand aucune ne
l'est. **Saisie** dans tout état (`lib/editor/roadblockEditor.ts`) : les stickers d'un
5x5, sans centre fixe (les tranches du milieu les déplacent) ; un clic sur
un centre peint sa barre entière (`paintBar`, `barCells`), et six boutons
disent quelles faces ont leurs barres tournées d'un quart par rapport à
START (`BarToggles`, l'état `twisted` de l'éditeur ; basculer une face
tourne ses centres d'un quart avec leurs couleurs, `turnFace`). « Depuis
l'état actuel » les lit sur le cube (`barsTurned`), `buildCube` les pose
(`withBars`) ; la validation refuse un sens des barres impossible. Rendu (`three/puzzles/bandaged/roadblockGeometry.ts`) : couches externes
épaisses, un sticker par barre.

**Résolution** (`methods/bandaged/roadblock.ts`, méthode **des centres**, d'après la
page) : chaque formule va de START à START (`legal`, qui la rejoue en
suivant le sens des barres), jouée dans le « mode » qui couche les barres
en travers de l'axe de sa tranche (`SETUP`). (0) START ; (1) les barres du
milieu (le centre de chaque face), par les tranches du milieu ; (2) la
parité : les ailes sont en permutation impaire de leur place près de leur
milieu une fois sur deux, ce que les 3-cycles ne corrigent pas ; un quart
de tranche de l'équateur (un 4-cycle d'ailes, START gardé) la change ; (3)
les autres barres par 3-cycles purs (commutateurs d'une tranche et d'un
coup de son mode) ; (4) les deux ailes de chaque arête amenées près de son
milieu par 3-cycles d'ailes (commutateurs d'une tranche interne et d'un
`F U F'` de son mode, leurs produits, et au besoin conjugués l'un par
l'autre) ; (5) comme un 3x3 (`projectPlan`, la projection du 5x5), ses
barres finissant dans un sens ou dans l'autre. Les tables se construisent
au premier calcul.
