import * as Crypto from "expo-crypto";
import type { ApiFailure, QueryValue } from "../../types/api";
import type {
  ApiOperationId,
  ApiOperationMap,
} from "../../types/api.generated";
import { authTokenStorage } from "../storage/auth-token.storage";
import { apiBaseUrl, apiRequestTimeoutMs } from "./config";
import {
  formatValidationErrorMessage,
  groupValidationIssues,
  parseValidationIssues,
  type ApiValidationIssue,
} from "./error-parser";
import { apiLogger } from "./logger";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: object | FormData;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  authenticated?: boolean;
  includeAccessToken?: boolean;
  retryAfterRefresh?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type OperationOptions<Id extends ApiOperationId> = {
  body?: ApiOperationMap[Id]["body"];
  query?: ApiOperationMap[Id]["query"];
  pathParams?: ApiOperationMap[Id]["pathParams"];
  headers?: ApiOperationMap[Id]["headers"];
  authenticated?: boolean;
  includeAccessToken?: boolean;
  signal?: AbortSignal;
};

type RefreshResponse = ApiOperationMap["post__auth_refresh"]["response"];

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
const unauthorizedListeners = new Set<() => void>();
const accessTokenListeners = new Set<(token: string | null) => void>();

function updateAccessToken(token: string | null) {
  accessToken = token;
  accessTokenListeners.forEach((listener) => listener(token));
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: unknown;
  readonly validationIssues: ApiValidationIssue[];
  readonly fieldErrors: Record<string, string[]>;

  constructor(input: {
    message: string;
    code?: string;
    status?: number;
    requestId?: string;
    details?: unknown;
    validationIssues?: ApiValidationIssue[];
  }) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code ?? "UNKNOWN_ERROR";
    this.status = input.status ?? 0;
    this.requestId = input.requestId;
    this.details = input.details;
    this.validationIssues = input.validationIssues ?? [];
    this.fieldErrors = groupValidationIssues(this.validationIssues);
  }
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { success?: unknown; error?: unknown };
  if (
    candidate.success !== false ||
    !candidate.error ||
    typeof candidate.error !== "object"
  ) {
    return false;
  }
  const error = candidate.error as { code?: unknown; message?: unknown };
  return typeof error.code === "string" && typeof error.message === "string";
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => listener());
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const parts = Object.entries(query)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  return parts.length ? `${url}?${parts.join("&")}` : url;
}

function makeSignal(callerSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      message: "The server returned an unreadable response. Please try again.",
      code: "INVALID_RESPONSE",
      status: response.status,
    });
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const authenticated = options.authenticated ?? false;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const method = options.method ?? "GET";
  const url = buildUrl(path, options.query);
  const logId = Crypto.randomUUID();
  const startedAt = Date.now();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!isFormData && options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if ((authenticated || options.includeAccessToken) && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  apiLogger.request({
    id: logId,
    method,
    url,
    headers,
    body: options.body,
  });

  const requestSignal = makeSignal(
    options.signal,
    options.timeoutMs ?? apiRequestTimeoutMs,
  );
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: requestSignal.signal,
    });
  } catch (error) {
    const requestError = requestSignal.signal.aborted
      ? new ApiError({
          message: options.signal?.aborted
            ? "Request cancelled."
            : "The request timed out. Check your connection and try again.",
          code: options.signal?.aborted
            ? "REQUEST_CANCELLED"
            : "REQUEST_TIMEOUT",
        })
      : new ApiError({
          message:
            "Unable to reach Community Connect. Check your internet connection.",
          code: "NETWORK_ERROR",
          details: error instanceof Error ? error.message : undefined,
        });

    apiLogger.error({
      id: logId,
      method,
      url,
      durationMs: Date.now() - startedAt,
      cause: requestError,
    });
    throw requestError;
  } finally {
    requestSignal.dispose();
  }

  let payload: unknown;
  try {
    payload = await parseResponse(response);
  } catch (error) {
    apiLogger.error({
      id: logId,
      method,
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      cause: error,
    });
    throw error;
  }

  const shouldRefreshAfterUnauthorized =
    authenticated || (options.includeAccessToken === true && accessToken !== null);
  if (
    response.status === 401 &&
    shouldRefreshAfterUnauthorized &&
    options.retryAfterRefresh !== false
  ) {
    const authenticationError = isApiFailure(payload)
      ? new ApiError({
          message: payload.error.message,
          code: payload.error.code,
          status: response.status,
          requestId: payload.requestId,
        })
      : new ApiError({
          message: "Authentication is required.",
          code: "AUTHENTICATION_REQUIRED",
          status: response.status,
        });

    apiLogger.error({
      id: logId,
      method,
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      payload,
      cause: authenticationError,
    });
    await refreshAccessToken();
    return rawRequest<T>(path, { ...options, retryAfterRefresh: false });
  }

  if (!response.ok) {
    const validationIssues =
      response.status === 422 && isApiFailure(payload)
        ? parseValidationIssues(payload.error.details)
        : [];
    const requestError = isApiFailure(payload)
      ? new ApiError({
          message: formatValidationErrorMessage(
            validationIssues,
            payload.error.message,
          ),
          code: payload.error.code,
          status: response.status,
          requestId: payload.requestId,
          details: payload.error.details,
          validationIssues,
        })
      : new ApiError({
          message: "Something went wrong. Please try again.",
          code: `HTTP_${response.status}`,
          status: response.status,
        });

    apiLogger.error({
      id: logId,
      method,
      url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      payload,
      cause: requestError,
    });
    throw requestError;
  }

  apiLogger.success({
    id: logId,
    method,
    url,
    status: response.status,
    durationMs: Date.now() - startedAt,
    payload,
  });

  return payload as T;
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = await authTokenStorage.getRefreshToken();
      if (!storedRefreshToken) {
        throw new ApiError({
          message: "Your session has expired. Please sign in again.",
          code: "NO_REFRESH_TOKEN",
          status: 401,
        });
      }
      const response = await rawRequest<RefreshResponse>("/auth/refresh", {
        method: "POST",
        body: { refreshToken: storedRefreshToken },
        retryAfterRefresh: false,
      });
      await authTokenStorage.setRefreshToken(
        response.data.session.refreshToken,
      );
      updateAccessToken(response.data.session.accessToken);
      return response.data.session.accessToken;
    } catch (error) {
      updateAccessToken(null);
      await authTokenStorage.clearRefreshToken();
      notifyUnauthorized();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function interpolatePath(path: string, params?: Record<string, string>) {
  return path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = params?.[name];
    if (!value)
      throw new ApiError({
        message: `Missing path parameter: ${name}`,
        code: "INVALID_REQUEST",
      });
    return encodeURIComponent(value);
  });
}

const operations: Record<
  ApiOperationId,
  { method: HttpMethod; path: string; authenticated: boolean }
> = {
  get__roommates_questions: { method: "GET", path: "/roommates/questions", authenticated: true },
  get__roommates_profiles_me: { method: "GET", path: "/roommates/profiles/me", authenticated: true },
  put__roommates_profiles_me: { method: "PUT", path: "/roommates/profiles/me", authenticated: true },
  patch__roommates_profiles_me_visibility: { method: "PATCH", path: "/roommates/profiles/me/visibility", authenticated: true },
  get__roommates_candidates: { method: "GET", path: "/roommates/candidates", authenticated: true },
  put__roommates_decisions_userId_: { method: "PUT", path: "/roommates/decisions/:userId", authenticated: true },
  get__roommates_connections: { method: "GET", path: "/roommates/connections", authenticated: true },
  get__roommates_connections_id_: { method: "GET", path: "/roommates/connections/:id", authenticated: true },
  delete__roommates_connections_id_: { method: "DELETE", path: "/roommates/connections/:id", authenticated: true },
  put__roommates_connections_id_contact_consents_me: { method: "PUT", path: "/roommates/connections/:id/contact-consents/me", authenticated: true },
  delete__roommates_connections_id_contact_consents_me: { method: "DELETE", path: "/roommates/connections/:id/contact-consents/me", authenticated: true },
  get__roommates_connections_id_contacts: { method: "GET", path: "/roommates/connections/:id/contacts", authenticated: true },
  post__roommates_connections_id_requests: { method: "POST", path: "/roommates/connections/:id/requests", authenticated: true },
  patch__roommates_connections_id_requests_requestId_: { method: "PATCH", path: "/roommates/connections/:id/requests/:requestId", authenticated: true },
  delete__roommates_connections_id_pairing: { method: "DELETE", path: "/roommates/connections/:id/pairing", authenticated: true },
  get__users_me_blocks: { method: "GET", path: "/users/me/blocks", authenticated: true },
  put__users_me_blocks_userId_: { method: "PUT", path: "/users/me/blocks/:userId", authenticated: true },
  delete__users_me_blocks_userId_: { method: "DELETE", path: "/users/me/blocks/:userId", authenticated: true },
  post__auth_register: {
    method: "POST",
    path: "/auth/register",
    authenticated: false,
  },
  post__auth_verify_email: {
    method: "POST",
    path: "/auth/verify-email",
    authenticated: false,
  },
  post__auth_resend_verification: {
    method: "POST",
    path: "/auth/resend-verification",
    authenticated: false,
  },
  post__auth_login: {
    method: "POST",
    path: "/auth/login",
    authenticated: false,
  },
  post__auth_refresh: {
    method: "POST",
    path: "/auth/refresh",
    authenticated: false,
  },
  post__auth_logout: {
    method: "POST",
    path: "/auth/logout",
    authenticated: true,
  },
  post__auth_forgot_password: {
    method: "POST",
    path: "/auth/forgot-password",
    authenticated: false,
  },
  post__auth_reset_password: {
    method: "POST",
    path: "/auth/reset-password",
    authenticated: false,
  },
  get__locations_search: {
    method: "GET",
    path: "/locations/search",
    authenticated: true,
  },
  get__users_me: { method: "GET", path: "/users/me", authenticated: true },
  patch__users_me: { method: "PATCH", path: "/users/me", authenticated: true },
  patch__users_me_avatar: {
    method: "PATCH",
    path: "/users/me/avatar",
    authenticated: true,
  },
  delete__users_me: {
    method: "DELETE",
    path: "/users/me",
    authenticated: true,
  },
  patch__users_me_password: {
    method: "PATCH",
    path: "/users/me/password",
    authenticated: true,
  },
  post__users_me_push_tokens: {
    method: "POST",
    path: "/users/me/push-tokens",
    authenticated: true,
  },
  delete__users_me_push_tokens: {
    method: "DELETE",
    path: "/users/me/push-tokens",
    authenticated: true,
  },
  get__events: { method: "GET", path: "/events", authenticated: false },
  post__events: { method: "POST", path: "/events", authenticated: true },
  get__events_recommended: {
    method: "GET",
    path: "/events/recommended",
    authenticated: true,
  },
  get__events_created_me: {
    method: "GET",
    path: "/events/created/me",
    authenticated: true,
  },
  get__events_id_: {
    method: "GET",
    path: "/events/{id}",
    authenticated: false,
  },
  patch__events_id_: {
    method: "PATCH",
    path: "/events/{id}",
    authenticated: true,
  },
  delete__events_id_: {
    method: "DELETE",
    path: "/events/{id}",
    authenticated: true,
  },
  post__events_id_orders: {
    method: "POST",
    path: "/events/{id}/orders",
    authenticated: true,
  },
  post__events_id_publish: {
    method: "POST",
    path: "/events/{id}/publish",
    authenticated: true,
  },
  post__events_id_cancel: {
    method: "POST",
    path: "/events/{id}/cancel",
    authenticated: true,
  },
  post__events_id_ticket_types: {
    method: "POST",
    path: "/events/{id}/ticket-types",
    authenticated: true,
  },
  patch__events_id_ticket_types_ticketTypeId_: {
    method: "PATCH",
    path: "/events/{id}/ticket-types/{ticketTypeId}",
    authenticated: true,
  },
  delete__events_id_ticket_types_ticketTypeId_: {
    method: "DELETE",
    path: "/events/{id}/ticket-types/{ticketTypeId}",
    authenticated: true,
  },
  get__events_id_attendees: {
    method: "GET",
    path: "/events/{id}/attendees",
    authenticated: true,
  },
  post__events_eventId_check_ins_verify: {
    method: "POST",
    path: "/events/{eventId}/check-ins/verify",
    authenticated: true,
  },
  post__events_id_check_ins: {
    method: "POST",
    path: "/events/{id}/check-ins",
    authenticated: true,
  },
  get__communities: {
    method: "GET",
    path: "/communities",
    authenticated: false,
  },
  post__communities: {
    method: "POST",
    path: "/communities",
    authenticated: true,
  },
  post__communities_resolve_code: {
    method: "POST",
    path: "/communities/resolve-code",
    authenticated: true,
  },
  get__communities_id_: {
    method: "GET",
    path: "/communities/{id}",
    authenticated: false,
  },
  patch__communities_id_: {
    method: "PATCH",
    path: "/communities/{id}",
    authenticated: true,
  },
  post__communities_id_members: {
    method: "POST",
    path: "/communities/{id}/members",
    authenticated: true,
  },
  get__communities_id_members: {
    method: "GET",
    path: "/communities/{id}/members",
    authenticated: true,
  },
  post__communities_id_membership_orders: {
    method: "POST",
    path: "/communities/{id}/membership-orders",
    authenticated: true,
  },
  get__communities_membership_orders_orderNumber_verify: {
    method: "GET",
    path: "/communities/membership-orders/{orderNumber}/verify",
    authenticated: true,
  },
  delete__communities_id_members_me: {
    method: "DELETE",
    path: "/communities/{id}/members/me",
    authenticated: true,
  },
  get__friends: { method: "GET", path: "/friends", authenticated: true },
  get__friends_requests: {
    method: "GET",
    path: "/friends/requests",
    authenticated: true,
  },
  get__friends_suggestions: {
    method: "GET",
    path: "/friends/suggestions",
    authenticated: true,
  },
  post__friends_requests_userId_: {
    method: "POST",
    path: "/friends/requests/{userId}",
    authenticated: true,
  },
  patch__friends_requests_id_: {
    method: "PATCH",
    path: "/friends/requests/{id}",
    authenticated: true,
  },
  delete__friends_id_: {
    method: "DELETE",
    path: "/friends/{id}",
    authenticated: true,
  },
  get__chat_conversations: {
    method: "GET",
    path: "/chat/conversations",
    authenticated: true,
  },
  post__chat_conversations: {
    method: "POST",
    path: "/chat/conversations",
    authenticated: true,
  },
  get__chat_conversations_id_messages: {
    method: "GET",
    path: "/chat/conversations/{id}/messages",
    authenticated: true,
  },
  post__chat_conversations_id_messages: {
    method: "POST",
    path: "/chat/conversations/{id}/messages",
    authenticated: true,
  },
  post__chat_conversations_id_read: {
    method: "POST",
    path: "/chat/conversations/{id}/read",
    authenticated: true,
  },
  post__ai_chat: { method: "POST", path: "/ai/chat", authenticated: true },
  post__ai_event_copy: {
    method: "POST",
    path: "/ai/event-copy",
    authenticated: true,
  },
  post__ai_event_recommendations: {
    method: "POST",
    path: "/ai/event-recommendations",
    authenticated: true,
  },
  post__ai_conversations_id_summary: {
    method: "POST",
    path: "/ai/conversations/{id}/summary",
    authenticated: true,
  },
  get__ai_sessions: {
    method: "GET",
    path: "/ai/sessions",
    authenticated: true,
  },
  delete__ai_sessions_id_: {
    method: "DELETE",
    path: "/ai/sessions/{id}",
    authenticated: true,
  },
  get__tickets: { method: "GET", path: "/tickets", authenticated: true },
  get__tickets_orderNumber_: {
    method: "GET",
    path: "/tickets/{orderNumber}",
    authenticated: true,
  },
  post__tickets_orderNumber_checkout: {
    method: "POST",
    path: "/tickets/{orderNumber}/checkout",
    authenticated: true,
  },
  get__tickets_orderNumber_verify: {
    method: "GET",
    path: "/tickets/{orderNumber}/verify",
    authenticated: true,
  },
  get__notifications: {
    method: "GET",
    path: "/notifications",
    authenticated: true,
  },
  patch__notifications_read_all: {
    method: "PATCH",
    path: "/notifications/read-all",
    authenticated: true,
  },
  patch__notifications_id_read: {
    method: "PATCH",
    path: "/notifications/{id}/read",
    authenticated: true,
  },
  post__disputes: { method: "POST", path: "/disputes", authenticated: true },
  get__disputes: { method: "GET", path: "/disputes", authenticated: true },
  get__disputes_id_: {
    method: "GET",
    path: "/disputes/{id}",
    authenticated: true,
  },
  post__disputes_id_messages: {
    method: "POST",
    path: "/disputes/{id}/messages",
    authenticated: true,
  },
  patch__disputes_id_status: {
    method: "PATCH",
    path: "/disputes/{id}/status",
    authenticated: true,
  },
  get__wallet: { method: "GET", path: "/wallet", authenticated: true },
  get__wallet_transactions: {
    method: "GET",
    path: "/wallet/transactions",
    authenticated: true,
  },
  get__wallet_transactions_id_: {
    method: "GET",
    path: "/wallet/transactions/{id}",
    authenticated: true,
  },
  post__wallet_topups: {
    method: "POST",
    path: "/wallet/topups",
    authenticated: true,
  },
  get__wallet_topups_reference_verify: {
    method: "GET",
    path: "/wallet/topups/{reference}/verify",
    authenticated: true,
  },
  get__wallet_banks: {
    method: "GET",
    path: "/wallet/banks",
    authenticated: true,
  },
  get__wallet_bank_accounts: {
    method: "GET",
    path: "/wallet/bank-accounts",
    authenticated: true,
  },
  post__wallet_bank_accounts: {
    method: "POST",
    path: "/wallet/bank-accounts",
    authenticated: true,
  },
  delete__wallet_bank_accounts_id_: {
    method: "DELETE",
    path: "/wallet/bank-accounts/{id}",
    authenticated: true,
  },
  post__wallet_transfers: {
    method: "POST",
    path: "/wallet/transfers",
    authenticated: true,
  },
  post__wallet_withdrawals: {
    method: "POST",
    path: "/wallet/withdrawals",
    authenticated: true,
  },
  post__wallet_withdrawals_reference_finalize: {
    method: "POST",
    path: "/wallet/withdrawals/{reference}/finalize",
    authenticated: true,
  },
  post__uploads_images: {
    method: "POST",
    path: "/uploads/images",
    authenticated: true,
  },
  post__webhooks_paystack: {
    method: "POST",
    path: "/webhooks/paystack",
    authenticated: false,
  },
  post__users_id_reports: {
    method: "POST",
    path: "/users/{id}/reports",
    authenticated: true,
  },
  post__events_id_reports: {
    method: "POST",
    path: "/events/{id}/reports",
    authenticated: true,
  },
  get__communities_id_posts: {
    method: "GET",
    path: "/communities/{id}/posts",
    authenticated: true,
  },
  post__communities_id_posts: {
    method: "POST",
    path: "/communities/{id}/posts",
    authenticated: true,
  },
  get__communities_id_announcements: {
    method: "GET",
    path: "/communities/{id}/announcements",
    authenticated: true,
  },
  post__communities_id_announcements: {
    method: "POST",
    path: "/communities/{id}/announcements",
    authenticated: true,
  },
  get__communities_id_messages: {
    method: "GET",
    path: "/communities/{id}/messages",
    authenticated: true,
  },
  post__communities_id_messages: {
    method: "POST",
    path: "/communities/{id}/messages",
    authenticated: true,
  },
  post__communities_id_reports: {
    method: "POST",
    path: "/communities/{id}/reports",
    authenticated: true,
  },
  get__users_me_communities: {
    method: "GET",
    path: "/users/me/communities",
    authenticated: true,
  },
  get__users_me_community_join_requests: {
    method: "GET",
    path: "/users/me/community-join-requests",
    authenticated: true,
  },
  get__communities_id_rules: {
    method: "GET",
    path: "/communities/{id}/rules",
    authenticated: false,
  },
  put__communities_id_rules: {
    method: "PUT",
    path: "/communities/{id}/rules",
    authenticated: true,
  },
  get__communities_id_settings: {
    method: "GET",
    path: "/communities/{id}/settings",
    authenticated: true,
  },
  patch__communities_id_settings: {
    method: "PATCH",
    path: "/communities/{id}/settings",
    authenticated: true,
  },
  patch__communities_id_members_userId_: {
    method: "PATCH",
    path: "/communities/{id}/members/{userId}",
    authenticated: true,
  },
  delete__communities_id_members_userId_: {
    method: "DELETE",
    path: "/communities/{id}/members/{userId}",
    authenticated: true,
  },
  put__communities_id_bans_userId_: {
    method: "PUT",
    path: "/communities/{id}/bans/{userId}",
    authenticated: true,
  },
  delete__communities_id_bans_userId_: {
    method: "DELETE",
    path: "/communities/{id}/bans/{userId}",
    authenticated: true,
  },
  post__communities_id_join_requests: {
    method: "POST",
    path: "/communities/{id}/join-requests",
    authenticated: true,
  },
  get__communities_id_join_requests: {
    method: "GET",
    path: "/communities/{id}/join-requests",
    authenticated: true,
  },
  post__communities_id_invites: {
    method: "POST",
    path: "/communities/{id}/invites",
    authenticated: true,
  },
  patch__communities_id_join_requests_requestId_: {
    method: "PATCH",
    path: "/communities/{id}/join-requests/{requestId}",
    authenticated: true,
  },
  delete__communities_id_join_requests_me: {
    method: "DELETE",
    path: "/communities/{id}/join-requests/me",
    authenticated: true,
  },
  post__communities_id_calls: {
    method: "POST",
    path: "/communities/{id}/calls",
    authenticated: true,
  },
  get__communities_id_calls_active: {
    method: "GET",
    path: "/communities/{id}/calls/active",
    authenticated: true,
  },
  post__communities_id_calls_callId_join: {
    method: "POST",
    path: "/communities/{id}/calls/{callId}/join",
    authenticated: true,
  },
  delete__communities_id_calls_callId_: {
    method: "DELETE",
    path: "/communities/{id}/calls/{callId}",
    authenticated: true,
  },
  post__communities_id_ownership_transfer: {
    method: "POST",
    path: "/communities/{id}/ownership-transfer",
    authenticated: true,
  },
  put__communities_id_messages_read: {
    method: "PUT",
    path: "/communities/{id}/messages/read",
    authenticated: true,
  },
  patch__communities_id_notification_preferences_me: {
    method: "PATCH",
    path: "/communities/{id}/notification-preferences/me",
    authenticated: true,
  },
  patch__communities_id_announcements_announcementId_: {
    method: "PATCH",
    path: "/communities/{id}/announcements/{announcementId}",
    authenticated: true,
  },
  delete__communities_id_announcements_announcementId_: {
    method: "DELETE",
    path: "/communities/{id}/announcements/{announcementId}",
    authenticated: true,
  },
  patch__communities_id_messages_messageId_: {
    method: "PATCH",
    path: "/communities/{id}/messages/{messageId}",
    authenticated: true,
  },
  delete__communities_id_messages_messageId_: {
    method: "DELETE",
    path: "/communities/{id}/messages/{messageId}",
    authenticated: true,
  },
  put__communities_id_messages_messageId_reactions_emoji_: {
    method: "PUT",
    path: "/communities/{id}/messages/{messageId}/reactions/{emoji}",
    authenticated: true,
  },
  delete__communities_id_messages_messageId_reactions_emoji_: {
    method: "DELETE",
    path: "/communities/{id}/messages/{messageId}/reactions/{emoji}",
    authenticated: true,
  },
  put__communities_id_messages_messageId_pin: {
    method: "PUT",
    path: "/communities/{id}/messages/{messageId}/pin",
    authenticated: true,
  },
  delete__communities_id_messages_messageId_pin: {
    method: "DELETE",
    path: "/communities/{id}/messages/{messageId}/pin",
    authenticated: true,
  },
  patch__communities_id_posts_postId_: {
    method: "PATCH",
    path: "/communities/{id}/posts/{postId}",
    authenticated: true,
  },
  delete__communities_id_posts_postId_: {
    method: "DELETE",
    path: "/communities/{id}/posts/{postId}",
    authenticated: true,
  },
  post__communities_id_messages_messageId_reports: {
    method: "POST",
    path: "/communities/{id}/messages/{messageId}/reports",
    authenticated: true,
  },
  post__uploads_files: {
    method: "POST",
    path: "/uploads/files",
    authenticated: true,
  },
};

export const apiClient = {
  setAccessToken(token: string | null) {
    updateAccessToken(token);
  },

  getAccessToken() {
    return accessToken;
  },

  onUnauthorized(listener: () => void) {
    unauthorizedListeners.add(listener);
    return () => unauthorizedListeners.delete(listener);
  },

  onAccessTokenChanged(listener: (token: string | null) => void) {
    accessTokenListeners.add(listener);
    return () => accessTokenListeners.delete(listener);
  },

  restoreSession: refreshAccessToken,

  async request<Id extends ApiOperationId>(
    id: Id,
    options: OperationOptions<Id> = {},
  ) {
    const operation = operations[id];
    return rawRequest<ApiOperationMap[Id]["response"]>(
      interpolatePath(
        operation.path,
        options.pathParams as Record<string, string> | undefined,
      ),
      {
        method: operation.method,
        authenticated: options.authenticated ?? operation.authenticated,
        body: options.body === undefined ? undefined : (options.body as object),
        query: options.query as Record<string, QueryValue> | undefined,
        headers: options.headers as Record<string, string> | undefined,
        includeAccessToken: options.includeAccessToken,
        signal: options.signal,
      },
    );
  },

  async upload<T>(
    path: string,
    formData: FormData,
    signal?: AbortSignal,
    method: HttpMethod = "POST",
  ) {
    return rawRequest<T>(path, {
      method,
      authenticated: true,
      body: formData,
      signal,
    });
  },
};

export function createIdempotencyKey() {
  return Crypto.randomUUID();
}
