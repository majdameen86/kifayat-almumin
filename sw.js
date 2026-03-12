/* ═══════════════════════════════════════════════════════════════
   كفاية المؤمن — sw.js  (Service Worker)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'kifayat-v3';
const STATIC_ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(async cache => {
    for (const url of STATIC_ASSETS) {
      try { await cache.add(url); } catch(err) { console.warn('SW: skip', url); }
    }
  }));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Skip all cross-origin requests — let the browser handle them directly
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/dashboard')) return;

  if (e.request.method === 'GET' && /\.(css|js|woff2?|png|jpg|jpeg|svg|ico|webp)(\?.*)?$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE_VERSION).then(cache => cache.put(e.request, c)); }
        return res;
      }).catch(() => caches.match(e.request).then(r => r ||
        new Response('', { status: 503, statusText: 'Service Unavailable' })
      ))
    ));
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() =>
      caches.match('/index.html').then(r => r ||
        new Response('<h1 style="font-family:sans-serif;text-align:center;padding:60px;direction:rtl">أنت غير متصل بالإنترنت</h1>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    ));
  }
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let p = { title: 'كفاية المؤمن', body: '', url: '/' };
  try { p = { ...p, ...e.data.json() }; } catch { p.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(p.title, {
    body: p.body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png',
    vibrate: [100,50,100], data: { url: p.url }, dir: 'rtl', lang: 'ar'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    const w = list.find(c => c.url === url);
    return w ? w.focus() : clients.openWindow(url);
  }));
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_CACHE') caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
});
