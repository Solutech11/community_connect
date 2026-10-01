// Account-scoped screen data, restored before authenticated screens mount.
export type CacheStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let storage: CacheStorage | undefined;
let storageQueue = Promise.resolve();
let activeAccount: string | null = null;
const storagePrefix = "community-connect.screen-cache.v1.";
// Keep each Android storage row comfortably below its native size limit.
const maxSnapshotCharacters = 200_000;

export function configureSessionCacheStorage(driver: CacheStorage) {
  storage = driver;
}

function enqueueStorage(operation: () => Promise<void>) {
  storageQueue = storageQueue.then(operation).catch(() => {
    // A full or unavailable disk must not interrupt the live app.
  });
  return storageQueue;
}

export function flushSessionCacheStorage() {
  return storageQueue;
}

export async function restoreSessionCaches(accountId: string) {
  sessionGeneration += 1;
  const generation = sessionGeneration;
  activeAccount = null;
  caches.forEach((cache) => cache.clear());
  // Logout deletions and earlier writes finish before any saved data is read.
  await storageQueue;
  if (generation !== sessionGeneration) return false;
  await Promise.all(
    Array.from(caches, (cache) => cache.restore(accountId, generation)),
  );
  if (generation !== sessionGeneration) return false;
  activeAccount = accountId;
  return true;
}

let sessionGeneration = 0;
const caches = new Set<{
  clear: () => void;
  restore: (accountId: string, generation: number) => Promise<void>;
  removeSaved: () => Promise<void>;
}>();

type Entry<T> = {
  data?: T;
  pending?: Promise<T>;
  controller?: AbortController;
};

export function clearSessionCaches() {
  sessionGeneration += 1;
  activeAccount = null;
  caches.forEach((cache) => cache.clear());
  return enqueueStorage(async () => {
    await Promise.all(Array.from(caches, (cache) => cache.removeSaved()));
  });
}

export function getCacheSessionGeneration() {
  return sessionGeneration;
}

export class SessionCache<T> {
  private entries = new Map<string, Entry<T>>();
  private listeners = new Set<() => void>();

  constructor(
    private readonly maxEntries = 30,
    private readonly namespace?: string,
  ) {
    caches.add(this);
  }

  private storageKey() {
    return this.namespace ? storagePrefix + this.namespace : null;
  }

  removeSaved = async () => {
    const key = this.storageKey();
    if (storage && key) await storage.removeItem(key);
  };

  restore = async (accountId: string, generation: number) => {
    const key = this.storageKey();
    if (!storage || !key) return;
    try {
      const raw = await storage.getItem(key);
      if (generation !== sessionGeneration || !raw) return;
      const saved: unknown = JSON.parse(raw);
      if (
        !saved ||
        typeof saved !== "object" ||
        !("version" in saved) ||
        saved.version !== 1 ||
        !("accountId" in saved) ||
        saved.accountId !== accountId ||
        !("entries" in saved) ||
        !Array.isArray(saved.entries)
      ) {
        await enqueueStorage(async () => {
          if (generation === sessionGeneration) await this.removeSaved();
        });
        return;
      }
      for (const item of saved.entries.slice(-this.maxEntries)) {
        if (
          !item ||
          typeof item !== "object" ||
          typeof item.resource !== "string" ||
          !Object.prototype.hasOwnProperty.call(item, "data")
        )
          continue;
        this.entries.set(this.key(accountId, item.resource), {
          data: item.data as T,
        });
      }
      this.emit();
    } catch {
      // Malformed cache or a storage failure falls back to the initial network load.
      if (generation === sessionGeneration) {
        await enqueueStorage(async () => {
          if (generation === sessionGeneration) await this.removeSaved();
        });
      }
    }
  };

  private persist() {
    const key = this.storageKey();
    const accountId = activeAccount;
    const driver = storage;
    if (!key || !accountId || !driver) return;
    try {
      const entries: { resource: string; data: T }[] = [];
      let characters = 0;
      // Store the newest complete resources first; never truncate a DTO.
      for (const [entryKey, entry] of Array.from(this.entries).reverse()) {
        const [owner, resource] = JSON.parse(entryKey) as [string, string];
        if (owner !== accountId || entry.data === undefined) continue;
        const item = { resource, data: entry.data };
        const size = JSON.stringify(item).length;
        if (characters + size > maxSnapshotCharacters) continue;
        characters += size;
        entries.unshift(item);
      }
      const serialized = JSON.stringify({ version: 1, accountId, entries });
      void enqueueStorage(() => driver.setItem(key, serialized));
    } catch {
      // Screen data remains usable even if an unexpected value cannot serialize.
    }
  }

  private key(accountId: string, resource: string) {
    return JSON.stringify([accountId, resource]);
  }

  read(accountId: string, resource: string): T | undefined {
    return this.entries.get(this.key(accountId, resource))?.data;
  }

  isPending(accountId: string, resource: string) {
    return Boolean(this.entries.get(this.key(accountId, resource))?.pending);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  write(accountId: string, resource: string, data: T) {
    const key = this.key(accountId, resource);
    const entry = this.entries.get(key) ?? {};
    entry.data = data;
    // Recently updated resources survive bounded cache eviction.
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.trim();
    this.persist();
    this.emit();
  }

  private trim() {
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= this.maxEntries) break;
      if (!entry.pending) this.entries.delete(key);
    }
  }

  invalidate(accountId: string, resource: string) {
    const key = this.key(accountId, resource);
    this.entries.get(key)?.controller?.abort();
    this.entries.delete(key);
    this.persist();
    this.emit();
  }

  clear = () => {
    this.entries.forEach((entry) => entry.controller?.abort());
    this.entries.clear();
    this.persist();
    this.emit();
  };

  request(
    accountId: string,
    resource: string,
    loader: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const key = this.key(accountId, resource);
    const existing = this.entries.get(key);
    if (existing?.pending) return existing.pending;
    const entry: Entry<T> = existing ?? {};
    const controller = new AbortController();
    const generation = sessionGeneration;
    entry.controller = controller;
    this.entries.set(key, entry);
    const pending = Promise.resolve()
      .then(() => loader(controller.signal))
      .then((data) => {
        if (
          controller.signal.aborted ||
          generation !== sessionGeneration ||
          this.entries.get(key) !== entry
        ) {
          throw new Error("Cached request cancelled");
        }
        this.write(accountId, resource, data);
        return data;
      })
      .finally(() => {
        if (entry.pending === pending) {
          entry.pending = undefined;
          entry.controller = undefined;
          this.trim();
        }
      });
    entry.pending = pending;
    return pending;
  }
}
