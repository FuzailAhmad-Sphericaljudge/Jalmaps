import { useState, useEffect } from "react";

// Singleton interval logic
const listeners = new Set<() => void>();
let timerId: NodeJS.Timeout | null = null;

function tick() {
  listeners.forEach((listener) => listener());
}

export function useSharedClock(updateIntervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const listener = () => setNow(Date.now());
    listeners.add(listener);

    if (!timerId) {
      timerId = setInterval(tick, updateIntervalMs);
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };
  }, [updateIntervalMs]);

  return now;
}
