import type {
  GetFriendsResponse,
  GetFriendsSuggestionsResponse,
} from "./api.generated";

export type FriendRelationshipDto =
  GetFriendsResponse["data"]["friendships"][number];
export type FriendProfileDto =
  GetFriendsSuggestionsResponse["data"]["users"][number];

// UI identity always refers to a user; relationship IDs are kept separately.
export type FriendPerson = {
  userId: string;
  name: string;
  avatarUrl: string;
  location: string;
  interests: string[];
};

export type FriendConnection = {
  relationshipId: string;
  person: FriendPerson;
  incoming: boolean;
  status: string;
};
