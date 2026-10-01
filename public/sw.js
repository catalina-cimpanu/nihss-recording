// This worker only claims clients. Failed exam saves are retried from the
// in-page persist queue (sessionStorage + online event), not from here.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
