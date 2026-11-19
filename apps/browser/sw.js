const CACHE_NAME = "voidbrowser-shell-v1";
const APP_SHELL = [
  "./", "./index.html", "./style.css", "./spatial-audio.css",
  "./core/search.js", "./core/engine.js",
  "./features/weather.js", "./features/youtube.js",
  "./features/spatial-audio.js", "./features/calculator.js",
  "./app.js", "./manifest.json", "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll(APP_SHELL))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith("voidbrowser-shell-") && key !== CACHE_NAME)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      if (request.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
      throw error;
    }
  })());
});
