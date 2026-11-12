const V = 'rz-tracker-v2.1.3';
const B = '/tracker';
const SHELL = [B, B + '/index.html', B + '/styles.css', B + '/js/app.js', B + '/js/engine.js', B + '/js/parser.js', B + '/js/charts.js', B + '/js/flex.js', B + '/js/deep.js', B + '/manifest.webmanifest', B + '/icons/icon-192.png', B + '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('rz-tracker') && k !== V && k !== V + '-api').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (!u.pathname.startsWith(B) && !u.pathname.startsWith('/api/tracker/')) return;
  if (u.pathname.startsWith('/api/tracker/') || u.pathname.startsWith(B + '/data/')) {
    // network first; fall back to last good response so the app opens offline
    e.respondWith(
      fetch(e.request).then((r) => {
        if (r.ok && u.searchParams.get('fn') !== 'game' && !u.pathname.startsWith(B + '/data/')) { const cp = r.clone(); caches.open(V + '-api').then((c) => c.put(e.request, cp)); }
        return r;
      }).catch(() => caches.match(e.request).then((m) => m || new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }
  // shell: network-first so every visit gets the latest app; cache is only the offline fallback
  e.respondWith(
    caches.open(V).then(async (c) => {
      try {
        const r = await Promise.race([fetch(e.request, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
        if (r.ok) c.put(e.request, r.clone());
        return r;
      } catch {
        return (await c.match(e.request, { ignoreSearch: true })) || (e.request.mode === 'navigate' ? await c.match(B) : Response.error());
      }
    })
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => { const c = cs[0]; if (c) { c.focus(); c.navigate(B + '#/live'); } else self.clients.openWindow(B + '#/live'); }));
});
