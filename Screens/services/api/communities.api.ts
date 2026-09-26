import type {
  DeleteCommunitiesIdAnnouncementsAnnouncementIdBody,
  DeleteCommunitiesIdBansUserIdBody,
  DeleteCommunitiesIdJoinRequestsMeBody,
  DeleteCommunitiesIdMembersUserIdBody,
  DeleteCommunitiesIdMessagesMessageIdBody,
  DeleteCommunitiesIdMessagesMessageIdPinBody,
  DeleteCommunitiesIdMessagesMessageIdReactionsEmojiBody,
  DeleteCommunitiesIdPostsPostIdBody,
  GetCommunitiesIdAnnouncementsQuery,
  GetCommunitiesIdJoinRequestsQuery,
  GetCommunitiesIdMembersQuery,
  GetCommunitiesIdMessagesQuery,
  GetCommunitiesIdPostsQuery,
  GetCommunitiesQuery,
  GetUsersMeCommunitiesQuery,
  GetUsersMeCommunitiesResponse,
  PatchCommunitiesIdAnnouncementsAnnouncementIdBody,
  PatchCommunitiesIdBody,
  PatchCommunitiesIdMembersUserIdBody,
  PatchCommunitiesIdMessagesMessageIdBody,
  PatchCommunitiesIdNotificationPreferencesMeBody,
  PatchCommunitiesIdPostsPostIdBody,
  PatchCommunitiesIdSettingsBody,
  PatchCommunitiesIdJoinRequestsRequestIdBody,
  PostCommunitiesBody,
  PostCommunitiesIdAnnouncementsBody,
  PostCommunitiesIdCallsBody,
  PostCommunitiesIdInvitesBody,
  PostCommunitiesIdJoinRequestsBody,
  PostCommunitiesIdMessagesBody,
  PostCommunitiesIdMessagesMessageIdReportsBody,
  PostCommunitiesIdOwnershipTransferBody,
  PostCommunitiesIdPostsBody,
  PostCommunitiesIdReportsBody,
  PutCommunitiesIdBansUserIdBody,
  PutCommunitiesIdMessagesReadBody,
  PutCommunitiesIdRulesBody,
} from "../../types/api.generated";
import { apiClient, createIdempotencyKey } from "./client";

export const communitiesApi = {
  list: (query: GetCommunitiesQuery = {}, signal?: AbortSignal) =>
    apiClient.request("get__communities", { query, signal }),
  myCommunities: (
    query: GetUsersMeCommunitiesQuery = {},
    signal?: AbortSignal,
  ) => apiClient.request("get__users_me_communities", { query, signal }),
  allMyCommunities: async (
    signal?: AbortSignal,
  ): Promise<GetUsersMeCommunitiesResponse["data"]["communities"]> => {
    const communities: GetUsersMeCommunitiesResponse["data"]["communities"] =
      [];
    let page = 1;
    let totalPages = 1;
    do {
      const response = await apiClient.request("get__users_me_communities", {
        query: { page, limit: 100 },
        signal,
      });
      communities.push(...response.data.communities);
      totalPages =
        response.data.pagination.totalPages ||
        Math.ceil(response.data.pagination.total / 100);
      page += 1;
    } while (page <= totalPages);
    return communities;
  },
  get: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__communities_id_", { pathParams: { id }, signal }),
  create: (body: PostCommunitiesBody, signal?: AbortSignal) =>
    apiClient.request("post__communities", { body, signal }),
  update: (id: string, body: PatchCommunitiesIdBody, signal?: AbortSignal) =>
    apiClient.request("patch__communities_id_", {
      pathParams: { id },
      body,
      signal,
    }),
  join: (id: string, signal?: AbortSignal) =>
    apiClient.request("post__communities_id_members", {
      pathParams: { id },
      signal,
    }),
  leave: (id: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_members_me", {
      pathParams: { id },
      signal,
    }),
  members: (
    id: string,
    query: GetCommunitiesIdMembersQuery = {},
    signal?: AbortSignal,
  ) =>
    apiClient.request("get__communities_id_members", {
      pathParams: { id },
      query,
      signal,
    }),
  updateMember: (
    id: string,
    userId: string,
    body: PatchCommunitiesIdMembersUserIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_members_userId_", {
      pathParams: { id, userId },
      body,
      signal,
    }),
  removeMember: (id: string, userId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_members_userId_", {
      pathParams: { id, userId },
      signal,
    }),
  banMember: (
    id: string,
    userId: string,
    body: PutCommunitiesIdBansUserIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("put__communities_id_bans_userId_", {
      pathParams: { id, userId },
      body,
      signal,
    }),
  unbanMember: (id: string, userId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_bans_userId_", {
      pathParams: { id, userId },
      signal,
    }),

  rules: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__communities_id_rules", {
      pathParams: { id },
      signal,
    }),
  updateRules: (
    id: string,
    body: PutCommunitiesIdRulesBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("put__communities_id_rules", {
      pathParams: { id },
      body,
      signal,
    }),
  settings: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__communities_id_settings", {
      pathParams: { id },
      signal,
    }),
  updateSettings: (
    id: string,
    body: PatchCommunitiesIdSettingsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_settings", {
      pathParams: { id },
      body,
      signal,
    }),

  createJoinRequest: (
    id: string,
    body: PostCommunitiesIdJoinRequestsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_join_requests", {
      pathParams: { id },
      body,
      signal,
    }),
  joinRequests: (
    id: string,
    query: GetCommunitiesIdJoinRequestsQuery = {},
    signal?: AbortSignal,
  ) =>
    apiClient.request("get__communities_id_join_requests", {
      pathParams: { id },
      query,
      signal,
    }),
  reviewJoinRequest: (
    id: string,
    requestId: string,
    body: PatchCommunitiesIdJoinRequestsRequestIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_join_requests_requestId_", {
      pathParams: { id, requestId },
      body,
      signal,
    }),
  cancelMyJoinRequest: (id: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_join_requests_me", {
      pathParams: { id },
      signal,
    }),
  createInvite: (
    id: string,
    body: PostCommunitiesIdInvitesBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_invites", {
      pathParams: { id },
      body,
      signal,
    }),
  transferOwnership: (
    id: string,
    body: PostCommunitiesIdOwnershipTransferBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_ownership_transfer", {
      pathParams: { id },
      body,
      signal,
    }),

  createMembershipOrder: (
    id: string,
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_membership_orders", {
      pathParams: { id },
      headers: { "Idempotency-Key": idempotencyKey },
      signal,
    }),
  verifyMembershipOrder: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.request("get__communities_membership_orders_orderNumber_verify", {
      pathParams: { orderNumber },
      signal,
    }),

  posts: (
    id: string,
    query: GetCommunitiesIdPostsQuery = {},
    signal?: AbortSignal,
  ) =>
    apiClient.request("get__communities_id_posts", {
      pathParams: { id },
      query,
      signal,
    }),
  createPost: (
    id: string,
    body: PostCommunitiesIdPostsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_posts", {
      pathParams: { id },
      body,
      signal,
    }),
  updatePost: (
    id: string,
    postId: string,
    body: PatchCommunitiesIdPostsPostIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_posts_postId_", {
      pathParams: { id, postId },
      body,
      signal,
    }),
  deletePost: (id: string, postId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_posts_postId_", {
      pathParams: { id, postId },
      signal,
    }),

  announcements: (
    id: string,
    query: GetCommunitiesIdAnnouncementsQuery = {},
    signal?: AbortSignal,
  ) =>
    apiClient.request("get__communities_id_announcements", {
      pathParams: { id },
      query,
      signal,
    }),
  createAnnouncement: (
    id: string,
    body: PostCommunitiesIdAnnouncementsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_announcements", {
      pathParams: { id },
      body,
      signal,
    }),
  updateAnnouncement: (
    id: string,
    announcementId: string,
    body: PatchCommunitiesIdAnnouncementsAnnouncementIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_announcements_announcementId_", {
      pathParams: { id, announcementId },
      body,
      signal,
    }),
  deleteAnnouncement: (
    id: string,
    announcementId: string,
    signal?: AbortSignal,
  ) =>
    apiClient.request("delete__communities_id_announcements_announcementId_", {
      pathParams: { id, announcementId },
      signal,
    }),

  messages: (
    id: string,
    query: GetCommunitiesIdMessagesQuery = {},
    signal?: AbortSignal,
  ) =>
    apiClient.request("get__communities_id_messages", {
      pathParams: { id },
      query,
      signal,
    }),
  sendMessage: (
    id: string,
    body: PostCommunitiesIdMessagesBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_messages", {
      pathParams: { id },
      body,
      signal,
    }),
  updateMessage: (
    id: string,
    messageId: string,
    body: PatchCommunitiesIdMessagesMessageIdBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_messages_messageId_", {
      pathParams: { id, messageId },
      body,
      signal,
    }),
  deleteMessage: (id: string, messageId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_messages_messageId_", {
      pathParams: { id, messageId },
      signal,
    }),
  addReaction: (
    id: string,
    messageId: string,
    emoji: string,
    signal?: AbortSignal,
  ) =>
    apiClient.request(
      "put__communities_id_messages_messageId_reactions_emoji_",
      {
        pathParams: { id, messageId, emoji },
        signal,
      },
    ),
  removeReaction: (
    id: string,
    messageId: string,
    emoji: string,
    signal?: AbortSignal,
  ) =>
    apiClient.request(
      "delete__communities_id_messages_messageId_reactions_emoji_",
      {
        pathParams: { id, messageId, emoji },
        signal,
      },
    ),
  pinMessage: (id: string, messageId: string, signal?: AbortSignal) =>
    apiClient.request("put__communities_id_messages_messageId_pin", {
      pathParams: { id, messageId },
      signal,
    }),
  unpinMessage: (id: string, messageId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_messages_messageId_pin", {
      pathParams: { id, messageId },
      signal,
    }),
  markMessagesRead: (
    id: string,
    body: PutCommunitiesIdMessagesReadBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("put__communities_id_messages_read", {
      pathParams: { id },
      body,
      signal,
    }),
  updateNotificationPreference: (
    id: string,
    body: PatchCommunitiesIdNotificationPreferencesMeBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("patch__communities_id_notification_preferences_me", {
      pathParams: { id },
      body,
      signal,
    }),
  reportMessage: (
    id: string,
    messageId: string,
    body: PostCommunitiesIdMessagesMessageIdReportsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_messages_messageId_reports", {
      pathParams: { id, messageId },
      body,
      signal,
    }),
  report: (
    id: string,
    body: PostCommunitiesIdReportsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_reports", {
      pathParams: { id },
      body,
      signal,
    }),

  createCall: (
    id: string,
    body: PostCommunitiesIdCallsBody,
    signal?: AbortSignal,
  ) =>
    apiClient.request("post__communities_id_calls", {
      pathParams: { id },
      body,
      signal,
    }),
  activeCall: (id: string, signal?: AbortSignal) =>
    apiClient.request("get__communities_id_calls_active", {
      pathParams: { id },
      signal,
    }),
  joinCall: (id: string, callId: string, signal?: AbortSignal) =>
    apiClient.request("post__communities_id_calls_callId_join", {
      pathParams: { id, callId },
      signal,
    }),
  endCall: (id: string, callId: string, signal?: AbortSignal) =>
    apiClient.request("delete__communities_id_calls_callId_", {
      pathParams: { id, callId },
      signal,
    }),
};
