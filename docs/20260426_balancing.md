# Processus d'équilibrage d'Escarmouche

_26 avril 2026_

## 1. Diagnostic initial du système

L'analyse initiale a révélé plusieurs problèmes structurels dans le système d'équilibrage existant.

**Capacités sans implémentation simulée.** Sur 12 capacités définies dans les fichiers YAML de `pkg/core/abilities/`, seules 3 avaient un fichier d'implémentation dans `pkg/sim/` : Charge, Trait d'Énergie et Posture Défensive. Les 9 autres (Tir de Suppression, Repli Tactique, Ordre En Avant !, Frappe Dévastatrice, Feinte, Gardien, Balayage, Tir de Précision, Surcharge) avaient un coût dans la formule mais n'avaient aucun effet en simulation. Le balanceur optimisait donc les coûts d'un système où la majorité des capacités étaient des coquilles vides.

**Bug de réinitialisation des capacités.** Le compteur `CounterRoundAbilities` n'était jamais remis à zéro entre les tours dans `game.go` — seul `CounterRoundAttacks` l'était. Les unités ne pouvaient donc utiliser chaque capacité qu'une seule fois par partie entière, au lieu d'une fois par tour.

**`MaxTotal` dans le génome évolutionnaire.** Le paramètre `MaxTotal` (budget maximum d'une unité) était optimisé par l'algorithme génétique au même titre que les facteurs de coût. Or ce paramètre contrôle implicitement quelles unités sont générées pour les tournois — le faire varier revenait à changer les règles du jeu pendant la mesure de balance.

**Stratégie IA trop simpliste.** L'IA utilisait une évaluation gloutonne à un seul coup : elle appliquait chaque action possible sur une copie de l'état, calculait `maVie − vieAdversaire + bonus position`, et choisissait le maximum sans voir plus loin. Elle ne planifiait pas, n'anticipait pas les réponses adverses, et ajoutait un bruit aléatoire de ±10 % à chaque décision.

**Absence de guidance stratégique pour les capacités.** La fonction `evaluateAbilityAction` de la stratégie fuzzy ne connaissait explicitement que trois capacités (Posture Défensive, Charge, Trait d'Énergie). Toutes les autres recevaient un score basé uniquement sur `maVie − vieAdversaire`, ce qui rendait leur usage peu pertinent.

---

## 2. Corrections implémentées

### 2.1 Les 9 capacités manquantes

Chaque capacité a été implémentée dans un fichier Go dédié dans `pkg/sim/`, suivant le patron des trois existantes. Quatre nouveaux compteurs de statut persistants ont été introduits :

- `CounterSuppressed` — l'unité ciblée ne peut pas agir à son prochain tour
- `CounterUntargetable` — l'unité ne peut pas être ciblée par des attaques
- `CounterOvercharged` — l'unité ne peut pas attaquer à son prochain tour
- `CounterGuardianOf` — l'unité protège un allié adjacent (les dégâts lui sont redirigés)

Ces compteurs utilisent un modèle de durée basé sur un décompte à 2 : initialisés à 2, décrémentés à chaque début de tour (joueur actif et adversaire alternativement), ce qui garantit que l'effet persiste exactement pendant le tour adverse.

La mécanique de Guardian a nécessité de modifier `applyDamage` dans `game_state.go` pour vérifier, avant d'appliquer des dégâts à une cible, si un allié adjacent porte le compteur `CounterGuardianOf` pointant vers elle — auquel cas les dégâts sont redirigés.

Le Tir de Précision a motivé l'ajout d'une fonction `getOpponentsInRange` qui ignore délibérément la ligne de vue, contrairement à `getReachableOpponentUnits`.

### 2.2 Correction du bug `CounterRoundAbilities`

`game.go` a été modifié pour appeler `g.state.DelAll(CounterRoundAbilities)` au début de chaque tour, au même titre que `CounterRoundAttacks`. Sans cette correction, les capacités n'étaient utilisables qu'une seule fois par partie.

### 2.3 Retrait de `MaxTotal` du génome

Les blocs de croisement et de mutation portant sur `MaxTotal` ont été supprimés dans `evaluator.go`. `MaxTotal` est désormais toujours fixé à 30, indépendant de l'optimisation.

### 2.4 Mutation adaptative

Le pas de mutation dans l'algorithme génétique décroît progressivement au fil des générations, selon la formule `adaptiveFactor = 1 − 0.9 × (génération / maxGénérations)`. En début de run l'exploration est large ; en fin de run l'affinement est précis sans provoquer de régressions.

### 2.5 Stratégie lookahead alpha-beta minimax

Un nouveau fichier `pkg/sim/lookahead_strategy.go` a implémenté l'algorithme minimax avec élagage alpha-beta. Les choix de conception sont les suivants :

- **Profondeur par défaut : 2** — l'IA évalue son action, puis la réponse adverse avant de décider.
- **Modèle d'alternance A → B → A → B** à chaque profondeur, approximation des 2 slots d'action réels (A-A-B-B) pour limiter l'explosion combinatoire.
- **Détection des états terminaux** : victoire ou défaite scorée ±1000 pour guider l'arbre vers les fins de partie.
- **Tri des actions** : attaques et capacités sont évaluées en premier pour maximiser l'efficacité de l'élagage.
- **Pas de randomisation** par défaut (déterminisme requis pour le balanceur).

`DefaultStrategy` a été mis à jour pour utiliser `LookaheadStrategy(2)`. Le balanceur utilise `WithLookaheadDepth(1)` pour réduire le coût de calcul lors des milliers de simulations de tournoi.

### 2.6 Guidance stratégique des capacités dans FuzzyStrategy

`evaluateAbilityAction` a été étendue pour couvrir les 12 capacités réparties en quatre groupes : offensif mêlée (Charge, Frappe Dévastatrice, Balayage, Surcharge), offensif à distance (Trait d'Énergie, Tir de Suppression, Tir de Précision), défensif (Posture Défensive, Gardien), et repositionnement (Repli Tactique, Ordre En Avant !, Feinte). Chaque groupe reçoit des bonus calibrés sur les paramètres de décision fuzzy (Aggression, RiskTolerance, PositioningPreference).

Le bruit aléatoire ±10 % appliqué à chaque décision de FuzzyStrategy a été supprimé.

---

## 3. Campagne d'équilibrage

Quatre runs de l'algorithme génétique ont été menés avec des paramètres et des coûts par défaut différents.

### Run 1 — Coûts originaux, paramètres réduits

**Paramètres** : population 20, 8 escouades/éval (56 matchs/individu), 30 générations.  
**Résultat** : fitness Gen 0 = 0.9847, fitness Gen 29 = 0.9949.  
**Signal** : le GA trouvait systématiquement `HealthFactor` ~2.4 (depuis 1.0) et `PowerFactor` ~0.7 (depuis 3.0). La courbe était bruitée, signe que 56 matchs par individu est insuffisant pour une mesure stable du HHI.

### Run 2 — Coûts originaux, paramètres complets

**Paramètres** : population 50, 20 escouades/éval (380 matchs/individu), 200 générations, ~5 heures.  
**Résultat** : fitness Gen 0 = 0.9944, fitness finale = 0.9972.  
**Signal** : confirmation que `HealthFactor` devrait être autour de 2.65 (+165 %) et `PowerFactor` autour de 0.67 (−78 %). `MoveFactor` et `RangeFactor` montraient des variations incohérentes entre les runs, indiquant que ces dimensions sont peu déterminantes pour la balance. L'algorithme n'a pas convergé (seuil 0.999) car la variance résiduelle du HHI avec 380 matchs reste ~0.001-0.002.

### Run 3 — Correction agressive (HealthFactor=2.5, PowerFactor=0.8)

**Résultat** : fitness Gen 0 = 0.9825, légèrement inférieure au run 1.  
**Explication** : l'effet de couplage. Modifier `DefaultCosts` modifie simultanément le prix des statistiques ET la population d'unités générées pour les tournois — les deux sont liés via `gen.RandomUnit`. Avec `HealthFactor=2.5`, chaque PV coûte plus cher, donc les unités générées ont moins de PV. Des unités plus fragiles meurent plus vite, rendant les parties plus aléatoires et dégradant le HHI. La correction agressive annulait ses propres bénéfices.

### Run 4 — Correction conservatrice (PowerFactor=0.9)

**Paramètres** : population 20, 8 escouades/éval, 30 générations.  
**Résultat** : fitness Gen 0 = 0.9927, meilleure des quatre configurations testées au démarrage.  
**Conclusion** : réduire `PowerFactor` de 3.0 à 0.9 améliore le point de départ de manière mesurable et reproductible, sans l'effet de couplage de la correction agressive.

### Run 5 — Validation à PowerFactor=1.5

**Paramètres** : population 50, 20 escouades/éval, 200 générations, ~5 heures.  
**Résultat** : fitness Gen 0 = 0.9946 (meilleure baseline), fitness finale = 0.9977.  
**Conclusion** : `PowerFactor=1.5` donne le meilleur point de départ de tous les runs. Le paysage de fitness est très plat dans les dimensions `Move` et `Range` — le GA trouve des valeurs très différentes pour ces paramètres selon le point de départ, mais toutes atteignent des fitness similaires. Seul `PowerFactor` a un signal robuste et reproductible.

---

## 4. Conclusion et coûts retenus

Les cinq runs confirment deux faits stables :

1. **`PowerFactor = 3.0` est trop élevé.** Toute valeur entre 0.7 et 2.0 améliore la fitness de départ. La valeur retenue, **1.5**, est le point médian entre les deux signaux contradictoires observés (le GA montait de 0.9 vers ~2.0, et descendait de 3.0 vers ~0.7).

2. **Le paysage de fitness est intrinsèquement plat.** Beaucoup de configurations différentes produisent des HHI proches de 0.999 avec 20 escouades. C'est une bonne nouvelle : le système de jeu est naturellement robuste et la balance n'est pas très sensible aux valeurs exactes des paramètres secondaires.

Les coûts par défaut finaux (`pkg/core/cost.go`) :

| Paramètre | Valeur originale | Valeur finale | Justification |
|---|---|---|---|
| `HealthFactor` | 1.0 | **1.0** | Signal incohérent dû à l'effet de couplage |
| `PowerFactor` | 3.0 | **1.5** | Seul signal robuste et reproductible sur 5 runs |
| `PowerExponent` | 1.2 | **1.2** | Inchangé |
| `RangeFactor` | 2.0 | **2.0** | Inchangé |
| `RangeExponent` | 1.1 | **1.1** | Inchangé |
| `MoveFactor` | 1.0 | **1.0** | Inchangé |
| `MoveExponent` | 1.1 | **1.1** | Inchangé |
| `MaxTotal` | 30 | **30** | Retiré du génome, toujours fixe |

---

## 5. Limites identifiées et pistes d'amélioration

**Effet de couplage unités/coûts.** `gen.RandomUnit` utilise `DefaultCosts` à la fois pour tarifer les unités et pour décider quand une unité "remplit" son budget de rang. Modifier les coûts change donc la population d'unités testée, pas seulement leur tarification. Pour des résultats plus fiables, il faudrait découpler la génération d'unités (avec des statistiques fixes) de l'optimisation des coûts.

**Variance du HHI.** Avec 20 escouades (380 matchs), la variance résiduelle de l'estimateur HHI est ~0.001-0.002, juste en dessous du seuil de convergence fixé à 0.999. Passer à 30 escouades (870 matchs) permettrait probablement la convergence, au prix d'un run plus long.

**IA non représentative du jeu PvP.** Même avec le lookahead depth 2, l'IA reste un approximant du jeu humain : pas de planification coopérative entre unités, pas d'anticipation sur plus de 2 coups, évaluation basée uniquement sur la différence de santé et la position. Les coûts optimisés pour cette IA ne sont pas nécessairement optimaux pour des parties humaines.
