// EasyBuckets Live service worker: push notifications and the installable app. No offline caching of data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "EasyBuckets Live", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "EasyBuckets Live", {
    body: d.body || "", tag: d.tag, renotify: true, icon: "/live/icon-192.png", badge: "/live/icon-192.png",
    data: { url: d.url || "/live" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/live";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.includes("/live")) return w.focus();
    return self.clients.openWindow(url);
  }));
});
