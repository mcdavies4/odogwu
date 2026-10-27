// Odogwu service worker: makes the app installable and keeps the shell available
// on patchy venue networks. Payments and spraying always go to the network.
const CACHE = "odogwu-v3";
const NOTES = [50, 100, 200, 500, 1000].flatMap((v) => [`/notes/${v}-front.webp`, `/notes/${v}-back.webp`]);
const SHELL = ["/", "/offline.html", "/icon.svg", "/manifest.webmanifest", ...NOTES];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || /\.(svg|png|webp|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
      )
    );
  }
});
