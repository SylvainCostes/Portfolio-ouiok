# Universe V2 — un continent d’infrastructure suspendu

## Intention

Donner à l’expérience la profondeur d’un lieu : une infrastructure habitée par ses fonctions, ses circulations et ses détails d’échelle. Le plateau central devient un territoire asymétrique avec plusieurs quartiers construits. Les ponts prolongent la composition vers deux destinations secondaires, puis des silhouettes lointaines.

Le regard arrive depuis un viaduc au premier plan. Il traverse le cœur énergétique et les terrasses, remonte vers la citadelle, puis découvre les infrastructures au-delà des nuages. La vue d’ensemble, le cœur et l’architecture disposent de cadrages définis. Le déplacement de la souris apporte une légère parallaxe ; le cœur peut être sélectionné pour rapprocher la caméra.

## Architecture et matière

- Citadelle centrale dissymétrique, couronne décalée, façades inclinées et aile structurelle découpée.
- Ateliers à toits en dents de scie, cheminées de ventilation et galeries techniques.
- Volumes en porte-à-faux à l’est, terrasses, escaliers, garde-corps et armoires de service.
- Fondations à plusieurs quilles, contreforts, baies profondes et nervures sous le plateau.
- Deux constructions secondaires reliées par des ponts suspendus, avec tabliers segmentés, câbles et pylônes.

La palette associe graphite, béton, titane et bronze. Le cyan désigne l’énergie ; l’ambre ponctue les équipements. Les matières utilisent un grain généré localement, des différences de rugosité et une réflexion d’environnement créée à partir d’un ciel peint dans un canvas. L’occlusion ambiante souligne les joints et les contacts.

Cette version est modélisée dans Three.js à partir de sections dessinées, de volumes extrudés, de profils chanfreinés et d’éléments assemblés puis fusionnés par matériau. Elle ne charge aucun modèle Blender ou GLB, ni modèle externe sous licence.

## Atmosphère et mouvement

La mer de nuages utilise un shader qui échantillonne une densité en coordonnées du monde. Des bancs supplémentaires enveloppent les fondations et traversent certains ponts. Quelques particules donnent une échelle au déplacement. La brume de l’ouverture s’allège progressivement pendant que le réseau énergétique s’illumine.

Les mouvements restent liés à la scène : passage entre trois vues, parallaxe, pulsations du cœur et des conduits, dérive des nuages. L’interface conserve la marque, le contact, une courte signature et les commandes d’exploration et de pause. La préférence de mouvement réduit affiche directement une scène éclairée et permet des changements de vue immédiats.

## Répartition des fichiers

Tous les chemins ci-dessous sont relatifs à `experiments/universe`.

| Fichier | Responsabilité |
| --- | --- |
| `Universe.astro` | Document local, marque, contrôles accessibles et illustration de remplacement |
| `universe.css` | Composition responsive et styles du prototype |
| `lib/experience.ts` | Scène, caméra guidée, éclairage, post-traitement, interactions et cycle de vie |
| `lib/architectural-kit.ts` | Sections, extrusions, profils, matériaux et fusion des géométries |
| `lib/world-architecture.ts` | Continent central et cœur énergétique de V2 |
| `lib/archipelago.ts` | Destinations secondaires, ponts et silhouettes lointaines |
| `lib/atmosphere.ts` | Ciel, mer de nuages, bancs de brume et particules |
| `lib/architectural-occlusion.ts` | Occlusion des volumes solides, avec exclusion des effets atmosphériques |
| `lib/architecture.ts` | Géométrie de la première direction, conservée ; le point d’entrée V2 utilise `world-architecture.ts` |
| `tests/` | Intégrité du site, routage local et production, scénarios de navigateur |
| `versions/v1-diorama.zip` | Sauvegarde complète du prototype avant V2, hors archives de versions |

V2 reste limitée au dossier du prototype. Le mode maintenance, les pages originales et la configuration de déploiement ne sont pas modifiés. Le seul ajout antérieur dans la configuration Astro racine est l’intégration locale explicitement autorisée : `/universe` existe pendant `dev`, et n’est pas enregistré pendant le build de production.

## Rendu et vérification

Le rendu est plafonné à 60 images par seconde sur ordinateur et à 30 pour le profil mobile. La cadence utilise une échéance cumulative pour éviter une dérive sur les écrans à fréquence élevée. La résolution peut diminuer si plusieurs mesures indiquent une cadence insuffisante. Les rendus s’arrêtent lorsque l’onglet est masqué ou la scène hors champ ; le mouvement réduit et la pause utilisent un rendu à la demande.

Les géométries statiques sont fusionnées par matériau. Les shaders animent les effets sans reconstruire les géométries à chaque image. Les observateurs, événements, matériaux, textures, cibles de rendu et contextes sont libérés à la fermeture de l’expérience. Une perte de contexte ou l’absence de WebGL conserve une illustration et le contenu HTML.

Les attributs de diagnostic du canvas décrivent les images réellement rendues, les appels de dessin, les triangles et le temps CPU soumis par image. Ce temps CPU ne représente pas une mesure GPU. Une fenêtre de navigateur à taille mobile vérifie la composition et les contrôles ; elle ne remplace pas une mesure sur téléphone physique.

## Réversibilité

[Le guide des versions](versions/README.md) donne l’empreinte de l’archive V1 et une restauration qui sauvegarde d’abord la version courante. La restauration concerne exclusivement le prototype. Aucun déploiement n’est effectué par ces commandes.
