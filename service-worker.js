"use strict";

const CACHE_NAME = "hedef-yks-shell-v1";
const APP_SHELL_URLS = [
  "index.html",
  "style.css",
  "script.js",
  "manifest.webmanifest",
  "icon.svg"
].map((path) => new URL(path, self.registration.scope).href);
const APP_ENTRY_URL = new URL("index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("hedef-yks-shell-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(APP_ENTRY_URL, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(APP_ENTRY_URL);
          return cachedPage || Response.error();
        })
    );
    return;
  }

  if (!APP_SHELL_URLS.includes(requestUrl.href)) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cachedAsset = await caches.match(request);
        return cachedAsset || Response.error();
      })
  );
});
