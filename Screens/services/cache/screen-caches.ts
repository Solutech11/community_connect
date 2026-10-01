import type {
  GetChatConversationsResponse,
  GetChatConversationsIdMessagesResponse,
  GetUsersMeCommunitiesResponse,
} from "../../types/api.generated";
import type {
  CommunityListData,
  CommunityProfileSnapshot,
  RoomSnapshot,
} from "../../types/screen-cache";
import { SessionCache, restoreSessionCaches } from "./session-cache";

export const conversationsCache = new SessionCache<
  GetChatConversationsResponse["data"]["conversations"]
>(1, "chat-list");
export const messagesCache = new SessionCache<
  GetChatConversationsIdMessagesResponse["data"]["messages"]
>(20, "chat-messages");
export const myCommunitiesCache = new SessionCache<
  GetUsersMeCommunitiesResponse["data"]["communities"]
>(1, "my-communities");
export const categoryOptionsCache = new SessionCache<string[]>(
  1,
  "community-categories",
);
export const communityListCache = new SessionCache<CommunityListData>(
  20,
  "community-list",
);
export const communityProfileCache = new SessionCache<CommunityProfileSnapshot>(
  15,
  "community-profile",
);
export const roomCache = new SessionCache<RoomSnapshot>(15, "community-room");

// Register every cache even when Metro defers loading an individual route module.
export function restoreScreenCaches(accountId: string) {
  return restoreSessionCaches(accountId);
}
