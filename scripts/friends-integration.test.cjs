const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const { randomUUID } = require("node:crypto");
const ts = require("typescript");

// Run the real TypeScript mapping, hook, domain services and HTTP client with
// synthetic responses. No accounts, friendships or notifications are created.
function loadTs(file, dependencies = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(
    source,
    {
      exports,
      module: { exports },
      require: (name) => {
        if (!(name in dependencies))
          throw new Error("Unexpected dependency: " + name);
        return dependencies[name];
      },
      AbortController,
      setTimeout,
      clearTimeout,
      Response,
      FormData,
      URL,
      ...globals,
    },
    { filename: file },
  );
  return exports;
}

const mapper = loadTs("Screens/services/api/friends.mapper.ts");
const self = "100000000000000000000001";
const peer = "200000000000000000000002";
const third = "300000000000000000000003";
const relationId = "400000000000000000000004";
const profile = (id = peer, name = "Ada") => ({
  _id: id,
  firstName: name,
  lastName: "Okafor",
  avatarUrl: "https://example.com/" + id + ".jpg",
  lga: "Ikeja",
  state: "Lagos",
  interests: ["Music", "Technology"],
});
const relationship = (extra = {}) => ({
  _id: relationId,
  requesterId: self,
  addresseeId: peer,
  requester: profile(self, "Chidi"),
  addressee: profile(),
  status: "accepted",
  ...extra,
});
const clone = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

class ApiError extends Error {
  constructor(input) {
    super(input.message);
    Object.assign(this, input);
  }
}

function harness(initial = {}) {
  const cells = [];
  let cursor = 0;
  let focusCallback;
  let focusCleanup;
  let effectCleanup;
  let didMount = false;
  let ownerId = self;
  const api = {
    list: async () => ({ data: { friendships: [relationship()] } }),
    requests: async () => ({ data: { requests: [] } }),
    suggestions: async () => ({ data: { users: [profile(third, "Ngozi")] } }),
    ...initial,
  };
  const chat = {
    createConversation: async () => ({
      data: {
        conversation: {
          _id: relationId,
          participantIds: [self, peer],
        },
      },
    }),
  };
  const react = {
    useState(value) {
      const index = cursor++;
      if (!cells[index])
        cells[index] = { value: typeof value === "function" ? value() : value };
      return [
        cells[index].value,
        (next) => {
          cells[index].value =
            typeof next === "function" ? next(cells[index].value) : next;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      if (!cells[index]) cells[index] = { value: { current: value } };
      return cells[index].value;
    },
    useCallback: (callback) => callback,
    useEffect(callback) {
      if (!didMount) effectCleanup = callback();
    },
  };
  const hook = loadTs("Screens/hooks/use-friends.ts", {
    react,
    "@react-navigation/native": {
      useFocusEffect: (callback) => {
        focusCallback = callback;
      },
    },
    "../services/api/chat.api": { chatApi: chat },
    "../services/api/client": { ApiError },
    "../services/api/friends.api": { friendsApi: api },
    "../services/api/friends.mapper": mapper,
    "../services/api/users.api": {
      usersApi: { report: async () => ({ success: true }) },
    },
  });
  const render = (id = ownerId) => {
    ownerId = id;
    cursor = 0;
    const value = hook.useFriends(id);
    didMount = true;
    return value;
  };
  render();
  focusCleanup = focusCallback();
  return {
    api,
    chat,
    render,
    ready: async () => {
      await tick();
      return render();
    },
    blur: () => focusCleanup(),
    focus: () => {
      focusCleanup = focusCallback();
    },
    unmount: () => {
      focusCleanup();
      effectCleanup();
    },
  };
}

test("maps the other user's name and photo in either friendship direction", () => {
  const outgoing = mapper.mapFriendConnection(relationship(), self);
  const incoming = mapper.mapFriendConnection(
    relationship({
      requesterId: peer,
      addresseeId: self,
      requester: profile(),
      addressee: profile(self, "Chidi"),
    }),
    self,
  );
  assert.equal(outgoing.person.userId, peer);
  assert.equal(incoming.person.userId, peer);
  assert.equal(outgoing.person.name, "Ada Okafor");
  assert.equal(incoming.person.avatarUrl, profile().avatarUrl);
  assert.equal(outgoing.relationshipId, relationId);
  assert.equal(incoming.incoming, true);
});

test("rejects unrelated relationships, self friendships and swapped profile IDs", () => {
  assert.equal(mapper.mapFriendConnection(relationship(), third), null);
  assert.equal(
    mapper.mapFriendConnection(relationship({ addresseeId: self }), self),
    null,
  );
  assert.equal(
    mapper.mapFriendConnection(
      relationship({ addressee: profile(third) }),
      self,
    ),
    null,
  );
  assert.equal(
    mapper.mapFriendConnection(relationship({ addressee: null }), self),
    null,
  );
});

test("missing photos never become stock portraits; missing names never expose IDs", () => {
  const person = mapper.mapFriendPerson({
    _id: peer,
    firstName: "",
    lastName: "",
    avatarUrl: undefined,
    state: undefined,
    lga: undefined,
    interests: undefined,
  });
  assert.equal(person.name, "Community member");
  assert.equal(person.avatarUrl, "");
  assert.deepEqual(clone(person.interests), []);
  assert.equal(
    mapper.mapFriendPerson({ ...profile(), avatarUrl: "javascript:bad" })
      .avatarUrl,
    "",
  );
  assert.equal(mapper.mapFriendPerson({ ...profile(), _id: "invalid" }), null);
});

test("search matches names, locations and interests without searching raw IDs", () => {
  const person = mapper.mapFriendPerson(profile());
  for (const query of [" ADA ", "okafor", "ikeja", "LAGOS", "technology"]) {
    assert.equal(mapper.matchesFriendSearch(person, query), true);
  }
  assert.equal(mapper.matchesFriendSearch(person, peer), false);
});

test("endpoint failure preserves other sections and incoming requests use requester profiles", async () => {
  const h = harness({
    requests: async () => ({
      data: {
        requests: [
          relationship({
            requesterId: third,
            addresseeId: self,
            requester: profile(third, "Ngozi"),
            addressee: profile(self),
            status: "pending",
          }),
        ],
      },
    }),
    suggestions: async () => {
      throw new ApiError({ message: "Offline", code: "NETWORK_ERROR" });
    },
  });
  const result = await h.ready();
  assert.equal(result.friends[0].person.userId, peer);
  assert.equal(result.requests[0].person.name, "Ngozi Okafor");
  assert.equal(result.errors.Discover, "Offline");
  assert.equal(result.errors.Friends, null);
  h.unmount();
});

test("discovery excludes self, existing connections, incoming requests and duplicates", async () => {
  const h = harness({
    suggestions: async () => ({
      data: {
        users: [profile(self), profile(peer), profile(third), profile(third)],
      },
    }),
  });
  const result = await h.ready();
  assert.deepEqual(clone(result.discover.map((person) => person.userId)), [
    third,
  ]);
  h.unmount();
});

test("obsolete refreshes and blurred screens cannot replace current data", async () => {
  const h = harness();
  await h.ready();
  const old = deferred();
  let oldSignal;
  h.api.list = (_query, signal) => {
    oldSignal = signal;
    return old.promise;
  };
  const firstLoad = h.render().refresh();
  h.api.list = async () => ({
    data: {
      friendships: [
        relationship({ addresseeId: third, addressee: profile(third) }),
      ],
    },
  });
  await h.render().refresh();
  old.resolve({ data: { friendships: [relationship()] } });
  await firstLoad;
  assert.equal(oldSignal.aborted, true);
  assert.equal(h.render().friends[0].person.userId, third);

  const last = deferred();
  h.api.list = () => last.promise;
  const lastLoad = h.render().refresh();
  h.blur();
  last.resolve({ data: { friendships: [] } });
  await lastLoad;
  assert.equal(h.render().friends.length, 1);
  h.unmount();
});

test("rapid request taps produce one write; failed writes preserve suggestions", async () => {
  const h = harness();
  const initial = await h.ready();
  const pending = deferred();
  let count = 0;
  h.api.sendRequest = (id) => {
    assert.equal(id, third);
    count += 1;
    return pending.promise;
  };
  const first = initial.sendRequest(initial.discover[0]);
  await h.render().sendRequest(initial.discover[0]);
  assert.equal(count, 1);
  pending.reject(
    new ApiError({ message: "Network unavailable", code: "NETWORK_ERROR" }),
  );
  await first;
  assert.equal(h.render().discover.length, 1);
  assert.equal(h.render().pendingId, null);
  assert.equal(h.render().notice.message, "Network unavailable");
  h.unmount();
});

test("confirmed accept remains visible when the subsequent refresh fails", async () => {
  const incoming = relationship({
    requesterId: third,
    addresseeId: self,
    requester: profile(third),
    addressee: profile(self),
    status: "pending",
  });
  const h = harness({
    requests: async () => ({ data: { requests: [incoming] } }),
  });
  const initial = await h.ready();
  h.api.respondToRequest = async (id, body) => {
    assert.equal(id, relationId);
    assert.equal(body.action, "accept");
    return { data: { friendship: { ...incoming, status: "accepted" } } };
  };
  h.api.list =
    h.api.requests =
    h.api.suggestions =
      async () => {
        throw new Error("Offline");
      };
  await initial.respond(initial.requests[0], "accept");
  assert.equal(h.render().requests.length, 0);
  assert.equal(h.render().friends[0].person.userId, third);
  h.unmount();
});

test("a confirmed outgoing request disappears from suggestions even if refresh is offline", async () => {
  const h = harness();
  const initial = await h.ready();
  h.api.sendRequest = async (id) => ({
    data: {
      friendship: relationship({
        addresseeId: id,
        addressee: profile(id),
        status: "pending",
      }),
    },
  });
  h.api.list =
    h.api.requests =
    h.api.suggestions =
      async () => {
        throw new Error("Offline");
      };
  await initial.sendRequest(initial.discover[0]);
  assert.equal(h.render().discover.length, 0);
  assert.equal(h.render().requests.length, 0);
  assert.equal(h.render().notice.message, "Your friend request has been sent.");
  h.unmount();
});

test("mismatched member profiles are withheld with an explicit retry state", async () => {
  const h = harness({
    list: async () => ({
      data: { friendships: [relationship({ addressee: profile(third) })] },
    }),
  });
  const result = await h.ready();
  assert.equal(result.friends.length, 0);
  assert.match(result.errors.Friends, /profiles are unavailable/);
  h.unmount();
});

test("remove uses relationship ID and chat uses the peer user ID", async () => {
  const h = harness();
  const initial = await h.ready();
  h.chat.createConversation = async (body) => {
    assert.deepEqual(clone(body), { type: "direct", participantIds: [peer] });
    return {
      data: { conversation: { _id: third, participantIds: [self, peer] } },
    };
  };
  const conversation = await initial.startChat(initial.friends[0].person);
  assert.equal(conversation._id, third);
  h.api.remove = async (id) => {
    assert.equal(id, relationId);
    return { success: true };
  };
  h.api.list = async () => ({ data: { friendships: [] } });
  await h.render().remove(initial.friends[0]);
  assert.equal(h.render().friends.length, 0);
  h.unmount();
});

test("wrong conversation participants are rejected before navigation", async () => {
  const h = harness();
  const initial = await h.ready();
  h.chat.createConversation = async () => ({
    data: { conversation: { _id: relationId, participantIds: [self, third] } },
  });
  assert.equal(await initial.startChat(initial.friends[0].person), undefined);
  assert.match(h.render().notice.message, /match this conversation/);
  h.unmount();
});

test("changing accounts hides the previous user's connections", async () => {
  const h = harness();
  await h.ready();
  const next = h.render(third);
  assert.equal(next.friends.length, 0);
  assert.equal(next.discover.length, 0);
  h.unmount();
});

function clientHarness(fetch, storageOverrides = {}) {
  const saved = { value: "synthetic-refresh", saves: 0, clears: 0 };
  const storage = {
    getRefreshToken: async () => saved.value,
    setRefreshToken: async (value) => {
      saved.value = value;
      saved.saves += 1;
    },
    clearRefreshToken: async () => {
      saved.value = null;
      saved.clears += 1;
    },
    ...storageOverrides,
  };
  const client = loadTs(
    "Screens/services/api/client.ts",
    {
      "expo-crypto": { randomUUID },
      "../storage/auth-token.storage": { authTokenStorage: storage },
      "./config": {
        apiBaseUrl: "https://api.example.test/api/v1",
        apiRequestTimeoutMs: 1000,
      },
      "./error-parser": loadTs("Screens/services/api/error-parser.ts"),
      "./logger": { apiLogger: { request() {}, success() {}, error() {} } },
    },
    { fetch },
  );
  client.apiClient.setAccessToken("synthetic-expired");
  return { ...client, saved };
}
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const unauthenticated = () =>
  response(
    {
      success: false,
      error: { code: "TOKEN_EXPIRED", message: "Session expired" },
      requestId: "test-request",
    },
    401,
  );

test("simultaneous Friends endpoints share one refresh and persist rotation before retries", async () => {
  let refreshCount = 0;
  let authenticatedCalls = 0;
  let h;
  h = clientHarness(async (url, options) => {
    if (url.endsWith("/auth/refresh")) {
      refreshCount += 1;
      await tick();
      return response({
        success: true,
        data: {
          session: {
            accessToken: "synthetic-current",
            refreshToken: "synthetic-rotated",
          },
        },
      });
    }
    if (options.headers.Authorization === "Bearer synthetic-expired")
      return unauthenticated();
    assert.equal(options.headers.Authorization, "Bearer synthetic-current");
    assert.equal(h.saved.value, "synthetic-rotated");
    authenticatedCalls += 1;
    return response({ success: true, data: {} });
  });
  await Promise.all([
    h.apiClient.request("get__friends"),
    h.apiClient.request("get__friends_requests"),
    h.apiClient.request("get__friends_suggestions"),
  ]);
  assert.equal(refreshCount, 1);
  assert.equal(h.saved.saves, 1);
  assert.equal(authenticatedCalls, 3);
});

test("refresh failure clears credentials and notifies the existing auth reset", async () => {
  const h = clientHarness(async () => unauthenticated());
  let resets = 0;
  h.apiClient.onUnauthorized(() => {
    resets += 1;
  });
  await assert.rejects(
    h.apiClient.request("get__friends"),
    (error) => error.status === 401,
  );
  assert.equal(h.apiClient.getAccessToken(), null);
  assert.equal(h.saved.value, null);
  assert.equal(resets, 1);
});

test("network and validation failures preserve parsed user-facing API errors", async () => {
  const offline = clientHarness(async () => {
    throw new Error("Connection refused");
  });
  await assert.rejects(
    offline.apiClient.request("get__friends"),
    (error) => error.code === "NETWORK_ERROR",
  );
  const invalid = clientHarness(async () =>
    response(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid action" },
        requestId: "validation-request",
      },
      422,
    ),
  );
  await assert.rejects(
    invalid.apiClient.request("patch__friends_requests_id_", {
      pathParams: { id: relationId },
      body: { action: "accept" },
    }),
    (error) => error.status === 422 && error.requestId === "validation-request",
  );
});

test("friend mutation service uses documented IDs, bodies and abort signals", async () => {
  const calls = [];
  const service = loadTs("Screens/services/api/friends.api.ts", {
    "./client": {
      apiClient: {
        request: async (operation, options) => {
          calls.push({ operation, options });
        },
      },
    },
  }).friendsApi;
  const signal = new AbortController().signal;
  await service.sendRequest(peer, signal);
  await service.respondToRequest(relationId, { action: "decline" }, signal);
  await service.remove(relationId, signal);
  assert.equal(calls[0].operation, "post__friends_requests_userId_");
  assert.equal(calls[0].options.pathParams.userId, peer);
  assert.equal(calls[1].options.pathParams.id, relationId);
  assert.equal(calls[1].options.body.action, "decline");
  assert.equal(calls[2].operation, "delete__friends_id_");
  assert.equal(calls[2].options.pathParams.id, relationId);
  assert.equal(calls[2].options.signal, signal);
});
