const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function importTs(file, resolve = require) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext("(function(module,exports,require){" + code + "\n})")(
    module,
    module.exports,
    resolve,
  );
  return module.exports;
}
const { SessionCache, clearSessionCaches } = importTs(
  "Screens/services/cache/session-cache.ts",
);
const { mergeRefreshedMessages } = importTs(
  "Screens/hooks/merge-cached-messages.ts",
);
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

test("accounts and search filters never share cached values", () => {
  const cache = new SessionCache();
  cache.write("account-a", "all", [1]);
  cache.write("account-a", "filtered", [2]);
  assert.equal(cache.read("account-b", "all"), undefined);
  assert.deepEqual(cache.read("account-a", "filtered"), [2]);
});
test("empty successful results are cached and survive failed refresh", async () => {
  const cache = new SessionCache();
  await cache.request("a", "chat", async () => []);
  await assert.rejects(
    cache.request("a", "chat", async () => {
      throw new Error("offline");
    }),
  );
  assert.deepEqual(cache.read("a", "chat"), []);
});
test("overlapping background requests share one network operation", async () => {
  const cache = new SessionCache();
  const gate = deferred();
  let calls = 0;
  const loader = async () => {
    calls++;
    return gate.promise;
  };
  const first = cache.request("a", "chat", loader),
    second = cache.request("a", "chat", loader);
  assert.equal(first, second);
  gate.resolve([1]);
  await first;
  assert.equal(calls, 1);
});
test("logout aborts requests and late responses cannot recreate private data", async () => {
  const cache = new SessionCache();
  const gate = deferred();
  let signal;
  const pending = cache.request("a", "chat", async (s) => {
    signal = s;
    return gate.promise;
  });
  const rejection = assert.rejects(pending);
  await Promise.resolve();
  clearSessionCaches();
  assert.equal(signal.aborted, true);
  gate.resolve([1]);
  await rejection;
  assert.equal(cache.read("a", "chat"), undefined);
});
test("invalidated requests cannot overwrite a replacement resource", async () => {
  const cache = new SessionCache();
  const gate = deferred();
  const old = cache.request("a", "room", () => gate.promise);
  const rejection = assert.rejects(old);
  cache.invalidate("a", "room");
  await cache.request("a", "room", async () => ["new"]);
  gate.resolve(["old"]);
  await rejection;
  assert.deepEqual(cache.read("a", "room"), ["new"]);
});
test("bounded cache evicts older entries and notifies mounted readers", () => {
  const cache = new SessionCache(2);
  let changes = 0;
  const stop = cache.subscribe(() => changes++);
  cache.write("a", "one", 1);
  cache.write("a", "two", 2);
  cache.write("a", "three", 3);
  assert.equal(cache.read("a", "one"), undefined);
  assert.equal(changes, 3);
  stop();
});
const message = (id, day, text = id) => ({
  _id: id,
  createdAt: `2026-10-${day}T12:00:00Z`,
  text,
});
test("room refresh preserves older pages and live arrivals without duplicating IDs", () => {
  const older = message("older", "01"),
    current = message("recent", "02"),
    live = message("live", "03");
  const merged = mergeRefreshedMessages(
    [older, current, live],
    [{ ...current, text: "fresh" }],
    [older, current],
  );
  assert.deepEqual(
    merged.map((m) => m._id),
    ["older", "recent", "live"],
  );
  assert.equal(merged[1].text, "fresh");
});
test("late history cannot resurrect socket deletions or overwrite socket edits", () => {
  const old = message("edit", "02"),
    deleted = message("delete", "02");
  const edited = { ...old, text: "edited live" };
  const merged = mergeRefreshedMessages(
    [edited],
    [old, deleted],
    [old, deleted],
  );
  assert.deepEqual(merged, [edited]);
});
test("authoritative empty history clears stale messages but keeps new live messages", () => {
  const old = message("old", "01"),
    live = message("live", "02");
  assert.deepEqual(mergeRefreshedMessages([old, live], [], [old]), [live]);
});

function persistentEngine(driver, namespace = "chat-list", maxEntries = 3) {
  // A fresh module models a real JS runtime restart, rather than navigation.
  const engine = importTs("Screens/services/cache/session-cache.ts");
  engine.configureSessionCacheStorage(driver);
  return { ...engine, cache: new engine.SessionCache(maxEntries, namespace) };
}
function memoryDisk() {
  const rows = new Map();
  return {
    rows,
    getItem: async (key) => rows.get(key) ?? null,
    setItem: async (key, value) => {
      rows.set(key, value);
    },
    removeItem: async (key) => {
      rows.delete(key);
    },
  };
}
test("full runtime restart restores conversations and empty history before rendering", async () => {
  const disk = memoryDisk();
  const first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "list", [{ _id: "conversation" }]);
  first.cache.write("a", "empty-thread", []);
  await first.flushSessionCacheStorage();
  const restarted = persistentEngine(disk);
  assert.equal(restarted.cache.read("a", "list"), undefined);
  await restarted.restoreSessionCaches("a");
  assert.deepEqual(restarted.cache.read("a", "list"), [
    { _id: "conversation" },
  ]);
  assert.deepEqual(restarted.cache.read("a", "empty-thread"), []);
});
test("restored cache stays visible throughout a pending or failed background refresh", async () => {
  const disk = memoryDisk(),
    first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "thread", ["saved message"]);
  await first.flushSessionCacheStorage();
  const restarted = persistentEngine(disk),
    gate = deferred();
  await restarted.restoreSessionCaches("a");
  const pending = restarted.cache.request("a", "thread", () => gate.promise);
  assert.deepEqual(restarted.cache.read("a", "thread"), ["saved message"]);
  gate.resolve(["fresh message"]);
  await pending;
  await assert.rejects(
    restarted.cache.request("a", "thread", async () => {
      throw Error("offline");
    }),
  );
  assert.deepEqual(restarted.cache.read("a", "thread"), ["fresh message"]);
});
test("account switching discards another account's saved private data", async () => {
  const disk = memoryDisk(),
    first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "list", ["private"]);
  await first.flushSessionCacheStorage();
  const next = persistentEngine(disk);
  await next.restoreSessionCaches("b");
  assert.equal(next.cache.read("a", "list"), undefined);
  assert.equal(next.cache.read("b", "list"), undefined);
  assert.equal(disk.rows.size, 0);
});
test("logout deletion follows queued writes and cache cannot return on restart", async () => {
  const disk = memoryDisk(),
    gate = deferred();
  const originalWrite = disk.setItem;
  disk.setItem = async (...args) => {
    await gate.promise;
    await originalWrite(...args);
  };
  const first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "list", ["private"]);
  const cleared = first.clearSessionCaches();
  gate.resolve();
  await cleared;
  const restarted = persistentEngine(disk);
  await restarted.restoreSessionCaches("a");
  assert.equal(disk.rows.size, 0);
  assert.equal(restarted.cache.read("a", "list"), undefined);
});
test("logout during disk hydration cannot resurrect cached messages", async () => {
  const disk = memoryDisk(),
    first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "list", ["private"]);
  await first.flushSessionCacheStorage();
  const gate = deferred(),
    readStarted = deferred(),
    originalRead = disk.getItem;
  disk.getItem = async (key) => {
    const value = await originalRead(key);
    readStarted.resolve();
    await gate.promise;
    return value;
  };
  const next = persistentEngine(disk);
  const restoring = next.restoreSessionCaches("a");
  await readStarted.promise;
  const cleared = next.clearSessionCaches();
  gate.resolve();
  assert.equal(await restoring, false);
  await cleared;
  assert.equal(next.cache.read("a", "list"), undefined);
  assert.equal(disk.rows.size, 0);
});
test("corrupt or incompatible storage falls back without blocking authentication", async () => {
  for (const raw of [
    "invalid-json",
    JSON.stringify({ version: 0, accountId: "a", entries: [] }),
  ]) {
    const disk = memoryDisk();
    disk.rows.set("community-connect.screen-cache.v1.chat-list", raw);
    const engine = persistentEngine(disk);
    assert.equal(await engine.restoreSessionCaches("a"), true);
    assert.equal(engine.cache.read("a", "list"), undefined);
    assert.equal(disk.rows.size, 0);
  }
});
test("access denial invalidation is persisted across restart", async () => {
  const disk = memoryDisk(),
    first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "room", ["private"]);
  first.cache.invalidate("a", "room");
  await first.flushSessionCacheStorage();
  const restarted = persistentEngine(disk);
  await restarted.restoreSessionCaches("a");
  assert.equal(restarted.cache.read("a", "room"), undefined);
});
test("storage failure leaves live cache and authentication usable", async () => {
  const brokenDisk = {
    getItem: async () => {
      throw Error("unavailable");
    },
    setItem: async () => {
      throw Error("full");
    },
    removeItem: async () => {
      throw Error("unavailable");
    },
  };
  const engine = persistentEngine(brokenDisk);
  assert.equal(await engine.restoreSessionCaches("a"), true);
  engine.cache.write("a", "list", ["live"]);
  await engine.flushSessionCacheStorage();
  assert.deepEqual(engine.cache.read("a", "list"), ["live"]);
  await engine.clearSessionCaches();
});
test("disk snapshots stay bounded and prioritize recent complete resources", async () => {
  const disk = memoryDisk(),
    first = persistentEngine(disk);
  await first.restoreSessionCaches("a");
  first.cache.write("a", "older", ["x".repeat(130000)]);
  first.cache.write("a", "recent", ["y".repeat(130000)]);
  await first.flushSessionCacheStorage();
  const restarted = persistentEngine(disk);
  await restarted.restoreSessionCaches("a");
  assert.equal(restarted.cache.read("a", "older"), undefined);
  assert.equal(restarted.cache.read("a", "recent")[0].length, 130000);
});

test("all screen namespaces hydrate before deferred route modules mount", async () => {
  const disk = memoryDisk();
  function appCaches() {
    const engine = importTs("Screens/services/cache/session-cache.ts");
    engine.configureSessionCacheStorage(disk);
    const screens = importTs(
      "Screens/services/cache/screen-caches.ts",
      (name) => {
        assert.equal(name, "./session-cache");
        return engine;
      },
    );
    return { engine, screens };
  }
  const first = appCaches();
  await first.screens.restoreScreenCaches("a");
  first.screens.conversationsCache.write("a", "list", [
    { _id: "conversation" },
  ]);
  first.screens.messagesCache.write("a", "conversation", [{ _id: "message" }]);
  first.screens.communityListCache.write("a", "all", {
    items: [],
    page: 1,
    hasMore: false,
  });
  first.screens.roomCache.write("a", "room", {
    community: { _id: "room" },
    messages: [],
    olderCursor: null,
    hasOlderMessages: false,
  });
  first.screens.communityProfileCache.write("a", "room", {
    community: { _id: "room" },
    posts: [],
  });
  first.screens.myCommunitiesCache.write("a", "list", []);
  first.screens.categoryOptionsCache.write("a", "list", ["Sports"]);
  await first.engine.flushSessionCacheStorage();
  const restart = appCaches();
  await restart.screens.restoreScreenCaches("a");
  assert.equal(
    restart.screens.conversationsCache.read("a", "list")[0]._id,
    "conversation",
  );
  assert.equal(
    restart.screens.messagesCache.read("a", "conversation")[0]._id,
    "message",
  );
  assert.deepEqual(
    restart.screens.communityListCache.read("a", "all").items,
    [],
  );
  assert.equal(
    restart.screens.roomCache.read("a", "room").community._id,
    "room",
  );
  assert.equal(
    restart.screens.communityProfileCache.read("a", "room").community._id,
    "room",
  );
  assert.deepEqual(restart.screens.myCommunitiesCache.read("a", "list"), []);
  assert.deepEqual(restart.screens.categoryOptionsCache.read("a", "list"), [
    "Sports",
  ]);
});
