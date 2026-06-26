// Service worker for Web Push. The page registers this at /sw.js and the
// browser delivers `push` events with the JSON payload posted from
// `lib/push.sendPushTo`.

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: "WhatsApp", body: event.data?.text() ?? "" };
  }
  const title = data.title ?? "WhatsApp";
  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon.png",
    badge: data.badge ?? "/icon.png",
    data: { url: data.url ?? "/" },
    tag: data.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const c of clients) {
        if (c.url === url) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
