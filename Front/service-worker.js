// No-op service worker used to unregister any old SW and avoid stale caches during development.
// It immediately unregisters itself and clears known caches.

self.addEventListener('install', (event) => {
  // Skip waiting so activate runs immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((c) => caches.delete(c)));
      // Unregister this service worker
      const registration = await self.registration.unregister();
      // Claim clients to ensure pages are controlled by no SW
      await self.clients.claim();
    })()
  );
});

// Passthrough fetch
self.addEventListener('fetch', (event) => {
  // Just fetch from network
});
