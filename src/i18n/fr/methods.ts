/** The methods' names and descriptions (the source; English mirrors it).
 *  A description is the method's idea in one sentence, short enough for the
 *  two folded lines under the picker: the steps are listed below it anyway. */
export const METHODS_FR = {
  beginner: {
    name: 'Par couches',
    desc: 'La méthode des débutants : étage par étage, avec peu de formules.',
  },
  cfop: {
    name: 'Fridrich (CFOP)',
    desc: 'La méthode des speedcubers : deux couches par paires coin-arête, la dernière en deux algorithmes.',
  },
  roux: {
    name: 'Roux',
    desc: 'Deux blocs construits sur les côtés, puis tout le reste en tournant presque uniquement M et U.',
  },
  petrus: {
    name: 'Petrus',
    desc: 'Un bloc qu’on agrandit, les arêtes orientées tôt pour finir les deux couches en R et U seulement.',
  },
  zz: {
    name: 'ZZ',
    desc: 'Toutes les arêtes orientées dès le départ, pour ne plus jamais tourner F ni B ensuite.',
  },
  reduction: {
    name: 'Réduction par couches',
    desc: 'Regrouper centres et arêtes pour qu’il se comporte comme un 3x3, puis le finir par couches.',
  },
  reductionCfop: {
    name: 'Réduction CFOP',
    desc: 'Regrouper centres et arêtes pour qu’il se comporte comme un 3x3, puis le finir en CFOP.',
  },
  barrelLayers: {
    name: 'Par couches',
    desc: 'Comme un 3x3 par couches ; ses arêtes du milieu, dont le sens ne se voit pas, simplifient la fin.',
  },
  megaStar: {
    name: 'L’étoile prolongée',
    desc: 'Comme un Rubik’s Cube par couches, une face voisine de plus à chaque étape, le haut en dernier.',
  },
  ftoCornersFirst: {
    name: 'Sommets, centres, arêtes',
    desc: 'Une sorte de pièce après l’autre, chacune par un 3-cycle qui ne touche à rien d’autre.',
  },
  skewbTopFirst: {
    name: 'Le haut d’abord',
    desc: 'Le centre du haut ne bouge jamais : le haut d’abord, puis tout le reste en tournant le bas.',
  },
  crystalCornersFirst: {
    name: 'Les sommets d’abord',
    desc: 'Comme le Megaminx par couches, mais en plaçant toujours les sommets avant les arêtes.',
  },
  aiBlocks: {
    name: 'Méthode des blocs',
    desc: 'Le ramener à un Pocket : reconstituer ses huit blocs, puis les résoudre comme un 2x2x2.',
  },
  rbCenters: {
    name: 'Méthode des centres',
    desc: 'Le ramener à un 3x3, en couchant ses barres pour pouvoir tourner les tranches voulues.',
  },
  quarterEdgesFirst: {
    name: 'Les arêtes d’abord',
    desc: 'Chaque face ne fait qu’un quart de tour et revient : toutes les formules alternent les faces.',
  },
  camoReduction: {
    name: 'Réduction en Domino',
    desc: 'Le remettre en forme et réunir les ailes de chaque arête, pour le ramener à un Domino.',
  },
  tower234Steps: {
    name: 'Sommets, arêtes, équateur',
    desc: 'La remettre en forme d’abord, puis tout résoudre avec des formules qui préservent cette forme.',
  },
  doubleDomino: {
    name: 'Double Domino',
    desc: 'Deux Dominos emboîtés, résolus l’un après l’autre avec les formules du Domino.',
  },
  towerReduction: {
    name: 'Réduction',
    desc: 'Réunir centres et arêtes pour la ramener à une tour de 3 de large, puis la finir comme telle.',
  },
  twoPockets: {
    name: 'Deux Pockets',
    desc: 'Deux Pockets empilés : la remettre en forme, puis les résoudre l’un après l’autre.',
  },
  asPocket: {
    name: 'Comme un Pocket',
    desc: 'Un Pocket déguisé : ses huit pièces sont les coins d’un 2x2, et il se résout comme tel.',
  },
  fashionLaid: {
    name: 'Coucher puis deux tours',
    desc: 'Coucher toutes ses paires pour retrouver un 3x3x5, puis le résoudre comme une tour.',
  },
  latchEdgesFirst: {
    name: 'Les arêtes d’abord',
    desc: 'Les flèches des arêtes bloquent des faces : les arêtes d’abord, en les contournant.',
  },
  copterEdgesFirst: {
    name: 'Les arêtes d’abord',
    desc: 'Ses arêtes ne quittent jamais leur place : elles donnent les couleurs, on range le reste autour.',
  },
  voidCornersFirst: {
    name: 'Les sommets du bas d’abord',
    desc: 'Un 3x3 sans centres : les sommets du bas en donnent les couleurs, puis on finit comme un 3x3.',
  },
  extendedCross: {
    name: 'Croix prolongée',
    desc: 'Un 3x3 sans coins : rien que des arêtes, placées par des commutateurs très simples.',
  },
  extendedTriangle: {
    name: 'Triangle prolongé',
    desc: 'Un premier triangle, puis tous les autres avec deux commutateurs ; le dernier se fait seul.',
  },
  octCornersFirst: {
    name: 'Sommets d’abord',
    desc: 'Un 4x4 taillé en octaèdre : chaque sorte de pièce par les commutateurs d’un cube connu.',
  },
  jingCornersFirst: {
    name: 'Sommets d’abord',
    desc: 'Les sommets d’abord, d’un tour chacun, puis les arêtes et les centres par commutateurs.',
  },
  wingsFirst: {
    name: 'Ailes puis co-ailes',
    desc: 'Un grand Pyraminx : les pièces faciles d’abord, puis les ailes et co-ailes par commutateurs.',
  },
  centersFirst: {
    name: 'Centres d’abord',
    desc: 'Les centres d’un simple tour chacun, puis les arêtes avec trois formules à retenir.',
  },
  isolateFirst: {
    name: 'Isoler puis permuter',
    desc: 'Séparer les deux couleurs entre haut et bas, puis tout ranger avec une seule formule d’échange.',
  },
  puckIsolate: {
    name: 'Isoler puis permuter',
    desc: 'Séparer les pièces numérotées des autres, puis ranger chaque étage par échanges de pièces.',
  },
  twoStars: {
    name: 'Deux étoiles',
    desc: 'Deux 2-Star Prism emboîtés, résolus l’un après l’autre avec la même formule.',
  },
  equatorFirst: {
    name: 'Équateur puis coins',
    desc: 'Comme un Domino debout : l’équateur d’abord, puis les coins du bas et du haut.',
  },
  cornersFirst: {
    name: 'Coins puis arêtes',
    desc: 'Les coins puis les arêtes, chaque fois par une formule qui ne touche que ce qui reste à faire.',
  },
  gemCentersFirst: {
    name: 'Centres d’abord',
    desc: 'Comme un Pyraminx : accorder les centres en tournant les carrés, puis ranger les arêtes.',
  },
  vtoCentersFirst: {
    name: 'Centres puis arêtes',
    desc: 'Comme un Pyraminx : accorder les centres en tournant les sommets, puis ranger les arêtes.',
  },
  gearEquatorFirst: {
    name: 'Équateur puis coins',
    desc: 'L’équateur d’abord, à l’intuition, puis chaque sorte de pièce, les engrenages en dernier.',
  },
  dinoCylLayers: {
    name: 'Par couches',
    desc: 'Étage par étage avec un 3-cycle d’arêtes ; les sommets, fixes, disent comment le tenir.',
  },
  dinoLayers: {
    name: 'Par couches',
    desc: 'Étage par étage avec une seule formule, un 3-cycle d’arêtes qui ne dérange rien d’autre.',
  },
  rexEdgesFirst: {
    name: 'Arêtes, centres, pétales',
    desc: 'Arêtes, centres, puis pétales, chaque formule ne dérangeant que ce qui reste à faire.',
  },
  gearCornersFirst: {
    name: 'Coins d’abord',
    desc: 'Les coins à l’intuition, puis chaque sorte de pièce ; les centres suivent tout seuls.',
  },
  shapeFirst: {
    name: 'Forme puis couleurs',
    desc: 'Redevenir un cube d’abord, puis remettre les couleurs par l’algorithme le plus court.',
  },
  optimal: {
    name: 'Optimale',
    desc: 'La solution la plus courte possible, trouvée par une recherche exhaustive.',
  },
  fromStart: {
    name: 'Depuis START',
    desc: 'Passer par la position START, d’où partent ses formules, pour y placer toutes les pièces.',
  },
  skewbFirst: {
    name: 'Skewb d’abord',
    desc: 'Le résoudre d’abord comme un Skewb, puis ses arêtes et ses pétales par commutateurs.',
  },
}
