const CACHE_NAME = "senior-planner-shell-__BUILD_TIMESTAMP__";
// Paths are relative to wherever the app is hosted (site root or a
// sub-folder like /Giuliana-Planner/).
const SCOPE = new URL(self.registration.scope);
const SHELL_URLS = [
  "./",
  "Giuliana-Planner.html",
  "icons/icon-192.png",
  "icons/icon-512.png",
].map((path) => new URL(path, SCOPE).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  // Activate immediately on first install. Updates wait until the user taps
  // the in-app refresh notice.
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("senior-planner-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  const url = new URL(request.url);
  if (!url.pathname.startsWith(SCOPE.pathname)) return;
  const path = url.pathname.slice(SCOPE.pathname.length);
  const isIcon = /^icons\/[^/]+$/.test(path);
  const isHashedExpoAsset =
    /^_expo\/static\/.+[.-][a-f0-9]{8,}\.[^/]+$/i.test(path);

  event.respondWith(
    (async () => {
      if (isIcon || isHashedExpoAsset) {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      }

      const isHtml =
        request.mode === "navigate" ||
        request.destination === "document" ||
        request.headers.get("accept")?.includes("text/html");

      if (isHtml) {
        try {
          const response = await fetch(request);
          if (
            response.ok &&
            response.type === "basic" &&
            response.headers.get("content-type")?.includes("text/html")
          ) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const shell = await caches.match(SCOPE.href);
          if (shell) return shell;
          throw new Error("No cached planner page is available offline.");
        }
      }

      // Keep all other resources network-only so fresh non-hashed files are
      // never hidden behind an old cache entry.
      return fetch(request);
    })(),
  );
});
