/**
 * DataProvider hydrates the persistence engine and exposes a version counter
 * so components can subscribe to data mutations declaratively.
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { persistence } from "@/lib/db/persistence";

interface DataContextValue {
  ready: boolean;
  version: number;
  reset: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(persistence.isReady());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    persistence.hydrate();
    setReady(true);
    const unsubscribe = persistence.subscribe(() => setVersion((v) => v + 1));
    return unsubscribe;
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      version,
      reset: () => {
        persistence.resetToSeed();
        setVersion((v) => v + 1);
      },
      clearAllData: () => {
        persistence.clearAllData();
        setVersion((v) => v + 1);
      },
    }),
    [ready, version],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataContext must be used inside a DataProvider.");
  return ctx;
}

/**
 * Re-runs `selector` whenever the persistence layer notifies a change.
 * The selector should be a synchronous, side-effect-free function that pulls
 * data through the service layer.
 */
export function useStore<T>(selector: () => T): T {
  const { version, ready } = useDataContext();
  return useMemo(() => (ready ? selector() : selector()), [version, ready, selector]);
}
