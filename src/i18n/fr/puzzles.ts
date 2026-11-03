/**
 * What a puzzle's page says of it, by puzzle (its `cubeKindId`): its hook in
 * a search engine's result (`summary`, 160 characters at most), what it is
 * like to hold, with a feeling and a judgment rather than its mechanism
 * (`about`), and its methods seen from a step back, its tutorial put
 * forward, never their steps (`methods`), under a hook of their own
 * (`methodsTitle`; the puzzle's name heads `about`). Words between `**`
 * are in bold. Short and engaging: a hook, not a
 * datasheet. A puzzle not listed yet says its methods alone, from the
 * solver's registry (seo/about.ts).
 */
export const PUZZLES_FR = {
  gearCube: {
    summary:
      'Des engrenages à la place des arêtes : le Gear Cube paraît redoutable, il est le plus accessible de sa famille. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Gear Cube garde la silhouette d’un 3x3, mais rien n’y tourne seul : ses arêtes sont des **engrenages**, et chaque demi-tour d’une face entraîne d’un quart de tour la tranche du milieu. Il a l’air redoutable, il est pourtant la porte d’entrée idéale de la famille : ses engrenages bloquent tant de mouvements qu’il ne compte que **41 472 positions**, contre plus de 43 milliards de milliards pour un Rubik’s Cube.',
    methodsTitle: 'Les coins, puis le reste',
    methods:
      'Une seule méthode : les coins à l’intuition, puis les arêtes, et l’on finit en remettant les engrenages dans le bon sens. Quelques formules courtes suffisent, faciles à retenir.',
  },
  gearU: {
    summary:
      'Jointures torturées, arêtes en engrenages : le Gear Cube Ultimate surprend à chaque coup. Manipulez-le en 3D et apprenez à le résoudre pas à pas.',
    about:
      'Avec ses jointures torturées, le Gear Cube Ultimate ne ressemble à aucun autre cube, et il surprend plus encore une fois en main : ses arêtes sont des **engrenages**. Un demi-tour d’une face entraîne d’un quart de tour la tranche du milieu, et **le cube ne reprend sa forme que tous les trois coups**. Déroutante au premier abord, cette contrainte devient vite une alliée : avec un peu d’entraînement, on s’aperçoit qu’elle facilite sa résolution.',
    methodsTitle: 'Une méthode unique',
    methods:
      'Une seule méthode pour en venir à bout : les coins d’abord, puis les arêtes, et l’on termine en remettant les engrenages dans le bon sens. Le tutoriel vous l’apprend pas à pas, jusqu’à retenir chaque formule.',
  },
  gearX: {
    summary:
      'Un haut et un bas qui tournent comme un 3x3, des côtés en engrenages : le Gear Cube Extreme mêle deux mondes. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Gear Cube Extreme est un hybride déroutant : le haut et le bas tournent d’un quart de tour, comme sur un Rubik’s Cube ordinaire, tandis que les côtés obéissent à des **engrenages**. Les deux logiques se croisent sans cesse, et **un côté tourné ne referme le cube qu’au bout de trois coups**. Le plus exigeant de la famille, et le plus gratifiant une fois dompté.',
    methodsTitle: 'L’équateur d’abord',
    methods:
      'Une méthode en sept étapes : on règle d’abord la ceinture du milieu, puis les coins, les arêtes, leurs agrafes et enfin les engrenages. Plus longue que celle de ses cousins, elle avance sûrement, chaque étape ne touchant qu’à ses propres pièces.',
  },
  dino: {
    summary:
      'Ni centre ni coin : le Dino Cube n’est fait que d’arêtes qui tournent autour de ses sommets. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Dino Cube a quelque chose de déroutant : **il n’a ni centre ni coin**, seulement douze arêtes taillées en triangles, que chaque sommet fait tourner trois par trois. Les couleurs semblent d’abord se mêler au hasard, puis la logique apparaît, et il devient un petit puzzle délicieux, idéal pour s’initier aux coupes diagonales.',
    methodsTitle: 'Une seule formule',
    methods:
      'Il se résout étage par étage avec une seule formule, qui fait tourner trois arêtes sans rien déranger d’autre. Une fois qu’on l’a en main, tout le cube y passe.',
  },
  skewb: {
    summary:
      'Le Skewb tourne par ses sommets, en coupant le cube en deux : déroutant, puis étonnamment simple. Apprenez à le résoudre pas à pas avec son tutoriel.',
    about:
      'Le Skewb ne tourne pas par ses faces, mais par ses sommets : chaque coup **coupe le cube en deux moitiés** le long d’une diagonale, et tout semble basculer d’un coup. Le premier contact désarçonne, pourtant **il se résout avec une poignée de gestes** : le meilleur point de départ pour les puzzles à coupes diagonales.',
    methodsTitle: 'Le haut d’abord',
    methods:
      'Une méthode toute simple : on termine d’abord le haut, puis tout le reste en ne tournant que le bas, car le centre du haut ne bouge jamais. Le tutoriel vous la fait suivre geste par geste.',
  },
  ivy: {
    summary:
      'Des feuilles arrondies, quatre sommets qui tournent sur place : l’Ivy Cube est le plus doux des puzzles à coupes diagonales. Manipulez-le et résolvez-le.',
    about:
      'Avec ses feuilles arrondies, l’Ivy Cube a l’allure d’un objet de design plus que d’un casse-tête. Seuls quatre sommets tournent, sur place, en emportant les feuilles autour d’eux, et **on le résout souvent par inadvertance**, rien qu’en jouant avec : de quoi goûter aux coupes diagonales sans s’y perdre.',
    methodsTitle: 'Face par face',
    methods:
      'Une méthode courte : une face, puis la face opposée, puis les quatre centres restants. Quelques coups bien choisis suffisent à en venir à bout.',
  },
  masterSkewb: {
    summary:
      'Le Master Skewb, un Skewb découpé plus finement : les mêmes gestes, plus de trois fois plus de pièces. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Master Skewb reprend les gestes du Skewb, mais chaque sommet peut emporter toute une moitié du cube ou une simple tranche, et ses faces se fragmentent en arêtes et en pétales : **cinquante pièces** au lieu de quatorze. En main, l’effet est saisissant, presque hypnotique. Plus long qu’un Skewb, il reste à la portée de qui connaît déjà son grand frère.',
    methodsTitle: 'Skewb d’abord',
    methods:
      'On le résout d’abord comme un Skewb, sans se soucier des petites pièces, puis on range ses arêtes et ses pétales par commutateurs, ces formules qui échangent trois pièces sans toucher au reste.',
  },
  copter: {
    summary:
      'Le Curvy Copter tourne par ses arêtes, en demi-tours, et ses feuilles courbes glissent d’une face à l’autre. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Ici, ce ne sont plus les faces ni les sommets qui tournent, mais **les arêtes**, d’un demi-tour à chaque coup. Les feuilles courbes glissent d’une face à l’autre, et le cube prend vite l’air d’une mosaïque indéchiffrable. Pourtant ses arêtes ne quittent jamais leur place : une fois ce repère trouvé, le puzzle se laisse apprivoiser.',
    methodsTitle: 'Les arêtes pour repère',
    methods:
      'Ses arêtes ne quittent jamais leur place : elles donnent la couleur de chaque face, et l’on range tout le reste autour, une sorte de pièce après l’autre.',
  },
  copter3: {
    summary:
      'Le Curvy Copter III ajoute centres et pétales au Curvy Copter : la même danse des arêtes, en plus foisonnant. Manipulez-le en 3D et résolvez-le.',
    about:
      'Le Curvy Copter III garde la mécanique du Curvy Copter, ses arêtes qui tournent d’un demi-tour, mais ses coupes plus profondes ajoutent **des centres et vingt-quatre pétales** emportés à chaque coup. Mélangé, il est d’une beauté foisonnante, et sa résolution demande plus de patience que de génie.',
    methodsTitle: 'La même boussole',
    methods:
      'La même méthode que son petit frère : ses arêtes restent en place et donnent les couleurs, et l’on range autour les sommets, les centres et les pétales, une sorte de pièce après l’autre.',
  },
  rex: {
    summary:
      'Le Rex Cube, un Dino Cube coupé plus profond : arêtes, centres et pétales arrondis se mêlent à chaque coup. Manipulez-le en 3D et résolvez-le.',
    about:
      'Le Rex Cube tourne comme le Dino Cube, par ses sommets, mais ses coupes arrondies plongent plus profond : chaque coup emporte **trois arêtes, trois centres et neuf pétales**. Ses courbes lui donnent un charme fou, et il se résout bien plus sereinement qu’il n’en a l’air.',
    methodsTitle: 'Des arêtes aux pétales',
    methods:
      'Une méthode en trois temps : les arêtes, puis les centres, puis les pétales, chaque formule ne dérangeant que ce qui reste à faire. On avance sans jamais revenir en arrière.',
  },
  fisher: {
    summary:
      'Le Fisher Cube est un Rubik’s Cube déguisé : taillé de biais, il se déforme à chaque coup. Résolvez-le pas à pas, avec la méthode de votre choix.',
    about:
      'Le Fisher Cube cache son jeu : c’est **un Rubik’s Cube déguisé**, taillé dans un cube tourné d’un huitième de tour. Le mécanisme est le même, mais il se déforme à chaque coup en silhouettes improbables, et ses centres de côté, posés de biais, montrent leur orientation. Le cerveau proteste, puis s’amuse : qui sait résoudre un 3x3 sait presque résoudre celui-ci.',
    methodsTitle: 'Comme un Rubik’s Cube',
    methods:
      'Quatre méthodes du 3x3 au choix, par couches, CFOP, Petrus ou ZZ, jouées sur ses couleurs, puis une dernière formule pour remettre ses centres de côté dans le bon sens.',
  },
  windmill: {
    summary:
      'Le Windmill, jumeau du Fisher Cube : un Rubik’s Cube taillé de biais qui, mélangé, a l’air tout cabossé. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Windmill est le jumeau du Fisher Cube : le même mécanisme de Rubik’s Cube, taillé cette fois dans un cube tourné d’un angle plus faible. Ce petit décalage suffit à tout changer : ses pièces prennent des tailles inégales et, **une fois mélangé, il fait l’effet d’un Rubik’s Cube tout cabossé**. Un déguisement plus subtil encore que celui du Fisher, et d’autant plus réjouissant à percer.',
    methodsTitle: 'Le 3x3 en filigrane',
    methods:
      'Comme pour le Fisher Cube, quatre méthodes du 3x3 au choix, par couches, CFOP, Petrus ou ZZ, puis une dernière formule pour tourner ses centres de côté.',
  },
  bigBlock: {
    summary:
      'Le BigBlock, un Rubik’s Cube dont un gros bloc est soudé : deux faces seulement tournent. Le plus doux des soudés, à résoudre pas à pas.',
    about:
      'Le BigBlock est un Rubik’s Cube dont **un bloc de douze pièces** est soudé d’un seul tenant : il ne reste que **deux faces qui tournent**. On croirait une plaisanterie, et pourtant ces deux faces suffisent à le mélanger sérieusement. Le plus abordable des soudés, parfait pour découvrir la famille.',
    methodsTitle: 'Les coins, puis les arêtes',
    methods:
      'Une méthode en deux temps : les coins d’abord, puis les arêtes, chaque fois par une formule à deux faces qui ne touche qu’à ce qui reste à faire.',
  },
  squarebik: {
    summary:
      'Le Squarebik, un Rubik’s Cube à moitié soudé, bridé comme un Square-1 : trois faces seulement tournent. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Squarebik soude la moitié de sa couronne du milieu, à la manière d’un Square-1 : **seules trois faces tournent encore**. On le croit vite résolu, puis l’on bute sur les pièces qui refusent de passer d’un côté à l’autre. Un soudé de transition, juste assez retors pour qu’on y prenne goût.',
    methodsTitle: 'Comme un 3x3, ou presque',
    methods:
      'Il se résout par couches, comme un Rubik’s Cube, en montant étage par étage avec les seules faces qui tournent encore. Quelques formules de plus que sur un 3x3, mais le chemin est familier.',
  },
  fused: {
    summary:
      'Le Fused, un Rubik’s Cube dont un coin de 2x2x2 est soudé en bloc : trois faces tournent. Un soudé accessible et malin, à résoudre pas à pas.',
    about:
      'Le Fused a **un coin entier soudé en un bloc de huit pièces** : les trois faces qui le touchent ne tournent plus, il n’en reste que trois. Le mélange paraît sage, mais il faut vite ruser pour amener chaque pièce là où elle doit aller. Un soudé à la fois accessible et malin.',
    methodsTitle: 'Par couches, en rusant',
    methods:
      'Il se résout par couches, entre Petrus et Fridrich, avec les trois faces libres : le bas et le milieu se construisent à l’intuition, et quelques formules bien choisies finissent le haut.',
  },
  quadStripe: {
    summary:
      'Le QuadStripe soude trois carrés et trois barres autour d’un cube caché : chaque coup change les faces qui tournent. Résolvez-le pas à pas en 3D.',
    about:
      'Sur le QuadStripe, trois carrés et trois barres soudés s’enroulent autour d’un **petit cube caché**. À chaque coup, les soudures se déplacent et **ce sont d’autres faces qui se bloquent** : le puzzle se transforme sans cesse sous les doigts. Il faut apprendre à le lire autant qu’à le tourner, et c’est ce qui le rend passionnant.',
    methodsTitle: 'Tout part d’une position clé',
    methods:
      'Comme les soudés de sa trempe, on le ramène d’abord à sa position clé, d’où partent toutes ses formules, puis on y range chaque sorte de pièce l’une après l’autre.',
  },
  detour: {
    summary:
      'Le Detour, deux barres et cinq languettes soudées : un Rubik’s Cube qui oblige à prendre des chemins de traverse. Manipulez-le en 3D et résolvez-le.',
    about:
      'Le Detour porte bien son nom : avec ses deux barres et ses **cinq languettes soudées**, aucun coup direct ne mène là où l’on veut, il faut sans cesse **passer par des détours**. Ses milliers de formes possibles en font un vrai labyrinthe, mais chaque passage trouvé procure un plaisir rare.',
    methodsTitle: 'Le passage obligé',
    methods:
      'On le ramène à sa position clé, où une face tourne librement, on y range les pièces par petits groupes avec des formules courtes, puis l’on revient à la forme du cube résolu.',
  },
  diamond: {
    summary:
      'Le Diamond, deux carrés et deux languettes soudés : peu de formes, mais chacune a son piège. Un soudé élégant à manipuler en 3D et à résoudre pas à pas.',
    about:
      'Le Diamond soude **deux carrés et deux languettes**, et ne prend qu’une centaine de formes, bien moins que ses cousins le Stripe ou le Detour, qui en comptent des milliers. Mais chacune réserve son piège. Un soudé élégant, idéal pour apprendre à manœuvrer autour des blocs.',
    methodsTitle: 'Un aller-retour',
    methods:
      'On passe par sa position clé, où le haut tourne librement, pour y ranger toutes les pièces, puis l’on revient à la forme du cube. Un aller-retour court et bien balisé.',
  },
  bandage: {
    summary:
      'Le Bandage Cube, sept barres soudées autour d’un sommet libre : le classique des soudés. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Bandage Cube est le classique de la famille : **sept barres soudées**, des languettes et un seul sommet resté libre. Chaque coup déplace les soudures et fige d’autres faces, si bien qu’on avance souvent à reculons. Exigeant mais d’une logique imparable, c’est l’épreuve que tout amateur de soudés finit par affronter.',
    methodsTitle: 'Barre après barre',
    methods:
      'Depuis sa position clé, on remet ses barres en place une à une, chacune avec la formule qui lui convient ; les deux dernières suivent d’elles-mêmes.',
  },
  quad: {
    summary:
      'Le Quad, trois carrés soudés autour d’un cube caché : le QuadStripe sans ses barres, plus libre et plus trompeur. Résolvez-le pas à pas en 3D.',
    about:
      'Le Quad, c’est le QuadStripe débarrassé de ses barres : il ne garde que **trois carrés soudés** autour d’un petit cube caché. Plus de liberté, donc, mais aussi moins de repères, et l’on se surprend à le mélanger davantage en croyant le résoudre. Plus court que son grand frère, et plein de surprises.',
    methodsTitle: 'Le cube caché d’abord',
    methods:
      'Depuis sa position clé, on reforme d’abord le petit cube caché, puis on range autour les arêtes et les sommets, avec les formules du QuadStripe.',
  },
  stripe: {
    summary:
      'Le Stripe, trois barres soudées en étoile autour d’un coin : un Rubik’s Cube aux coups souvent bloqués. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Stripe soude **trois barres en étoile** autour d’un même coin, si bien qu’une bonne partie des coups est bloquée à tout moment. Pourtant, son chemin de résolution ressemble étonnamment à celui d’un Rubik’s Cube, couche après couche, pour qui sait contourner ses barres.',
    methodsTitle: 'Couche après couche',
    methods:
      'Depuis sa position clé, on le résout presque comme un 3x3, du bas vers le haut, avec des formules taillées pour ses barres, avant de revenir à la forme du cube.',
  },
  fusedStripe: {
    summary:
      'Le FusedStripe, le bloc du Fused et trois barres soudées : l’un des soudés les plus coriaces. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le FusedStripe cumule les contraintes : **le gros bloc du Fused et trois barres en étoile**. Il reste si peu de coups possibles qu’on se sent vite à l’étroit, et orienter ses pièces oblige à passer par une position intermédiaire bien précise. L’un des soudés les plus coriaces, et l’un des plus satisfaisants à vaincre.',
    methodsTitle: 'Un détour obligé',
    methods:
      'On place d’abord ses barres, ses sommets et ses arêtes, puis on oriente tout en passant par une position intermédiaire, où de nouvelles formules deviennent possibles, avant de revenir.',
  },
  alcatraz: {
    summary:
      'L’Alcatraz, le plus verrouillé des soudés : un bloc, trois barres, deux languettes et un carré. Saurez-vous vous en évader ? Résolvez-le pas à pas.',
    about:
      'L’Alcatraz porte un nom de prison, et il le mérite : **un bloc de huit pièces, trois barres, deux languettes et un carré** soudés ensemble. C’est le dernier et le plus redoutable de la série, celui où chaque coup se négocie. S’en évader demande méthode et persévérance, mais la sortie n’en est que plus belle.',
    methodsTitle: 'La grande évasion',
    methods:
      'Depuis sa position clé, on libère d’abord ses barres, puis l’on place et tourne les sommets et les arêtes du haut avec quelques longues formules. Un parcours exigeant, balisé étape par étape.',
  },
  ai: {
    summary:
      'L’AI Cube, un 4x4 dont la moitié des pièces est soudée en gros blocs : rien ne tourne comme prévu. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'L’AI Cube part d’un 4x4 dont **quatre gros blocs soudés** se placent en quinconce, entourés de petits cubes libres. Selon où se trouvent les blocs, on peut tourner une moitié du cube, une couche ou une simple tranche, et le puzzle change de visage à chaque coup. Fascinant à manipuler, et bien plus abordable qu’il n’y paraît.',
    methodsTitle: 'Retour au Pocket',
    methods:
      'On le ramène à un 2x2x2 : on reconstitue d’abord ses huit blocs, petits cubes compris, puis on le résout comme un simple Pocket Cube.',
  },
  roadblock: {
    summary:
      'Le RoadBlock-I, un 5x5 dont les centres sont soudés en barres : une tranche ne tourne que si ses barres la laissent passer. Résolvez-le pas à pas.',
    about:
      'Le RoadBlock-I est un 5x5 dont **les neuf centres de chaque face sont soudés en trois barres**. Une tranche ne tourne que si aucune barre ne lui coupe la route, d’où son nom. Il faut sans cesse coucher et redresser les barres pour ouvrir le passage : un casse-tête ingénieux, aussi déroutant que plaisant.',
    methodsTitle: 'Ouvrir la route',
    methods:
      'On le ramène à un Rubik’s Cube : en couchant ses barres dans le bon sens, on libère les tranches qu’il faut tourner, puis on le résout comme un 3x3.',
  },
  oct4: {
    summary:
      'Le 4-Trajber’s Octahedron, un 4x4 déguisé en octaèdre à huit couleurs : qui connaît le 4x4 s’y retrouve vite. Manipulez-le en 3D et résolvez-le.',
    about:
      'Sous ses huit faces triangulaires, le 4-Trajber’s Octahedron cache **un 4x4 taillé en octaèdre** : il tourne exactement comme lui, mais chaque pièce n’y montre qu’une couleur. Le déguisement est si réussi qu’on met un moment à reconnaître son vieux compagnon, puis tout devient familier, et plaisant à redécouvrir sous un nouvel angle.',
    methodsTitle: 'Un vieux compagnon',
    methods:
      'On le résout une sorte de pièce après l’autre, sommets, centres puis arêtes, avec des commutateurs empruntés à un cube bien connu.',
  },
  vto: {
    summary:
      'L’Octahedron VTO tourne par ses sommets, d’un quart de tour : un 3x3 taillé en octaèdre, aux faces de Pyraminx. Manipulez-le en 3D et résolvez-le.',
    about:
      'L’Octahedron VTO est **un 3x3 taillé en octaèdre** : ce sont ses six sommets qui tournent, d’un quart de tour, et leurs pointes peuvent aussi tourner seules. Chaque face, découpée en neuf triangles, rappelle un Pyraminx, si bien qu’on hésite sans cesse entre les deux logiques. Déroutant au premier contact, il se révèle bien moins difficile qu’il n’en a l’air.',
    methodsTitle: 'Comme un Pyraminx',
    methods:
      'On accorde d’abord ses centres en tournant les sommets, comme sur un Pyraminx, puis on range les arêtes avec quelques formules courtes.',
  },
  gem: {
    summary:
      'Le GEM-0, un octaèdre aux pointes rabotées en carrés dorés : un bijou qui tourne comme un 3x3. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le GEM-0 est un VTO dont on a **raboté les pointes en carrés dorés**, ornés d’un emblème : il prend l’allure d’un bijou et tourne désormais comme un 3x3, par quarts de tour. Le plus beau des octaèdres, presque trop précieux pour qu’on ose le mélanger.',
    methodsTitle: 'Les centres d’abord',
    methods:
      'Comme sur un Pyraminx, on accorde d’abord ses centres en tournant les carrés, puis on range les arêtes : une méthode courte et élégante, à l’image du puzzle.',
  },
  fto: {
    summary:
      'Le FTO, un octaèdre dont les huit faces tournent par tiers : vif, profond, et sans rien de connu. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le FTO fait tourner **ses huit faces**, d’un tiers de tour, et chacune emporte au passage des pièces de ses voisines. Il se mélange en un instant et ne ressemble à rien de connu, ni cube ni Pyraminx. Un puzzle vif et profond, qui oblige à se construire de nouveaux réflexes.',
    methodsTitle: 'Une pièce à la fois',
    methods:
      'Une sorte de pièce après l’autre, sommets, centres puis arêtes, chacune par un 3-cycle qui ne touche à rien d’autre. Méthodique et sans mauvaise surprise.',
  },
  rainbow: {
    summary:
      'Le Rainbow, un cuboctaèdre aux triangles qui tournent : douze pièces seulement, mais un vrai casse-tête. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Rainbow mêle **six carrés et huit triangles**, et ce sont les triangles qui tournent, chacun faisant circuler les trois pièces de ses coins. Il n’a que douze pièces, chacune aux quatre couleurs, et pourtant il résiste étonnamment longtemps. Une forme rare, d’une grande élégance, qui ne se laisse pas apprivoiser au premier essai.',
    methodsTitle: 'Un triangle, puis les autres',
    methods:
      'On complète un premier triangle, puis tous les autres avec deux commutateurs ; le dernier se range tout seul, comme une récompense.',
  },
  megaminx: {
    summary:
      'Le Megaminx, le Rubik’s Cube à douze faces : plus de pièces, mais une logique familière. Manipulez-le en 3D et apprenez à le résoudre pas à pas.',
    about:
      'Le Megaminx, c’est **un Rubik’s Cube à douze faces pentagonales** : plus de pièces, plus de couleurs, et une impression de vertige au premier mélange. Pourtant, qui sait résoudre un 3x3 y retrouve vite ses repères : les mêmes idées, simplement plus longues à dérouler. Un marathon plus qu’un sprint, et une immense satisfaction à l’arrivée.',
    methodsTitle: 'L’étoile prolongée',
    methods:
      'On le résout comme un Rubik’s Cube par couches, en gagnant une face voisine à chaque étape, jusqu’au haut, qui se termine en dernier.',
  },
  crystal: {
    summary:
      'Le Pyraminx Crystal, un Megaminx coupé plus profond, sans centres : douze faces qui s’entremêlent. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Pyraminx Crystal reprend la forme du Megaminx, mais ses coupes plongent jusqu’au centre des faces voisines : **il n’a plus de centres**, et chaque coup bouscule une large part du puzzle. Les repères habituels s’évanouissent, il faut tout reconstruire à partir des sommets. Splendide une fois mélangé, et un vrai défi pour les amateurs de Megaminx.',
    methodsTitle: 'Les sommets d’abord',
    methods:
      'Comme le Megaminx par couches, mais en plaçant toujours les sommets avant les arêtes, puisque plus aucun centre ne donne les couleurs.',
  },
  skewbU: {
    summary:
      'Le Skewb Ultimate, un Skewb taillé en dodécaèdre : douze faces pour un mécanisme familier. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Skewb Ultimate a l’allure d’un Megaminx, mais c’est **un Skewb déguisé en dodécaèdre** : chaque coup fait basculer toute une moitié du puzzle. Ses faces penchées brouillent les repères, et l’on cherche longtemps où se cachent les centres. Une fois le déguisement percé, il se résout comme son grand frère, avec un plaisir intact.',
    methodsTitle: 'Le haut d’abord',
    methods:
      'La méthode du Skewb, adaptée à sa forme : on termine d’abord le haut, puis tout le reste en ne tournant que le bas.',
  },
  pyra: {
    summary:
      'Le Pyraminx, la pyramide qui tourne : quatre sommets, une logique limpide. Le casse-tête idéal pour débuter, avec son tutoriel pas à pas.',
    about:
      'Le Pyraminx est la porte d’entrée rêvée des casse-têtes qui ne sont pas des cubes : **une pyramide dont chaque sommet tourne**, avec sa couche ou sa seule pointe. Ses pointes se règlent d’un simple tour, et le reste suit une logique limpide. On le croit compliqué, il se résout en un rien de temps, et l’on n’arrête plus de le mélanger.',
    methodsTitle: 'Les centres d’abord',
    methods:
      'On accorde d’abord ses centres, d’un simple tour chacun, puis on range les arêtes avec trois formules à retenir. Le tutoriel vous guide pas à pas, jusqu’à le résoudre seul.',
  },
  tetra: {
    summary:
      'Le Tetraminx, un Pyraminx sans ses pointes : la même pyramide, en plus épuré. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Tetraminx, c’est **un Pyraminx dont on a ôté les pointes** : quatre sommets tronqués, et rien d’autre ne change. Plus épuré, il va droit à l’essentiel, et c’est sans doute la plus douce des pyramides pour s’initier.',
    methodsTitle: 'L’essentiel du Pyraminx',
    methods:
      'La méthode du Pyraminx, sans l’étape des pointes : les centres d’abord, d’un tour chacun, puis les arêtes avec trois formules.',
  },
  pyra4: {
    summary:
      'Le Master Pyraminx, un Pyraminx à quatre étages : plus de pièces, plus de tranches, et des jumelles à départager. Manipulez-le en 3D et résolvez-le.',
    about:
      'Le Master Pyraminx agrandit la pyramide à **quatre étages**, dont chaque tranche tourne séparément. Ses pièces se multiplient, certaines vont par paires de jumelles qu’il faut apprendre à distinguer, et le petit Pyraminx semble soudain bien loin. Une belle marche à gravir pour qui maîtrise déjà son petit frère.',
    methodsTitle: 'Du facile au subtil',
    methods:
      'On le traite comme un grand Pyraminx : les pièces faciles d’abord, puis les arêtes, qui vont par paires de jumelles, par commutateurs, ces formules qui échangent trois pièces sans toucher au reste.',
  },
  pyra5: {
    summary:
      'Le Professor Pyraminx, cinq étages et sept sortes de pièces : la plus grande des pyramides. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Professor Pyraminx pousse la pyramide jusqu’à **cinq étages et sept sortes de pièces**. Mélangé, c’est **un océan de petits triangles**, d’une beauté presque artistique, qu’on hésiterait à résoudre. Pourtant chaque pièce finit par trouver sa place avec une logique imparable : un défi de patience, et un objet superbe.',
    methodsTitle: 'La même méthode, en grand',
    methods:
      'La méthode du Master Pyraminx, étendue : les pièces faciles d’abord, puis les arêtes et les centres par commutateurs, une famille de pièces après l’autre.',
  },
  jing: {
    summary:
      'Le Pyraminx Jing, une pyramide coupée en plein cœur : chaque sommet fait basculer la moitié du puzzle. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Pyraminx Jing coupe **au-delà du centre** : chaque sommet fait basculer toute une moitié de la pyramide, ses centres compris. Le mélange devient vite vertigineux, bien plus que sur un Pyraminx, mais il ne compte que quatorze pièces, et l’on finit par en démêler la logique avec plaisir.',
    methodsTitle: 'Les coins d’un tour',
    methods:
      'Les sommets d’abord, d’un tour chacun, puis les arêtes et les centres par commutateurs, ces formules qui ne déplacent que trois pièces.',
  },
  morph: {
    summary:
      'Le Pyramorphinx, un 2x2 déguisé en pyramide qui se déforme à chaque coup. Manipulez-le en 3D et apprenez à le résoudre avec son tutoriel.',
    about:
      'Le Pyramorphinx a l’air d’un Pyraminx, mais c’est **un 2x2 taillé dans une pyramide** : au premier quart de tour, il se déforme en une silhouette inattendue. Le contraste entre son allure de pyramide et ses gestes de cube est délicieusement troublant. Qui connaît le 2x2 le résout vite, et les autres apprennent deux puzzles d’un coup.',
    methodsTitle: 'Comme un Pocket',
    methods:
      'Ses huit pièces sont les coins d’un 2x2, et il se résout comme tel. Le tutoriel vous l’enseigne pas à pas, en tenant compte de sa forme changeante.',
  },
  mmorph: {
    summary:
      'Le Master Morphinx, un Rubik’s Cube taillé dans une pyramide, qui se déforme sans cesse. Résolvez-le pas à pas, avec la méthode de votre choix.',
    about:
      'Le Master Morphinx est **un Rubik’s Cube déguisé en pyramide** : le mécanisme d’un 3x3, taillé dans un tétraèdre. Au premier coup, la pyramide se disloque en formes étranges, et l’on doute d’avoir affaire à un cube. Un déguisement aussi réussi que celui du Fisher Cube, et tout aussi réjouissant à percer.',
    methodsTitle: 'Un 3x3 sous la pyramide',
    methods:
      'Quatre méthodes du 3x3 au choix, par couches, CFOP, Petrus ou ZZ, jouées sur ses couleurs, avec une dernière étape pour remettre ses centres dans le bon sens.',
  },
  dinoCyl: {
    summary:
      'Le Dino Cylinder, un Dino Cube taillé en cylindre, avec des sommets en plus. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Dino Cylinder reprend la mécanique du Dino Cube, mais taillé en **cylindre aussi haut que large**, avec des sommets en plus qui pivotent sur place. Sa silhouette ronde trompe l’œil : on cherche des faces là où il n’y a que des courbes. Un puzzle doux et original, qui ravit autant en main que sur l’étagère.',
    methodsTitle: 'Les sommets pour boussole',
    methods:
      'On le résout étage par étage avec une seule formule, qui fait tourner trois arêtes ; ses sommets, qui ne quittent jamais leur place, indiquent comment le tenir.',
  },
  puck: {
    summary:
      'Le Hockey Puck, un palet de vingt-quatre pièces qui tournent et basculent, numérotées sur le dessus. Manipulez-le en 3D et remettez chaque numéro en place.',
    about:
      'Le Hockey Puck a la forme d’un palet : **deux étages de douze pièces**, numérotées sur le dessus, qui tournent l’un sur l’autre et basculent par moitiés. Les numéros en font un puzzle de chiffres plus que de couleurs, et remettre 1 à 12 dans l’ordre devient étrangement addictif.',
    methodsTitle: 'Trier les numéros',
    methods:
      'On sépare d’abord les pièces numérotées des autres, puis on range chaque étage par échanges de pièces, jusqu’à retrouver la ronde des numéros.',
  },
  barrel: {
    summary:
      'Le Barrel, un Rubik’s Cube aux arêtes rabotées en tonneau à huit côtés, quatre couleurs en plus. Résolvez-le pas à pas, avec la méthode de votre choix.',
    about:
      'Le Barrel est un Rubik’s Cube dont **les quatre arêtes verticales ont été rabotées** : il devient un tonneau à huit côtés, avec quatre couleurs de plus sur les coupes. Le cube familier paraît étrangement neuf, et sa résolution réserve une bonne surprise : ses arêtes du milieu n’ont pas de sens visible, ce qui simplifie la fin.',
    methodsTitle: 'Quatre façons de faire',
    methods:
      'Quatre méthodes au choix, par couches, CFOP, Petrus ou ZZ, comme sur un 3x3. Ses arêtes du milieu, dont le sens ne se voit pas, rendent la fin plus légère.',
  },
  star: {
    summary:
      'Le 2-Star Prism, une étoile à six branches qui tourne et bascule : la famille du Square-1, en plus doux. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le 2-Star Prism est **une étoile à six branches** sur deux étages : on tourne le haut ou le bas, puis l’on fait basculer toute une moitié d’un coup sec. De la famille du Square-1, il en a la mécanique déroutante, mais avec douze pièces et deux couleurs seulement, il se laisse dompter bien plus vite. Un petit objet charmant, presque un bijou de poche.',
    methodsTitle: 'Trier, puis ranger',
    methods:
      'On sépare d’abord les deux couleurs, l’une en haut, l’autre en bas, puis l’on range tout avec une seule formule d’échange.',
  },
  star4: {
    summary:
      'Le 4-Star Prism, deux étoiles emboîtées sur quatre étages : un Super Square-1 en forme d’étoile. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le 4-Star Prism superpose **quatre étages qui tournent chacun seul**, traversés par le même basculement : en réalité, deux 2-Star Prism emboîtés qui partagent leur axe. Sous ses airs de grand frère, il cache une logique limpide : il suffit de résoudre une étoile après l’autre. Une belle leçon de décomposition.',
    methodsTitle: 'Une étoile, puis l’autre',
    methods:
      'On le résout comme deux 2-Star Prism, l’un après l’autre, avec la même formule pour les deux.',
  },
  holey: {
    summary:
      'Le Holey Megaminx, un Megaminx sans centres, troué de part en part : le même casse-tête, en dentelle. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Holey Megaminx, c’est un Megaminx dont on a **retiré les douze centres** : des trous à leur place, à travers lesquels on voit le puzzle de part en part. Plus léger, presque en dentelle, il tourne exactement comme son grand frère, mais sans centres pour dire les couleurs, il faut redoubler d’attention.',
    methodsTitle: 'L’étoile prolongée',
    methods:
      'La méthode du Megaminx, sans changement : par couches, en gagnant une face voisine à chaque étape, jusqu’au haut. Ce sont les pièces déjà placées qui servent de repère.',
  },
  void: {
    summary:
      'Le Void Cube, un Rubik’s Cube sans centres, troué de part en part : six méthodes pour le résoudre. Manipulez-le en 3D et choisissez la vôtre.',
    about:
      'Le Void Cube est **un Rubik’s Cube sans centres**, chaque face percée d’un grand trou. Sans eux, plus rien ne dit la couleur d’une face, et les tranches du milieu deviennent de vraies farceuses : elles déplacent des arêtes sans toucher aux sommets, si bien qu’il reste parfois deux arêtes à échanger à la toute fin. Un cube d’une grande élégance, plus malicieux qu’il n’y paraît.',
    methodsTitle: 'Six chemins possibles',
    methods:
      'Six méthodes au choix : les grandes méthodes du 3x3, par couches, CFOP, Roux, Petrus et ZZ, et une qui lui est propre, commençant par les sommets du bas pour donner les couleurs.',
  },
  tori: {
    summary:
      'Le Tori, un Rubik’s Cube sans coins aux formes arrondies : rien que des centres et des arêtes. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Tori est **un Rubik’s Cube sans coins** : six centres en anneaux percés et douze arêtes effilées comme des amandes, dans un cube aux formes arrondies. Il tient presque de la sculpture, et sa résolution, débarrassée des coins, se fait légère et rapide.',
    methodsTitle: 'La croix prolongée',
    methods:
      'Rien que des arêtes à placer autour des centres fixes, avec des commutateurs très simples : une méthode courte, idéale pour s’amuser.',
  },
  edge: {
    summary:
      'L’Edge Only, un Rubik’s Cube réduit à ses douze arêtes, chaque face percée d’un trou carré. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'L’Edge Only pousse l’épure jusqu’au bout : **ni centres ni coins**, seulement les douze arêtes d’un Rubik’s Cube, chaque face percée d’un trou carré. Sans aucun repère fixe, on se demande d’abord par où commencer, puis le puzzle révèle une simplicité réjouissante.',
    methodsTitle: 'Rien que des arêtes',
    methods:
      'Des arêtes, encore des arêtes, placées par des commutateurs très simples : la méthode du Tori, sans même les centres pour guide.',
  },
  square1: {
    summary:
      'Le Square-1, un cube qui se déforme dès le premier coup : retrouver sa forme est déjà un défi. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Square-1 a l’air sage tant qu’il est carré, mais **un seul coup suffit à le déformer** en silhouettes improbables. Ses étages tournent par crans, sa moitié droite bascule, et ses pièces de deux tailles se répartissent au gré des mouvements. **Retrouver la forme du cube** est déjà une victoire, puis tout se range avec quelques formules : déroutant, et terriblement attachant.',
    methodsTitle: 'Deux chemins vers le cube',
    methods:
      'Deux méthodes, qui commencent toutes deux par lui rendre sa forme de cube : l’une range les sommets avant les arêtes, l’autre bâtit une face entière avant de finir la seconde. À vous de choisir votre route.',
  },
  twist: {
    summary:
      'Le Z-Twist, un Rubik’s Cube tordu sur lui-même : chaque coup le fait onduler. Résolvez-le pas à pas, avec la méthode de votre choix.',
    about:
      'Le Z-Twist est **un Rubik’s Cube dont le dessus a pivoté d’un quart de tour par rapport au dessous** : ses côtés se tordent, et une même face peut montrer deux couleurs. Dès qu’on le tourne, il ondule en formes étonnantes, et l’on peine à reconnaître un 3x3. Pourtant tout est là, ses centres disant même par leur forme s’ils sont tournés : un déguisement facétieux, parfait pour qui connaît déjà le cube.',
    methodsTitle: 'Un 3x3 sous la torsion',
    methods:
      'Quatre méthodes du 3x3 au choix, par couches, CFOP, Petrus ou ZZ, qui remettent aussi ses centres de côté dans le bon sens.',
  },
  quarter: {
    summary:
      'Le Quarter Cube, un Rubik’s Cube dont chaque face ne fait qu’un quart de tour, puis revient. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Quarter Cube a l’air d’un Rubik’s Cube ordinaire, mais **chaque face ne peut faire qu’un quart de tour, puis revenir**. Impossible de tourner deux fois de suite la même face : il faut sans cesse alterner, et les réflexes du 3x3 ne servent plus à rien. Un repère sur chaque centre dit où en est sa face : une contrainte toute simple, qui change tout.',
    methodsTitle: 'Toujours alterner',
    methods:
      'Une méthode qui place les arêtes d’abord, puis le reste, avec des formules qui alternent sans cesse les faces, puisqu’aucune ne peut tourner deux fois de suite.',
  },
  latch: {
    summary:
      'Le Latch Cube, un Rubik’s Cube à sens interdits : des flèches décident dans quel sens chaque face peut tourner. Manipulez-le et résolvez-le pas à pas.',
    about:
      'Sur le Latch Cube, **des flèches sur les arêtes décident du sens de chaque face** : horaire, anti-horaire, les deux, ou pas du tout quand elles se contredisent. Les sens interdits voyagent avec les pièces, et le cube semble se rebeller à chaque coup. Il faut apprendre à négocier avec lui : déroutant, puis franchement addictif.',
    methodsTitle: 'Contourner les flèches',
    methods:
      'Les arêtes d’abord, en contournant les faces bloquées, puis le reste : une méthode qui apprend à avancer malgré les sens interdits.',
  },
  fashion: {
    summary:
      'Le Fashion-V, un 3x3x5 ramassé en cube : ses couches fines se dressent et se couchent à chaque coup. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Fashion-V cache **un 3x3x5 dans la forme d’un cube** : ses couches du haut et du bas sont moitié moins épaisses que celle du milieu. Quand on tourne un côté, ses pièces se dressent et se décalent, et le cube devient un empilement surprenant. L’un des plus étonnants à manipuler, qui demande de penser en tour autant qu’en cube.',
    methodsTitle: 'Coucher, puis tourner',
    methods:
      'On couche d’abord toutes ses paires de pièces pour retrouver un 3x3x5 en ordre, puis on le résout comme une tour.',
  },
  meffertsPocket: {
    summary:
      'Le Meffert’s Pocket Cube, un 2x2 tout violet à l’axe décentré : il se déforme à chaque coup. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Meffert’s Pocket Cube a tout d’un 2x2 tranquille, **tout violet sauf un coin découpé en huit petits cubes**. Mais son axe est décentré : chaque coup le déforme, et ses gros blocs partent en tous sens. Ici, la couleur compte peu, **c’est la forme qu’il faut retrouver** : un casse-tête de géométrie plus que de couleurs, aussi intrigant que charmant.',
    methodsTitle: 'La forme avant tout',
    methods:
      'Deux méthodes : l’une le ramène d’abord à un cube, puis remet en place les couleurs du coin découpé ; l’autre trouve d’un coup la solution la plus courte.',
  },
  '123': {
    summary:
      'Le 1x2x3, un petit pavé de six cubes qui ne tourne que par demi-tours : le casse-tête idéal pour débuter. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le 1x2x3 tient dans la main comme un petit rectangle de six cubes, et ne se tourne que par **demi-tours**. On en fait vite le tour, et c’est tout son charme : **96 positions seulement**, contre plus de 43 milliards de milliards pour un Rubik’s Cube. Le terrain de jeu parfait pour comprendre ce qu’est une formule avant de s’attaquer aux grands.',
    methodsTitle: 'Un premier pas',
    methods:
      'Les coins d’abord, placés un à un, puis l’arête du bas retournée par une seule formule. Le tutoriel vous guide coup par coup ; la méthode Optimale, elle, trouve toujours le chemin le plus court.',
  },
  '331': {
    summary:
      'Un Rubik’s Cube aplati en une seule couche : le Floppy paraît simple, il a plus d’un tour dans son sac. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Le Floppy, c’est un Rubik’s Cube **aplati en une seule couche** : neuf pièces, et des faces qui ne font que des demi-tours. Ses arêtes ne quittent jamais leur place, elles se retournent seulement, tandis que les coins voyagent. On le croit trivial, il réserve pourtant **une petite surprise** au moment de retourner les dernières arêtes. Une entrée en matière rapide et gratifiante.',
    methodsTitle: 'Les coins, puis les arêtes',
    methods:
      'On place d’abord les coins un à un, puis une seule formule retourne les arêtes deux par deux. Le tutoriel vous l’apprend pas à pas ; la méthode Optimale montre le chemin le plus court.',
  },
  ghost: {
    summary:
      'Une plaque argentée taillée en étoile, qui se déforme à chaque coup : le Floppy Ghost se résout à l’œil. Manipulez-le en 3D et résolvez-le pas à pas.',
    about:
      'Tout argenté, le Floppy Ghost ne se lit qu’à ses formes : une plaque carrée découpée selon **une étoile à cinq branches**, posée légèrement de travers. Chaque coup retourne un côté, et la plaque part en angles improbables. Sans couleur pour se repérer, **c’est l’œil qui travaille** : on apprend à reconnaître chaque pièce à son contour. Un bel objet, et un vrai défi d’observation.',
    methodsTitle: 'Chaque pièce a son nom',
    methods:
      'On place d’abord les coins, on les retourne, puis on finit par les arêtes, chaque fois avec une formule courte. Le tutoriel donne un nom à chaque pièce pour s’y retrouver ; la méthode Optimale trouve le chemin le plus court.',
  },
}
