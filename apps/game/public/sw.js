/* CW Pocket offline foundation. No account data or mutation queue. */
const CACHE = "cw-public-p25-2";
const MAX_ENTRIES = 96;
const ESSENTIAL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/pocket-icon.svg",
];
function allowed(url) {
  if (url.origin !== self.location.origin || url.search) return false;
  return (
    ESSENTIAL.includes(url.pathname) ||
    /^\/world-assets\/[a-z0-9/-]+\.[a-f0-9]{12}\.svg$/.test(url.pathname) ||
    /^\/api\/world\/(futa|oau|unilag)\/versions\/(1|2)$/.test(url.pathname) ||
    /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(js|css|woff2)$/.test(url.pathname)
  );
}
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ESSENTIAL)));
  // Activate on next navigation; never swap a running game to new code.
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("cw-public-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }
  if (!allowed(url)) return; // private APIs, guide, facts, latest pointers: always network.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (
        response.ok &&
        response.type !== "opaque" &&
        !response.headers.get("Cache-Control")?.includes("no-store") &&
        (ESSENTIAL.includes(url.pathname) ||
          response.headers.get("Cache-Control")?.includes("immutable"))
      ) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        const evictable = keys.filter(
          (k) => !ESSENTIAL.includes(new URL(k.url).pathname),
        );
        while (evictable.length > MAX_ENTRIES - ESSENTIAL.length)
          await cache.delete(evictable.shift());
      }
      return response;
    })(),
  );
});
