/* NutriSen — service worker
   Changez VERSION à chaque mise en ligne de index.html pour que les appareils
   reçoivent la nouvelle version (un bandeau « Mettre à jour » s'affiche). */
const VERSION = '1.0.0';
const SHELL = `nutrisen-shell-${VERSION}`;
const IMG = 'nutrisen-img-v1';      // partagé avec index.html (bouton « Télécharger les photos »)
const FONTS = 'nutrisen-fonts-v1';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Photos visibles dès l'accueil (carrousel 3D + familles de plats) : mises en cache à l'installation.
const HOME_IMAGES = [26, 61, 51, 4, 14, 72, 18, 85, 100, 47, 43, 97, 56, 92]
  .map(n => `./img/${String(n).padStart(3, '0')}-dish.webp`);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(SHELL_FILES);
    const img = await caches.open(IMG);
    await Promise.all(HOME_IMAGES.map(u => img.add(u).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('nutrisen-shell-') && k !== SHELL).map(k => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages : réseau d'abord (pour recevoir les nouveautés), sinon la copie hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const res = preload || await fetch(req);
        if (res && res.ok) (await caches.open(SHELL)).put('./index.html', res.clone());
        return res;
      } catch {
        return (await caches.match('./index.html', { ignoreSearch: true })) ||
               (await caches.match('./', { ignoreSearch: true })) ||
               new Response('<h1>Hors ligne</h1><p>Ouvrez NutriSen une première fois avec une connexion.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Photos des plats : cache d'abord, puis réseau (et mise en cache au passage).
  if (url.origin === location.origin && /\/img\/[^/]+\.(webp|jpe?g|png)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMG);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return new Response('', { status: 504, statusText: 'Hors ligne' });
      }
    })());
    return;
  }

  // Polices Google : copie en cache, rafraîchie en arrière-plan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('', { status: 504 });
    })());
    return;
  }

  // Autres fichiers de l'application (manifeste, icônes…) : cache, puis réseau.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(SHELL)).put(req, res.clone());
      return res;
    })());
  }
});
