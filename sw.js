const CACHE_NAME = 'app-cache-v1';
const ASSETS = [
    '/',
    'index.html',
    'script.js',
    'styles.css',
    'icons/pause.svg',
    'icons/restart.svg',
    'icons/start.svg',
    'PWA/offline.html',
    'PWA/offline-icon.svg',
    'PWA/microphone.svg',
    'PWA/microphone-512.png',
    'PWA/microphone-256.png',
    'PWA/microphone-128.png',
    'PWA/microphone-64.png',
];

// Service Worker installieren und statische Assets cachen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Aktivierung: Alte Caches bereinigen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch-Handler für Offline-Funktionalität mit Cookies
self.addEventListener('fetch', event => {
    // Stelle sicher, dass API-Anfragen und solche mit Cookies direkt zum Server gehen
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                if (fetchResponse.ok && event.request.method === 'GET') {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            if (event.request.destination === 'image') {
                return caches.match('icons/offline-icon.svg');
            } else {
                return caches.match('PWA/offline.html');
            }
        })
    );
});