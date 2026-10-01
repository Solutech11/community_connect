import type {
  GetCommunitiesResponse,
  GetCommunitiesIdResponse,
  GetCommunitiesIdAnnouncementsResponse,
  GetCommunitiesIdPostsResponse,
  GetCommunitiesIdRulesResponse,
  GetUsersMeCommunitiesResponse,
} from "./api.generated";

type Community = GetCommunitiesIdResponse["data"]["community"];
type Announcement =
  GetCommunitiesIdAnnouncementsResponse["data"]["announcements"][number];
type Post = GetCommunitiesIdPostsResponse["data"]["posts"][number];
type CommunityRules = GetCommunitiesIdRulesResponse["data"]["rules"];
type ViewerMembership =
  GetUsersMeCommunitiesResponse["data"]["communities"][number]["viewerMembership"];

export type CommunityProfileMember = {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    state: string;
    lga: string;
  };
  communityRole: "owner" | "moderator" | "member";
  status: string;
  joinedAt: string;
};

export type RoomAttachment = {
  _id: string;
  url: string;
  type: "image" | "pdf" | "file";
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type RoomMessage = {
  _id: string;
  communityId: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    communityRole: string;
  };
  text: string;
  attachments: RoomAttachment[];
  clientMessageId: string;
  replyToMessageId: string | null;
  createdAt: string;
  editedAt: string | null;
  pinnedAt: string | null;
  reactions: Array<{ emoji: string; count: number; reactedByViewer: boolean }>;
};

export type RoomSnapshot = {
  community: Community | null;
  messages: RoomMessage[];
  olderCursor: string | null;
  hasOlderMessages: boolean;
};

export type CommunityProfileSnapshot = {
  community: Community | null;
  members: CommunityProfileMember[];
  memberPage: number;
  moreMembers: boolean;
  announcements: Announcement[];
  posts: Post[];
  postPage: number;
  announcementPage: number;
  morePosts: boolean;
  moreAnnouncements: boolean;
  communityRules: CommunityRules | null;
  viewerMembership: ViewerMembership | null;
  messagePermission: string;
  memberListVisible: boolean;
};

export type CommunityListData = {
  items: GetCommunitiesResponse["data"]["communities"];
  page: number;
  hasMore: boolean;
};
