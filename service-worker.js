const CACHE_NAME = "void-big-shine-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./code_assistant.html",
  "./code_assistant.css",
  "./code_assistant.js",
  "./survey.html",
  "./survey.css",
  "./survey.js",
  "./style.css",
  "./script.js",
  "./worker.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./apps/sonora/",
  "./apps/sonora/index.html",
  "./apps/sonora/manifest.webmanifest",
  "./apps/sonora/css/sonora.css",
  "./apps/sonora/js/app.js",
  "./apps/sonora/js/audio-engine.js",
  "./apps/sonora/js/project-store.js",
  "./apps/sonora/assets/sonora-icon.svg"
];
const EXTERNAL_CACHE_HOSTS = new Set([
  "cdn.jsdelivr.net",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
]);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("void-big-shine-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (!EXTERNAL_CACHE_HOSTS.has(url.hostname)) return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && (response.type === "cors" || response.type === "basic")) {
        await cache.put(request, response.clone());
      }
      return response;
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await caches.match(request);
        if (cachedPage) return cachedPage;
        if (url.pathname.includes("/apps/sonora")) {
          return (await caches.match("./apps/sonora/index.html")) || Response.error();
        }
        if (url.pathname.endsWith("/survey.html")) {
          return (await caches.match("./survey.html")) || (await caches.match("./index.html")) || Response.error();
        }
        return (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
