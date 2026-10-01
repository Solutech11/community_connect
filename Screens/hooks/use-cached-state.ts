import { useCallback, useSyncExternalStore, type SetStateAction } from "react";
import {
  getCacheSessionGeneration,
  type SessionCache,
} from "../services/cache/session-cache";

// Cache is the state source so socket events and successful edits survive remounts.
export function useCachedState<T>(
  cache: SessionCache<T>,
  accountId: string | undefined,
  key: string,
  fallback: T,
) {
  const generation = getCacheSessionGeneration();
  const snapshot = useCallback(
    () => (accountId ? cache.read(accountId, key) : undefined),
    [cache, accountId, key],
  );
  const data = useSyncExternalStore(cache.subscribe, snapshot, snapshot);
  const setData = useCallback(
    (next: SetStateAction<T>) => {
      if (!accountId || generation !== getCacheSessionGeneration()) return;
      const current = cache.read(accountId, key) ?? fallback;
      const value =
        typeof next === "function" ? (next as (value: T) => T)(current) : next;
      cache.write(accountId, key, value);
    },
    [cache, accountId, key, fallback, generation],
  );
  return [data ?? fallback, setData, data !== undefined] as const;
}
