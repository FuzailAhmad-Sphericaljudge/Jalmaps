import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // We'll prompt the user to reload
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-actions") {
    // We ideally call triggerSync here if we had access to fetch.
    // Instead, we just ping an endpoint or we let the client handle it upon receiving an online event.
    // The client's triggerSync does the actual work. Here we could invoke it.
    event.waitUntil(
      fetch("/api/internal/offline/sync/run", { method: "POST" }).catch(() =>
        Promise.reject("Offline"),
      ),
    );
  }
});

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "JalMaps", {
        body: data.body,
        icon: "/icon-192.svg",
        data: data.url,
        actions: [
          { action: "open", title: "Open" },
          { action: "acknowledge", title: "Acknowledge" },
        ],
      }),
    );
  } catch (err) {
    console.error("Push event error:", err);
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === "acknowledge") {
    // Just a placeholder for acknowledging via push
    event.waitUntil(
      fetch("/api/internal/offline/sync", {
        method: "POST",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          type: "acknowledge_alert",
          payload: { url: event.notification.data },
          createdAt: Date.now(),
        }),
      }),
    );
    return;
  }

  // Default behavior (action === 'open' or clicked main body)
  if (event.notification.data) {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data);
        }
      }),
    );
  }
});

// Let user control skipWaiting via message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
