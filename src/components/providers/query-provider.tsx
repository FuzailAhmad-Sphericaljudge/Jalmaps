"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";
import { useState, useEffect } from "react";
import type { Persister } from "@tanstack/react-query-persist-client";
import { createBrowserSupabaseClient } from "@/lib/db/client";

function createIDBPersister(userId: string): Persister {
  const key = `queryCache-${userId}`;
  return {
    persistClient: async (client) => {
      await set(key, client);
    },
    restoreClient: async () => {
      return await get(key);
    },
    removeClient: async () => {
      await del(key);
    },
  };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1, // Only retry once offline
          },
        },
      }),
  );

  const [persister, setPersister] = useState<Persister | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        setPersister(createIDBPersister(session.user.id));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        setPersister(createIDBPersister(session.user.id));
      } else if (event === "SIGNED_OUT") {
        // Clear query cache on sign out
        queryClient.clear();
        setPersister(null);
        // Assuming the active persister key was derived from the old user
        // we should ideally clear all user keys, but relying on session clear here
        // The wipe is explicitly required:
        indexedDB.databases().then((dbs) => {
          for (const db of dbs) {
            if (db.name === "keyval-store") {
              indexedDB.deleteDatabase("keyval-store");
            }
          }
        });
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [queryClient]);

  if (!persister) {
    return <>{children}</>;
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  );
}
