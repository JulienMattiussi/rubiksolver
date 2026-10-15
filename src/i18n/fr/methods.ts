/** The methods' names and descriptions (the source; English mirrors it). */
export const METHODS_FR = {
  beginner: {
    name: 'Par couches',
    desc: 'Étage par étage : 1re couche entière, couche du milieu (sur 3x3), puis dernière couche.',
  },
  cfop: {
    name: 'Fridrich (CFOP)',
    desc: 'Croix, puis paires F2L, puis orientation (OLL), puis permutation (PLL) de la dernière couche.',
  },
  roux: {
    name: 'Roux',
    desc: 'Deux blocs 1x2x3 (le second en R, U, M et r seulement), les coins du haut (CMLL), puis les six dernières arêtes en M et U.',
  },
  petrus: {
    name: 'Petrus',
    desc: 'Bloc 2x2x2, étendu en 2x2x3, orientation des arêtes, fin des deux couches en R et U seulement, puis la dernière couche.',
  },
  zz: {
    name: 'ZZ',
    desc: 'Toutes les arêtes orientées et la ligne du bas d’abord (EOLine), puis les deux blocs sans jamais tourner F ni B, puis OCLL et PLL.',
  },
  reduction: {
    name: 'Réduction par couches',
    desc: 'Centres, appariement des arêtes, puis résolution par couches comme un 3x3.',
  },
  reductionCfop: {
    name: 'Réduction CFOP',
    desc: 'Centres, appariement des arêtes, puis Croix, F2L, OLL et PLL comme un 3x3.',
  },
  barrelLayers: {
    name: 'Par couches',
    desc: 'Comme un Rubik’s Cube, à un détail près : les quatre arêtes du milieu ne montrent qu’une couleur, leur sens ne compte pas. La couche du bas, puis les arêtes du milieu placées avec [HD].[H’A’], les coins du haut tournés puis placés, les arêtes du haut placées par le 3-cycle D².HAP’.D².PA’H.D², puis retournées deux par deux (DPGAH.A’HG’P’D’.A’H’AH’) ou une seule, avec une arête du milieu dont le sens ne se voit pas (HGBDA.D’AB’G’H’.D’A’DA’).',
  },
  megaStar: {
    name: 'L’étoile prolongée',
    desc: 'Le Rubik’s Cube par couches, une face de plus à chaque tour : l’étoile de la face du dessous (A², A.H’DH), ses sommets (D’B’D, tournés par D’BD.ABA’), les arêtes autour ([H’A’][HD], [HD][H’A’]), les cinq faces voisines finies (H’A’²HA², HD²H’D’², HDH’D’…), les arêtes de l’équateur haut, puis la face du haut : arêtes placées (A[HD]A’) et retournées (A[HD]HA’HA.H³A’), sommets placés ([HA].P’[AH]P) et tournés ((D’BDABA’).H’(AB’A’D’B’D)H).',
  },
  ftoCornersFirst: {
    name: 'Sommets, centres, arêtes',
    desc: 'La méthode 2 de fan2cube.fr, en quatre formules : les sommets placés et tournés (où la page joue O1 = [D A’] et O2 = HD’H’.AHD), puis les centres par O4 = AhA’.B.Ah’A’.B’, un 3-cycle de centres qui ne touche à rien d’autre, et enfin les arêtes par O3 = dHd’h.dH’d’h’, un 3-cycle d’arêtes qui ne touche à rien d’autre. Chaque formule vue de chaque côté, préparée par un coup défait ensuite.',
  },
  skewbTopFirst: {
    name: 'Le haut d’abord',
    desc: 'Seuls les quatre sommets du bas tournent (B, O, H, E) : le centre du haut ne bouge jamais. Skewb : les sommets du haut placés puis tournés ([B’O’]), les centres placés ([B’E’][HE], [H’E’][HO]), les sommets du bas tournés ([BO’]²). Skewb Ultimate : les sommets du haut placés, puis tournés ([BO], [O’B’], [OH], [B’E’]), les centres placés ([OH’], [BO’], [B’E’][HE], [H’E’][HO]) puis retournés ([HE’]²[EB’]²), et enfin les sommets du bas tournés (K = [BO’]⁴, Z = [OH’]⁴) : ils suivent ceux du haut, déjà à leur place.',
  },
  crystalCornersFirst: {
    name: 'Les sommets d’abord',
    desc: 'Comme le Megaminx, mais à chaque étape les sommets avant les arêtes : la face du bas (monter un sommet D’BD, le pivoter D’BD.ABA’), les sommets de l’équateur bas (A’²HA’²) puis haut ([HD]), les arêtes des cinq faces voisines, les sommets du haut placés ([HA].P’[AH]P) et tournés (D’BDABA’.H’.AB’A’D’B’D.H), enfin les arêtes du haut placées ([G’P]) et retournées (([G’P]H’)².([PG’]H)²).',
  },
  aiBlocks: {
    name: 'Méthode des blocs',
    desc: 'Le ramener à un Pocket : les quatre gros blocs en bas (position standard), puis chaque petit octant reconstitué autour de son petit sommet, arêtes puis centres, comme s’il était soudé (T = D’BD.ABA’ pivote un bloc, X = H².GBG’.D’B’D.GBG’.H échange deux capuchons, C fait un 3-cycle de centres), et enfin les huit blocs résolus comme un 2x2x2, par demi-cubes.',
  },
  rbCenters: {
    name: 'Méthode des centres',
    desc: 'Comme un Professor (5x5x5), ramené à un 3x3x3, en s’arrangeant toujours pour pouvoir tourner les tranches voulues : les barres des faces autour d’un axe couchées en travers, ses tranches tournent. Les barres du milieu, la parité des arêtes (un quart de tranche de l’équateur), les autres barres, les arêtes regroupées trois par trois, puis comme un 3x3 (une fois les couleurs en place, il est résolu, ses barres dans un sens ou dans l’autre).',
  },
  quarterEdgesFirst: {
    name: 'Les arêtes d’abord',
    desc: 'Chaque face ne fait qu’un quart de tour puis revient : toutes les formules alternent. On ramène d’abord chaque face au départ (START), puis on place les arêtes (A[DH]A’), on les retourne deux par deux (A[DH]A’.G[HA]G’.D[HP]D’), on place les coins ([[DH], G]) et on les tourne ([[DH]², G]).',
  },
  camoReduction: {
    name: 'Réduction en Domino',
    desc: 'Le Camouflage remis en forme (et ses ailes en permutation paire), puis traité comme un 4x4x4 : les centres blancs en haut, les deux ailes de chaque arête réunies avec l’échange D*²H’D²HD*², et ce qui reste est un Domino 3x3x2, résolu comme tel.',
  },
  tower234Steps: {
    name: 'Sommets, arêtes, équateur',
    desc: 'D’abord la forme (les colonnes de côté redressées), puis tout dans la boîte : les centres, les sommets par P(H*D.G.H*D)³P (où les colonnes D et G sortent d’un quart et reviennent), les arêtes du haut et du bas par (D²H)³, (D²A)³ et PB.(D²A)³.BP, et enfin l’équateur par ((D²h)²P)², ((G²h)²P)², hA.(D²h)².Ah, (HA)³, plus une formule à nous qui sort de la boîte et y revient : sans elle, une pièce de l’équateur peut rester échangée de gauche à droite.',
  },
  doubleDomino: {
    name: 'Double Domino',
    desc: 'Deux Dominos qui partagent leurs côtés : l’extérieur (le haut et le bas) puis l’intérieur (les deux couches du milieu), chacun avec les formules du Domino (descendre un sommet, permuter deux sommets, descendre une arête, faire tourner trois arêtes). Celles de l’intérieur sont jouées deux par deux, pour ne rien changer à l’extérieur.',
  },
  towerReduction: {
    name: 'Réduction',
    desc: 'Les centres réunis, puis les pièces de chaque arête du haut et du bas réunies (par 3-cycles purs), et la tour devient une tour de 3 de large : son Domino extérieur, son Domino intérieur s’il en a un, puis son équateur s’il en a un. Une parité éventuelle se règle d’abord, d’un demi-tour de tranche.',
  },
  twoPockets: {
    name: 'Deux Pockets',
    desc: 'La tour vue comme deux Pockets empilés : la remettre en forme en pivotant ses sommets, puis finir le Pocket intérieur, puis le Pocket extérieur, avec deux formules du Domino (descendre un sommet, permuter deux sommets).',
  },
  asPocket: {
    name: 'Comme un Pocket',
    desc: 'Le Pyramorphinx n’est qu’un Pocket (2x2) déguisé : ses 8 pièces sont les 8 coins d’un 2x2 et ses mouvements ceux d’un 2x2. On le lit comme tel et on le résout comme un Pocket, en un minimum de mouvements, sans se laisser troubler par les formes qu’il prend.',
  },
  copterEdgesFirst: {
    name: 'Les arêtes d’abord',
    desc: 'Les arêtes, qui ne quittent jamais leur place, donnent les couleurs des faces : on les remet à l’endroit, puis on place les centres (Curvy Copter III), les sommets et on les tourne, puis les feuilles, enfin les pétales (Curvy Copter III), chaque fois par les 3-cycles de la page vus de chaque côté.',
  },
  voidCornersFirst: {
    name: 'Les sommets du bas d’abord',
    desc: 'Comme un Rubik’s Cube, la couleur des centres absents donnée par les sommets : les sommets du bas d’abord, comme sur le Pocket, puis les arêtes du bas (avec les tranches), les arêtes du milieu, la singularité s’il y en a une (deux arêtes à échanger, ce qu’un Rubik’s Cube ne demande jamais), puis le haut comme sur un Rubik’s Cube.',
  },
  extendedCross: {
    name: 'Croix prolongée',
    desc: 'Comme un Rubik’s Cube dont on ignore les coins : la croix du bas, les arêtes du milieu placées par un simple commutateur ([H’A’] ou [HD], aucun coin à préserver), la croix du haut retournée deux arêtes à la fois, puis les arêtes du haut placées par 3-cycles.',
  },
  extendedTriangle: {
    name: 'Triangle prolongé',
    desc: 'Les trois pièces du triangle du haut d’abord, chacune prolongeant les carrés autour, puis toutes les autres avec deux commutateurs, « placer à gauche » [H’ G’] et « placer à droite » [H D] : quand sept triangles sont faits, le huitième l’est aussi.',
  },
  octCornersFirst: {
    name: 'Sommets d’abord',
    desc: 'Un 4x4x4 taillé en octaèdre : les sommets (trois par face) d’abord, avec les commutateurs de centres du Super Revenge, puis les arêtes (trois par face) avec des commutateurs de tranches, et enfin les centres (le triangle du milieu de chaque face) avec un commutateur de coins du Rubik’s Cube. Une parité éventuelle se règle d’un quart de tour au départ.',
  },
  jingCornersFirst: {
    name: 'Sommets d’abord',
    desc: 'Les sommets d’abord, chacun d’un tour, puis les arêtes placées avec un crochet (trois arêtes à la fois), retournées deux par deux, et enfin les centres échangés deux à deux.',
  },
  wingsFirst: {
    name: 'Ailes puis co-ailes',
    desc: 'Co-sommets, pointes et centres d’abord, puis les ailes trois par trois avec un commutateur (réserver, monter, prendre, descendre), puis les co-ailes, placées puis retournées deux par deux (sur le Professor : les co-ailes, les arêtes, puis les co-centres), et enfin les centres échangés deux à deux.',
  },
  centersFirst: {
    name: 'Centres d’abord',
    desc: 'Les centres d’abord (et les pointes, sur le Pyraminx), chacun d’un simple tour de son sommet, puis les arêtes avec trois formules : un crochet qui descend une arête du haut pour finir le bas, une permutation circulaire des trois arêtes du haut, puis une formule qui retourne deux arêtes à la fois.',
  },
  isolateFirst: {
    name: 'Isoler puis permuter',
    desc: 'Séparer les sommets verts (en haut) et bleus (en bas), puis finir le bas et le haut avec une seule formule, K, qui échange deux sommets de chaque étage.',
  },
  puckIsolate: {
    name: 'Isoler puis permuter',
    desc: 'Séparer les pièces numérotées (en haut) des autres (en bas), puis ranger les couleurs du bas et les numéros du haut avec la formule K, / B / 1-B / -1 /, qui échange deux pièces voisines de chaque étage, et ses cousines qui en échangent de plus éloignées ; deux K de même paire du bas font un 3-cycle en haut. Enfin, aligner le haut sur le bas.',
  },
  twoStars: {
    name: 'Deux étoiles',
    desc: 'Le 4-Star Prism est fait de deux 2-Star Prism : on résout l’étoile interne (h, b) puis l’externe (H, B), chacune comme un 2-Star, avec la même formule K.',
  },
  equatorFirst: {
    name: 'Équateur puis coins',
    desc: 'Comme un Domino debout : les quatre arêtes de l’équateur, puis les coins du bas descendus deux par deux, puis les coins du haut échangés deux à deux.',
  },
  cornersFirst: {
    name: 'Coins puis arêtes',
    desc: 'Les coins d’abord, puis les arêtes, chaque fois avec une formule qui ne touche que ce qui reste à faire (Domino : bas puis haut ; Floppy : les coins placés, puis les arêtes retournées deux par deux ; Floppy Ghost : les sommets placés puis orientés, puis les arêtes retournées deux par deux ; BigBlock : les deux coins du bas, qui placent ceux du haut, puis les arêtes par 3-cycles du haut).',
  },
  gemCentersFirst: {
    name: 'Centres d’abord',
    desc: 'Comme un Pyraminx : chaque carré tourné pour que les quatre triangles collés contre lui aillent avec leurs faces (le logo « Danger nucléaire »), puis les arêtes placées par 3-cycles ([H D], vu de chaque côté) et enfin retournées deux par deux ([A D’][H’ D]).',
  },
  vtoCentersFirst: {
    name: 'Centres puis arêtes',
    desc: 'Comme un Pyraminx : chaque sommet tourné pour que les quatre centres autour de lui aillent avec leurs faces, puis les arêtes placées par 3-cycles (trois arêtes d’une face, [A D’], ou autour d’un sommet, A’HA.H.A’H²A, chaque lettre un sommet entier, Aw...), retournées deux par deux ([A D’][H’ D]), et enfin les pointes tournées seules.',
  },
  gearEquatorFirst: {
    name: 'Équateur puis coins',
    desc: 'L’équateur et les centres d’abord, intuitivement, puis les coins du bas descendus un à un ((D²H)².(D²H²)²), ceux du haut par 3-cycle et échange, les arêtes du bas isolées en bas ((BG²B’G’²)⁵), toutes les arêtes placées par paires échangées, les agrafes remises à l’endroit (D²(D²H)¹²D’²) et enfin les engrenages, un tiers de tour à la fois ((D²H)².D⁸.(H’D’²)²).',
  },
  dinoCylLayers: {
    name: 'Étage par étage',
    desc: 'Comme le Dino Cube, avec deux formules : [GA’] = GA’G’A fait tourner trois arêtes en laissant le reste en place (les sommets ne bougent jamais et disent comment le tenir) : le haut, puis l’équateur, puis le bas. Les arêtes s’orientent toutes seules une fois en place ; restent les sommets, pivotés un à un par (A)+ = [AD]A’[DA’].',
  },
  dinoLayers: {
    name: 'Étage par étage',
    desc: 'Une seule formule, [GA’] = GA’G’A, qui fait tourner trois arêtes en laissant le reste en place : le haut, puis l’équateur, puis le bas, une arête à la fois. Les arêtes s’orientent toutes seules une fois en place.',
  },
  rexEdgesFirst: {
    name: 'Arêtes, centres, pétales',
    desc: 'Les arêtes d’abord, par 3-cycles ([GA’] = GA’G’A, qui dérange centres et pétales), puis les centres, par 3-cycles ([DG’] = DG’D’G, qui ne dérange que des pétales), et enfin les pétales, face par face, avec [DG’][D’B], qui n’échange que des pétales.',
  },
  gearCornersFirst: {
    name: 'Coins d’abord',
    desc: 'Les coins d’abord, intuitivement, puis les arêtes placées par paires échangées (D⁴ : deux demi-tours d’une face), sur l’Ultimate les agrafes remises à l’endroit ((A² D²)³, qui retourne sur place les arêtes de deux étages) et enfin les engrenages remis en place, ceux d’une tranche d’un tiers de tour à la fois (D⁸). Les centres suivent tout seuls.',
  },
  shapeFirst: {
    name: 'Forme puis couleurs',
    desc: 'D’abord le moins de coups possible pour qu’il redevienne un cube, quelles que soient les couleurs du coin composé ; puis, depuis ce cube (35 cas possibles), la suite la plus courte qui remet ses couleurs : un algorithme par cas. Trouvé par une recherche sur tous ses états.',
  },
  optimal: {
    name: 'Optimale',
    desc: 'Recherche exhaustive de la solution la plus courte possible (2x2, 1x2x3, Floppy, Floppy Ghost et Purple, dont les espaces d’états sont assez petits).',
  },
  fromStart: {
    name: 'Depuis START',
    desc: 'On met d’abord le puzzle en position START, celle d’où partent les formules de la page : ses blocs où ils doivent être (sa forme résolue, ou une autre comme ABA’ sur le Stripe). Puis on place les pièces avec ces formules, qui laissent START tel quel et passent donc toujours, et quelques coups qui y ramènent ; enfin, quand START n’est pas la forme résolue, on y revient.',
  },
  skewbFirst: {
    name: 'Skewb d’abord',
    desc: 'Résolu d’abord comme un Skewb, ses sommets et ses centres (ses couches extérieures les tournent comme celles d’un Skewb : « le haut d’abord »), puis ses arêtes (o’.(P’DP).o.(P’D’P) et son reflet) et enfin ses pétales (e.(D’GD).e’.(D’G’D) et son reflet), chaque formule aussi depuis un sommet tourné (conjugaison).',
  },
}
