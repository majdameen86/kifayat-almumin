/* ═══════════════════════════════════════════════════════════════
   كفاية المؤمن - Service Worker (PWA Support)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'kifayat-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('Some assets failed to cache:', err);
      });
    })
  );
  
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// معالجة الطلبات
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تخطي الطلبات غير HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // استراتيجية Cache First للأصول الثابتة
  if (request.method === 'GET' && 
      (request.url.includes('.css') || 
       request.url.includes('.js') || 
       request.url.includes('.woff') ||
       request.url.includes('.png') ||
       request.url.includes('.jpg'))) {
    
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          // لا نخزن الاستجابات غير الناجحة
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // نسخ الاستجابة
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          // إذا فشل الطلب، حاول الحصول على نسخة مخزنة
          return caches.match(request);
        });
      })
    );
    return;
  }

  // استراتيجية Network First للطلبات الديناميكية
  event.respondWith(
    fetch(request)
      .then((response) => {
        // لا نخزن الاستجابات غير الناجحة
        if (!response || response.status !== 200) {
          return response;
        }

        // نسخ الاستجابة
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // إذا فشل الطلب، حاول الحصول على نسخة مخزنة
        return caches.match(request).then((response) => {
          return response || new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

// معالجة الرسائل من العميل
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// معالجة الإشعارات
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('كفاية المؤمن', options)
  );
});

// معالجة نقرات الإشعارات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // ابحث عن نافذة مفتوحة بالفعل
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا لم توجد نافذة، افتح واحدة جديدة
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// معالجة إغلاق الإشعارات
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// معالجة المزامنة في الخلفية
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  try {
    // هنا يمكن إضافة منطق المزامنة
    console.log('Syncing analytics...');
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// معالجة الأخطاء
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection in Service Worker:', event.reason);
});
