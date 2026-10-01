type CachedMessage = { _id: string; createdAt: string };

// Reconcile an authoritative history window without undoing socket changes that
// arrived while the request was pending. Older loaded pages stay visible.
export function mergeRefreshedMessages<T extends CachedMessage>(
  current: T[],
  refreshed: T[],
  atRequestStart: T[],
): T[] {
  const started = new Map(
    atRequestStart.map((message) => [message._id, message]),
  );
  const currentById = new Map(current.map((message) => [message._id, message]));
  const changed = new Map(
    current
      .filter((message) => started.get(message._id) !== message)
      .map((message) => [message._id, message]),
  );
  const oldest = refreshed.reduce<string | undefined>(
    (value, message) =>
      !value || message.createdAt < value ? message.createdAt : value,
    undefined,
  );
  const retained = current.filter(
    (message) =>
      changed.has(message._id) ||
      (oldest !== undefined && message.createdAt < oldest),
  );
  const incoming = refreshed.filter(
    (message) =>
      !changed.has(message._id) &&
      !(started.has(message._id) && !currentById.has(message._id)),
  );
  return [
    ...new Map(
      [...retained, ...incoming].map((message) => [message._id, message]),
    ).values(),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
