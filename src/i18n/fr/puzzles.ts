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
}
