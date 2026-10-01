import { apiClient } from "./client";
import type { RoommateDraft } from "../../types/roommates";

export const roommatesApi = {
  questions: (signal?: AbortSignal) => apiClient.request("get__roommates_questions", { signal }),
  profile: (signal?: AbortSignal) => apiClient.request("get__roommates_profiles_me", { signal }),
  saveProfile: (body: RoommateDraft) => apiClient.request("put__roommates_profiles_me", { body }),
  visibility: (visibility: "discoverable" | "paused") => apiClient.request("patch__roommates_profiles_me_visibility", { body: { visibility } }),
  candidates: (signal?: AbortSignal) => apiClient.request("get__roommates_candidates", { query: { page: 1, limit: 20 }, signal }),
  decide: (userId: string, action: "like" | "pass") => apiClient.request("put__roommates_decisions_userId_", { pathParams: { userId }, body: { action } }),
  connections: (page = 1, signal?: AbortSignal) => apiClient.request("get__roommates_connections", { query: { page, limit: 20 }, signal }),
  connection: (id: string, signal?: AbortSignal) => apiClient.request("get__roommates_connections_id_", { pathParams: { id }, signal }),
  end: (id: string) => apiClient.request("delete__roommates_connections_id_", { pathParams: { id } }),
  endPairing: (id: string) => apiClient.request("delete__roommates_connections_id_pairing", { pathParams: { id } }),
  consent: (id: string, fields: Array<"phone" | "email">) => apiClient.request("put__roommates_connections_id_contact_consents_me", { pathParams: { id }, body: { fields } }),
  revoke: (id: string) => apiClient.request("delete__roommates_connections_id_contact_consents_me", { pathParams: { id } }),
  contacts: (id: string, signal?: AbortSignal) => apiClient.request("get__roommates_connections_id_contacts", { pathParams: { id }, signal }),
  requestPairing: (id: string) => apiClient.request("post__roommates_connections_id_requests", { pathParams: { id } }),
  respond: (id: string, requestId: string, action: "accept" | "decline" | "cancel") => apiClient.request("patch__roommates_connections_id_requests_requestId_", { pathParams: { id, requestId }, body: { action } }),
  blocks: (page = 1, signal?: AbortSignal) => apiClient.request("get__users_me_blocks", { query: { page, limit: 20 }, signal }),
  block: (userId: string) => apiClient.request("put__users_me_blocks_userId_", { pathParams: { userId } }),
  unblock: (userId: string) => apiClient.request("delete__users_me_blocks_userId_", { pathParams: { userId } }),
};
