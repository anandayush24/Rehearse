/* Service worker: makes the app usable offline once it has been opened.
 *  - /_next/static/*  hashed build assets: cache first
 *  - /data/*          note content: serve the cached copy, refresh it in the background
 *  - pages            network first, fall back to the cache, then to the dashboard
 * Bump VERSION to drop every old cache. */
const VERSION = "v1";
const STATIC = `static-${VERSION}`;
const DATA = `data-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const KEEP = [STATIC, DATA, PAGES];
// Registration scope is the app root, e.g. https://host/Rehearse/ or https://host/
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(["/", "/practice/", "/saved/", "/stats/", "/settings/"].map((p) => BASE + p)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit ?? (await refresh) ?? Response.error();
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) ?? (await cache.match(BASE + "/")) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(BASE + "/_next/static/")) event.respondWith(cacheFirst(request, STATIC));
  else if (url.pathname.startsWith(BASE + "/data/")) event.respondWith(staleWhileRevalidate(request, DATA));
  else if (request.mode === "navigate") event.respondWith(networkFirstPage(request));
});
