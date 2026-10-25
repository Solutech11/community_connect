import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import type { ApiOperationId } from "../Screens/types/api.generated";

type ClientModule = typeof import("../Screens/services/api/client");
type RoommatesModule = typeof import("../Screens/services/api/roommates.api");
type TaskModule = typeof import("../Screens/hooks/use-roommate-task");
type RequestLog = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};
type MockFetch = (
  url: string,
  options: Omit<RequestLog, "url">,
) => Promise<Response>;
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Exercise the real domain service and client without contacting live accounts.
function loadTs<T>(
  file: string,
  dependencies: Record<string, unknown> = {},
  globals: Record<string, unknown> = {},
): T {
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync(path.join(testDirectory, "..", file), "utf8"),
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
      require: (name: string) => {
        if (!(name in dependencies))
          throw new Error("Unexpected dependency: " + name);
        return dependencies[name];
      },
      AbortController,
      setTimeout,
      clearTimeout,
      Response,
      FormData,
      ...globals,
    },
    { filename: file },
  );
  return exports as T;
}

const baseUrl = "https://api.example.test/api/v1";
const userId = "200000000000000000000002";
const connectionId = "300000000000000000000003";
const requestId = "400000000000000000000004";
const response = (data: object = {}, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function harness(fetchOverride?: MockFetch) {
  const calls: RequestLog[] = [];
  const client = loadTs<ClientModule>(
    "Screens/services/api/client.ts",
    {
      "expo-crypto": { randomUUID },
      "../storage/auth-token.storage": {
        authTokenStorage: {
          getRefreshToken: async () => "synthetic-refresh",
          setRefreshToken: async () => {},
          clearRefreshToken: async () => {},
        },
      },
      "./config": { apiBaseUrl: baseUrl, apiRequestTimeoutMs: 1000 },
      "./error-parser": loadTs("Screens/services/api/error-parser.ts"),
      "./logger": { apiLogger: { request() {}, success() {}, error() {} } },
    },
    {
      fetch: async (url: string, options: Omit<RequestLog, "url">) => {
        calls.push({ url, ...options });
        return fetchOverride
          ? fetchOverride(url, options)
          : response({
              success: true,
              data: { matched: false, connectionId: null },
            });
      },
    },
  );
  client.apiClient.setAccessToken("synthetic-access");
  const { roommatesApi } = loadTs<RoommatesModule>(
    "Screens/services/api/roommates.api.ts",
    {
      "./client": client,
    },
  );
  return { ...client, roommatesApi, calls };
}

type ActionCase = [
  name: string,
  call: (api: RoommatesModule["roommatesApi"]) => Promise<unknown>,
  method: string,
  expectedPath: string,
  body?: object,
];
const actions: ActionCase[] = [
  [
    "like",
    (api) => api.decide(userId, "like"),
    "PUT",
    `/roommates/decisions/${userId}`,
    { action: "like" },
  ],
  [
    "pass",
    (api) => api.decide(userId, "pass"),
    "PUT",
    `/roommates/decisions/${userId}`,
    { action: "pass" },
  ],
  [
    "connection",
    (api) => api.connection(connectionId),
    "GET",
    `/roommates/connections/${connectionId}`,
  ],
  [
    "end connection",
    (api) => api.end(connectionId),
    "DELETE",
    `/roommates/connections/${connectionId}`,
  ],
  [
    "end pairing",
    (api) => api.endPairing(connectionId),
    "DELETE",
    `/roommates/connections/${connectionId}/pairing`,
  ],
  [
    "consent",
    (api) => api.consent(connectionId, ["email"]),
    "PUT",
    `/roommates/connections/${connectionId}/contact-consents/me`,
    { fields: ["email"] },
  ],
  [
    "revoke consent",
    (api) => api.revoke(connectionId),
    "DELETE",
    `/roommates/connections/${connectionId}/contact-consents/me`,
  ],
  [
    "contacts",
    (api) => api.contacts(connectionId),
    "GET",
    `/roommates/connections/${connectionId}/contacts`,
  ],
  [
    "request pairing",
    (api) => api.requestPairing(connectionId),
    "POST",
    `/roommates/connections/${connectionId}/requests`,
  ],
  ...(["accept", "decline", "cancel"] as const).map((action): ActionCase => [
    action,
    (api) => api.respond(connectionId, requestId, action),
    "PATCH",
    `/roommates/connections/${connectionId}/requests/${requestId}`,
    { action },
  ]),
  ["block", (api) => api.block(userId), "PUT", `/users/me/blocks/${userId}`],
  [
    "unblock",
    (api) => api.unblock(userId),
    "DELETE",
    `/users/me/blocks/${userId}`,
  ],
];
for (const [name, call, method, expectedPath, body] of actions) {
  test(`${name} sends actual IDs, authorization and the documented payload`, async () => {
    const h = harness();
    await call(h.roommatesApi);
    assert.equal(h.calls.length, 1);
    const request = h.calls[0];
    assert.equal(request.url, baseUrl + expectedPath);
    assert.equal(request.method, method);
    assert.equal(request.headers.Authorization, "Bearer synthetic-access");
    assert.deepEqual(
      request.body === undefined ? undefined : JSON.parse(request.body),
      body,
    );
  });
}

test("every configured operation uses its generated contract path and method", async () => {
  const source = ts.createSourceFile(
    "api.generated.ts",
    fs.readFileSync(
      path.join(testDirectory, "../Screens/types/api.generated.ts"),
      "utf8",
    ),
    ts.ScriptTarget.Latest,
    true,
  );
  const map = source.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === "ApiOperationMap",
  );
  assert.ok(map, "Generated API operation map must exist");
  const h = harness();
  for (const operation of map.members) {
    assert.ok(
      ts.isPropertySignature(operation) && ts.isStringLiteral(operation.name),
    );
    assert.ok(operation.type && ts.isTypeLiteralNode(operation.type));
    const fields = Object.fromEntries(
      operation.type.members.flatMap((field) => {
        if (
          !ts.isPropertySignature(field) ||
          !field.type ||
          !ts.isLiteralTypeNode(field.type) ||
          !ts.isStringLiteral(field.type.literal)
        )
          return [];
        return [[field.name.getText(source), field.type.literal.text]];
      }),
    );
    const params: Record<string, string> = {};
    const expected = fields.path.replace(
      /\{([^}]+)\}/g,
      (_: string, name: string) => {
        params[name] = `value ${name}/?`;
        return encodeURIComponent(params[name]);
      },
    );
    await h.apiClient.request(operation.name.text as ApiOperationId, {
      pathParams: params,
    });
    const actual = h.calls[h.calls.length - 1];
    assert.equal(actual.url, baseUrl + expected, operation.name.text);
    assert.equal(actual.method, fields.method, operation.name.text);
  }
});

test("missing decision, connection, request and block IDs fail before fetch", async () => {
  const h = harness();
  const operations: [ApiOperationId, string][] = [
    ["put__roommates_decisions_userId_", "userId"],
    ["get__roommates_connections_id_", "id"],
    ["patch__roommates_connections_id_requests_requestId_", "requestId"],
    ["put__users_me_blocks_userId_", "userId"],
  ];
  for (const [operation, parameter] of operations) {
    for (const value of [undefined, null, ""]) {
      // Deliberately bypass compile-time input types to verify the runtime guard.
      const params = { id: connectionId, [parameter]: value } as Record<
        string,
        string
      >;
      await assert.rejects(
        h.apiClient.request(operation, { pathParams: params }),
        (error: unknown) =>
          error instanceof h.ApiError &&
          error.code === "INVALID_REQUEST" &&
          error.message.includes(parameter),
      );
    }
  }
  assert.equal(h.calls.length, 0);
});

test("authentication refresh retries the same selected user and decision once", async () => {
  const h = harness(async (url, options) => {
    if (url.endsWith("/auth/refresh"))
      return response({
        success: true,
        data: {
          session: {
            accessToken: "synthetic-new",
            refreshToken: "synthetic-rotated",
          },
        },
      });
    if (options.headers.Authorization === "Bearer synthetic-access")
      return response(
        {
          success: false,
          error: { code: "TOKEN_EXPIRED", message: "Session expired" },
        },
        401,
      );
    return response({ success: true, data: { matched: true, connectionId } });
  });
  const result = await h.roommatesApi.decide(userId, "like");
  assert.equal(result.data.connectionId, connectionId);
  assert.equal(h.calls.length, 3);
  for (const index of [0, 2]) {
    assert.equal(
      h.calls[index].url,
      `${baseUrl}/roommates/decisions/${userId}`,
    );
    assert.deepEqual(JSON.parse(h.calls[index].body!), { action: "like" });
  }
  assert.equal(h.calls[2].headers.Authorization, "Bearer synthetic-new");
});

test("decision failures retain server validation details and network errors", async () => {
  const invalid = harness(async () =>
    response(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid decision" },
        requestId: "synthetic-request",
      },
      422,
    ),
  );
  await assert.rejects(
    invalid.roommatesApi.decide(userId, "like"),
    (error: unknown) =>
      error instanceof invalid.ApiError &&
      error.status === 422 &&
      error.requestId === "synthetic-request",
  );
  const offline = harness(async () => {
    throw new Error("Offline");
  });
  await assert.rejects(
    offline.roommatesApi.decide(userId, "pass"),
    (error: unknown) =>
      error instanceof offline.ApiError && error.code === "NETWORK_ERROR",
  );
});

test("repeated taps run one task and a failed decision can be retried", async () => {
  const notices: { message: string }[] = [];
  const busy: boolean[] = [];
  const { ApiError } = harness();
  const { useRoommateTask } = loadTs<TaskModule>(
    "Screens/hooks/use-roommate-task.ts",
    {
      react: {
        useCallback: (callback: unknown) => callback,
        useRef: (current: unknown) => ({ current }),
        useState: () => [false, (value: boolean) => busy.push(value)],
      },
      "../components/ui/app-notifier": {
        useNotifier: () => ({
          notify: (notice: { message: string }) => notices.push(notice),
        }),
      },
      "../services/api/client": { ApiError },
    },
  );
  const { run } = useRoommateTask();
  let release!: () => void;
  const first = run(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  let duplicates = 0;
  assert.equal(
    await run(async () => {
      duplicates += 1;
    }),
    false,
  );
  release();
  assert.equal(await first, true);
  assert.equal(duplicates, 0);
  assert.equal(
    await run(async () => {
      throw new ApiError({ message: "Try again", code: "NETWORK_ERROR" });
    }),
    false,
  );
  assert.equal(notices[0].message, "Try again");
  assert.equal(await run(async () => {}), true);
  assert.equal(busy[busy.length - 1], false);
});
