# Prompts d'illustration — les 23 unités

Un fichier par unité, prêt à coller dans un générateur d'images
(gpt-image-1, Stable Diffusion, Midjourney…). Chaque prompt est **autonome** :
il embarque déjà le bloc de style commun.

## Le style d'ensemble

Toutes les unités partagent la même esthétique : **illustration de carte à la
manière des grands TCG** (Magic: The Gathering…) — peinture numérique
détaillée, éclairage cinématographique, personnage net sur un arrière-plan
d'ambiance en profondeur de champ, **cadrage paysage 16:9**. La cohérence de
collection tient à deux invariants :

1. le même bloc STYLE en tête de chaque prompt ;
2. une **palette dominante par escouade**, qui distingue les quatre univers
   au premier coup d'œil sans casser l'unité de l'ensemble.

| Escouade | Préfixe | Palette dominante | Ambiance d'arrière-plan |
|---|---|---|---|
| Compagnie de l'Aube | `fantasy-` | or pâle, lumière d'aube | remparts en ruine, bannières, brume |
| Détachement Vanguard | `scifi-` | cyan acier, lumière stellaire froide | soutes, structures orbitales, colonies |
| Ligne de 1812 | `hist-` | bleu impérial, gris poudre | fumée de mousquets, éclairs de canon |
| Convoi des Rouilleux | `apoc-` | orange rouille, blanc os | autoroutes effondrées, carcasses, poussière ambrée |

Le contraste de valeurs est exigé dans le STYLE : l'illustration doit rester
lisible **imprimée en noir et blanc** sur la carte 63 × 88 mm.

Pour changer de rendu global (repasser en figurines, en illustration 2D
flat…), remplacez le bloc STYLE au début de chaque prompt — les sujets
(pose, équipement, caractère) en sont indépendants.

## Paramètres recommandés

- **Format : paysage 16:9, 1344 × 768 minimum** — la fenêtre d'illustration
  de la carte est au ratio ≈ 1,75:1 et l'image la remplit (`object-fit:
  cover`) : le centre du cadre doit porter le sujet, les bords peuvent être
  rognés.
- Générer les variantes d'une même escouade **dans la même session/seed**
  quand l'outil le permet : la cohérence intra-escouade y gagne.
- Après génération : déposer les fichiers dans `barracks/static/` sous le nom
  indiqué dans chaque fiche, puis renseigner `imageUrl` dans
  `barracks/util/defaults.ts` (`${BASE_URL}/<fichier>.png`).

## Les fiches

- [Templier](knight.md) — Compagnie de l'Aube
- [Archer elfe](archer.md) — Compagnie de l'Aube
- [Sorcier crépusculaire](mage.md) — Compagnie de l'Aube
- [Gardien du serment](fantasy-warden.md) — Compagnie de l'Aube
- [Écuyer](fantasy-squire.md) — Compagnie de l'Aube
- [Chasseresse sylvestre](fantasy-huntress.md) — Compagnie de l'Aube
- [Guerrier orc](bruiser.md) — Compagnie de l'Aube
- [Fusilier lourd](scifi-heavy.md) — Détachement Vanguard
- [Éclaireur orbital](scifi-scout.md) — Détachement Vanguard
- [Technicien de combat](scifi-tech.md) — Détachement Vanguard
- [Sergent d'abordage](scifi-sergeant.md) — Détachement Vanguard
- [Drone sentinelle](scifi-drone.md) — Détachement Vanguard
- [Grenadier de la Garde](hist-grenadier.md) — Ligne de 1812
- [Voltigeur](hist-voltigeur.md) — Ligne de 1812
- [Cuirassier](hist-cuirassier.md) — Ligne de 1812
- [Sergent de compagnie](hist-sergeant.md) — Ligne de 1812
- [Tambour](hist-drummer.md) — Ligne de 1812
- [Fusilier de ligne](hist-fusilier.md) — Ligne de 1812
- [Colosse de fonte](apoc-colossus.md) — Convoi des Rouilleux
- [Tireuse de tôle](apoc-sharpshooter.md) — Convoi des Rouilleux
- [Ferrailleur](apoc-scrapper.md) — Convoi des Rouilleux
- [Chien de casse](apoc-hound.md) — Convoi des Rouilleux
- [Mécano bricoleur](apoc-mechanic.md) — Convoi des Rouilleux
