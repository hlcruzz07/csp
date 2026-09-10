self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'Notification', {
            body: data.body || '',
            icon: data.icon || '/logo.webp',
            data: data.data || {},
        }),
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
});
