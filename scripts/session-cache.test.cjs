const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function importTs(file) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext("(function(module,exports){" + code + "\n})")(
    module,
    module.exports,
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
