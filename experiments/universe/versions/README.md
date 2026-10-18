# Versions du prototype Universe

## V1 · Diorama

`v1-diorama.zip` conserve le prototype avant la révision de son monde : une île industrielle centrale, ses tours, son cœur énergétique, son atmosphère, ses trois vues et l'interface minimale.

- Sauvegarde : 16 octobre 2026.
- Portée : tous les fichiers alors présents dans `experiments/universe`, sauf `versions`.
- Les entrées de l'archive sont relatives à `experiments/universe` : `Universe.astro`, `universe.css`, `lib/…`, `tests/…`, configuration et documentation locales.
- Aucun fichier de maintenance, de `src`, de `public`, de Docker ou de configuration racine n'est inclus.
- Le routage local autorisé sur `http://localhost:4321/universe` reste géré par la configuration racine existante.

Empreinte SHA-256 vérifiée :

```text
28E2DF52E387C012BC4F993C613EE507F40F17B30C34145D720F79DF04169D50
```

## Revenir à V1 en conservant l'état courant

Arrêter les serveurs de développement. Depuis la racine du dépôt, exécuter ce bloc dans PowerShell. Il vérifie l'archive connue, sauvegarde d'abord la version courante dans une nouvelle archive horodatée, puis restaure les fichiers V1 dans le seul dossier du prototype.

```powershell
$universeRepo = (Resolve-Path -LiteralPath '.').Path
$universeRoot = [System.IO.Path]::GetFullPath((Join-Path $universeRepo 'experiments/universe'))
$universeArchive = Join-Path $universeRoot 'versions/v1-diorama.zip'
$universeExpected = '28E2DF52E387C012BC4F993C613EE507F40F17B30C34145D720F79DF04169D50'

if (!(Test-Path -LiteralPath (Join-Path $universeRepo 'astro.config.mjs'))) {
  throw 'Exécuter cette procédure depuis la racine du dépôt.'
}
if ((Get-FileHash -LiteralPath $universeArchive -Algorithm SHA256).Hash -ne $universeExpected) {
  throw 'L’archive V1 ne correspond pas à la sauvegarde vérifiée.'
}

$universeBackup = Join-Path $universeRoot ('versions/before-restore-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.zip')
$universeCurrent = @(Get-ChildItem -LiteralPath $universeRoot -Force | Where-Object Name -ne 'versions')
Compress-Archive -LiteralPath $universeCurrent.FullName -DestinationPath $universeBackup -CompressionLevel Optimal -ErrorAction Stop
Expand-Archive -LiteralPath $universeArchive -DestinationPath $universeRoot -Force -ErrorAction Stop
Write-Output ('Version précédente conservée dans ' + $universeBackup)
```

La restauration remplace uniquement les fichiers présents dans l'archive. Elle conserve les éventuels fichiers ajoutés après V1 ; ceux-ci ne sont plus importés par les points d'entrée V1. Elle conserve également ce guide et toutes les archives du dossier `versions`. La documentation incluse dans V1 reflète son état historique ; le présent guide reste la référence pour le routage local actuel.

Relancer ensuite le serveur habituel et ouvrir [V1 en local](http://localhost:4321/universe) :

```sh
pnpm dev
```

Les anciennes pages et le mode maintenance restent intacts. Aucun déploiement n'est effectué. Pour revenir à l'état d'avant restauration, utiliser son archive `before-restore-…zip` dans la même destination après avoir sauvegardé l'état courant suivant le même principe.
