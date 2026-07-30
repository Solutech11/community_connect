# Community frontend: required backend API contract

This document is the backend handoff for the community screens. It describes the **missing or incomplete** contracts required by the mobile app. Existing community discovery, detail, create, update, join/leave, payment, members, posts, announcements, messages, uploads, and report routes remain in use.

Base path: `/api/v1`

## Shared response envelope

Every operation should use the existing backend envelope.

```ts
type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
};

type PagePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
```

All protected endpoints require `Authorization: Bearer <accessToken>`. Object IDs below are strings containing valid MongoDB ObjectIds. Authorization must be enforced by the backend, never inferred from client UI state.

## Shared community DTOs

```ts
type CommunityRole = "owner" | "moderator" | "member";
type CommunityMembershipStatus =
  | "pending"
  | "active"
  | "rejected"
  | "removed"
  | "banned";
type CommunityVisibility = "public" | "private";
type CommunityMembershipType = "free" | "premium";
type CommunityJoinPolicy = "open" | "approval" | "invite_only" | "access_code";
type CommunityMessagePermission = "everyone" | "moderators";

type ViewerMembership = {
  role: CommunityRole;
  status: CommunityMembershipStatus;
  joinedAt: string;
  muted: boolean;
} | null;

type CommunitySummary = {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  avatarImageUrl: string;
  category: string;
  state: string;
  lga: string;
  visibility: CommunityVisibility;
  membershipType: CommunityMembershipType;
  membershipPriceKobo: number;
  memberCount: number;
  viewerMembership: ViewerMembership;
  unreadCount: number;
  lastActivityAt: string | null;
  createdAt: string;
};

type CommunitySettings = {
  joinPolicy: CommunityJoinPolicy;
  messagePermission: CommunityMessagePermission;
  membersCanCreatePosts: boolean;
  membersCanInvite: boolean;
  showMemberList: boolean;
};
```

`GET /communities` should eventually return `memberCount` and `viewerMembership` instead of exposing every member ID in `members`.

---

# P0: required for the core supplied screens

## 1. List my communities

### `GET /users/me/communities`

**Use:** Populates the "My Communities" carousel completely, independent of the public discovery page. It also powers unread badges and membership state.

**Authorization:** Authenticated user.

**Query:**

```ts
type GetMyCommunitiesQuery = {
  page?: number;       // default 1
  limit?: number;      // default 20, maximum 50
  search?: string;
  role?: CommunityRole;
  status?: "pending" | "active";
  unreadOnly?: boolean;
};
```

**Response:**

```ts
type GetMyCommunitiesResponse = ApiSuccess<{
  communities: CommunitySummary[];
  pagination: PagePagination;
}>;
```

---

## 2. Community-specific rules

### `GET /communities/{communityId}/rules`

**Use:** Populates the Rules tab and full Community Rules page. Public rules should be readable for public communities; private-community rules should follow the product privacy policy.

**Authorization:** Optional for public communities; active member for private communities.

**Request body:** None.

**Response:**

```ts
type CommunityRule = {
  _id: string;
  title: string;
  description: string;
  order: number;
};

type CommunityRules = {
  communityId: string;
  introduction: string;
  rules: CommunityRule[];
  consequences: string[];
  updatedAt: string;
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  } | null;
};

type GetCommunityRulesResponse = ApiSuccess<{
  rules: CommunityRules;
}>;
```

### `PUT /communities/{communityId}/rules`

**Use:** Lets owners/moderators publish and reorder the full rules document atomically.

**Authorization:** Owner or moderator.

**Request:**

```ts
type PutCommunityRulesBody = {
  introduction: string; // 1-500 characters
  rules: Array<{
    _id?: string;       // omitted for a new rule
    title: string;      // 2-100 characters
    description: string;// 2-1000 characters
    order: number;
  }>;
  consequences: string[]; // each 1-300 characters
};
```

**Response:**

```ts
type PutCommunityRulesResponse = ApiSuccess<{
  rules: CommunityRules;
}>;
```

---

## 3. Community settings and admins-only messaging

### `GET /communities/{communityId}/settings`

**Use:** Determines join behavior, whether the composer is writable, and which community controls appear.

**Authorization:** Active member. Sensitive owner-only settings should not be returned to ordinary members.

**Response:**

```ts
type GetCommunitySettingsResponse = ApiSuccess<{
  settings: CommunitySettings;
}>;
```

### `PATCH /communities/{communityId}/settings`

**Use:** Enables the reference screen where only admins can send messages, and controls posting/invitation behavior.

**Authorization:** Owner or moderator. The backend must reject unsupported fields.

**Request:**

```ts
type PatchCommunitySettingsBody = Partial<{
  joinPolicy: CommunityJoinPolicy;
  messagePermission: CommunityMessagePermission;
  membersCanCreatePosts: boolean;
  membersCanInvite: boolean;
  showMemberList: boolean;
}>;
```

At least one field is required.

**Response:**

```ts
type PatchCommunitySettingsResponse = ApiSuccess<{
  settings: CommunitySettings;
}>;
```

The existing `POST /communities/{id}/messages` must enforce `messagePermission` server-side and return `403 COMMUNITY_MESSAGE_PERMISSION_DENIED` when applicable.

---

## 4. Rich member list and community roles

### Update existing `GET /communities/{communityId}/members`

**Use:** Populates member search, ADMIN/OWNER badges, join dates, moderation menus, and correct permissions.

**Query:**

```ts
type GetCommunityMembersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: CommunityRole;
  status?: "active" | "banned";
};
```

**Response:**

```ts
type CommunityMember = {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    state: string;
    lga: string;
  };
  communityRole: CommunityRole;
  status: CommunityMembershipStatus;
  joinedAt: string;
  isOnline?: boolean; // only include when backed by real presence state
};

type GetCommunityMembersResponse = ApiSuccess<{
  members: CommunityMember[];
  pagination: PagePagination;
}>;
```

Do not expose member email addresses to other members unless there is an explicit product requirement and consent model.

### `PATCH /communities/{communityId}/members/{userId}`

**Use:** Implements "Make Admin", "Remove Admin", and membership status moderation.

**Authorization:** Owner for role changes. Owner/moderator for allowed status changes. The owner cannot demote or remove themselves without an ownership-transfer flow.

**Request:**

```ts
type PatchCommunityMemberBody = {
  role?: "moderator" | "member";
  status?: "active" | "removed";
};
```

**Response:**

```ts
type PatchCommunityMemberResponse = ApiSuccess<{
  member: CommunityMember;
}>;
```

### `DELETE /communities/{communityId}/members/{userId}`

**Use:** Removes a member from the community.

**Authorization:** Owner or moderator. Moderators cannot remove the owner or another moderator unless explicitly allowed.

**Response:**

```ts
type RemoveCommunityMemberResponse = ApiSuccess<{
  removedUserId: string;
}>;
```

### `PUT /communities/{communityId}/bans/{userId}`

**Use:** Bans an abusive member and prevents immediate rejoining.

**Authorization:** Owner or moderator.

**Request:**

```ts
type BanCommunityMemberBody = {
  reason: string;       // 2-500 characters
  expiresAt?: string;   // ISO timestamp; omitted means permanent
};
```

**Response:**

```ts
type BanCommunityMemberResponse = ApiSuccess<{
  userId: string;
  status: "banned";
  reason: string;
  expiresAt: string | null;
}>;
```

### `DELETE /communities/{communityId}/bans/{userId}`

**Use:** Removes an existing community ban.

**Authorization:** Owner or moderator.

**Response:**

```ts
type UnbanCommunityMemberResponse = ApiSuccess<{
  userId: string;
  status: "removed";
}>;
```

---

## 5. Private-community join requests

### `POST /communities/{communityId}/join-requests`

**Use:** Handles private, approval-based, invite-only, or access-code communities instead of joining them immediately.

**Authorization:** Authenticated non-member.

**Request:**

```ts
type CreateCommunityJoinRequestBody = {
  message?: string;    // maximum 500 characters
  accessCode?: string; // required only for access_code policy
  inviteToken?: string;// required only for invite_only policy
};
```

**Response:**

```ts
type CommunityJoinRequest = {
  _id: string;
  communityId: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
  message: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

type CreateCommunityJoinRequestResponse = ApiSuccess<{
  joinRequest: CommunityJoinRequest;
  membership?: ViewerMembership; // present when a valid code/invite grants immediate access
}>;
```

Use `409 COMMUNITY_MEMBERSHIP_EXISTS` or `409 COMMUNITY_JOIN_REQUEST_EXISTS` for duplicates.

### `GET /communities/{communityId}/join-requests`

**Use:** Owner/moderator review queue.

**Authorization:** Owner or moderator.

**Query:**

```ts
type GetCommunityJoinRequestsQuery = {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
};
```

**Response:**

```ts
type GetCommunityJoinRequestsResponse = ApiSuccess<{
  joinRequests: CommunityJoinRequest[];
  pagination: PagePagination;
}>;
```

### `PATCH /communities/{communityId}/join-requests/{requestId}`

**Use:** Approves or rejects a private-community request.

**Authorization:** Owner or moderator.

**Request:**

```ts
type ReviewCommunityJoinRequestBody = {
  status: "approved" | "rejected";
  note?: string;
};
```

**Response:**

```ts
type ReviewCommunityJoinRequestResponse = ApiSuccess<{
  joinRequest: CommunityJoinRequest;
  member?: CommunityMember; // present when approved
}>;
```

### `DELETE /communities/{communityId}/join-requests/me`

**Use:** Lets the requester cancel a pending request.

**Response:**

```ts
type CancelCommunityJoinRequestResponse = ApiSuccess<{
  joinRequestId: string;
  status: "cancelled";
}>;
```

---

## 6. Community Socket.IO room subscription

Namespace: `/chat`, authenticated with the existing access token.

### Client emits `community:join`

**Use:** Subscribes the connected member to realtime community messages, posts, and announcements.

```ts
type CommunityJoinSocketPayload = {
  communityId: string;
};

type CommunityJoinSocketAck =
  | { success: true; communityId: string }
  | { success: false; code: string; message: string };
```

The server must verify active membership before executing:

```ts
socket.join(`community:${communityId}`);
```

### Client emits `community:leave`

```ts
type CommunityLeaveSocketPayload = {
  communityId: string;
};

type CommunityLeaveSocketAck = {
  success: true;
  communityId: string;
};
```

### Server emits

```ts
type CommunityRealtimeEvents = {
  "community:message:new": CommunityMessage;
  "community:message:updated": CommunityMessage;
  "community:message:deleted": { communityId: string; messageId: string };
  "community:post:new": CommunityPost;
  "community:announcement:new": CommunityAnnouncement;
  "community:member:updated": CommunityMember;
  "community:typing": {
    communityId: string;
    userId: string;
    firstName: string;
    typing: boolean;
  };
};
```

The server should force sockets to leave a room after removal/ban and must not trust a user-provided room name.

---

# P1: required for the complete chat design

## Shared message and attachment DTOs

```ts
type CommunityAttachment = {
  _id: string;
  url: string;
  type: "image" | "pdf" | "file";
  name: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailUrl: string | null;
};

type CommunityMessageAuthor = {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  communityRole: CommunityRole;
};

type CommunityMessage = {
  _id: string;
  communityId: string;
  author: CommunityMessageAuthor;
  clientMessageId: string;
  text: string;
  attachments: CommunityAttachment[];
  replyTo: {
    _id: string;
    authorName: string;
    text: string;
  } | null;
  reactions: Array<{
    emoji: string;
    count: number;
    reactedByViewer: boolean;
  }>;
  pinnedAt: string | null;
  editedAt: string | null;
  createdAt: string;
};
```

## 7. Upload community files

### `POST /uploads/files`

**Use:** Uploads PDF and other supported files before sending the community message.

**Authorization:** Authenticated user.

**Request:** `multipart/form-data`

```ts
type UploadCommunityFileForm = {
  file: Blob;
  folder: "community-chat";
};
```

Recommended constraints: PDF/document allowlist, maximum 10 MB, virus/malware scan, private or signed delivery URLs where appropriate.

**Response:**

```ts
type UploadCommunityFileResponse = ApiSuccess<{
  attachment: CommunityAttachment;
}>;
```

## 8. Extend existing send-message route

### Update `POST /communities/{communityId}/messages`

**Use:** Sends text, images, PDF/files, or replies. Keep `clientMessageId` idempotent per author/community.

**Request:**

```ts
type SendCommunityMessageBody = {
  clientMessageId: string; // 8-128 characters
  text?: string;           // maximum 4000 characters
  attachmentIds?: string[];// maximum 5
  replyToMessageId?: string;
};
```

At least one of `text` or `attachmentIds` is required.

**Response:**

```ts
type SendCommunityMessageResponse = ApiSuccess<{
  message: CommunityMessage;
}>;
```

## 9. Message pagination

### Update `GET /communities/{communityId}/messages`

**Use:** Reliable upward infinite scrolling without page drift when new messages arrive.

**Query:**

```ts
type GetCommunityMessagesQuery = {
  limit?: number;         // default 30, maximum 100
  before?: string;       // opaque cursor
};
```

**Response:**

```ts
type GetCommunityMessagesResponse = ApiSuccess<{
  messages: CommunityMessage[]; // oldest to newest within the returned window
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}>;
```

## 10. Edit and delete messages

### `PATCH /communities/{communityId}/messages/{messageId}`

**Use:** Edits the sender's message.

**Authorization:** Message author; optional moderator override should be audited.

```ts
type EditCommunityMessageBody = {
  text: string;
};

type EditCommunityMessageResponse = ApiSuccess<{
  message: CommunityMessage;
}>;
```

### `DELETE /communities/{communityId}/messages/{messageId}`

**Use:** Deletes the author's message or moderates prohibited content.

**Authorization:** Author, owner, or moderator.

```ts
type DeleteCommunityMessageResponse = ApiSuccess<{
  messageId: string;
  deletedAt: string;
}>;
```

Use soft deletion and keep an auditable moderation record.

## 11. Message reactions

### `PUT /communities/{communityId}/messages/{messageId}/reactions/{emoji}`

**Use:** Adds or replaces the viewer's reaction for the message.

```ts
type PutCommunityReactionResponse = ApiSuccess<{
  messageId: string;
  reactions: CommunityMessage["reactions"];
}>;
```

### `DELETE /communities/{communityId}/messages/{messageId}/reactions/{emoji}`

**Use:** Removes the viewer's reaction.

Response uses `PutCommunityReactionResponse`.

## 12. Pin/unpin messages

### `PUT /communities/{communityId}/messages/{messageId}/pin`

**Use:** Pins important maps, instructions, or meetup messages.

**Authorization:** Owner or moderator.

```ts
type PinCommunityMessageResponse = ApiSuccess<{
  message: CommunityMessage;
}>;
```

### `DELETE /communities/{communityId}/messages/{messageId}/pin`

**Use:** Removes the pin. Same response type.

## 13. Report a community message

### `POST /communities/{communityId}/messages/{messageId}/reports`

**Use:** Reports a specific message rather than the whole community.

```ts
type ReportCommunityMessageBody = {
  reason: "spam" | "harassment" | "hate_speech" | "unsafe" | "inappropriate" | "other";
  details?: string; // maximum 2000 characters
};

type ReportCommunityMessageResponse = ApiSuccess<{
  report: {
    _id: string;
    targetType: "community_message";
    targetId: string;
    status: "open";
    createdAt: string;
  };
}>;
```

## 14. Mark room as read

### `PUT /communities/{communityId}/messages/read`

**Use:** Clears unread badges and stores the viewer's last-read position.

```ts
type MarkCommunityMessagesReadBody = {
  lastReadMessageId: string;
};

type MarkCommunityMessagesReadResponse = ApiSuccess<{
  communityId: string;
  lastReadMessageId: string;
  lastReadAt: string;
  unreadCount: 0;
}>;
```

## 15. Community notification preferences

### `PATCH /communities/{communityId}/notification-preferences/me`

**Use:** Mutes/unmutes community push notifications and chooses notification level.

```ts
type PatchCommunityNotificationPreferencesBody = {
  level: "all" | "announcements" | "mentions" | "muted";
};

type PatchCommunityNotificationPreferencesResponse = ApiSuccess<{
  communityId: string;
  level: "all" | "announcements" | "mentions" | "muted";
  updatedAt: string;
}>;
```

## 16. Typing state

Typing is ephemeral and should use Socket.IO, not REST persistence.

```ts
// Client emits after joining the authorized room.
type CommunityTypingPayload = {
  communityId: string;
  typing: boolean;
};

// Server emits to other authorized members.
type CommunityTypingEvent = {
  communityId: string;
  userId: string;
  firstName: string;
  typing: boolean;
};
```

Rate-limit typing events and automatically expire stale typing state.

---

# P1: community voice/video call flow

A call provider can be selected by the backend, but provider secrets and privileged tokens must never be generated by the Expo client.

## 17. Create a community call

### `POST /communities/{communityId}/calls`

**Use:** Owner/moderator starts a voice or video room.

**Authorization:** Owner/moderator by default.

```ts
type CreateCommunityCallBody = {
  type: "voice" | "video";
  title?: string;
};

type CommunityCall = {
  _id: string;
  communityId: string;
  type: "voice" | "video";
  status: "active" | "ended";
  startedBy: string;
  participantCount: number;
  startedAt: string;
  endedAt: string | null;
};

type CreateCommunityCallResponse = ApiSuccess<{
  call: CommunityCall;
}>;
```

## 18. Get the active call

### `GET /communities/{communityId}/calls/active`

**Use:** Determines whether the phone button should show an active call.

```ts
type GetActiveCommunityCallResponse = ApiSuccess<{
  call: CommunityCall | null;
}>;
```

## 19. Join a call

### `POST /communities/{communityId}/calls/{callId}/join`

**Use:** Validates membership and returns a short-lived provider access token.

```ts
type JoinCommunityCallResponse = ApiSuccess<{
  call: CommunityCall;
  provider: "agora" | "daily" | "livekit";
  roomName: string;
  participantToken: string;
  expiresAt: string;
}>;
```

## 20. End a call

### `DELETE /communities/{communityId}/calls/{callId}`

**Authorization:** Call starter, owner, or moderator.

```ts
type EndCommunityCallResponse = ApiSuccess<{
  call: CommunityCall;
}>;
```

Recommended server events:

```ts
type CommunityCallEvents = {
  "community:call:started": CommunityCall;
  "community:call:updated": CommunityCall;
  "community:call:ended": CommunityCall;
};
```

---

# P2: design and content completeness

## 21. Separate cover and avatar images

### Extend existing `PATCH /communities/{communityId}`

**Use:** The reference design has a wide cover and separate round group avatar. Images are uploaded first through the authenticated upload endpoint, then the returned URLs are persisted here.

```ts
type PatchCommunityBody = Partial<{
  name: string;
  description: string;
  coverImageUrl: string;
  avatarImageUrl: string;
  category: string;
  state: string;
  lga: string;
  visibility: CommunityVisibility;
  membershipType: CommunityMembershipType;
  membershipPriceKobo: number;
}>;

type PatchCommunityResponse = ApiSuccess<{
  community: CommunitySummary & {
    settings: CommunitySettings;
  };
}>;
```

The OpenAPI document and controller validation must expose the same allowlist.

## 22. Edit/delete community posts

```ts
type CommunityPost = {
  _id: string;
  communityId: string;
  author: CommunityMessageAuthor;
  text: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### `PATCH /communities/{communityId}/posts/{postId}`

**Use:** Edits the author's post.

```ts
type PatchCommunityPostBody = {
  text?: string;
  imageUrl?: string | null;
};

type PatchCommunityPostResponse = ApiSuccess<{
  post: CommunityPost;
}>;
```

### `DELETE /communities/{communityId}/posts/{postId}`

**Use:** Author deletion or moderator removal.

```ts
type DeleteCommunityPostResponse = ApiSuccess<{
  postId: string;
  deletedAt: string;
}>;
```

## 23. Edit/delete/pin announcements

```ts
type CommunityAnnouncement = CommunityPost & {
  pinnedAt: string | null;
};
```

### `PATCH /communities/{communityId}/announcements/{announcementId}`

```ts
type PatchCommunityAnnouncementBody = {
  text?: string;
  imageUrl?: string | null;
  pinned?: boolean;
};

type PatchCommunityAnnouncementResponse = ApiSuccess<{
  announcement: CommunityAnnouncement;
}>;
```

### `DELETE /communities/{communityId}/announcements/{announcementId}`

```ts
type DeleteCommunityAnnouncementResponse = ApiSuccess<{
  announcementId: string;
  deletedAt: string;
}>;
```

## 24. Transfer community ownership

### `POST /communities/{communityId}/ownership-transfer`

**Use:** Safely transfers ownership before an owner leaves or removes their account.

**Authorization:** Current owner, with recent authentication confirmation if available.

```ts
type TransferCommunityOwnershipBody = {
  newOwnerId: string;
  currentPassword?: string;
};

type TransferCommunityOwnershipResponse = ApiSuccess<{
  communityId: string;
  previousOwnerId: string;
  newOwnerId: string;
  transferredAt: string;
}>;
```

---

# Required error codes

Recommended stable codes used by the mobile client:

```ts
type CommunityErrorCode =
  | "COMMUNITY_NOT_FOUND"
  | "COMMUNITY_ROOM_NOT_FOUND"
  | "COMMUNITY_MEMBER_REQUIRED"
  | "COMMUNITY_OWNER_REQUIRED"
  | "COMMUNITY_MODERATOR_REQUIRED"
  | "COMMUNITY_MESSAGE_PERMISSION_DENIED"
  | "COMMUNITY_MEMBERSHIP_EXISTS"
  | "COMMUNITY_JOIN_REQUEST_EXISTS"
  | "COMMUNITY_JOIN_REQUEST_NOT_FOUND"
  | "COMMUNITY_ACCESS_CODE_INVALID"
  | "COMMUNITY_INVITE_INVALID"
  | "COMMUNITY_MEMBER_BANNED"
  | "COMMUNITY_OWNER_CANNOT_LEAVE"
  | "COMMUNITY_MESSAGE_NOT_FOUND"
  | "COMMUNITY_ATTACHMENT_INVALID"
  | "COMMUNITY_CALL_NOT_FOUND"
  | "COMMUNITY_CALL_ENDED";
```

Use HTTP statuses consistently:

- `400` malformed request or invalid state transition.
- `401` missing/expired authentication.
- `403` authenticated but not authorized.
- `404` resource unavailable to the caller.
- `409` duplicate membership/request or conflicting transition.
- `413` file too large.
- `422` schema validation failure.
- `429` rate limit exceeded.

# Recommended implementation order

1. My Communities and safer discovery summary fields.
2. Rich member roles plus member moderation.
3. Community settings and admins-only messages.
4. Rules read/write operations.
5. Private-community join requests.
6. Socket community join/leave plus realtime messages.
7. Read state/unread counts and notification preferences.
8. File attachments and richer message actions.
9. Separate avatar/cover images and content management.
10. Voice/video calls.
