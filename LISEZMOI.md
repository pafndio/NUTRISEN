# NutriSen : application web progressive

## Structure à déployer

```
nutrisen/
├── index.html              application (données des 100 recettes incluses)
├── manifest.webmanifest    nom, icônes, couleurs, raccourcis
├── sw.js                   service worker (hors ligne + mises à jour)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   └── favicon-32.png
├── screenshots/            images affichées dans la fenêtre d'installation
│   ├── mobile.webp
│   ├── mobile-grid.webp
│   └── desktop.webp
└── img/                    les 200 photos (001-dish.webp, 001-ing.webp … 101-ing.webp)
```

Le dossier `img/` reste celui que vous avez déjà, au même niveau que `index.html`.

## Mise en ligne

1. Copiez tout le dossier sur un hébergement en **HTTPS** (obligatoire pour le service worker ; `localhost` fonctionne aussi pour les tests). Netlify, Vercel, GitHub Pages, Firebase Hosting ou un serveur Nginx/Apache conviennent.
2. `sw.js` doit être à côté de `index.html`. L'application peut vivre à la racine du domaine ou dans un sous-dossier : tous les chemins sont relatifs.
3. Si votre serveur ne connaît pas l'extension `.webmanifest`, servez-la avec le type `application/manifest+json`.
4. Conseillé : `Cache-Control: no-cache` pour `sw.js` et `index.html`, pour que les mises à jour arrivent vite.

Test local rapide : dans le dossier, `python3 -m http.server 8000`, puis ouvrez http://localhost:8000.

## Ce que fait la PWA

- **Installation** : bouton « Installer » dans la barre du haut (Chrome, Edge, Android). Sur iPhone et iPad, le bouton rappelle la marche à suivre : Partager, puis « Sur l'écran d'accueil ».
- **Hors ligne** : après la première visite, l'application, les recettes, les étapes et la composition nutritionnelle s'ouvrent sans connexion. Les photos déjà vues sont gardées. Le bloc « Emporter NutriSen hors ligne », en bas de page, télécharge les 200 photos (environ 14 Mo) avec une barre de progression. Le lien « Libérer l'espace » les supprime.
- **Mises à jour** : quand une nouvelle version est en ligne, un bandeau « Mettre à jour » apparaît.
- **Raccourcis** (appui long sur l'icône installée) : Plat au hasard, Mes favoris, Guide.

## Publier une nouvelle version

Après une modification de `index.html`, changez la ligne `const VERSION = '1.0.0';` dans `sw.js` (par exemple `'1.0.1'`). Les appareils déjà équipés afficheront alors le bandeau « Mettre à jour ».

Si vous remplacez des photos dans `img/`, renommez aussi `IMG = 'nutrisen-img-v1'` en `v2`, dans `sw.js` et dans `index.html` (constante `IMG_CACHE`), pour vider les anciennes copies.
