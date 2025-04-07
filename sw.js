importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');

if (workbox) {
    workbox.routing.registerRoute(
        new RegExp('\/css|\/js\/'),
        workbox.strategies.cacheFirst({
            cacheName: 'lautometer_cache'
        })
    )
}