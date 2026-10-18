import { createBrowserSupabaseClient } from "@/lib/db/client";
import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export type RealtimeReading = {
  node_id: string;
  well_id: string;
  recorded_at: string;
  depth_to_water_m: number | null;
  column_m: number | null;
  quality: string;
  battery_v: number | null;
};

export type ConnectionState = "connecting" | "live" | "reconnecting" | "offline";

export type SubscribeCallback = (payload: RealtimeReading) => void;
export type StateCallback = (state: ConnectionState) => void;

const MAX_WELLS = 20;
const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

export class RealtimeManager {
  private static instance: RealtimeManager;
  private supabase: SupabaseClient<Database>;
  private channels = new Map<string, RealtimeChannel>();

  private readingCallbacks = new Map<string, Set<SubscribeCallback>>();
  private stateCallbacks = new Map<string, Set<StateCallback>>();
  private connectionStates = new Map<string, ConnectionState>();

  private activeWells: string[] = [];
  private retryTimers = new Map<string, NodeJS.Timeout>();
  private retryAttempts = new Map<string, number>();

  private constructor() {
    this.supabase = createBrowserSupabaseClient();

    // Re-authenticate when token refreshes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        this.supabase.realtime.setAuth(session.access_token);
      }
    });

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", this.handleVisibilityChange);
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      // Pause realtime when hidden
      this.channels.forEach((channel) => channel.unsubscribe());
    } else {
      // Resume and trigger reconnect logic
      this.channels.forEach((_, wellId) => {
        this.connectChannel(wellId);
      });
      // (The hook handles refetching the latest data on visibility change via React Query window focus)
    }
  };

  private handleOnline = () => {
    // Immediate retry on reconnect
    this.channels.forEach((_, wellId) => {
      this.connectChannel(wellId);
    });
  };

  private handleOffline = () => {
    this.channels.forEach((_, wellId) => {
      this.updateState(wellId, "offline");
    });
  };

  private updateState(wellId: string, state: ConnectionState) {
    this.connectionStates.set(wellId, state);
    const callbacks = this.stateCallbacks.get(wellId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(state));
    }
  }

  private calculateBackoff(wellId: string): number {
    const attempts = this.retryAttempts.get(wellId) || 0;
    const baseDelay = INITIAL_RETRY_MS * Math.pow(2, attempts);
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay + jitter, MAX_RETRY_MS);
  }

  private connectChannel(wellId: string) {
    // Clean up existing timer and channel if any
    if (this.retryTimers.has(wellId)) {
      clearTimeout(this.retryTimers.get(wellId));
      this.retryTimers.delete(wellId);
    }
    if (this.channels.has(wellId)) {
      this.channels.get(wellId)?.unsubscribe();
    }

    if (!navigator.onLine) {
      this.updateState(wellId, "offline");
      return;
    }

    this.updateState(wellId, "connecting");

    const channel = this.supabase.channel(`well:${wellId}`);
    this.channels.set(wellId, channel);

    channel
      .on("broadcast", { event: "reading" }, (payload) => {
        const data = payload.payload as RealtimeReading;
        const cbs = this.readingCallbacks.get(wellId);
        if (cbs) {
          cbs.forEach((cb) => cb(data));
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.updateState(wellId, "live");
          this.retryAttempts.set(wellId, 0); // reset attempts on success
        } else if (status === "CLOSED") {
          // Intentionally closed
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          this.updateState(wellId, "reconnecting");
          const attempts = this.retryAttempts.get(wellId) || 0;
          this.retryAttempts.set(wellId, attempts + 1);

          const delay = this.calculateBackoff(wellId);
          const timer = setTimeout(() => {
            this.connectChannel(wellId);
          }, delay);
          this.retryTimers.set(wellId, timer);
        }
      });
  }

  public subscribe(
    wellId: string,
    onReading: SubscribeCallback,
    onStateChange: StateCallback,
  ): () => void {
    if (!this.readingCallbacks.has(wellId)) {
      this.readingCallbacks.set(wellId, new Set());
      this.stateCallbacks.set(wellId, new Set());

      this.activeWells.push(wellId);
      if (this.activeWells.length > MAX_WELLS) {
        const oldestWell = this.activeWells.shift();
        if (oldestWell) {
          this.fullUnsubscribe(oldestWell);
        }
      }

      this.connectChannel(wellId);
    }

    this.readingCallbacks.get(wellId)!.add(onReading);
    this.stateCallbacks.get(wellId)!.add(onStateChange);

    // Initial state push
    const currentState = this.connectionStates.get(wellId) || "connecting";
    onStateChange(currentState);

    return () => {
      this.readingCallbacks.get(wellId)?.delete(onReading);
      this.stateCallbacks.get(wellId)?.delete(onStateChange);

      if (this.readingCallbacks.get(wellId)?.size === 0) {
        this.fullUnsubscribe(wellId);
      }
    };
  }

  private fullUnsubscribe(wellId: string) {
    this.readingCallbacks.delete(wellId);
    this.stateCallbacks.delete(wellId);
    this.connectionStates.delete(wellId);
    this.retryAttempts.delete(wellId);
    if (this.retryTimers.has(wellId)) {
      clearTimeout(this.retryTimers.get(wellId));
      this.retryTimers.delete(wellId);
    }
    const channel = this.channels.get(wellId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(wellId);
    }
    this.activeWells = this.activeWells.filter((w) => w !== wellId);
  }
}
