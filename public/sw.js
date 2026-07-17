const CACHE_NAME = 'axara-lms-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Disable service worker intercept and caching during local development to ensure hot-reload and script changes load instantly
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return;
  }

  // Only handle GET requests and exclude Supabase database API calls or external dynamic resources
  if (event.request.method !== 'GET' || 
      event.request.url.includes('supabase.co') || 
      event.request.destination === 'video' || 
      event.request.destination === 'audio' ||
      event.request.headers.has('range')) {
    return;
  }
  
  // Implement a Network-First strategy so that users always get the latest build from production
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache new static assets dynamically
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline support)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/index.html');
        });
      })
  );
});

// Handle background Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Axara LMS', body: 'Ada notifikasi baru untuk Anda.', type: 'sop' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Axara LMS', body: event.data.text(), type: 'sop' };
    }
  }

  // Map notification type to icon and destination page
  const typeMap = {
    'sop':         { icon: '/icon-sop.png',   page: 'sop' },
    'sertifikasi': { icon: '/icon-cert.png',  page: 'sertifikasi' },
    'remedial':    { icon: '/icon-warn.png',  page: 'sertifikasi' },
  };
  const pageOverride = data.page === 'sertifikasi' ? 'sertifikasi' : (data.page || 'sop');
  const mapped = typeMap[data.type] || typeMap[pageOverride] || typeMap['sop'];

  const options = {
    body: data.body || data.message || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    tag: data.type || 'general',       // group same-type notifs so they don't stack
    renotify: true,
    data: {
      url: self.location.origin + '/#' + mapped.page,
      type: data.type,
    }
  };

  // Badge update (Android Chrome supports this; iOS ignores it in background — known limitation)
  if ('setAppBadge' in self) {
    const badgeCount = data.unreadCount ? parseInt(data.unreadCount) : 1;
    self.navigator && self.navigator.setAppBadge && self.navigator.setAppBadge(badgeCount).catch(() => {});
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'myAxara LMS', options)
  );
});

// Handle clicking on background notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window tab open with the target URL or any app tab
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
          });
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
