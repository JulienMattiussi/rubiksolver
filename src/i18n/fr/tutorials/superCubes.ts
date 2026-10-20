import type { TutorialTexts } from '../../tutorialTexts'

/** The super cubes' tutorials' own texts (lib/tutorials/standard/superCubes.ts);
 *  their other stages keep the 4x4's and the 5x5's. */
export const SUPER_CUBES_FR: TutorialTexts = {
  checks: {
    stepTutorialSuperMiddles: (done: number) =>
      done === 6
        ? 'Vérifie que les six centres du milieu sont droits, leurs bordures face aux bonnes couleurs.'
        : 'Vérifie que les centres du milieu ont tourné sur place, les couleurs intactes.',
    stepTutorialSuperCenters: () =>
      'Vérifie que les trois centres qui scintillaient ont changé de place, les couleurs intactes.',
  },
  figures: {
    figureSuperMiddles:
      'Les centres du milieu tournent sur place : leurs bordures disent de combien. La formule en tourne deux à la fois, ou un d’un demi-tour, sans rien déranger d’autre.',
    figureSuperCenter:
      'Repère les trois centres qui scintillent : la formule les fait tourner en rond, chacun prenant la place du suivant, et ne touche à rien d’autre.',
  },
  terms: {
    termBorder:
      'Une **bordure** : sur un super cube, chaque centre porte sur ses côtés la couleur de la face voisine. Résolu, chaque bordure touche la face de sa couleur : chaque centre a sa place à lui.',
  },
  progress: {
    stepTutorialSuperMiddles: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} du milieu sur ${total} droit${done > 1 ? 's' : ''}`,
    stepTutorialSuperCenters: (done: number, total: number) =>
      `${done} centre${done > 1 ? 's' : ''} sur ${total} à sa place`,
  },
  titles: {
    stepTutorialSuperMiddles: 'Redresser les centres du milieu',
    stepTutorialSuperCenters: 'Remettre chaque centre à sa place',
  },
  hints: {
    stepTutorialSuperMiddles:
      'Les couleurs sont faites, mais les centres du milieu ont pu tourner sur place. Des formules de tranches les redressent, deux à la fois ou un d’un demi-tour.',
    stepTutorialSuperCenters:
      'Les couleurs sont faites : chaque centre est sur sa face, mais pas forcément à sa place. Une formule échange trois centres en rond ; on la répète jusqu’à ce que chaque bordure touche la face de sa couleur.',
  },
}
