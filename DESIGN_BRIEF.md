# Design Brief — Escarmouche / La Caserne

> Document destiné à une refonte complète du design de l'application **Barracks** (« La Caserne »).
> Objectif : repartir de zéro sur la couche visuelle et produire une interface aboutie, au niveau
> de ce qui se fait de mieux pour un compagnon numérique de jeu de figurines tactique.

---

## 1. Le produit

**Escarmouche** est un wargame d'escarmouche sur plateau 8×8, pour 2 joueurs, jouable avec des
figurines ou des pions. Chaque joueur commande une escouade de 1 à 6 unités, dans une limite de
30 points de rang. Le jeu est libre (CC-BY-SA), inspiré de *Motley Crew* de \_nubmark.

C'est un **système de règles sans univers imposé** : fantasy, science-fiction, historique ou tout
autre cadre, les joueurs apportent leurs figurines et leur fiction. Cette variabilité est la
contrainte de conception la plus structurante du projet — elle est développée en **§4**, et elle
détermine l'architecture de tokens (§5), le traitement de la carte (§6.1) et les critères de
réussite (§10).

**La Caserne** est l'application compagnon web. Elle sert à :

1. **Créer et équilibrer des unités** — l'utilisateur règle 4 caractéristiques (Santé, Portée,
   Puissance, Déplacement) et jusqu'à 3 capacités ; un moteur Go compilé en WebAssembly évalue en
   temps réel le **coût** et le **rang** résultants.
2. **Composer des escouades** — assembler des unités dans le budget de 30 RP.
3. **Imprimer / consulter les cartes d'unité** — l'artefact physique amené à la table.
4. **Tester une escouade en bataille** — un mode solo contre une IA (logique floue) sur le
   plateau 8×8, pour valider une composition avant de jouer en vrai.

### Le point clé à comprendre

> La Caserne n'est **pas** un jeu vidéo. C'est un **atelier de conception d'unités** qui produit un
> objet physique (la carte) et qui, accessoirement, sait jouer une partie de test.
>
> Le cœur émotionnel du produit, c'est **la boucle de création** : je pousse un curseur de Puissance,
> et je vois instantanément le coût grimper et mon Soldat devenir Vétéran. Cette réactivité est le
> moment « waouh » du produit, et il est aujourd'hui totalement sous-exploité visuellement.

---

## 2. Public cible

- Joueurs de wargames d'escarmouche (Kill Team, Frostgrave, Malifaux, Warcry…), habitués aux
  fiches de profil denses, aux tableaux de stats et aux jargons de règles.
- Créateurs de contenu maison : ils fabriquent leurs propres figurines/pions et veulent des
  cartes imprimables cohérentes.
- Usage réel : **majoritairement desktop en phase de création**, **mobile en session de jeu**
  (consultation de carte, arbitrage de règle, autour de la table).

Ce public ne craint pas la densité d'information. Il craint l'ambiguïté et la lenteur.

---

## 3. État actuel — ce qu'il faut remplacer

| Aspect | Situation actuelle | Problème |
|---|---|---|
| Framework CSS | Bulma 1.0 + classes utilitaires (`has-background-dark`, `is-4`…) | Look générique « Bulma dark », aucune identité |
| Styles | ~100 % en objets `style={{}}` inline dans les composants React | Aucun système, aucune réutilisation, aucun thème possible |
| Couleurs | Grises/marron improvisées (`#333`, `#3a3a3a`, `rgb(75,67,67)`), dégradé beige sur les cartes | Palette involontaire, contrastes non vérifiés |
| Typographie | Défauts du navigateur, aucune police choisie | Aucun caractère, aucune hiérarchie |
| Iconographie | Font Awesome 6 via CDN cdnjs | Dépendance externe, icônes génériques, non thématiques |
| Carte d'unité | 300×420 px codée en dur, dégradé beige, capacités écrasées dans un encart absolu | L'objet le plus important du produit est le moins soigné |
| Plateau | Grille 8×8, cases 60 px fixes, surbrillances en aplats de couleur brute | Illisible sur mobile, feedback d'action peu clair |
| Feedback d'évaluation | Coût et rang affichés en texte brut | Le moment fort du produit passe inaperçu |
| Thème | `data-theme="dark"` codé en dur dans `index.html` | Aucun choix laissé à l'utilisateur |

**À conserver, en revanche :** l'architecture de l'information est saine (Unités / Escouades /
Bataille / Règles) et la boucle d'évaluation temps réel fonctionne. La refonte est **visuelle et
ergonomique**, pas fonctionnelle.

---

## 4. Direction artistique demandée

### La contrainte fondatrice : Escarmouche n'a pas d'univers

Escarmouche est un **système de règles agnostique**. Il ne raconte aucun monde. Les mêmes 4
caractéristiques et les mêmes 12 capacités servent aussi bien à une compagnie de chevaliers, à un
commando spatial, à un régiment napoléonien, à des équipes de sport post-apocalyptique ou à des
animaux de la ferme. Les joueurs amènent leurs propres figurines et leur propre fiction.

**Le design ne doit donc jamais câbler un univers dans le châssis de l'application.** C'était le
défaut de la première version de ce brief : proposer une esthétique « militaire opérationnel »
revenait à choisir un univers à la place des joueurs.

La règle qui en découle :

> **Le châssis est neutre et porte l'outil. L'univers vient du contenu — les illustrations, les
> noms, et un thème d'univers choisi par l'utilisateur.**

### Ce que doit être le châssis neutre

Pas « neutre » au sens de fade ou d'absent — au sens de **précis, sobre et sans folklore**. Il doit
avoir du caractère par sa qualité d'exécution (rythme typographique, densité, justesse des
alignements, finesse des états d'interaction), pas par un décor emprunté à un genre.

Repères pour cette neutralité :

- L'interface se lit comme **un instrument de conception** : un atelier, un banc de réglage. La
  comparaison utile est un bon éditeur ou un bon outil de mesure, pas une boîte de jeu.
- Contrastes francs, aplats mats, très peu d'ombres molles ; préférer les traits, les
  encadrements et l'espacement aux effets de profondeur.
- Formes géométriques sans connotation de genre : ni chanfreins « SF », ni arrondis « médiévaux »,
  ni sérifs ornementaux.
- Un accent chromatique unique et sobre, réservé à l'action et à l'évaluation en cours ; le reste
  en neutres. **Cet accent doit être surchargeable par thème d'univers.**
- Le châssis s'efface devant les illustrations des unités, qui sont la seule vraie source de
  couleur locale.

### Les thèmes d'univers

C'est la réponse à la variabilité. En plus du châssis neutre, livrer un **mécanisme de thème
d'univers** : une couche surchargeable qui redéfinit l'ambiance sans toucher à la structure ni à
l'ergonomie.

Ce qu'un thème d'univers peut redéfinir :

| Redéfinissable par thème | Jamais redéfini par thème |
|---|---|
| Palette (accent, neutres, fonds) | Structure et disposition des écrans |
| Couples de polices | Échelle typographique et rythme vertical |
| Traitement de bordure de carte et de cadre | Emplacement des informations sur la carte |
| Texture / trame de fond (discrète, optionnelle) | Grille d'espacement, tailles de cibles tactiles |
| Jeu de pictogrammes des caractéristiques et des rangs | La sémantique de ces pictogrammes |
| Forme des marqueurs de rang | Le nombre de rangs et leur ordre |
| Motif du plateau de bataille | La géométrie 8×8 et le code des surbrillances |

Livrer **le thème neutre par défaut, plus au moins trois thèmes de démonstration** couvrant les
familles d'univers les plus attendues :

1. **Fantasy** — sans tomber dans le parchemin brûlé et la calligraphie illisible.
2. **Science-fiction** — sans tomber dans le néon cyan et les glow effects.
3. **Historique** — sans tomber dans le pastiche de document d'époque taché de café.

Ces trois thèmes ont une double fonction : ils servent les joueurs, et ils **prouvent que
l'architecture de tokens tient**. Un quatrième thème doit pouvoir être ajouté en écrivant un seul
fichier de surcharge, sans toucher un composant.

Le thème d'univers est **indépendant du couple clair/sombre** : chaque thème doit exister dans les
deux modes. Il est également **indépendant par escouade si possible** — un joueur peut entretenir
une escouade fantasy et une escouade SF dans la même installation ; à minima, le thème est un
réglage global persisté en `localStorage`.

### À éviter explicitement

- **Câbler un univers dans le châssis** — l'erreur la plus grave ici.
- Les trois pastiches cités plus haut, y compris à l'intérieur des thèmes de démonstration : un
  thème doit être une **évocation sobre**, pas un déguisement.
- Des pictogrammes de caractéristiques trop littéraux : un cœur pour la Santé passe partout, mais
  une épée pour la Puissance ou une botte pour le Déplacement excluent déjà des univers. Viser
  l'abstraction géométrique dans le thème neutre, et réserver le figuratif aux thèmes d'univers.
- Le « dashboard SaaS » : cartes blanches arrondies, ombres douces, dégradés violets.
- Le glassmorphism, les fonds animés, tout ornement qui n'informe pas.
- Les icônes génériques posées « pour décorer ».

### Thème clair / sombre

Les deux sont requis, aucun n'est un simple inverse de l'autre :

- **Sombre** = mode table de jeu, faible luminosité, écran posé à côté du plateau. Défaut probable.
- **Clair** = mode atelier de conception, et **surtout** mode impression des cartes.

L'utilisateur doit pouvoir choisir, avec respect de `prefers-color-scheme` par défaut.

---

## 5. Système de design attendu

Livrer un vrai système, pas une collection de styles ad hoc.

### Tokens — architecture à trois couches

L'agnosticisme d'univers (§4) impose une séparation stricte, et c'est la décision structurante de
toute la refonte :

1. **Socle** — ce qui ne change jamais : échelle d'espacement, rythme vertical, ratios
   typographiques, durées et courbes d'animation, tailles de cibles tactiles, points de rupture.
2. **Mode** — clair / sombre : la résolution des couleurs sémantiques en valeurs concrètes.
3. **Univers** — la couche surchargeable : familles de polices, teintes de palette, traitements de
   bordure, trames, jeux de pictogrammes.

Définir en variables CSS : couleurs sémantiques (surface, surface élevée, bordure, texte
primaire/secondaire, accent, succès/danger/avertissement), échelle typographique, échelle
d'espacement, rayons, épaisseurs de trait, mouvement. Aucune valeur en dur dans les composants.

**Test de validation de l'architecture** : changer de thème d'univers ne doit provoquer **aucun
décalage de mise en page**. Si passer de fantasy à SF déplace un élément d'un pixel, la frontière
entre les couches 1 et 3 est mal placée.

### Sémantiques métier à coder dans le système

Ces notions reviennent partout et méritent chacune un traitement visuel **stable et reconnaissable
d'un écran à l'autre** :

**Les 5 rangs** (échelle de puissance croissante) :
`trooper` (Soldat, 1 RP) · `veteran` (Vétéran, 3 RP) · `elite` (Élite, 6 RP) ·
`champion` (Champion, 10 RP) · `paragon` (Parangon, 15 RP)

→ Ils ont besoin d'une **identité visuelle graduée et lisible d'un coup d'œil** (galon, badge,
sceau, chevrons…). Le passage d'un rang à l'autre pendant l'édition doit être un événement visible.

**Les 6 archétypes** (rôles tactiques) :
`jackofalltrades` (Touche-à-tout) · `tank` · `sniper` · `skirmisher` (Tirailleur) ·
`bruiser` (Cogneur) · `glasscannon` (Colosse aux pieds d'argile)

→ Utilisés dans le générateur aléatoire. Chacun a besoin d'un pictogramme distinct — et ces noms
sont des **rôles tactiques, pas des types de troupes** : « sniper » désigne autant un arbalétrier
qu'un tireur d'élite. Les pictogrammes doivent traduire le rôle (portée longue, encaisse,
mobilité) et non l'équipement, sous peine d'exclure des univers dès le thème neutre.

> **Note sur le nommage** — certains libellés du jeu sont eux-mêmes connotés (« Tir de
> Suppression », « Trait Énergétique »). C'est du **contenu de règles**, hors périmètre de cette
> refonte, mais cela renforce l'exigence : puisque les mots portent déjà une couleur d'univers, le
> design ne doit pas en rajouter une seconde.

**Les 4 caractéristiques** — Santé, Portée, Puissance, Déplacement.
→ Elles apparaissent sur la carte, dans l'éditeur, sur le jeton du plateau et dans le panneau de
bataille. Elles doivent être identifiables par leur **forme/pictogramme**, pas seulement par leur
label traduit (l'app est en 3 langues).

**Les capacités** — 12 aujourd'hui, extensibles :
Charge, Trait Énergétique, Posture Défensive, Tir de Suppression, Repli Tactique, En Avant !,
Frappe Dévastatrice, Feinte, Gardien, Fauchage, Tir de Précision, Surcharge.
→ Chacune a un label, une description longue et un coût. Il faut un composant de présentation
capable de gérer des textes de longueur très variable dans 3 langues.

**Les effets de statut** en bataille : Suppression, Inciblable, Surcharge, Posture défensive,
Gardien. Aujourd'hui affichés comme des lettres `S / U / O / D` sur le jeton — à remplacer par un
système de marqueurs lisible et non ambigu.

### Composants à concevoir

Bibliothèque : boutons (primaire/secondaire/danger/fantôme), champs de saisie numérique avec
incrémenteurs, sélecteurs, curseurs de stat, badges de rang, pastilles de coût, onglets,
notifications, modales de confirmation, états vides, états de chargement (le WASM met un instant à
s'initialiser), et une barre de navigation qui tienne debout sur mobile.

---

## 6. Écrans à traiter

### 6.1 Carte d'unité — **la pièce maîtresse**

C'est l'objet identitaire du produit. Il doit être remarquable.

Contenu : nom, rang, illustration (image uploadée par l'utilisateur, souvent de qualité et de
ratio quelconques), les 4 caractéristiques, 0 à 3 capacités avec leur nom, le coût.

**C'est aussi l'endroit où l'agnosticisme d'univers se joue vraiment.** La carte est le seul écran
que les joueurs impriment, montrent et comparent : elle doit pouvoir paraître crédible posée à
côté d'une figurine de chevalier comme d'un marine spatial. Deux conséquences :

- Le cadre est un **écrin, pas un décor**. L'illustration fournie par l'utilisateur est la seule
  source d'univers sur la carte ; le cadre l'encadre et la met en valeur sans rivaliser avec elle.
  Si le cadre raconte une histoire, il contredit la moitié des illustrations qu'il accueillera.
- La **structure** de la carte (position du nom, du rang, des 4 caractéristiques, des capacités)
  est identique dans tous les thèmes. Seuls le traitement de bordure, les polices, la palette et
  les pictogrammes varient.

Contraintes fortes :
- Doit fonctionner en **affichage écran** (grille de cartes, hover, mobile) **et en impression**.
  Prévoir un format d'impression propre — le joueur pose cette carte sur la table, à côté de sa
  figurine. Idéalement un ratio de carte à jouer standard, plusieurs cartes par page A4, marges de
  coupe, et une version lisible en noir et blanc.
- L'illustration est fournie par l'utilisateur et peut être ratée : le cadrage doit être robuste
  (recadrage, masque, fond de repli quand aucune image n'est fournie).
- Les noms de capacités varient de « Feinte » à « Frappe Dévastatrice » selon la langue : pas de
  largeur codée en dur.
- Lisible à 1 mètre de distance, posée à plat sur une table. C'est le vrai test.

### 6.2 Éditeur d'unité — **la boucle de création**

Écran le plus utilisé. Actuellement un formulaire Bulma de 640 lignes.

À repenser :
- Mise en regard **édition ↔ aperçu de la carte**, l'aperçu se mettant à jour en direct.
- Le **coût et le rang** doivent être le point focal permanent, pas une ligne de texte. Rendre
  visible la progression vers le rang suivant, et le moment où on le franchit.
- Les curseurs de caractéristiques gagneraient à montrer leur incidence sur le coût **avant**
  validation (survol, indication marginale).
- Le générateur aléatoire (choix rang + archétype) doit être présent sans voler la vedette.
- L'upload d'image doit gérer visuellement : drop, chargement, erreur de validation,
  redimensionnement en cours.
- Contrainte métier à afficher : coût maximal d'unité (`Barracks.MaxUnitCost`), 3 capacités max.

### 6.3 Liste des unités

Galerie de cartes. Doit rester lisible avec 40 unités. Prévoir tri/filtre par rang et par
archétype, actions d'édition/suppression accessibles sans survol (le survol n'existe pas sur
mobile — c'est un défaut actuel de `SquadCard`), et un état vide engageant qui invite à créer ou
à générer une première unité.

### 6.4 Escouades — liste et éditeur

Contrainte centrale : **budget 30 RP, 6 unités max**. La consommation du budget doit être le
véhicule visuel principal de cet écran — on doit voir en permanence combien il reste, et une
unité qu'on ne peut pas se permettre doit être visiblement hors de portée avant d'être cliquée.

Constantes exposées par le moteur : `Barracks.MaxSquadRankPoints`, `Barracks.MaxSquadSize`,
`Barracks.RankPointCosts`.

### 6.5 Bataille

Mode test contre l'IA, 3 difficultés (facile / normal / difficile).

- **Plateau 8×8** : cases actuellement à 60 px fixes, ce qui déborde sur mobile. Le plateau doit
  être responsive et rester jouable au doigt. Coordonnées de repère souhaitables (le jeu physique
  parle de « lignes 1-2 » et « 7-8 »). Le **motif de damier est thématisable** (dalles, terrain,
  grille technique) mais le **code des surbrillances d'action ne l'est pas** : il doit rester
  identique d'un univers à l'autre, sous peine de faire réapprendre le jeu à chaque thème.
- **Jetons d'unité** : portrait, barre de santé, appartenance (joueur / IA), sélection, et les
  marqueurs de statut. Beaucoup d'information dans très peu de place — c'est le défi de cet écran.
- **Feedback d'action** : aujourd'hui la case change simplement de couleur de fond (bleu =
  déplacement, rouge = attaque, jaune = capacité). Il faut un langage visuel distinct pour
  *déplacement possible*, *cible attaquable*, *cible de capacité*, *unité sélectionnée*, *ligne de
  vue bloquée*. Ne pas reposer uniquement sur la teinte (daltonisme).
- **Panneau de tour** : joueur actif, tour, **actions restantes (2 par tour)**, liste des actions
  valides, historique des actions récentes, écran de victoire/défaite.

### 6.6 Navigation et coquille

4 destinations : Unités, Escouades, Bataille, Règles (lien externe vers le site de règles, dans la
langue courante). Plus le sélecteur de langue (fr / en / es) et le futur sélecteur de thème.
La navigation mobile actuelle est un burger Bulma standard — à repenser.

---

## 7. Contraintes techniques (impératives)

| Contrainte | Détail |
|---|---|
| Stack | React 19 + React Router 7 en **HashRouter** (déploiement GitHub Pages) |
| Bundler | **Parcel 2** — pas de Vite, pas de Webpack, pas de config PostCSS exotique sans nécessité |
| Moteur | Toute la logique de jeu vient d'un binaire **Go compilé en WASM** exposé en global `Barracks.*`. Le design ne peut pas changer les règles ni les formules de coût. |
| Persistance | `localStorage` uniquement. Pas de backend, pas de compte utilisateur. |
| Hébergement | Site statique sur GitHub Pages, sous-chemin `/escarmouche/barracks/` — attention aux chemins d'assets, une variable `BASE_URL` est injectée à la compilation. |
| i18n | `i18next` + `react-i18next`, 3 locales (`fr`, `en`, `es`), fichiers JSON chargés en HTTP. **Toute chaîne visible passe par `t()`** et les clés sont extraites par `npx i18next-cli extract --sync-primary`. Aucun texte en dur. |
| Longueur des textes | Le français et l'espagnol sont ~20-30 % plus longs que l'anglais. Aucune largeur de libellé codée en dur. |
| Assets | Pas de CDN externe (le Font Awesome actuel est à internaliser ou remplacer). Polices auto-hébergées. |
| Poids | Le WASM est déjà lourd (~4,7 Mo). Le budget CSS/JS de la couche design doit rester modeste ; privilégier CSS natif et SVG inline aux grosses dépendances. |

**Sur Bulma** : son remplacement est souhaité (il est la principale source du look générique
actuel), mais la décision revient au design — un CSS maison sur tokens, ou un socle minimal, ou
Bulma fortement rethémé sont tous acceptables tant que le résultat ne se lit plus comme du Bulma.

---

## 8. Accessibilité

- Contraste **WCAG AA minimum** sur les deux thèmes, y compris sur le plateau et les jetons.
- Aucune information portée par la couleur seule — critique pour les surbrillances d'action en
  bataille et pour les marqueurs de statut.
- Navigation clavier complète, focus visible et cohérent, cibles tactiles ≥ 44 px sur mobile.
- Le survol ne doit jamais être le seul moyen d'accéder à une action (défaut actuel).
- Respect de `prefers-reduced-motion`.
- Structure de titres correcte, `aria-label` sur les contrôles iconographiques.

---

## 9. Livrables attendus

1. **Direction artistique du châssis neutre** — 2 à 3 pistes distinctes appliquées à la carte
   d'unité et à l'éditeur, pour arbitrage. La carte d'unité est le meilleur test d'une direction.
2. **Système de tokens à trois couches** (socle / mode / univers), palette complète clair et
   sombre, échelle typographique, espacement, rayons, traits, mouvement.
3. **Mécanisme de thème d'univers** — le point d'extension, avec sa documentation : comment
   ajouter un univers en un seul fichier, et quelles propriétés sont hors limites.
4. **Quatre thèmes** — neutre (défaut), fantasy, science-fiction, historique. Les trois derniers
   servent autant de démonstration que de preuve que l'architecture tient.
5. **Bibliothèque de composants** — implémentée, thémée, documentée par l'usage.
6. **Les 6 écrans** de la section 6, en desktop et mobile.
7. **Feuille d'impression** de la carte d'unité.
8. **Iconographie** — 4 caractéristiques, 6 archétypes, 5 statuts de bataille, 5 rangs, plus les
   icônes d'interface. En SVG inline, sans dépendance CDN. Le jeu neutre doit être **abstrait et
   valide dans tous les univers** ; les jeux thématiques peuvent être figuratifs.
9. **Planche de comparaison** — la même unité, la même escouade et le même plateau rendus dans les
   quatre thèmes, côte à côte. C'est la pièce qui démontre que l'objectif est atteint.

---

## 10. Critères de succès

- **Le test des trois univers** : la même unité, illustrée en chevalier, en soldat du futur et en
  grenadier de 1812, produit trois cartes également crédibles. Aucune ne donne l'impression d'un
  contenu posé dans le mauvais gabarit. C'est le critère principal.
- **Le test du quatrième univers** : un contributeur ajoute un thème (steampunk, western, animaux)
  en écrivant un seul fichier de surcharge de tokens, sans toucher un composant ni un gabarit.
- Changer de thème d'univers ne déplace **aucun élément** de la mise en page.
- Un joueur voit une capture d'écran de La Caserne et **reconnaît Escarmouche** — non pas à un
  décor, mais à la mise en page de ses cartes et de son plateau, qui restent identifiables quel que
  soit le thème appliqué.
- La carte d'unité imprimée tient la comparaison avec les cartes d'un jeu de plateau du commerce.
- Régler une caractéristique dans l'éditeur et voir le coût réagir est **satisfaisant** — le geste
  donne envie d'être répété.
- Le plateau de bataille est jouable au doigt sur un téléphone.
- Chaque écran est utilisable en français, anglais et espagnol sans casse de mise en page.
- Aucun `style={{}}` inline résiduel ; tout passe par le système.

---

## 11. Notes pour l'implémentation

- Les composants actuels (`Card.tsx`, `SquadCard.tsx`, `BattleBoard.tsx`, les 5 pages) sont à
  réécrire côté présentation. Leur logique — appels `Barracks.*`, gestion d'état, routage — est à
  préserver telle quelle.
- `barracks/pages/UnitEditorPage.tsx` contient un import parasite (`import { fork } from
  "child_process"`) à supprimer au passage.
- Le choix de thème d'univers se persiste dans `localStorage`, aux côtés des unités et des
  escouades (`barracks/util/storage.ts`), et s'applique par attribut sur l'élément racine — au
  même endroit que le `data-theme` clair/sombre aujourd'hui codé en dur dans `index.html`.
- Les polices des thèmes d'univers doivent être auto-hébergées et **chargées à la demande** : le
  poids cumulé de quatre couples typographiques ne doit pas être payé par tous les utilisateurs.
- Après toute modification de chaînes traduites : `npx i18next-cli extract --sync-primary`.
- Développement : `make watch` (rebuild WASM sur changement Go + Parcel serve sur `:1234`).
