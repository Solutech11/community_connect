import { useMemo, type Dispatch } from "react";
import { useCachedState } from "./use-cached-state";
import type { SetStateAction } from "react";
import type { SessionCache } from "../services/cache/session-cache";

type FieldSetters<T> = { [K in keyof T]: Dispatch<SetStateAction<T[K]>> };

// Keep related paginated screen fields together in a single cached snapshot.
export function useCachedObjectState<T extends object>(
  cache: SessionCache<T>,
  accountId: string | undefined,
  key: string,
  fallback: T,
) {
  const [data, setData, hasCachedData] = useCachedState(
    cache,
    accountId,
    key,
    fallback,
  );
  const setters = useMemo(() => {
    const fields = {} as FieldSetters<T>;
    for (const field of Object.keys(fallback) as Array<keyof T>) {
      fields[field] = (next) =>
        setData((current) => ({
          ...current,
          [field]:
            typeof next === "function"
              ? (next as (value: T[typeof field]) => T[typeof field])(
                  current[field],
                )
              : next,
        }));
    }
    return fields;
  }, [fallback, setData]);
  return [data, setters, hasCachedData] as const;
}
