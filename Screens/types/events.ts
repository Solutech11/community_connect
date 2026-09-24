export const EVENT_SETTING_VALUES = [
  "indoor",
  "outdoor",
  "online",
  "hybrid",
] as const;

export type EventSetting = (typeof EVENT_SETTING_VALUES)[number];

export const EVENT_STATUS_VALUES = [
  "draft",
  "pending_approval",
  "published",
  "rejected",
  "deactivated",
  "cancelled",
  "completed",
] as const;

export type EventStatus = (typeof EVENT_STATUS_VALUES)[number];
export type ParsedEventStatus = EventStatus | "unknown";

export function isEventSetting(value: unknown): value is EventSetting {
  return (
    typeof value === "string" &&
    (EVENT_SETTING_VALUES as readonly string[]).includes(value)
  );
}

export function normalizeEventSetting(value: unknown): EventSetting {
  if (typeof value !== "string") return "indoor";

  const normalized = value.trim().toLowerCase();
  return isEventSetting(normalized) ? normalized : "indoor";
}

export function parseEventStatus(value: unknown): ParsedEventStatus {
  return typeof value === "string" &&
    (EVENT_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as EventStatus)
    : "unknown";
}
