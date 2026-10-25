# Écrire un bon tutoriel

Ce guide dit comment concevoir, déclarer et vérifier un tutoriel. Il
rassemble les règles apprises en relisant les tutoriels dans l'appli :
chacune vient d'un défaut constaté par un utilisateur, cube en main. Le
moteur (`src/lib/teach/`) et la déclaration d'un tutoriel sont décrits dans
« Le tutoriel » d'[AGENTS.md](../AGENTS.md) ; ici, ce qui fait qu'un
tutoriel se suit sans surprise.

Le principe qui les résume : **à chaque pas, l'utilisateur sait ce qu'il
fait, pourquoi, et voit que ça avance.**

---

## Les règles

### 1. Un pas, un objectif clair

- Chaque pas a un but que l'utilisateur peut constater : une pièce de plus
  à sa place, une pièce de plus bien tournée, une figure résolue. Son texte
  de vérification (`checks`) dit quoi regarder.
- Un pas qui ne place rien (une préparation) n'est jamais montré seul : il
  se joue **dans le même pas** que la formule qu'il prépare. Exemple : le
  tour du haut qui amène une arête au-dessus de sa case se joue avec la
  formule qui l'y fait descendre (`leadOf`, `crossCornersKit.ts`).
- Seul cas où une préparation reste seule : la dernière d'une suite (un
  dernier tour du haut qui aligne tout).

### 2. Jamais de pas qui fait reculer

- Le compteur d'une étape (`progress`) ne redescend jamais d'un pas à
  l'autre, et l'étape affichée ne revient jamais à une étape précédente.
- Un but « tout d'un coup » (la plus courte suite qui place toutes les
  pièces) est à proscrire : son premier pas peut ne rien placer, ou déplacer
  une pièce déjà placée. Préférer un but **progressif** : une pièce de plus,
  en passant **seulement par des états qui n'en ont pas moins**
  (`through`), l'état d'arrivée compris. Ainsi chaque pas rapproche, et le
  tutoriel ne tourne jamais en rond (le nombre de pièces placées ne baisse
  jamais, et la distance au but diminue à chaque pas).
- Si ce but progressif est parfois impossible (il faut défaire une pièce
  placée pour en placer une autre), le découper : d'abord les pièces dans
  leur case, même mal tournées, puis tournées (les arêtes du milieu de
  « Croix puis coins »). En dernier recours seulement, un but « tout d'un
  coup ».
- Une étape qui en garde une autre (les coins du haut gardent ceux du bas)
  le déclare aussi dans `through` : sinon la recherche passe par un état où
  l'étape précédente n'est plus faite, et le tutoriel y retourne.
- Le moteur doit pouvoir le prouver : un test vérifie sur plusieurs
  mélanges que les étapes ne reculent pas et que le compteur ne baisse pas
  (voir « Vérifier »).

### 3. Pas de pas pour tenir le cube

- Comment tenir le puzzle est l'affaire de la vue et de la consigne, pas
  d'un pas à part : un pas « place le cube ainsi » que le pas suivant
  défait n'apprend rien. Avant de déclarer une étape, se demander si on la
  ferait vraiment, puzzle en main, et si la tenue suivante ne l'annule pas.
- Quand le cube doit pivoter (une autre face en haut), la rotation (`x`,
  `z`) est le début de la formule du pas, et **la consigne de tenue
  l'intègre** : « Place le centre blanc face à toi, le centre rouge en
  bas » ; un clic dessus fait pivoter le cube. La liste des coups ne répète
  pas la rotation (`heldFor`, `Instructions.tsx`).
- La consigne de tenue reste la même avant, pendant et après la rotation :
  elle se lit sur ce qui reste à jouer.
- Une rotation seule n'est un pas que si toutes les tenues suivantes la
  gardent (le 2x2 retourné, jaune en bas).

### 4. Toujours une flèche qui montre le mouvement

- Chaque pièce travaillée par le pas (`subjects` d'une étape de figures, la
  pièce choisie d'une étape de pièces) a une flèche qui montre où elle va.
- La flèche part d'un sticker que la pièce a vraiment, là où elle est
  maintenant :
  - avec un `marker` (le blanc d'une dernière couche) : le chemin de ce
    sticker ;
  - une pièce qui change de case : de la face où joue la formule (`side`)
    à la même face, à l'arrivée ; une pièce qui n'est pas encore sur cette
    face (amenée par une préparation) part du sticker qui y arrivera ;
  - une pièce retournée ou tournée sur place (arête retournée, coin
    pivoté) : du sticker qui arrive sur la face travaillée, depuis la face
    où il est ;
  - sans `side` ni `marker` : le chemin de son premier sticker ;
  - une pièce qui tourne autour de sa propre face (un centre, un
    engrenage) : aucune flèche possible, la consigne le dit ;
  - une formule qui commence par pivoter le cube : les flèches se lisent
    dans la tenue d'après, dessinées sur le cube tel qu'il est.
- **Jamais deux flèches à la fois** : quand plusieurs pièces bougent, leurs
  flèches s'affichent à tour de rôle (`useArrowTurns`), la pièce de la
  flèche montrée mise en valeur. Ne pas contourner ce mécanisme.
- `side` est la face où joue la formule. Si elle change d'un pas à l'autre
  (la formule tenue d'une face ou d'une autre), la déclarer comme fonction
  de l'état. La vue se lève vers `side`, sauf quand c'est la face regardée
  (alors la vue habituelle, un peu au-dessus).
- Une pièce que la flèche désigne n'est jamais hachurée (voir la règle
  suivante).

### 5. Les hachures : ce qui bouge sans compter

Chaque pièce que la formule déplace ou tourne a l'un de trois aspects,
lus par le moteur (`tonesOf`, `lib/teach/scene.ts`) :

- **travaillée** (`subjects` d'une étape de figures, la pièce choisie
  d'une étape de pièces) : elle garde ses couleurs, mise en valeur, avec sa
  flèche ;
- **hachurée** : elle bouge, mais son sort n'importe pas à ce pas ; la
  légende le dit (« Les cubes hachurés seront modifiés par le mouvement,
  sans impact sur le résultat attendu ») ;
- **intacte** : la formule ne la touche pas.

Les règles :

- Le moteur ne hachure jamais une pièce travaillée (`subjects`, par
  défaut les pièces de `focus`), même quand il ne sait pas lui dessiner de
  flèche.
- Hachurer est une promesse : ce que la pièce devient n'a vraiment aucune
  importance pour l'étape en cours ni pour les précédentes. Une pièce
  hachurée ne doit jamais être une pièce déjà placée qu'on défait sans la
  remettre (règle 2) ; une pièce placée que la formule déplace puis remet
  n'est pas hachurée, puisqu'elle finit où elle était.
- Les pièces que l'étape doit placer, et que ce pas fait avancer, sont
  travaillées, pas hachurées. Dans une étape de figures, celles de l'étape
  que ce pas déplace sans les placer (un coin du bas pris dans le cycle)
  sont travaillées aussi, avec leur flèche : l'utilisateur doit voir où
  elles vont.
- Dans une étape de pièces (une pièce choisie, placée à chaque pas), seule
  la pièce choisie est travaillée : les autres pièces de l'étape, pas
  encore placées, que la formule déplace au passage sont hachurées, leur
  sort n'important pas avant leur tour.
- Les pièces d'une étape à venir (les coins pendant les arêtes) sont
  hachurées : elles bougent sans compter pour l'instant.
- Une formule qui ne fait que tourner le cube entier ne hachure rien ; une
  formule qui commence par là hachure ce que bouge la suite, lue dans la
  tenue d'arrivée (`heldFor`).
- Le terme du vocabulaire hachure à l'inverse : tout ce qu'il ne nomme pas,
  pour faire ressortir les pièces nommées.
- À l'écran, vérifier qu'aucune pièce désignée par une flèche ou par la
  consigne (« Repère le coin... ») n'est hachurée, et que les pièces
  hachurées sont bien celles dont le sort n'importe pas.

### 6. Le meilleur geste, pas seulement le plus court

- À longueur égale, préférer le geste le plus simple : un tour de face
  plutôt qu'une formule. L'ordre des gestes donnés à la recherche fait
  foi (`wayChain` garde le premier trouvé) : lister les plus simples en
  premier.
- Si un geste paraît absurde à l'écran (une formule qui ne place rien, une
  pièce bien placée défaite), c'est que le but de la recherche est mal
  posé : corriger le but (règle 2), pas le cas.
- Avant de conclure « une seule formule suffit », le vérifier : une
  recherche en largeur prouve qu'aucune suite plus courte n'existe sous les
  contraintes posées. Si l'utilisateur voit une solution plus courte, c'est
  qu'une contrainte est trop forte, ou qu'une tenue manque.

### 7. Les coups décrits la première fois

- La première fois qu'un coup apparaît, sa description est écrite à côté
  (« Rotation de la face de droite dans le sens horaire, en la
  regardant ») ; ensuite il s'affiche en ligne, sa description en infobulle
  (`learnt`, `Instructions.tsx`). Les premières étapes gardent les
  descriptions coup par coup (`words`) tant que les lettres s'apprennent.
- Une formule apprise s'affiche comme un bloc, déclaré dans `algorithms`
  de l'étape ; jouée deux fois de suite, elle s'affiche une fois avec « 2
  fois de suite ».
- Les textes ne citent pas de formule en lettres (la notation peut être
  française ou internationale) : les coups s'affichent toujours par
  `formatMove`.

### 8. Des textes justes, sans couleur

- Chaque étape a un titre, une consigne (`hints`), un texte par sorte de
  pas (`figures`), une vérification (`checks`) et un compteur
  (`progress`), dans les deux langues.
- Les textes ne nomment pas de couleur (un cube miroir n'en a pas) ;
  sinon, prévoir leur version miroir (`tutorialMirror`).
- Le texte d'un pas décrit ce qu'il fait vraiment : s'il fusionne une
  préparation et une formule, il dit les deux (« Tourne la face opposée à
  la croix pour amener l'arête, puis la formule échange... »).
- Le vocabulaire suit celui du puzzle (« pointe » sur les pyramides).

---

## La démarche

1. **Décrire la méthode avec l'utilisateur.** Ses étapes, la formule de
   chacune, comment il tient le puzzle, ce qu'il s'autorise entre deux
   formules (tourner le haut, pivoter le cube). Lever toute ambiguïté
   avant d'écrire du code.
2. **Vérifier chaque formule** sur le moteur : ce qu'elle déplace et
   tourne, rien d'autre. En faire un test (`effect` dans
   `tests/unit/tutorials/crossCorners.test.ts`).
3. **Mesurer la recherche** de chaque étape sur une dizaine de mélanges :
   la profondeur nécessaire et le temps. Une étape qui demande plus de 4 ou
   5 gestes, ou qui sature la mémoire, a un but mal posé (règle 2) ou une
   recherche à réduire (clé projetée, places des stickers :
   `placeChain`).
4. **Déclarer le tutoriel** (`lib/tutorials/<catégorie>/`) : étapes, but
   progressif et `through` de chacune, gestes les plus simples d'abord,
   `side`, `subjects`, `algorithms`, textes.
5. **Brancher la méthode** si le tutoriel l'enseigne (`taught`,
   `solver.ts`) : la solution affichée est alors le tutoriel joué jusqu'au
   bout.
6. **Vérifier** (ci-dessous), puis relire chaque sorte de pas à l'écran.

---

## Vérifier

Tests (dans `tests/unit/tutorials/`) :

- chaque formule a l'effet annoncé ;
- plusieurs mélanges se résolvent en suivant les suggestions (`walk`), les
  étapes ne reculent jamais, le compteur ne baisse jamais d'un pas à
  l'autre dans une même étape (`expectSteady`, `walk.ts`) ;
- chaque flèche part d'un sticker que la pièce a, là où elle est ; une
  étape qui retourne ou tourne des pièces sur place a ses flèches ;
- aucun pas ne fait que pivoter le cube ;
- chaque titre, consigne, figure et compteur existe dans les deux langues
  (`expectTexts`) ;
- un cas signalé par l'utilisateur devient un test qui échoue avant la
  correction.

La conformance (`tests/unit/puzzles.test.ts`) résout ensuite un mélange par
la méthode, tenu aussi autrement. Hors des tests, mesurer une fois la
méthode sur une quarantaine de mélanges : aucun échec, et un temps
raisonnable (environ 1,5 s au pire pour « Croix puis coins »).

À l'écran (une spec Playwright jetable `tests/e2e/zz_*.spec.ts`, lancée
avec un seul worker, qui enregistre des captures puis est supprimée) : une
capture de chaque sorte de pas (avec et sans
rotation, préparation fusionnée, pièce tournée sur place), avant et après
le clic sur la consigne de tenue. Regarder :

- la face nommée par la consigne est bien devant, ou le devient au clic ;
- une flèche par pièce travaillée, une seule visible à la fois ;
- pas de pièce travaillée hachurée ;
- le compteur et le texte disent ce que le pas fait.

---

## La liste avant de livrer

- [ ] Chaque pas a un objectif constatable, et son texte le dit.
- [ ] Aucun pas ne fait reculer : étape et compteur ne redescendent jamais.
- [ ] Aucun pas ne fait que tenir ou pivoter le cube ; une préparation est
      jouée avec sa formule.
- [ ] La consigne de tenue intègre la rotation et ne change pas en cours
      de pas.
- [ ] Chaque pièce travaillée a sa flèche, depuis un vrai sticker ; jamais
      deux flèches à la fois.
- [ ] Hachurées seulement les pièces dont le sort n'importe pas ; aucune
      pièce désignée, aucune pièce placée défaite.
- [ ] À longueur égale, le geste le plus simple.
- [ ] Coups décrits la première fois, formules apprises en blocs, aucune
      formule écrite dans un texte.
- [ ] Textes complets dans les deux langues, sans couleur nommée.
- [ ] Tests (formules, marche, non-recul, flèches) et captures de chaque
      sorte de pas.
