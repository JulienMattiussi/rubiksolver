import { CUBE3_FR } from './tutorials/cube3'
import { CUBE4_FR } from './tutorials/cube4'
import { CUBE5_FR } from './tutorials/cube5'
import { SUPER_CUBES_FR } from './tutorials/superCubes'
import { FLAT_FR } from './tutorials/flat'
import { CUBE2_FR } from './tutorials/cube2'
import { CUBES_FR } from './tutorials/cubes'
import { MORPH_FR } from './tutorials/morph'
import { OFAPEL_FR } from './tutorials/ofapel'
import { CROSS_CORNERS_FR } from './tutorials/crossCorners'
import { PYRAMIDS_FR } from './tutorials/pyramids'
import { PYRAMINX_FR } from './tutorials/pyraminx'
import { SKEWB_FR } from './tutorials/skewb'
import { GEAR_FR } from './tutorials/gear'
import { TOWER_FR } from './tutorials/tower'
import { mergeTexts } from '../tutorialTexts'

/** Each tutorial's texts, by key, in one (see i18n/tutorialTexts.ts). */
const TEXTS = mergeTexts([
  CUBES_FR,
  CUBE3_FR,
  CUBE2_FR,
  CUBE4_FR,
  CUBE5_FR,
  SUPER_CUBES_FR,
  FLAT_FR,
  PYRAMIDS_FR,
  PYRAMINX_FR,
  MORPH_FR,
  OFAPEL_FR,
  CROSS_CORNERS_FR,
  SKEWB_FR,
  GEAR_FR,
  TOWER_FR,
])

/** The kinds of pieces (`Tutorial.pieceKind`), named. */
export const PIECES_FR: Record<string, string> = {
  center: 'le centre',
  edge: 'l’arête',
  corner: 'le coin',
  tip: 'la pointe',
  middle: 'le milieu',
}

/** The tutorial's texts (the source; English mirrors it): the phrases
 *  every tutorial shares, and each one's own (titles, hints, figures,
 *  checks, words...) from its module in `tutorials/`. */
export const TUTORIAL_FR = {
  button: 'Tutoriel',
  buttonTitle: 'Apprendre à résoudre pas à pas, en choisissant les pièces à déplacer',
  exit: 'Quitter le tutoriel',
  close: 'Fermer le tutoriel',
  apply: 'Appliquer la formule',
  undo: 'Annuler le déplacement',
  finish: 'Valider le déplacement',
  next: 'Suivant',
  /** A stage the puzzle already meets when the tutorial comes to it. */
  alreadyDone:
    'Dans cette configuration, les cubes à déplacer à cette étape sont déjà dans la bonne position.',
  alreadyDoneNext: 'On peut passer à l’étape suivante.',
  /** Why the actions replacing the cube are off. */
  locked: 'Indisponible pendant le tutoriel : quitte-le d’abord',
  facing: (color: string, down: string) =>
    `Place le centre ${color} face à toi, le centre ${down} en bas.`,
  /** A side with no center (a 2x2's), told by its color. */
  facingFace: (color: string, down: string) =>
    `Place le côté ${color} face à toi, le côté ${down} en bas.`,
  /** A tutorial's own way to say how to hold its puzzle (`Tutorial.holding`). */
  holding: TEXTS.holding,
  /** The hold's words, when the whole cube must turn for it: they turn it. */
  turnTitle: 'Tourner le cube entier pour le tenir ainsi',
  facingTitle: 'Tourner la vue pour l’avoir face à toi',
  /** A piece named by its kind (`Tutorial.pieceKind`) and colors. */
  piece: (kind: string, colors: readonly string[]) =>
    `${PIECES_FR[kind] ?? 'la pièce'} ${colors.join('-')}`,
  /** A piece named by its legend's label (« le coin A »). */
  labelled: (kind: string, label: string) => `${PIECES_FR[kind] ?? 'la pièce'} ${label}`.trim(),
  spot: (piece: string) => `Repère ${piece}.`,
  spotSwap: (piece: string, other: string) => `Repère ${piece}, et ${other} qui occupe sa place.`,
  /** None left: turns by hand have done the step's formula. */
  play: (count: number) =>
    count === 0
      ? 'Effectue les mouvements.'
      : count === 1
        ? 'Effectue ce mouvement :'
        : `Effectue ces ${count} mouvements :`,
  /** A block the formula repeats: after its lead, or the whole of it. */
  repeat: (times: number) => `Puis répète **${times} fois** ces mouvements :`,
  /** The round of a repeated block under way, followed by hand. */
  round: (n: number, times: number) => `(${n === 1 ? '1re' : `${n}e`} fois sur ${times})`,
  /** Moves after a sequence, one by one. */
  thenPlay: (count: number) =>
    count === 1 ? 'Puis effectue ce mouvement :' : `Puis effectue ces ${count} mouvements :`,
  /** A sequence learnt in the formula: after other moves, or first. */
  thenSequence: 'Puis effectue cet enchaînement :',
  sequence: (count: number) => `Effectue cet enchaînement de ${count} mouvements :`,
  repeatAll: (count: number, times: number) =>
    `Effectue ces ${count} mouvements, **${times} fois** de suite :`,
  check: (piece: string) => `Vérifie les nouvelles positions : ${piece} est à sa place.`,
  checkAll: 'Vérifie les nouvelles positions : les pièces sont à leur place.',
  checkFigure: 'Vérifie la nouvelle figure que dessine le blanc en haut.',
  /** The check of a stage played by figures, by its key, given how far
   *  its formula takes it and the pieces it leaves marked on its side,
   *  named (else `checkFigure`); or of a formula stage (else `checkAll`). */
  checks: TEXTS.checks,
  /** A piece stage's own check, by its key (else `check`). */
  placed: TEXTS.placed,
  /** The figures a stage recognizes, by their key. */
  figures: TEXTS.figures,
  /** The glossary (step 0): its heading, how far along, the button past
   *  it, and each word, by its key (the word defined between `**`, in
   *  bold). */
  glossary: 'Le vocabulaire',
  glossaryIntro:
    'La première étape, préliminaire, est d’acquérir et de comprendre le vocabulaire qui sera utilisé pour décrire et manipuler le cube.',
  termCount: (n: number, total: number) => `Mot ${n} sur ${total}`,
  skipTerms: 'Passer',
  /** The keys pressing the tutorial's buttons, on their tooltips. */
  keysAhead: 'Raccourci : Espace ou flèche droite',
  keysBack: 'Raccourci : flèche gauche ou retour arrière',
  /** The legend of a puzzle whose pieces are told by shape (`Tutorial.legend`). */
  legend: 'La légende',
  legendIntro: 'Ce puzzle est d’une seule couleur : ses pièces se reconnaissent à leur forme.',
  legendKinds: { corner: 'Les coins', edge: 'Les arêtes' } as Record<string, string>,
  legendFront: 'Endroit',
  legendBack: 'Envers',
  legendOpen: 'Voir la légende des pièces',
  legendClose: 'Fermer la légende',
  backToGlossary: 'Revenir au vocabulaire',
  /** The reminder: the stages and their formulas (at the end, or asked for
   *  once the tutorial played through). */
  recap: 'Aide-mémoire',
  recapTitle: (n: number) => (n === 1 ? 'La formule à retenir' : `Les ${n} formules à retenir`),
  recapByHand: 'Sans formule, à la main',
  recapBack: 'Revenir au tutoriel',
  terms: TEXTS.terms,
  /** The legend of the hatched pieces, under the step's hint. */
  legendMoved:
    'Les cubes hachurés seront modifiés par le mouvement, sans impact sur le résultat attendu.',
  noFormula: 'Aucune formule ne mène là sans déranger les pièces déjà placées.',
  solved: 'Résolu, bravo !',
  /** A step's rank among the method's stages, or before them. */
  stage: (n: number, total: number) => `Étape ${n} sur ${total}`,
  beforeStages: 'Avant de commencer',
  /** How far a step has come, by its key (its pieces placed, of how many). */
  progress: TEXTS.progress,
  /** Each step's goal, by its key: the panel's heading. */
  titles: TEXTS.titles,
  /** What each step asks, by its key. */
  hints: TEXTS.hints,
}
