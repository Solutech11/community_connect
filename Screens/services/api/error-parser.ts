export type ApiValidationIssue = {
  path: string;
  message: string;
};

const VALIDATION_ROOTS = new Set([
  "body",
  "query",
  "params",
  "pathParams",
  "headers",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePath(value: unknown) {
  const segments = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(".")
      : [];

  while (segments.length && VALIDATION_ROOTS.has(segments[0])) {
    segments.shift();
  }

  return segments.filter(Boolean).join(".");
}

function addIssue(
  output: ApiValidationIssue[],
  path: unknown,
  message: unknown,
) {
  if (typeof message !== "string" || !message.trim()) return;
  const issue = { path: normalizePath(path), message: message.trim() };
  if (
    !output.some(
      (existing) =>
        existing.path === issue.path && existing.message === issue.message,
    )
  ) {
    output.push(issue);
  }
}

function addMessages(
  output: ApiValidationIssue[],
  path: string,
  value: unknown,
) {
  if (Array.isArray(value)) {
    value.forEach((message) => addIssue(output, path, message));
    return;
  }
  addIssue(output, path, value);
}

export function parseValidationIssues(details: unknown) {
  const output: ApiValidationIssue[] = [];
  const values = Array.isArray(details) ? details : [details];

  values.forEach((value) => {
    const issue = asRecord(value);
    if (!issue) return;

    addIssue(output, issue.path, issue.message);

    if (Array.isArray(issue.issues)) {
      issue.issues.forEach((nestedIssue) => {
        const nested = asRecord(nestedIssue);
        if (nested) addIssue(output, nested.path, nested.message);
      });
    }

    const fieldErrors = asRecord(issue.fieldErrors);
    if (fieldErrors) {
      Object.entries(fieldErrors).forEach(([path, messages]) =>
        addMessages(output, path, messages),
      );
    }

    addMessages(output, "", issue.formErrors);

    if (
      !issue.path &&
      !issue.message &&
      !issue.issues &&
      !issue.fieldErrors &&
      !issue.formErrors
    ) {
      Object.entries(issue).forEach(([path, messages]) =>
        addMessages(output, path, messages),
      );
    }
  });

  return output;
}

function humanizeSegment(segment: string) {
  if (/^\d+$/.test(segment)) return `#${Number(segment) + 1}`;
  const words = segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : "Request";
}

export function formatValidationPath(path: string) {
  if (!path) return "Request";
  return path.split(".").map(humanizeSegment).join(" > ");
}

export function formatValidationErrorMessage(
  issues: ApiValidationIssue[],
  fallback: string,
) {
  if (!issues.length) return fallback;
  return [
    "Please correct the following:",
    ...issues.map(
      (issue) => `- ${formatValidationPath(issue.path)}: ${issue.message}`,
    ),
  ].join("\n");
}

export function groupValidationIssues(issues: ApiValidationIssue[]) {
  return issues.reduce<Record<string, string[]>>((grouped, issue) => {
    const key = issue.path || "request";
    grouped[key] ??= [];
    grouped[key].push(issue.message);
    return grouped;
  }, {});
}
