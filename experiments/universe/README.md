# Universe — prototype local isolé

Cette expérience est accessible sur `/universe` uniquement en développement. Elle conserve l'accueil de chantier, les redirections temporaires et tous les fichiers du site existant. L'ajout local dans `astro.config.mjs` a été explicitement autorisé ; il n'enregistre aucune route pendant un build de production. Aucune commande de production ni configuration de déploiement n'est changée par le prototype.

## Lancer

Depuis la racine du dépôt, avec **Node.js 22 ou ultérieur** :

```sh
pnpm dev
```

Ouvrir [le prototype local](http://localhost:4321/universe). [L'accueil sur le même serveur](http://localhost:4321/) conserve la page de chantier actuelle. Si le serveur habituel tourne déjà, il suffit d'ouvrir `/universe`.

Un deuxième serveur facultatif permet d'isoler le cache de développement, ou de comparer deux adresses :

```sh
node experiments/universe/preview.mjs
```

Il écoute uniquement sur `127.0.0.1:4324`. Un autre port peut être fourni en argument : `node experiments/universe/preview.mjs 4326`. Son accueil affiche aussi la page de chantier existante. Sur les deux serveurs, les anciennes routes et les URL inconnues conservent leurs redirections `302` vers `/`.

## Isolation et retrait

- La configuration principale comporte une intégration locale optionnelle : elle vérifie l'existence de `Universe.astro` et injecte `/universe` uniquement pendant la commande `dev`.
- Le fichier de page n'est ni importé ni enregistré pendant `build`, `preview` ou `sync`.
- La configuration alternative hérite de cette route et ajoute un serveur local avec un cache indépendant.
- Les commandes `build` et `preview` avec la configuration alternative sont explicitement refusées.
- Les composants, shaders, styles et ressources propres à l'expérience restent dans ce dossier. Les ressources sont importées depuis le code, sans ajout au dossier public du site.
- Aucun lien vers `/universe` n'est ajouté à l'accueil, au sitemap ou au menu du site.
- Le build de maintenance ordinaire continue à répondre `302` pour `/universe`, comme pour les autres URL inconnues. Aucun script ou modèle du prototype n'est inclus dans son résultat.

Pour retirer le prototype, arrêter ses serveurs et déplacer ou supprimer uniquement `experiments/universe`, après avoir conservé les versions souhaitées. Le cache facultatif `node_modules/.astro-universe` peut aussi être retiré. L'intégration locale devient inactive quand `Universe.astro` est absent ; aucun changement supplémentaire n'est nécessaire dans le site existant.

## Versions conservées

La première direction, **V1 · Diorama**, a été sauvegardée avant la révision du monde dans `versions/v1-diorama.zip`. Elle comprend tous les fichiers du prototype à cet instant, hors dossier `versions`. Le site de maintenance et les pages originales ne font pas partie de cette archive et ne sont pas restaurés par elle.

[Le guide des versions](versions/README.md) décrit le contenu, l'empreinte SHA-256 et la procédure de retour à V1. Cette procédure archive d'abord l'état courant, puis restaure les fichiers de V1 exclusivement dans `experiments/universe`.

## Vérifications

### Révision visuelle V2

La composition actuelle remplace le socle circulaire par un continent architectural asymétrique, deux destinations reliées par des ponts suspendus et une passerelle d'arrivée au premier plan. Le nombre de contrôles et les textes visibles sont conservés. Les cadrages existants ont été recomposés, sans ajout d'un système de navigation entre îles.

La version précédente complète est conservée dans `versions/v1-diorama.zip`. Voir `versions/README.md` pour une restauration qui sauvegarde d'abord la version courante. `ART-DIRECTION.md` décrit les modules et les choix de composition.

Vérifications locales du 16 octobre 2026 : TypeScript/Astro sans erreur, 14 tests de routage/intégrité et 44 tests du build de maintenance réussis. Rendu observé autour de 60 images/s dans le navigateur Chromium du poste et 30 images/s avec le profil mobile en fenêtre de 390 × 844 ; cela ne constitue pas une mesure sur téléphone physique. Le compteur de 60 appels de rendu inclut les passes d'occlusion et de bloom. Mouvement réduit, navigation clavier, absence de WebGL et perte de contexte contrôlés dans le navigateur.

Les tests sont séparés des tests existants. Ils utilisent exclusivement les modules standard de Node.

```sh
# 281 empreintes protégées, exception locale autorisée et gardes de configuration
node --test experiments/universe/tests/isolation.test.mjs

# Serveurs actifs sur 4321 et 4324 ; /universe est testé sur 4321
node --test experiments/universe/tests/preview-routing.test.mjs

# Contrôle TypeScript/Astro limité au prototype
node node_modules/astro/astro.js check --tsconfig experiments/universe/tsconfig.json

# Build habituel, puis contrôle de son isolation (serveur temporaire sur port libre)
node scripts/build.mjs
node --test experiments/universe/tests/production-isolation.test.mjs
node --test tests/maintenance-routing.test.mjs
```

`UNIVERSE_PREVIEW_URL` (par défaut `http://localhost:4321`) et `MAINTENANCE_PREVIEW_URL` (par défaut `http://127.0.0.1:4324`) permettent de changer les adresses utilisées par les tests. Le deuxième serveur sert de comparaison pour l'accueil ; l'intégrité du code de maintenance est vérifiée séparément par les empreintes.

L'instantané `tests/protected-files.snapshot.json` conserve les octets du site au début du prototype. Les fichiers de `src`, `public`, `maintenance`, les scripts de build et les fichiers de déploiement doivent rester identiques. `tests/approved-local-routing.json` conserve séparément les empreintes avant/après du seul ajout local autorisé à `astro.config.mjs`. L'instantané initial n'a pas été régénéré pour masquer ce changement.

### Scénarios navigateur

Avec le serveur du prototype actif :

```sh
node experiments/universe/tests/browser-harness.mjs
```

Le proxy QA est accessible sur `http://127.0.0.1:4325/universe?scenario=…`. Il utilise le serveur secondaire `4324` par défaut ; définir `UNIVERSE_PREVIEW_URL=http://localhost:4321` permet de viser le serveur habituel :

| Scénario | Vérification |
| --- | --- |
| `reduced` | Préférence de mouvement réduit, contrôles toujours utilisables |
| `webgl-disabled` | Scène de remplacement sans contexte WebGL |
| `no-js` | Contenu et scène de remplacement sans JavaScript |
| `context-loss` | Bouton local simulant une perte de contexte WebGL |
| `background` | Bouton local simulant un onglet masqué, puis sa réouverture |
| `capture` | Export JPEG du rendu WebGL, sans changer la page réelle |

Ces simulations concernent exclusivement ce proxy local. La page réelle ne charge aucun code du banc de test. Pour une évaluation de performance complète, compléter les mesures locales par un appareil mobile physique ; l'émulation de taille de fenêtre ne reproduit pas son GPU.
