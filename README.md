# Séquence — Atelier de scénario

Application de bureau pour l'écriture de scénarios : script, plans de scènes, storyboard et personnages.
Elle fonctionne entièrement hors ligne et sauvegarde automatiquement votre travail sur votre ordinateur.

## Télécharger (utilisateurs)

Rendez-vous dans l'onglet **[Releases](../../releases)** et téléchargez la dernière version :

- **`Séquence Setup x.y.z.exe`** : installateur Windows (raccourcis Bureau et menu Démarrer)
- **`Séquence x.y.z.exe`** : version portable, sans installation

> Windows SmartScreen peut afficher un avertissement car l'application n'est pas signée numériquement :
> cliquez sur *Informations complémentaires* puis *Exécuter quand même*.

Vos documents sont enregistrés dans `%APPDATA%\Séquence\sequence-data.json`.

## Lancer depuis le code source (développeurs)

Prérequis : [Node.js](https://nodejs.org) 20 ou plus récent.

```bash
git clone https://github.com/<votre-pseudo>/sequence.git
cd sequence
npm install
npm start
```

## Construire l'installateur Windows

```bash
npm run dist:win       # installateur NSIS + version portable dans dist/
npm run dist:win-dir   # version décompressée (test rapide)
```

Un workflow GitHub Actions (`.github/workflows/release.yml`) construit et publie automatiquement
les `.exe` dans les Releases à chaque tag de version :

```bash
git tag v1.0.1
git push origin v1.0.1
```

## Structure du projet

```
├── main.js            Processus principal Electron (fenêtre, sauvegarde locale)
├── preload.js         Pont sécurisé entre l'interface et le système de fichiers
├── app/
│   ├── index.html     Interface de l'application
│   └── vendor/        PDF.js 3.11.174 (Mozilla, licence Apache 2.0)
├── build/             Icônes de l'application
└── package.json       Dépendances et configuration electron-builder
```

## Technologies

- [Electron](https://www.electronjs.org/) 31
- [electron-builder](https://www.electron.build/) pour le packaging Windows
- [PDF.js](https://mozilla.github.io/pdf.js/) pour la lecture des PDF

## Licence

Tous droits réservés. Ce code est publié à titre de consultation ; aucune réutilisation sans autorisation.
