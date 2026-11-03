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
}
