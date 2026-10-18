import type { TutorialTexts } from '../../tutorialTexts'

/** The Pyramorphinx tutorial's texts (lib/tutorials/pyramid/morph.ts), by key. */
export const MORPH_FR: TutorialTexts = {
  checks: {
    stepTutorialMorphCorner: () => 'Vérifie qu’une pointe est maintenant dans la moitié du bas.',
    stepTutorialMorphTurn: (done: number) =>
      done === 2
        ? 'Vérifie que les deux pointes de l’autre moitié sont maintenant bien tournées.'
        : done === 1
          ? 'Vérifie qu’une pointe de l’autre moitié est maintenant bien tournée.'
          : 'Aucune pointe n’est encore bien tournée : la formule suivante s’en charge.',
    stepTutorialMorphPlace: () =>
      'Vérifie que chaque pièce est à sa place : le Pyramorphinx est résolu.',
  },
  figures: {
    figureMorphNone: 'Repère les deux pointes de l’autre moitié : aucune n’est bien tournée.',
    figureMorphOne: 'Repère les deux pointes de l’autre moitié : une seule est bien tournée.',
    figureMorphTurnTop:
      'Les pièces de l’autre moitié se suivent déjà dans le bon ordre : un tour du haut les met en place.',
    figureMorphAdjacent:
      'Deux pièces voisines sont à échanger : amenées à droite, la formule échange les deux pièces de droite.',
    figureMorphDiagonal:
      'Deux pièces en diagonale sont à échanger : une formule à part s’en charge.',
  },
  terms: {
    termMorphTip: 'Une **pointe** : une pièce à trois faces, à un sommet de la pyramide.',
    termMiddle:
      'Un **milieu** : une pièce à une seule face, au milieu d’une face de la pyramide. Il peut tourner sur lui-même sans que cela se voie.',
    termHalf:
      'Une **moitié** : tout ce qui tourne d’un coup, deux pointes et deux milieux. Le Pyramorphinx tourne comme un cube 2x2 : un quart de tour le déforme, un autre le remet en forme.',
    termHalfClockwise:
      'Le **sens horaire** : c’est le sens des aiguilles d’une montre, en regardant la moitié qui tourne.',
    termHalfCounterclockwise:
      'Le **sens anti-horaire** : c’est le sens inverse des aiguilles d’une montre, en regardant toujours la moitié qui tourne.',
  },
  progress: {
    stepTutorialMorphHalf: (done: number, total: number) =>
      `${done} pièce${done > 1 ? 's' : ''} sur ${total} en place`,
    stepTutorialMorphTurn: (done: number, total: number) =>
      `${done} pointe${done > 1 ? 's' : ''} sur ${total} bien tournée${done > 1 ? 's' : ''}`,
    stepTutorialMorphPlace: (done: number, total: number) =>
      `${done} pièce${done > 1 ? 's' : ''} sur ${total} à sa place`,
  },
  titles: {
    stepTutorialMorphCorner: 'Amener une pointe en bas',
    stepTutorialMorphHalf: 'Construire la première moitié',
    stepTutorialMorphTurn: 'Tourner les pointes de l’autre moitié',
    stepTutorialMorphPlace: 'Placer l’autre moitié',
  },
  hints: {
    stepTutorialMorphCorner:
      'Le Pyramorphinx n’a pas de pièce fixe : une pointe de la moitié du bas sert de repère. Aucune pointe n’y est : un coup en amène une.',
    stepTutorialMorphHalf:
      'Une pointe de la moitié du bas sert de repère, et les couleurs des faces se lisent sur elle. Place une à une les autres pièces de cette moitié : l’autre pointe du bas, et les milieux des faces du dessous et de devant.',
    stepTutorialMorphTurn:
      'Tourne les deux pointes de l’autre moitié pour qu’un tour du haut suffise à poser chacune à sa place.',
    stepTutorialMorphPlace:
      'Place les quatre pièces de l’autre moitié : un tour du haut, ou l’échange de deux pièces voisines ou en diagonale.',
  },
}
