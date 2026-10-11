import { get, set } from "idb-keyval";

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
}

const QUEUE_KEY = "offline-actions-queue";

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const queue = await get<QueuedAction[]>(QUEUE_KEY);
  return queue || [];
}

export async function enqueueAction(type: string, payload: unknown): Promise<void> {
  const queue = await getQueuedActions();
  const action: QueuedAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: Date.now(),
  };
  queue.push(action);
  await set(QUEUE_KEY, queue);

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error - TS doesn't know about sync yet
      await registration.sync.register("sync-actions");
    } catch (err) {
      console.warn("Background sync could not be registered", err);
    }
  } else {
    // Attempt immediate sync if online
    if (navigator.onLine) {
      triggerSync();
    }
  }
}

export async function removeAction(id: string): Promise<void> {
  const queue = await getQueuedActions();
  const newQueue = queue.filter((a) => a.id !== id);
  await set(QUEUE_KEY, newQueue);
}

export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
}

export async function triggerSync(): Promise<void> {
  const actions = await getQueuedActions();
  if (actions.length === 0) return;
  if (!navigator.onLine) return;

  for (const action of actions) {
    try {
      // Replay action logic
      const response = await fetch("/api/internal/offline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });

      if (response.ok) {
        await removeAction(action.id);
      }
    } catch (err) {
      console.error("Failed to sync action", action, err);
      // Stop syncing if network is actually down
      break;
    }
  }
}
