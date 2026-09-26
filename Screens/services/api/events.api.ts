import type {
  GetEventsQuery,
  GetEventsRecommendedQuery,
  PatchEventsIdBody,
  PatchEventsIdTicketTypesTicketTypeIdBody,
  PostEventsBody,
  PostEventsIdReportsBody,
  PostEventsIdTicketTypesBody,
} from "../../types/api.generated";
import type { EventSetting } from "../../types/events";
import { apiClient, createIdempotencyKey } from "./client";

type CreateEventRequestBody = Omit<
  PostEventsBody,
  "coordinates" | "setting"
> & {
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  setting: EventSetting;
};

// The backend update schema accepts these fields, though the generated OpenAPI
// PATCH type currently omits them.
export type EventUpdateBody = PatchEventsIdBody &
  Pick<PostEventsBody, "coverImageUrl" | "targetAudience">;

export const eventsApi = {
  list: (query: GetEventsQuery = {}, signal?: AbortSignal) =>
    apiClient.request("get__events", { query, signal }),
  recommended: (query: GetEventsRecommendedQuery = {}, signal?: AbortSignal) =>
    apiClient.request("get__events_recommended", { query, signal }),
  createdByMe: (signal?: AbortSignal) =>
    apiClient.request("get__events_created_me", { signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__events_id_", { pathParams: { id }, signal }),
  getForManagement: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__events_id_", {
      pathParams: { id },
      authenticated: true,
      signal,
    }),
  createDraft: (body: CreateEventRequestBody, signal?: AbortSignal) =>
    apiClient.request("post__events", { body, signal }),
  updateDraft: (id: string, body: EventUpdateBody, signal?: AbortSignal) =>
    apiClient.request("patch__events_id_", {
      pathParams: { id },
      body,
      signal,
    }),
  remove: (id: string, signal?: AbortSignal) =>
    apiClient.request("delete__events_id_", { pathParams: { id }, signal }),
  publish: (id: string, signal?: AbortSignal) =>
    apiClient.request("post__events_id_publish", {
      pathParams: { id },
      authenticated: true,
      signal,
    }),
  cancel: (id: string, signal?: AbortSignal) =>
    apiClient.request("post__events_id_cancel", { pathParams: { id }, signal }),
  addTicketType: (
    id: string,
    body: PostEventsIdTicketTypesBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__events_id_ticket_types", {
      pathParams: { id },
      body,
      signal,
    }),
  updateTicketType: (
    id: string,
    ticketTypeId: string,
    body: PatchEventsIdTicketTypesTicketTypeIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__events_id_ticket_types_ticketTypeId_", {
      pathParams: { id, ticketTypeId },
      body,
      authenticated: true,
      signal,
    }),
  removeTicketType: (id: string, ticketTypeId: string, signal?: AbortSignal) =>
    apiClient.request("delete__events_id_ticket_types_ticketTypeId_", {
      pathParams: { id, ticketTypeId },
      signal,
    }),
  createOrder: (
    id: string,
    body: { ticketTypeId: string; quantity: number },
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__events_id_orders", {
      pathParams: { id },
      body,
      headers: { "Idempotency-Key": idempotencyKey },
      signal,
    }),
  attendees: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__events_id_attendees", {
      pathParams: { id },
      signal,
    }),
  verifyCheckIn: (eventId: string, qrToken: string, signal?: AbortSignal) =>
    apiClient.request("post__events_eventId_check_ins_verify", {
      pathParams: { eventId },
      body: { qrToken },
      signal,
    }),
  checkIn: (id: string, qrToken: string, signal?: AbortSignal) =>
    apiClient.request("post__events_id_check_ins", {
      pathParams: { id },
      body: { qrToken },
      signal,
    }),
  report: (id: string, body: PostEventsIdReportsBody, signal?: AbortSignal) =>
    apiClient.request("post__events_id_reports", {
      pathParams: { id },
      body,
      signal,
    }),
};
