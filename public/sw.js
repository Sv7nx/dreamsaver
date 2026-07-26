// Слушаем push-уведомления
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Проверь свой дневной лимит!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'daily-limit',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(data.title || 'DreamSaver', options));
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});