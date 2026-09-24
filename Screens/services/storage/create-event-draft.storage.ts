import * as SecureStore from "expo-secure-store";

import { normalizeEventSetting } from "../../types/events";
import type { CreateEventDraft } from "../../types/navigation";

const CREATE_EVENT_DRAFT_KEY = "community-connect.create-event-draft.v1";

type StoredCreateEventDraft = {
  version: 1;
  draft: Partial<CreateEventDraft>;
};

let pendingWrite: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredDraft(value: unknown): value is StoredCreateEventDraft {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.draft)) {
    return false;
  }

  return (
    value.draft.tickets === undefined || Array.isArray(value.draft.tickets)
  );
}

export const createEventDraftStorage = {
  async get(): Promise<Partial<CreateEventDraft> | null> {
    try {
      await pendingWrite;
      const raw = await SecureStore.getItemAsync(CREATE_EVENT_DRAFT_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      return isStoredDraft(parsed)
        ? {
            ...parsed.draft,
            setting: normalizeEventSetting(parsed.draft.setting),
          }
        : null;
    } catch {
      return null;
    }
  },

  save(draft: Partial<CreateEventDraft>) {
    const value: StoredCreateEventDraft = {
      version: 1,
      draft: { ...draft, setting: normalizeEventSetting(draft.setting) },
    };
    const serialized = JSON.stringify(value);
    pendingWrite = pendingWrite
      .catch(() => undefined)
      .then(() => SecureStore.setItemAsync(CREATE_EVENT_DRAFT_KEY, serialized))
      .catch(() => undefined);
    return pendingWrite;
  },

  async clear() {
    pendingWrite = pendingWrite
      .catch(() => undefined)
      .then(() => SecureStore.deleteItemAsync(CREATE_EVENT_DRAFT_KEY))
      .catch(() => undefined);
    await pendingWrite;
  },
};
