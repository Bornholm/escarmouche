# La stratégie dominante — 2026-08-17

Enquête ouverte par une hypothèse de terrain : *« la stratégie dominante est
sûrement une équipe avec beaucoup de mobilité et de forts dégâts à distance. »*

Réponse courte : **l'hypothèse est à moitié juste, et sa moitié fausse est la
plus intéressante.** La mobilité décide effectivement des parties — mais pas
comme une doctrine de harcèlement à distance. Elle décide parce que **toutes
les parties se terminent par capture de la zone centrale, en 4 à 6 tours**, et
que la portée n'a pas le temps de servir.

## Protocole

Deux tournois indépendants, tous deux en round-robin aller-retour (chaque
doctrine joue les deux camps, ce qui neutralise l'avantage de position), IA
`SearchStrategy(profondeur 4, 5 000 nœuds)` des deux côtés, 50 tours maximum.

Sept doctrines, chacune poussant une idée jusqu'au bout :

| Doctrine | Idée |
|---|---|
| kite | mobilité 3-4 et portée 3 — *l'hypothèse à tester* |
| artillerie | portée 4, mouvement 1 |
| mêlée lourde | portée 1, gros dégâts, forte santé |
| nuée | 6 petites unités |
| concentrée | unités au plafond de coût |
| contrôle | tout en capacités |
| équilibrée | témoin |

Deux précautions ont changé les conclusions, et méritent d'être signalées :

1. **Budgets égalisés.** Au premier jet, les doctrines dépensaient de 70 à
   102 points : la comparaison ne mesurait rien. Elles sont désormais toutes à
   100 points, complétées si besoin par de la santé — la seule caractéristique
   linéaire, et celle qui ne change pas l'identité tactique d'une doctrine.
2. **Plafond par unité respecté.** La Caserne limite chaque unité à 30 points.
   Une première doctrine « deux héros à 50 points » écrasait tout le tableau
   avec 91,7 % de victoires… en étant tout simplement illégale. Elle a été
   remplacée par « concentrée », qui plafonne ses unités à 30 points.

   Conséquence structurelle à noter : **il faut au moins 4 unités pour dépenser
   100 points.** La doctrine « tout dans un héros » n'existe pas dans ce jeu.

## Résultat — 126 parties

| Rang | Doctrine | Taux de victoire |
|---|---|---|
| 1 | mêlée lourde | **91,7 %** |
| 2 | équilibrée | 63,9 % |
| 3 | contrôle | 55,6 % |
| 4 | concentrée | 52,8 % |
| 5 | **kite (mobilité + portée)** | **44,4 %** |
| 6 | **artillerie (portée max)** | **27,8 %** |
| 7 | nuée | 13,9 % |

L'hypothèse est réfutée : les deux doctrines qui misent sur la portée occupent
l'avant-dernière et la sixième place. Le kite ne bat que l'artillerie et la
nuée, et perd 5 parties sur 6 contre la mêlée lourde.

## Pourquoi — l'autopsie

Le classement ne dit pas *pourquoi*. En instrumentant la fin de partie sur les
escouades par défaut, le mécanisme apparaît :

| Affrontement | Fins par capture | Durée moyenne |
|---|---|---|
| Vanguard vs Aube | **16/16** | 4,6 tours |
| Vanguard vs Ligne 1812 | **16/16** | 6,3 tours |
| Aube vs Ligne 1812 | **16/16** | 6,5 tours |

**Aucune partie sur 48 ne se termine par élimination.** Et le classement suit
exactement le mouvement moyen des escouades : Vanguard 1,8 — Ligne 1812 1,5 —
Aube 1,3.

Le calcul est arithmétique. Depuis sa rangée de déploiement, une unité est à
2 cases de la zone centrale. À 3 de mouvement elle y est au tour 1 ; à 1 de
mouvement, au tour 3. Comme il suffit de **3 marqueurs de contrôle** et qu'on
marque dès qu'on occupe la zone seul, le premier arrivé a gagné avant que le
second n'ait pu le déloger.

D'où les trois enseignements, qui se tiennent tous :

- **Le mouvement est un seuil, pas une échelle.** Mouvement 1 est éliminatoire
  (l'artillerie ne participe pas à la course) ; au-delà, en rajouter ne paie
  plus. C'est ce qui distingue le seuil du surinvestissement, et pourquoi le
  kite — qui paie deux caractéristiques exponentielles à la fois — n'est pas
  rentable.
- **La portée est surévaluée.** Une partie se joue en 4 à 6 tours dans un carré
  de 4 cases : tirer à 4 cases n'y sert presque jamais, mais coûte 13,8 points
  contre 1,4 pour la portée 1.
- **L'effectif surnuméraire ne sert à rien.** Un joueur dispose de 2 actions par
  tour quel que soit le nombre d'unités : une escouade de 2 unités en active
  100 % chaque tour, une escouade de 6 en active 33 %. C'est ce qui enterre la
  nuée à 13,9 %.

## Le vrai défaut

Ce n'est pas un problème de composition, c'est un **réglage de la condition de
victoire** : la capture est trop courte pour être contestée. Le jeu récompense
la course et n'a pas le temps de récompenser autre chose — combat, portée,
capacités et manœuvre arrivent après la fin de la partie.

Trois leviers, par ordre d'efficacité présumée, à valider par la mesure :

1. **Porter les marqueurs de 3 à 5.** Le plus simple ; laisse le temps au camp
   lent d'arriver et de contester.
2. **N'ouvrir le décompte qu'au 3ᵉ tour.** Neutralise l'avantage de la course
   sans toucher au rythme de la fin de partie.
3. **Faire perdre un marqueur à qui perd la zone.** Rend la capture disputable
   plutôt que cumulative.

Aucun n'est appliqué à ce jour : ce sont des décisions de design.

## Effet de bord : une tentative de rééquilibrage qui échoue

L'enquête a révélé un déséquilibre marqué entre les escouades par défaut : le
Détachement Vanguard gagnait **91,7 %** de ses parties — en ne dépensant que
78 points sur 100.

Quatre passes d'ajustement ont suivi, chacune re-mesurée sur 72 parties. Elles
méritent d'être consignées parce qu'**elles n'ont pas résolu le problème** :

| Passe | Vanguard | Convoi | Ligne 1812 | Aube |
|---|---|---|---|---|
| départ | **91,7 %** | 44,4 % | 38,9 % | 25,0 % |
| mouvement rendu aux trois lentes | 55,6 % | **88,9 %** | 41,7 % | 13,9 % |
| Aube accélérée | 27,8 % | **77,8 %** | 69,4 % | 25,0 % |
| budget rendu au Vanguard | **88,9 %** | 47,2 % | 50,0 % | 13,9 % |
| Aube resserrée | **86,1 %** | 58,3 % | 47,2 % | 8,3 % |

À chaque passe, **la domination change de titulaire sans jamais s'atténuer** :
celle qui cumule mobilité et robustesse rafle 80-90 %, et l'écart entre la
première et la dernière ne descend jamais sous 45 points. La dernière passe a
même dégradé l'Aube, et a été annulée.

C'est la démonstration expérimentale du diagnostic : **le déséquilibre n'est pas
dans les compositions, il est dans la condition de victoire.** Tant que la
partie se décide par une course de 4 tours, aucun réglage de caractéristiques
ne produira quatre escouades comparables — on ne fait que désigner un nouveau
gagnant.

Les escouades livrées sont donc celles de la 4ᵉ ligne (Aube ramenée à sa
meilleure version mesurée), avec leurs budgets enfin utilisés : Aube 100 pts,
Vanguard 95, Ligne 1812 98, Convoi 91 — contre 90 / 78 / 95 / 85 au départ.
L'équilibre entre elles reste imparfait, et le restera jusqu'à l'arbitrage sur
la condition de victoire.

## Suite — les variantes de condition de victoire, mesurées

Les trois leviers proposés plus haut (plus deux combinaisons) ont été mis à
l'épreuve : la condition de capture est devenue paramétrable dans le moteur
(`sim.CaptureRules`, portée par le `GameState` pour que la recherche alpha-beta
joue la variante et non la règle de base), et les 7 doctrines ont rejoué leur
round-robin sous chaque variante — 42 parties par condition, 210 au total.

| Variante | Fins par élim. | Durée moy. | Écart 1ᵉʳ-dernier | Dominant |
|---|---|---|---|---|
| A. actuelle (3 marqueurs) | 17 % | 7,2 tours | 83 pts | mêlée **100 %** |
| B. 5 marqueurs | 40 % | 11,4 | 75 | concentrée 91,7 % |
| C. décompte au 3ᵉ tour | 26 % | 11,0 | 75 | concentrée 83,3 % |
| D. tir à la corde seul | 12 % | 6,6 | 83 | mêlée 91,7 % |
| E. 5 marqueurs + corde | **48 %** | 12,3 | **67** | concentrée 75 % |

Lecture :

- **D seul ne change rien** : voler un marqueur à l'adversaire ne sert que si
  l'adversaire en a — or dans une course, le perdant n'en gagne jamais. La
  partie reste une course, encore plus courte qu'avant.
- **B et C fonctionnent par le même mécanisme** : allonger la partie (7 → 11
  tours) laisse le combat exister. La part d'éliminations monte, l'artillerie
  redevient jouable.
- **E est la meilleure des cinq** : moitié captures, moitié éliminations —
  aucun style de victoire ne domine ; aucune doctrine au-dessus de 75 % ;
  cinq des sept doctrines entre 25 et 75 % de victoires ; et l'artillerie
  passe de 25 % (règle actuelle) à 66,7 %. Tenir la zone y exige d'avoir
  d'abord gagné le rapport de force — la capture couronne le combat au lieu
  de le remplacer.
- **La nuée reste morte partout** (8-17 %). Son problème n'est pas la
  condition de victoire mais l'économie d'actions : 2 actions par tour quel
  que soit l'effectif. C'est un levier distinct, à traiter séparément.

Réserve : 42 parties par variante, soit ±15 points de bruit sur les taux
individuels. Les classements fins entre doctrines voisines ne sont pas
significatifs ; la répartition des types de fin et les durées, elles, le sont.

**Arbitrage rendu : la variante E est la règle publiée** — 5 marqueurs, et
marquer en retire un à l'adversaire. Moteur, règles (fr/en/es) et onboarding
mis à jour en conséquence.

## Suite — l'économie d'actions par effectif, mesurée

Question posée après l'adoption de la règle E : faire croître le budget
d'actions avec l'effectif survivant sauve-t-il les escouades nombreuses ?
Le moteur a reçu `sim.ActionRules` (même mécanique que `CaptureRules` : la
règle vit dans le `GameState`, la recherche la joue). Trois économies
d'actions, sous la règle de capture désormais par défaut, 42 parties chacune :

| Effectif | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| A. 2 actions fixes (actuelle) | 2 | 2 | 2 | 2 | 2 |
| B. 1 + effectif/2 | 2 | 2 | 3 | 3 | 4 |
| C. 2 + effectif/3 | 2 | 3 | 3 | 3 | 4 |

| Variante | Nuée (6 unités) | Écart 1ᵉʳ-dernier | Fins par élim. | Dominant |
|---|---|---|---|---|
| A. fixe | 16,7 % | **58 pts** | 55 % | concentrée 75 % |
| B. 1 + n/2 | **50,0 %** | 75 | 57 % | artillerie 83,3 % |
| C. 2 + n/3 | 41,7 % | 92 | **81 %** | artillerie 91,7 % |

Verdict en deux temps :

- **Oui, ça sauve la nuée** : de 16,7 % à 50 % sous B — l'hypothèse est
  confirmée, le handicap des escouades nombreuses est bien l'économie
  d'actions.
- **Mais le remède déséquilibre plus qu'il ne répare.** Plus d'actions par
  tour, c'est plus d'attaques par tour pour tout le monde : l'artillerie
  s'envole (66,7 → 83,3 → 91,7 %), les unités fragiles et rapides
  s'effondrent (kite 16,7 → 8,3 → 0 %), et l'écart global se dégrade
  (58 → 75 → 92 points). Sous C, 81 % des parties finissent en élimination :
  on a re-déséquilibré dans l'autre sens.

**Décision : l'économie d'actions reste à 2 actions fixes.** Le support
`ActionRules` demeure dans le moteur pour de futures expériences — une piste
plus chirurgicale serait un modèle d'activation (chaque action doit activer
une unité différente de la précédente, ou k unités distinctes par tour), qui
avantagerait le nombre sans augmenter le volume de feu global.

## Les escouades par défaut sous la nouvelle règle

Re-mesure des 4 escouades livrées après adoption de la règle E (72 parties) :

| Escouade | Effectif | Ancienne règle | Règle E |
|---|---|---|---|
| Détachement Vanguard | 5 | 86,1 % | 77,8 % |
| Convoi des Rouilleux | 5 | 58,3 % | 77,8 % |
| Compagnie de l'Aube | 6 | 8,3 % | 33,3 % |
| Ligne de 1812 | 6 | 47,2 % | 11,1 % |

Le classement suit désormais **l'effectif** : les deux escouades de 5 unités
devant, les deux de 6 derrière — cohérent avec le diagnostic d'économie
d'actions, que des parties plus longues aggravent. Un retour d'équilibrage des
escouades (et de l'algorithme de coûts, qui a été calibré sous l'ancienne
règle) sous la règle E reste à faire.

## Suite — les stratégies extrêmes ne cassent pas le jeu

Sonde dédiée : sept escouades « min-maxées », chacune poussant **un** levier à
sa limite légale (statistique ≤ 10, unité ≤ 30 pts, escouade ≤ 100 pts),
confrontées à deux compositions saines de référence. 144 parties.

| Escouade | Taux | c/e/l |
|---|---|---|
| réf. équilibrée | **81,2 %** | 13/13/0 |
| réf. mêlée lourde | **81,2 %** | 12/13/1 |
| MUR (5 unités à 9 PV) | 68,8 % | 11/6/**5** |
| BLITZ (mouvement 4 + charge) | 50,0 % | 9/7/0 |
| TORTUE (gardien + posture) | 43,8 % | 7/3/4 |
| ALPHA (puissance 4 + surcharge) | 43,8 % | 11/3/0 |
| FANTÔME (repli tactique ×5) | 40,6 % | 4/9/0 |
| NID (portée 4 + tir de précision) | 28,1 % | 1/8/0 |
| VERROU (suppression ×4) | 12,5 % | 4/0/0 |

*(c/e/l = victoires par capture / élimination / limite de tours)*

**Les deux compositions saines dominent le tableau.** Aucun extrême ne casse le
jeu : le VERROU s'effondre à 12,5 % (saturer de suppression, c'est renoncer à
tuer), le NID à 28,1 % (la portée maximale ne tient pas un objectif).

Un seul point d'attention, le **MUR** (cinq unités à 9 PV, 1 de puissance) :
68,8 %, et surtout **5 victoires arrivées à la limite de tours** contre 0 ou 1
pour toutes les autres — il gagne par attrition, pas par jeu. Il perd toutefois
0-100 % contre les deux références : il est répondu, pas dominant. Le tir à la
corde adopté ci-dessus est précisément ce qui l'empêche de bétonner
tranquillement ; à surveiller si la règle évolue encore.

## Suite — re-calibration des coûts sous la nouvelle règle

Le barème de coûts avait été optimisé sous l'ancienne condition de victoire :
il devait être re-mesuré. Run évolutionnaire (population 16, 10 générations,
~1 600 parties) sous la règle E. Meilleure fitness **0,690** (génération 7),
contre 0,541 mesurée pour le barème actuel.

Le candidat brut est cependant **inutilisable**, et pour la même raison qu'en
août : il pousse `MoveExponent` à 2,99 et `RangeExponent` à 2,00 (bornes
hautes) tout en effondrant `PowerFactor` de 78 %. Traduit en profils jouables :

| Barème | blitz 3/1/4/2 | nid 2/4/1/2 | polyvalent 3/3/2/2 | mur 9/1/2/1 |
|---|---|---|---|---|
| actuel | 24 | 26 | 22 | 20 |
| **GA brut** | **101 ✗** | **81 ✗** | **42 ✗** | **31 ✗** |
| tempéré A | 30 | 29 | 24 | 25 |

Le candidat brut rend inachetable jusqu'à une unité aussi banale que
3/3/2/2 — il « équilibre » en supprimant les trois quarts de l'espace de
conception. Il fait même boucler le générateur d'escouades, incapable de
composer 100 points sous ces coûts.

La direction trouvée reste valable (santé, portée et mobilité sous-cotées,
puissance surcotée) ; c'est l'amplitude qui est aberrante. D'où un barème
**tempéré**, qui garde les directions en laissant portée 4 et mouvement 4
accessibles.

Validation par le tournoi des 7 doctrines (calibrées à ~100 pts sous chaque
barème, avec réduction automatique quand le barème renchérit) :

| Barème | Écart 1ᵉʳ-dernier | Dernières doctrines |
|---|---|---|
| actuel | 75 pts | kite 16,7 %, nuée 0 % |
| **tempéré (adopté)** | **58 pts** | kite 25 %, nuée 16,7 % |

**Adopté dans `core.DefaultCosts`** : Santé 2,0 · Portée 1,6 × 1,40^(r−1) ·
Mouvement 0,8 × 1,75^(m−1) · Puissance 1,6 × 1,30^(p−1), plafond 30 inchangé.
Le barème resserre l'écart entre doctrines et relève les deux plus faibles
sans rien rendre inachetable. À noter : sous ce barème, la doctrine
mobilité+portée ne tient plus qu'à 3 unités dans 100 points — le kite est
enfin tarifé à son vrai prix.

## Suite et fin — les escouades par défaut équilibrées

Sous le nouveau barème, les quatre escouades ont été recalibrées (93 à
100 pts, 5 unités chacune, couverture 12/12 des capacités maintenue). La
première mesure donnait toujours le Vanguard à 86 % — et une septième
itération de statistiques a de nouveau AGGRAVÉ l'écart (91,7 %, la Ligne de
1812 à 11 %). Les retouches de caractéristiques ne convergent pas : le
paysage est chaotique et chaque mesure de 72 parties porte ±12 points de
bruit.

Le déblocage est venu d'un **diagnostic causal** : rejouer le même tournoi
avec toutes les capacités neutralisées. Sans capacités, la Ligne de 1812
remontait à 50 % et l'écart tombait à 47 points — le déséquilibre ne venait
pas des statistiques mais de **l'attribution des capacités aux profils**.
Le Repli Tactique posé sur l'Éclaireur orbital (l'unité la plus rapide du
jeu) en faisait un preneur d'objectif intouchable ; posé sur un tireur lent,
c'est un outil défensif honnête.

Correction : échange du Repli Tactique (Éclaireur → Voltigeur, dont la
citation dit littéralement « Je tire, je disparais ») contre le Tir de
Précision (Voltigeur → Éclaireur, désignation orbitale). Résultat, 72
parties :

| Escouade | Avant | Après |
|---|---|---|
| Convoi des Rouilleux | 58,3 % | 55,6 % |
| Compagnie de l'Aube | 27,8 % | 52,8 % |
| Ligne de 1812 | 36,1 % | 47,2 % |
| Détachement Vanguard | 86,1 % | 44,4 % |

**Écart premier-dernier : 11 points** — contre 58 avant l'échange, et jamais
mieux que 45 sur toutes les itérations de statistiques. La leçon vaut
au-delà des escouades livrées : dans ce système, **une capacité n'a pas un
prix, elle a un prix × un porteur**. C'est l'appariement capacité-profil
qui fait l'équilibre, et c'est là que doit porter l'attention de conception
— une piste future serait de conditionner certaines capacités à des seuils de
caractéristiques.

## Annexe — évaluer les contraintes d'accès aux capacités

La conclusion « une capacité a un prix × un porteur » appelle une méthode
d'évaluation reproductible, en trois étages :

**1. Mesurer la rente d'appariement.** Pour une capacité donnée, jouer la
même escouade (châssis fixe, budget égalisé à 100 pts) avec et sans la
capacité, en faisant varier uniquement le profil du porteur, contre un jury
fixe d'escouades de référence. Le delta de taux de victoire par porteur est
la **valeur effective** de la capacité sur ce porteur ; son prix étant fixe,
tout delta qui croît avec une caractéristique du porteur signale une rente —
et l'endroit où la courbe décroche donne directement le seuil de contrainte.

**2. Choisir l'instrument.** Trois options par capacité à rente, du plus
souple au plus dur :
   - *tarification dynamique* : le coût de la capacité dépend du porteur
     (ex. Repli Tactique à 2 + 3×max(0, Mouvement−2)) — préserve tout
     l'espace de conception, mais complexifie la lecture des cartes ;
   - *seuil d'accès* : la capacité exige ou interdit une valeur de
     caractéristique (ex. « Mouvement 2 ou moins ») — lisible sur la carte,
     ferme des combinaisons ;
   - *ne rien faire* : si le barème général rend déjà l'appariement abusif
     inachetable sous le plafond de 30 pts, la contrainte est implicite.

**3. Valider l'instrument comme une règle.** Ré-exécuter la sonde min-max
avec la contrainte en vigueur : l'abus doit disparaître, ET la capacité doit
rester jouée sur ses porteurs légaux (une contrainte qui tue la capacité a
juste déplacé le problème).

### Pilote : le Repli Tactique (96 parties)

Châssis fixe, budget égalisé à 100 pts, jury de deux escouades de référence,
12 parties par configuration (±25 pts de bruit — seuls les grands deltas
sont significatifs) :

| Porteur | Sans | Avec | Rente |
|---|---|---|---|
| mouvement 4 (2/1/4/2, 30 pts) | 16,7 % | 33,3 % | +16,7 |
| mouvement 3 (3/1/3/2) | 50,0 % | 58,3 % | +8,3 |
| mouvement 2 (3/2/2/2) | 33,3 % | 83,3 % | **+50,0** |
| mouvement 1 (3/3/1/2, tireur) | 8,3 % | 58,3 % | **+50,0** |

Deux conclusions, dont une inattendue :

- **La contrainte pressentie (« interdire au-delà de Mouvement 2 ») est
  réfutée.** La rente de mobilité qui avait déséquilibré les escouades par
  défaut a disparu — le nouveau barème l'a tarifée d'office : le porteur
  rapide coûte désormais 30 pts pour 2 PV, et la capacité ne le sauve pas.
  C'est le cas « ne rien faire » de l'étage 2 : la contrainte est devenue
  implicite dans le prix des statistiques.
- **La rente s'est déplacée, pas éteinte.** +50 points de taux de victoire
  sur les porteurs qui ont une action offensive à protéger (tirer, puis
  devenir inciblable), pour un prix de 2 points : la capacité est
  sous-tarifée dans l'absolu. L'instrument approprié n'est pas un seuil
  d'accès mais un **re-prix** (2 → 4 ou 5 pts), à valider par une nouvelle
  passe — en notant qu'un re-prix invaliderait la calibration des escouades
  par défaut (le Voltigeur porte cette capacité) et demanderait une retouche.

La méthode a fait exactement ce qu'on lui demandait : dire OÙ porte la rente
avant de choisir l'instrument.

### Banc complet : les 12 capacités (576 parties)

Chaque capacité mesurée sur trois porteurs le long de son axe de rente
plausible, témoins partagés par axe, 12 parties par configuration (±25 pts de
bruit par point de mesure ; c'est la **cohérence du signe sur les trois
porteurs** qui fait la significativité, pas un point isolé).

| Capacité (prix) | Axe | Rentes (bas / moyen / haut) | Verdict |
|---|---|---|---|
| Repli Tactique (2) | mouvement | **+41,7 / +41,7 / +41,7** | **sous-tarifée** — uniforme, pas un appariement |
| Posture Défensive (3) | santé | −33,3 / −16,7 / −25,0 | sur-tarifée (négative partout) |
| Gardien (4) | santé | −8,3 / −16,7 / −33,3 | sur-tarifée (négative partout) |
| En Avant ! (5) | mouvement | −16,7 / −33,3 / +16,7 | sur-tarifée probable |
| Balayage (5) | santé | −16,7 / +8,3 / −41,7 | sur-tarifée probable |
| Trait d'Énergie (3) | portée | −16,7 / −16,7 / **+33,3** | rente d'appariement sur portée 3 |
| Tir de Précision (4) | portée | −33,3 / 0,0 / **+25,0** | gradient croissant avec la portée |
| Feinte (3) | mouvement | +25,0 / +16,7 / +8,3 | correcte (légèrement favorable aux lents) |
| Charge (3) | mouvement | 0,0 / +16,7 / +8,3 | correcte |
| Tir de Suppression (4) | mouvement | +8,3 / −16,7 / 0,0 | correcte |
| Surcharge (3) | puissance | −8,3 / 0,0 / 0,0 | correcte |
| Frappe Dévastatrice (6) | puissance | +16,7 / +25,0 / −33,3 | correcte (rachète les faibles puissances, logique) |

**La conclusion d'ensemble renverse la question initiale.** On cherchait des
contraintes d'accès ; le banc montre qu'il n'en faut (presque) pas :

- **Aucune rente d'appariement forte ne subsiste** — le plafond de 30 pts et
  le nouveau barème ont neutralisé les combinaisons abusives. Le Repli
  Tactique lui-même est fort *uniformément* (+41,7 sur les trois porteurs) :
  c'est un problème de **prix**, pas de porteur.
- Les seuls gradients d'appariement restants sont **Trait d'Énergie et Tir de
  Précision sur porteurs à longue portée** — des points isolés dans le bruit,
  mais un gradient cohérent (−17→−17→+33 et −33→0→+25) : à surveiller, pas à
  légiférer.
- Le vrai chantier révélé est le **tarif des capacités** : Repli Tactique
  sous-tarifé (2 → 4 proposé) ; Posture Défensive, Gardien, En Avant ! et
  Balayage sur-tarifés d'un à deux points chacun. Tout re-prix devra être
  suivi d'une re-validation des escouades par défaut, qui portent quatre de
  ces cinq capacités.

## Suite — le re-prix des capacités, appliqué

Les cinq tarifs pointés par le banc ont été corrigés dans les YAML :

| Capacité | Avant | Après |
|---|---|---|
| Repli Tactique | 2 | **4** |
| Posture Défensive | 3 | **2** |
| Gardien | 4 | **3** |
| En Avant ! | 5 | **4** |
| Balayage | 5 | **4** |

Les marges dégagées dans les escouades par défaut ont été réinvesties en
santé (les quatre escouades jouent à 99-100 pts). Re-validation sur 72
parties :

| Escouade | Avant re-prix | Après |
|---|---|---|
| Convoi des Rouilleux | 55,6 % | 66,7 % |
| Ligne de 1812 | 47,2 % | 55,6 % |
| Compagnie de l'Aube | 52,8 % | 38,9 % |
| Détachement Vanguard | 44,4 % | 38,9 % |

L'écart premier-dernier remonte de 11 à 28 points — un desserrement attendu
(le Voltigeur paie son Repli Tactique au vrai prix) et acceptable : chaque
mesure porte ±15 points de bruit, aucune escouade ne domine (max 66,7 %) ni
n'est écrasée (min 38,9 %). L'arbitrage est assumé : un tarif juste pour
TOUTES les compositions possibles vaut mieux qu'un équilibre au point près
entre les quatre escouades livrées, obtenu sur des prix faux.

## Note de méthode

Deux erreurs ont été commises et corrigées en cours de route ; elles disent
quelque chose sur la façon de mesurer ce jeu.

- **Comparer à budgets inégaux ne mesure rien.** Le premier tournoi opposait des
  escouades de 70 à 102 points.
- **Recopier les compositions à la main crée des divergences silencieuses.** Une
  substitution sur un nom ambigu (« Sergent ») a modifié la mauvaise unité dans
  un script de test. Les compositions de test sont désormais **générées depuis
  `barracks/util/defaults.ts`**, seule source de vérité.
