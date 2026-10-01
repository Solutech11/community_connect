// Account-scoped, in-memory screen data. Nothing is written to device storage.
let sessionGeneration = 0;
const caches = new Set<{ clear: () => void }>();

type Entry<T> = {
  data?: T;
  pending?: Promise<T>;
  controller?: AbortController;
};

export function clearSessionCaches() {
  sessionGeneration += 1;
  caches.forEach((cache) => cache.clear());
}

export function getCacheSessionGeneration() {
  return sessionGeneration;
}

export class SessionCache<T> {
  private entries = new Map<string, Entry<T>>();
  private listeners = new Set<() => void>();

  constructor(private readonly maxEntries = 30) {
    caches.add(this);
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
    this.emit();
  }

  clear = () => {
    this.entries.forEach((entry) => entry.controller?.abort());
    this.entries.clear();
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
