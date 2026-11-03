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
}
