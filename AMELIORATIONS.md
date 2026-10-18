# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## Tutoriel : apprendre à déplacer une pièce

**Idée.** Sur un modèle donné, un mode d'apprentissage guidé : l'app désigne
une pièce et l'endroit où l'amener (ou la façon de la tourner), l'utilisateur
cherche les coups lui-même, avec des indices gradués (la couche à tourner, puis
le coup, puis la formule et son effet expliqué), et l'app vérifie à chaque coup
qu'il ne défait pas ce qui est déjà en place.

**Pistes.** Les briques existent : les objectifs des étapes (`StepSpec.goal`),
les formules de chaque méthode avec leur effet testé, et la recherche par
pièces (`solvePieces`) pour proposer le coup suivant. Commencer par les étapes
intuitives (croix, premiers coins) du 3x3 et du 2x2, puis par les 3-cycles.

## Tutoriel : les flèches sur un cube miroir

**Constat.** Sur un miroir, la flèche du tutoriel part du centre de la case
de la pièce, une demi-case plus loin (`TutorialArrow`, `FACE`) : elle
s'arrête avant une face fine et traverse une face très épaisse, et son
contournement suppose la boîte d'un cube plein, que les bosses dépassent.

**Pistes.** Faire comme pour les puzzles en polygones (`PolyView`, `onFace`) :
prendre pour bouts le centre réel du sticker, lu sur la boîte de la pièce
(`lib/core/shape.ts`), et pour boîte à contourner celle du cube miroir avec
ses bosses.

## Fuites mémoire : ce qui a été mesuré

**Mesuré** (Playwright, tampons et textures WebGL comptés à leur création et
leur destruction, tas JavaScript après ramasse-miettes forcé) : le Megaminx
mélangé puis résolu trois fois, le 3x3 de même, le guide des mouvements
ouvert une minute, une tournée de six puzzles répétée. Une fuite trouvée et
corrigée : `PolyPiece` créait une géométrie neuve à chaque coup sans libérer
l'ancienne (+62 000 tampons GPU et +35 Mo par mélange résolu sur le
Megaminx) ; elle est maintenant libérée (`dispose`). Depuis, tout est stable :
le tas se remplit au premier tour (caches des formes, bornés par le nombre
de positions d'une pièce) puis ne bouge plus.

**Pas mesuré** : la mémoire du worker de résolution, qui garde ses tables
(formules du Megaminx et du Crystal : quelques dizaines de Mo, une fois par
liste de formules, donc bornées) ; une session de plusieurs heures.

## Mobile : reprendre l'interface

**Constat.** Le mode mobile (panneau repliable, puzzle empilé au-dessus de la
saisie) marche, mais il a de nombreuses lacunes, jamais passées en revue.

**Piste.** Faire le tour de l'app sur un petit écran (accueil, sélecteur,
pad de coups, guide, saisie et ses phases, résolution), lister ce qui gêne,
puis reprendre la mise en page écran par écran.
