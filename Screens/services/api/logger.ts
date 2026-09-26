type ApiLogRequest = {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
};

type ApiLogResponse = {
  id: string;
  method: string;
  url: string;
  status?: number;
  durationMs: number;
  payload?: unknown;
  error?: {
    name?: string;
    code?: string;
    message: string;
    requestId?: string;
  };
};

const LOG_PREFIX = "[Community Connect API]";
const MAX_ARRAY_ITEMS = 25;
const MAX_DEPTH = 6;
const REDACTED = "[REDACTED]";
const OMITTED = "[OMITTED]";
const EMPTY_VALUE = "<none>";

const sensitiveKeyPattern =
  /authorization|password|passcode|otp|one.?time|access.?token|refresh.?token|push.?token|qr.?token|ticket.?token|secret|api.?key|paystack|pin|cvv|account.?number|routing.?number/i;
const personallyIdentifiableKeyPattern = /email|phone|date.?of.?birth/i;

function isLoggingEnabled() {
  return __DEV__ || process.env.EXPO_PUBLIC_API_LOGGING === "true";
}

function shouldRedact(key: string) {
  return (
    sensitiveKeyPattern.test(key) || personallyIdentifiableKeyPattern.test(key)
  );
}

function sanitize(
  value: unknown,
  key = "",
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (shouldRedact(key)) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 1_000
      ? `${value.slice(0, 1_000)}...[truncated]`
      : value;
  }
  if (typeof value !== "object") return value;
  if (typeof FormData !== "undefined" && value instanceof FormData) {
    return "[FormData contents omitted]";
  }
  if (depth >= MAX_DEPTH) return OMITTED;
  if (seen.has(value)) return "[Circular]";

  seen.add(value);
  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitize(item, key, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`[${value.length - MAX_ARRAY_ITEMS} more items]`);
    }
    seen.delete(value);
    return items;
  }

  const result = Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      sanitize(entryValue, entryKey, depth + 1, seen),
    ]),
  );
  seen.delete(value);
  return result;
}

function sanitizeUrl(value: string) {
  const [base, queryString] = value.split("?", 2);
  if (!queryString) return base;

  const query = queryString
    .split("&")
    .map((part) => {
      const [rawKey, ...rawValue] = part.split("=");
      const decodedKey = decodeURIComponent(rawKey);
      return shouldRedact(decodedKey)
        ? `${rawKey}=${REDACTED}`
        : [rawKey, ...rawValue].join("=");
    })
    .join("&");

  return `${base}?${query}`;
}

function safeError(error: unknown): ApiLogResponse["error"] {
  if (error instanceof Error) {
    const details = error as Error & { code?: string; requestId?: string };
    return {
      name: error.name,
      code: details.code,
      message: error.message,
      requestId: details.requestId,
    };
  }
  return { message: "Unknown request error" };
}

function formatValue(value: unknown, emptyValue = EMPTY_VALUE) {
  const sanitizedValue = sanitize(value);
  if (sanitizedValue === undefined) return emptyValue;

  try {
    return JSON.stringify(sanitizedValue, null, 2) ?? emptyValue;
  } catch {
    return "[Unable to format value]";
  }
}

function formatBlock(label: string, value: unknown, emptyValue = EMPTY_VALUE) {
  return [
    `${label}:`,
    ...formatValue(value, emptyValue)
      .split("\n")
      .map((line) => `  ${line}`),
  ];
}

function writeLog(level: "info" | "error", lines: string[]) {
  const message = lines.join("\n");
  if (level === "error") {
    console.error(message);
  } else {
    console.info(message);
  }
}

function responseLogLines(
  input: ApiLogResponse,
  outcome: "success" | "error",
  error?: unknown,
) {
  return [
    `${LOG_PREFIX} RESPONSE`,
    `ID: ${input.id}`,
    `METHOD: ${input.method}`,
    `URL: ${sanitizeUrl(input.url)}`,
    `STATUS CODE: ${input.status ?? "NETWORK"}`,
    `OUTCOME: ${outcome.toUpperCase()}`,
    ...formatBlock("RESPONSE BODY", input.payload, "<empty>"),
    `DURATION: ${input.durationMs}ms`,
    ...(error === undefined ? [] : formatBlock("ERROR", error)),
  ];
}

export const apiLogger = {
  request(input: ApiLogRequest) {
    if (!isLoggingEnabled()) return;

    writeLog("info", [
      `${LOG_PREFIX} REQUEST`,
      `ID: ${input.id}`,
      `METHOD: ${input.method}`,
      `URL: ${sanitizeUrl(input.url)}`,
      ...formatBlock("REQUEST BODY", input.body),
      ...formatBlock("HEADERS", input.headers),
    ]);
  },

  success(input: ApiLogResponse) {
    if (!isLoggingEnabled()) return;

    writeLog("info", responseLogLines(input, "success"));
  },

  error(input: ApiLogResponse & { cause?: unknown }) {
    if (!isLoggingEnabled()) return;

    writeLog(
      "error",
      responseLogLines(input, "error", input.error ?? safeError(input.cause)),
    );
  },
};
