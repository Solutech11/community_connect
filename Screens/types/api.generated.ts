// Generated from the running Community Connect OpenAPI document. Do not edit manually.

export type PostAuthRegisterBody = {
  "firstName": string;
  "lastName": string;
  "email": string;
  "password": string;
  "phone"?: string;
  "location"?: {
    "type"?: "Point";
    "coordinates"?: Array<number>;
  };
};
export type PostAuthRegisterQuery = {

};
export type PostAuthRegisterPath = {

};
export type PostAuthRegisterHeaders = {

};
export type PostAuthRegisterResponse = {
  "success": true;
  "message": string;
  "data": {
    "userId": string;
    "email": string;
  };
};

export type PostAuthVerifyEmailBody = {
  "email": string;
  "otp": string;
};
export type PostAuthVerifyEmailQuery = {

};
export type PostAuthVerifyEmailPath = {

};
export type PostAuthVerifyEmailHeaders = {

};
export type PostAuthVerifyEmailResponse = {
  "success": true;
  "message": string;
  "data": {
    "user": {
      "_id": string;
      "firstName": string;
      "lastName": string;
      "email": string;
      "role": string;
      "status": string;
      "state": string;
      "lga": string;
      "interests": Array<string>;
      "avatarUrl": string;
      "createdAt": string;
      "phone": string;
      "bio": string;
      "country": string;
      "location": {
        "type": string;
        "coordinates": Array<number>;
      };
      "preferredSetting": string;
      "preferredGroupSize": string;
      "participationRole": string;
      "hobbies": Array<string>;
    };
    "session": {
      "accessToken": string;
      "refreshToken": string;
      "accessTokenExpiresIn": string;
    };
  };
};

export type PostAuthResendVerificationBody = {
  "email": string;
};
export type PostAuthResendVerificationQuery = {

};
export type PostAuthResendVerificationPath = {

};
export type PostAuthResendVerificationHeaders = {

};
export type PostAuthResendVerificationResponse = {
  "success": true;
  "message": string;
};

export type PostAuthLoginBody = {
  "email": string;
  "password": string;
};
export type PostAuthLoginQuery = {

};
export type PostAuthLoginPath = {

};
export type PostAuthLoginHeaders = {

};
export type PostAuthLoginResponse = {
  "success": true;
  "message": string;
  "data": {
    "user": {
      "_id": string;
      "firstName": string;
      "lastName": string;
      "email": string;
      "role": string;
      "status": string;
      "state": string;
      "lga": string;
      "interests": Array<string>;
      "avatarUrl": string;
      "createdAt": string;
      "phone": string;
      "bio": string;
      "country": string;
      "location": {
        "type": string;
        "coordinates": Array<number>;
      };
      "preferredSetting": string;
      "preferredGroupSize": string;
      "participationRole": string;
      "hobbies": Array<string>;
    };
    "session": {
      "accessToken": string;
      "refreshToken": string;
      "accessTokenExpiresIn": string;
    };
  };
};

export type PostAuthRefreshBody = {
  "refreshToken": string;
};
export type PostAuthRefreshQuery = {

};
export type PostAuthRefreshPath = {

};
export type PostAuthRefreshHeaders = {

};
export type PostAuthRefreshResponse = {
  "success": true;
  "message": string;
  "data": {
    "session": {
      "accessToken": string;
      "refreshToken": string;
      "accessTokenExpiresIn": string;
    };
  };
};

export type PostAuthLogoutBody = {
  "refreshToken": string;
};
export type PostAuthLogoutQuery = {

};
export type PostAuthLogoutPath = {

};
export type PostAuthLogoutHeaders = {

};
export type PostAuthLogoutResponse = {
  "success": true;
  "message": string;
};

export type PostAuthForgotPasswordBody = {
  "email": string;
};
export type PostAuthForgotPasswordQuery = {

};
export type PostAuthForgotPasswordPath = {

};
export type PostAuthForgotPasswordHeaders = {

};
export type PostAuthForgotPasswordResponse = {
  "success": true;
  "message": string;
};

export type PostAuthResetPasswordBody = {
  "email": string;
  "otp": string;
  "newPassword": string;
};
export type PostAuthResetPasswordQuery = {

};
export type PostAuthResetPasswordPath = {

};
export type PostAuthResetPasswordHeaders = {

};
export type PostAuthResetPasswordResponse = {
  "success": true;
  "message": string;
};

export type GetLocationsSearchBody = never;
export type GetLocationsSearchQuery = {
  "q": string;
  "countryCode"?: string;
  "latitude"?: number;
  "longitude"?: number;
  "limit"?: number;
};
export type GetLocationsSearchPath = {

};
export type GetLocationsSearchHeaders = {

};
export type GetLocationsSearchResponse = {
  "success": true;
  "message": string;
  "data": {
    "results": Array<{
        "id": string;
        "name": string;
        "label": string;
        "address": string;
        "latitude": number;
        "longitude": number;
        "state": string | null;
        "localArea": string | null;
      }>;
    "attribution": string;
  };
};

export type GetUsersMeBody = never;
export type GetUsersMeQuery = {

};
export type GetUsersMePath = {

};
export type GetUsersMeHeaders = {

};
export type GetUsersMeResponse = {
  "success": true;
  "message": string;
  "data": {
    "user": {
      "_id": string;
      "firstName": string;
      "lastName": string;
      "email": string;
      "role": string;
      "status": string;
      "state": string;
      "lga": string;
      "interests": Array<string>;
      "avatarUrl": string;
      "createdAt": string;
      "phone": string;
      "bio": string;
      "country": string;
      "location": {
        "type": string;
        "coordinates": Array<number>;
      };
      "preferredSetting": string;
      "preferredGroupSize": string;
      "participationRole": string;
      "hobbies": Array<string>;
    };
    "totals": {
      "connections": number;
      "events": number;
    };
  };
};

export type PatchUsersMeBody = {
  "firstName"?: string;
  "lastName"?: string;
  "phone"?: string;
  "bio"?: string;
  "avatarUrl"?: string;
  "country"?: string;
  "state"?: string;
  "lga"?: string;
  "location"?: {
    "type"?: "Point";
    "coordinates": [number, number];
  };
  "interests"?: Array<string>;
  "preferredSetting"?: "indoor" | "outdoor";
  "preferredGroupSize"?: "small" | "medium" | "large";
  "participationRole"?: "participant" | "organizer";
  "hobbies"?: Array<string>;
};
export type PatchUsersMeQuery = {

};
export type PatchUsersMePath = {

};
export type PatchUsersMeHeaders = {

};
export type PatchUsersMeResponse = {
  "success": true;
  "message": string;
  "data": {
    "user": {
      "_id": string;
      "firstName": string;
      "lastName": string;
      "email": string;
      "role": string;
      "status": string;
      "state": string;
      "lga": string;
      "interests": Array<string>;
      "avatarUrl": string;
      "createdAt": string;
      "phone": string;
      "bio": string;
      "country": string;
      "location": {
        "type": string;
        "coordinates": Array<number>;
      };
      "preferredSetting": string;
      "preferredGroupSize": string;
      "participationRole": string;
      "hobbies": Array<string>;
    };
  };
};

export type DeleteUsersMeBody = {
  "password": string;
};
export type DeleteUsersMeQuery = {

};
export type DeleteUsersMePath = {

};
export type DeleteUsersMeHeaders = {

};
export type DeleteUsersMeResponse = {
  "success": true;
  "message": string;
};

export type PatchUsersMeAvatarBody = {
  "image": string;
};
export type PatchUsersMeAvatarQuery = {

};
export type PatchUsersMeAvatarPath = {

};
export type PatchUsersMeAvatarHeaders = {

};
export type PatchUsersMeAvatarResponse = {
  "success": true;
  "message": string;
  "data": {
    "user": {
      "_id": string;
      "firstName": string;
      "lastName": string;
      "email": string;
      "role": string;
      "status": string;
      "state": string;
      "lga": string;
      "interests": Array<string>;
      "avatarUrl": string;
      "createdAt": string;
      "phone": string;
      "bio": string;
      "country": string;
      "location": {
        "type": string;
        "coordinates": Array<number>;
      };
      "preferredSetting": string;
      "preferredGroupSize": string;
      "participationRole": string;
      "hobbies": Array<string>;
    };
  };
};

export type PatchUsersMePasswordBody = {
  "currentPassword": string;
  "newPassword": string;
};
export type PatchUsersMePasswordQuery = {

};
export type PatchUsersMePasswordPath = {

};
export type PatchUsersMePasswordHeaders = {

};
export type PatchUsersMePasswordResponse = {
  "success": true;
  "message": string;
};

export type PostUsersMePushTokensBody = {
  "token": string;
};
export type PostUsersMePushTokensQuery = {

};
export type PostUsersMePushTokensPath = {

};
export type PostUsersMePushTokensHeaders = {

};
export type PostUsersMePushTokensResponse = {
  "success": true;
  "message": string;
};

export type DeleteUsersMePushTokensBody = {
  "token": string;
};
export type DeleteUsersMePushTokensQuery = {

};
export type DeleteUsersMePushTokensPath = {

};
export type DeleteUsersMePushTokensHeaders = {

};
export type DeleteUsersMePushTokensResponse = {
  "success": true;
  "message": string;
};

export type PostUsersIdReportsBody = {
  "reason": "spam" | "harassment" | "hate" | "violence" | "scam" | "unsafe" | "misinformation" | "other";
  "details"?: string;
};
export type PostUsersIdReportsQuery = {

};
export type PostUsersIdReportsPath = {
  "id": string;
};
export type PostUsersIdReportsHeaders = {

};
export type PostUsersIdReportsResponse = {
  "success": true;
  "message": string;
  "data": {
    "report": {
      "_id": string;
      "targetType": string;
      "targetId": string;
      "reason": string;
      "status": string;
      "createdAt": string;
    };
  };
};

export type GetUsersMeCommunitiesBody = never;
export type GetUsersMeCommunitiesQuery = {
  "page"?: number;
  "limit"?: number;
  "search"?: string;
  "role"?: "owner" | "moderator" | "member";
  "status"?: "pending" | "active";
  "unreadOnly"?: "true" | "false";
};
export type GetUsersMeCommunitiesPath = {

};
export type GetUsersMeCommunitiesHeaders = {

};
export type GetUsersMeCommunitiesResponse = {
  "success": true;
  "message": string;
  "data": {
    "communities": Array<{
        "_id": string;
        "ownerId": string;
        "name": string;
        "slug": string;
        "description": string;
        "imageUrl": string;
        "category": string;
        "state": string;
        "lga": string;
        "visibility": string;
        "membershipType": string;
        "membershipPriceKobo": number;
        "members": Array<string>;
        "createdAt": string;
        "coverImageUrl": string;
        "avatarImageUrl": string;
        "memberCount": number;
        "viewerMembership": {
          "role": string;
          "status": string;
          "joinedAt": string;
          "muted": false;
        };
        "unreadCount": number;
        "lastActivityAt": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
      "totalPages": number;
    };
  };
};

export type GetCommunitiesIdRulesBody = never;
export type GetCommunitiesIdRulesQuery = {

};
export type GetCommunitiesIdRulesPath = {
  "id": string;
};
export type GetCommunitiesIdRulesHeaders = {

};
export type GetCommunitiesIdRulesResponse = {
  "success": true;
  "message": string;
  "data": {
    "rules": {
      "communityId": string;
      "introduction": string;
      "rules": Array<{
          "_id": string;
          "title": string;
          "description": string;
          "order": number;
        }>;
      "consequences": Array<string>;
      "updatedAt": string;
      "updatedBy": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
    };
  };
};

export type PutCommunitiesIdRulesBody = {
  "introduction": string;
  "rules": Array<{
      "title"?: string;
      "description"?: string;
      "order"?: number;
    }>;
  "consequences": Array<string>;
};
export type PutCommunitiesIdRulesQuery = {

};
export type PutCommunitiesIdRulesPath = {
  "id": string;
};
export type PutCommunitiesIdRulesHeaders = {

};
export type PutCommunitiesIdRulesResponse = {
  "success": true;
  "message": string;
  "data": {
    "rules": {
      "communityId": string;
      "introduction": string;
      "rules": Array<unknown>;
      "consequences": Array<unknown>;
      "updatedAt": string;
      "updatedBy": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
    };
  };
};

export type GetCommunitiesIdSettingsBody = never;
export type GetCommunitiesIdSettingsQuery = {

};
export type GetCommunitiesIdSettingsPath = {
  "id": string;
};
export type GetCommunitiesIdSettingsHeaders = {

};
export type GetCommunitiesIdSettingsResponse = {
  "success": true;
  "message": string;
  "data": {
    "settings": {
      "joinPolicy": string;
      "messagePermission": string;
      "membersCanCreatePosts": true;
      "membersCanInvite": false;
      "showMemberList": true;
    };
  };
};

export type PatchCommunitiesIdSettingsBody = {
  "joinPolicy"?: "open" | "approval" | "invite_only" | "access_code";
  "accessCode"?: string;
  "messagePermission"?: "everyone" | "moderators";
  "membersCanCreatePosts"?: boolean;
  "membersCanInvite"?: boolean;
  "showMemberList"?: boolean;
};
export type PatchCommunitiesIdSettingsQuery = {

};
export type PatchCommunitiesIdSettingsPath = {
  "id": string;
};
export type PatchCommunitiesIdSettingsHeaders = {

};
export type PatchCommunitiesIdSettingsResponse = {
  "success": true;
  "message": string;
  "data": {
    "settings": {
      "joinPolicy": string;
      "messagePermission": string;
      "membersCanCreatePosts": true;
      "membersCanInvite": false;
      "showMemberList": true;
    };
  };
};

export type PatchCommunitiesIdMembersUserIdBody = {
  "role"?: "moderator" | "member";
  "status"?: "active" | "removed";
};
export type PatchCommunitiesIdMembersUserIdQuery = {

};
export type PatchCommunitiesIdMembersUserIdPath = {
  "id": string;
  "userId": string;
};
export type PatchCommunitiesIdMembersUserIdHeaders = {

};
export type PatchCommunitiesIdMembersUserIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "member": {
      "user": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "communityRole": string;
      "status": string;
      "joinedAt": string;
    };
  };
};

export type DeleteCommunitiesIdMembersUserIdBody = never;
export type DeleteCommunitiesIdMembersUserIdQuery = {

};
export type DeleteCommunitiesIdMembersUserIdPath = {
  "id": string;
  "userId": string;
};
export type DeleteCommunitiesIdMembersUserIdHeaders = {

};
export type DeleteCommunitiesIdMembersUserIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "removedUserId": string;
  };
};

export type PutCommunitiesIdBansUserIdBody = {
  "reason": string;
  "expiresAt"?: string;
};
export type PutCommunitiesIdBansUserIdQuery = {

};
export type PutCommunitiesIdBansUserIdPath = {
  "id": string;
  "userId": string;
};
export type PutCommunitiesIdBansUserIdHeaders = {

};
export type PutCommunitiesIdBansUserIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "userId": string;
    "status": string;
    "reason": string;
    "expiresAt": string;
  };
};

export type DeleteCommunitiesIdBansUserIdBody = never;
export type DeleteCommunitiesIdBansUserIdQuery = {

};
export type DeleteCommunitiesIdBansUserIdPath = {
  "id": string;
  "userId": string;
};
export type DeleteCommunitiesIdBansUserIdHeaders = {

};
export type DeleteCommunitiesIdBansUserIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "userId": string;
    "status": string;
  };
};

export type PostCommunitiesIdJoinRequestsBody = {
  "message"?: string;
};
export type PostCommunitiesIdJoinRequestsQuery = {

};
export type PostCommunitiesIdJoinRequestsPath = {
  "id": string;
};
export type PostCommunitiesIdJoinRequestsHeaders = {

};
export type PostCommunitiesIdJoinRequestsResponse = {
  "success": true;
  "message": string;
  "data": {
    "joinRequest": {
      "_id": string;
      "communityId": string;
      "requesterId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "message": string;
      "status": string;
      "createdAt": string;
    };
  };
};

export type GetCommunitiesIdJoinRequestsBody = never;
export type GetCommunitiesIdJoinRequestsQuery = {
  "page"?: number;
  "limit"?: number;
  "status"?: "pending" | "approved" | "rejected";
};
export type GetCommunitiesIdJoinRequestsPath = {
  "id": string;
};
export type GetCommunitiesIdJoinRequestsHeaders = {

};
export type GetCommunitiesIdJoinRequestsResponse = {
  "success": true;
  "message": string;
  "data": {
    "joinRequests": Array<unknown>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
      "totalPages": number;
    };
  };
};

export type PostCommunitiesIdInvitesBody = {
  "expiresAt": string;
  "maxUses"?: number;
};
export type PostCommunitiesIdInvitesQuery = {

};
export type PostCommunitiesIdInvitesPath = {
  "id": string;
};
export type PostCommunitiesIdInvitesHeaders = {

};
export type PostCommunitiesIdInvitesResponse = {
  "success": true;
  "message": string;
  "data": {
    "invite": {
      "_id": string;
      "token": string;
      "expiresAt": string;
      "maxUses": number;
    };
  };
};

export type PatchCommunitiesIdJoinRequestsRequestIdBody = {
  "status": "approved" | "rejected";
  "note"?: string;
};
export type PatchCommunitiesIdJoinRequestsRequestIdQuery = {

};
export type PatchCommunitiesIdJoinRequestsRequestIdPath = {
  "id": string;
  "requestId": string;
};
export type PatchCommunitiesIdJoinRequestsRequestIdHeaders = {

};
export type PatchCommunitiesIdJoinRequestsRequestIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "joinRequest": {
      "_id": string;
      "status": string;
    };
    "member": {
      "user": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "communityRole": string;
      "status": string;
      "joinedAt": string;
    };
  };
};

export type DeleteCommunitiesIdJoinRequestsMeBody = never;
export type DeleteCommunitiesIdJoinRequestsMeQuery = {

};
export type DeleteCommunitiesIdJoinRequestsMePath = {
  "id": string;
};
export type DeleteCommunitiesIdJoinRequestsMeHeaders = {

};
export type DeleteCommunitiesIdJoinRequestsMeResponse = {
  "success": true;
  "message": string;
  "data": {
    "joinRequestId": string;
    "status": string;
  };
};

export type PostCommunitiesIdCallsBody = {
  "type": "voice" | "video";
  "title"?: string;
};
export type PostCommunitiesIdCallsQuery = {

};
export type PostCommunitiesIdCallsPath = {
  "id": string;
};
export type PostCommunitiesIdCallsHeaders = {

};
export type PostCommunitiesIdCallsResponse = {
  "success": true;
  "message": string;
  "data": {
    "call": {
      "_id": string;
      "communityId": string;
      "type": string;
      "status": string;
      "startedBy": string;
      "participantCount": number;
      "startedAt": string;
      "endedAt": null;
    };
  };
};

export type GetCommunitiesIdCallsActiveBody = never;
export type GetCommunitiesIdCallsActiveQuery = {

};
export type GetCommunitiesIdCallsActivePath = {
  "id": string;
};
export type GetCommunitiesIdCallsActiveHeaders = {

};
export type GetCommunitiesIdCallsActiveResponse = {
  "success": true;
  "message": string;
  "data": {
    "call": {
      "_id": string;
      "communityId": string;
      "type": string;
      "status": string;
      "startedBy": string;
      "participantCount": number;
      "startedAt": string;
      "endedAt": null;
    };
  };
};

export type PostCommunitiesIdCallsCallIdJoinBody = never;
export type PostCommunitiesIdCallsCallIdJoinQuery = {

};
export type PostCommunitiesIdCallsCallIdJoinPath = {
  "id": string;
  "callId": string;
};
export type PostCommunitiesIdCallsCallIdJoinHeaders = {

};
export type PostCommunitiesIdCallsCallIdJoinResponse = {
  "success": true;
  "message": string;
  "data": {
    "call": {
      "_id": string;
      "communityId": string;
      "type": string;
      "status": string;
      "startedBy": string;
      "participantCount": number;
      "startedAt": string;
      "endedAt": null;
    };
    "provider": string;
    "roomName": string;
    "participantToken": string;
    "expiresAt": string;
  };
};

export type DeleteCommunitiesIdCallsCallIdBody = never;
export type DeleteCommunitiesIdCallsCallIdQuery = {

};
export type DeleteCommunitiesIdCallsCallIdPath = {
  "id": string;
  "callId": string;
};
export type DeleteCommunitiesIdCallsCallIdHeaders = {

};
export type DeleteCommunitiesIdCallsCallIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "call": {
      "_id": string;
      "communityId": string;
      "type": string;
      "status": string;
      "startedBy": string;
      "participantCount": number;
      "startedAt": string;
      "endedAt": string;
    };
  };
};

export type PostCommunitiesIdOwnershipTransferBody = {
  "newOwnerId": string;
  "currentPassword"?: string;
};
export type PostCommunitiesIdOwnershipTransferQuery = {

};
export type PostCommunitiesIdOwnershipTransferPath = {
  "id": string;
};
export type PostCommunitiesIdOwnershipTransferHeaders = {

};
export type PostCommunitiesIdOwnershipTransferResponse = {
  "success": true;
  "message": string;
  "data": {
    "communityId": string;
    "previousOwnerId": string;
    "newOwnerId": string;
    "transferredAt": string;
  };
};

export type PutCommunitiesIdMessagesReadBody = {
  "lastReadMessageId": string;
};
export type PutCommunitiesIdMessagesReadQuery = {

};
export type PutCommunitiesIdMessagesReadPath = {
  "id": string;
};
export type PutCommunitiesIdMessagesReadHeaders = {

};
export type PutCommunitiesIdMessagesReadResponse = {
  "success": true;
  "message": string;
  "data": {
    "communityId": string;
    "lastReadMessageId": string;
    "lastReadAt": string;
    "unreadCount": number;
  };
};

export type PatchCommunitiesIdNotificationPreferencesMeBody = {
  "level": "all" | "announcements" | "mentions" | "muted";
};
export type PatchCommunitiesIdNotificationPreferencesMeQuery = {

};
export type PatchCommunitiesIdNotificationPreferencesMePath = {
  "id": string;
};
export type PatchCommunitiesIdNotificationPreferencesMeHeaders = {

};
export type PatchCommunitiesIdNotificationPreferencesMeResponse = {
  "success": true;
  "message": string;
  "data": {
    "communityId": string;
    "level": string;
    "updatedAt": string;
  };
};

export type PatchCommunitiesIdAnnouncementsAnnouncementIdBody = {
  "text"?: string;
  "imageUrl"?: string;
  "pinned"?: boolean;
};
export type PatchCommunitiesIdAnnouncementsAnnouncementIdQuery = {

};
export type PatchCommunitiesIdAnnouncementsAnnouncementIdPath = {
  "id": string;
  "announcementId": string;
};
export type PatchCommunitiesIdAnnouncementsAnnouncementIdHeaders = {

};
export type PatchCommunitiesIdAnnouncementsAnnouncementIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "announcement": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
    };
  };
};

export type DeleteCommunitiesIdAnnouncementsAnnouncementIdBody = never;
export type DeleteCommunitiesIdAnnouncementsAnnouncementIdQuery = {

};
export type DeleteCommunitiesIdAnnouncementsAnnouncementIdPath = {
  "id": string;
  "announcementId": string;
};
export type DeleteCommunitiesIdAnnouncementsAnnouncementIdHeaders = {

};
export type DeleteCommunitiesIdAnnouncementsAnnouncementIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "announcementId": string;
    "deletedAt": string;
  };
};

export type PatchCommunitiesIdMessagesMessageIdBody = {
  "text": string;
};
export type PatchCommunitiesIdMessagesMessageIdQuery = {

};
export type PatchCommunitiesIdMessagesMessageIdPath = {
  "id": string;
  "messageId": string;
};
export type PatchCommunitiesIdMessagesMessageIdHeaders = {

};
export type PatchCommunitiesIdMessagesMessageIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "message": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
      "clientMessageId": string;
    };
  };
};

export type DeleteCommunitiesIdMessagesMessageIdBody = never;
export type DeleteCommunitiesIdMessagesMessageIdQuery = {

};
export type DeleteCommunitiesIdMessagesMessageIdPath = {
  "id": string;
  "messageId": string;
};
export type DeleteCommunitiesIdMessagesMessageIdHeaders = {

};
export type DeleteCommunitiesIdMessagesMessageIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "messageId": string;
    "deletedAt": string;
  };
};

export type PutCommunitiesIdMessagesMessageIdReactionsEmojiBody = never;
export type PutCommunitiesIdMessagesMessageIdReactionsEmojiQuery = {

};
export type PutCommunitiesIdMessagesMessageIdReactionsEmojiPath = {
  "id": string;
  "messageId": string;
  "emoji": string;
};
export type PutCommunitiesIdMessagesMessageIdReactionsEmojiHeaders = {

};
export type PutCommunitiesIdMessagesMessageIdReactionsEmojiResponse = {
  "success": true;
  "message": string;
  "data": {
    "messageId": string;
    "reactions": Array<{
        "emoji": string;
        "count": number;
        "reactedByViewer": true;
      }>;
  };
};

export type DeleteCommunitiesIdMessagesMessageIdReactionsEmojiBody = never;
export type DeleteCommunitiesIdMessagesMessageIdReactionsEmojiQuery = {

};
export type DeleteCommunitiesIdMessagesMessageIdReactionsEmojiPath = {
  "id": string;
  "messageId": string;
  "emoji": string;
};
export type DeleteCommunitiesIdMessagesMessageIdReactionsEmojiHeaders = {

};
export type DeleteCommunitiesIdMessagesMessageIdReactionsEmojiResponse = {
  "success": true;
  "message": string;
  "data": {
    "messageId": string;
    "reactions": Array<{
        "emoji": string;
        "count": number;
        "reactedByViewer": false;
      }>;
  };
};

export type PutCommunitiesIdMessagesMessageIdPinBody = never;
export type PutCommunitiesIdMessagesMessageIdPinQuery = {

};
export type PutCommunitiesIdMessagesMessageIdPinPath = {
  "id": string;
  "messageId": string;
};
export type PutCommunitiesIdMessagesMessageIdPinHeaders = {

};
export type PutCommunitiesIdMessagesMessageIdPinResponse = {
  "success": true;
  "message": string;
  "data": {
    "message": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
      "clientMessageId": string;
    };
  };
};

export type DeleteCommunitiesIdMessagesMessageIdPinBody = never;
export type DeleteCommunitiesIdMessagesMessageIdPinQuery = {

};
export type DeleteCommunitiesIdMessagesMessageIdPinPath = {
  "id": string;
  "messageId": string;
};
export type DeleteCommunitiesIdMessagesMessageIdPinHeaders = {

};
export type DeleteCommunitiesIdMessagesMessageIdPinResponse = {
  "success": true;
  "message": string;
  "data": {
    "message": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
      "clientMessageId": string;
    };
  };
};

export type PatchCommunitiesIdPostsPostIdBody = {
  "text"?: string;
  "imageUrl"?: string;
};
export type PatchCommunitiesIdPostsPostIdQuery = {

};
export type PatchCommunitiesIdPostsPostIdPath = {
  "id": string;
  "postId": string;
};
export type PatchCommunitiesIdPostsPostIdHeaders = {

};
export type PatchCommunitiesIdPostsPostIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "post": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
    };
  };
};

export type DeleteCommunitiesIdPostsPostIdBody = never;
export type DeleteCommunitiesIdPostsPostIdQuery = {

};
export type DeleteCommunitiesIdPostsPostIdPath = {
  "id": string;
  "postId": string;
};
export type DeleteCommunitiesIdPostsPostIdHeaders = {

};
export type DeleteCommunitiesIdPostsPostIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "postId": string;
    "deletedAt": string;
  };
};

export type GetEventsBody = never;
export type GetEventsQuery = {
  "page"?: number;
  "limit"?: number;
  "search"?: string;
  "state"?: string;
  "lga"?: string;
  "activityType"?: string;
  "latitude"?: number;
  "longitude"?: number;
  "radiusKm"?: number;
};
export type GetEventsPath = {

};
export type GetEventsHeaders = {

};
export type GetEventsResponse = {
  "success": true;
  "message": string;
  "data": {
    "events": Array<{
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      }>;
    "sort": string;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PostEventsBody = {
  "title": string;
  "description": string;
  "coverImageUrl"?: string;
  "activityType": string;
  "targetAudience"?: string;
  "setting": "indoor" | "outdoor" | "online" | "hybrid";
  "country"?: string;
  "state": string;
  "lga": string;
  "venueName": string;
  "address": string;
  "coordinates"?: {
    "type"?: "Point";
    "coordinates"?: Array<number>;
  };
  "startsAt": string;
  "endsAt": string;
  "timezone"?: string;
  "contactPhone"?: string;
  "maxCapacity": number;
  "tags"?: Array<string>;
};
export type PostEventsQuery = {

};
export type PostEventsPath = {

};
export type PostEventsHeaders = {

};
export type PostEventsResponse = {
  "success": true;
  "message": string;
  "data": {
    "event": {
      "_id": string;
      "creatorId": string;
      "title": string;
      "slug": string;
      "description": string;
      "coverImageUrl": string;
      "activityType": string;
      "setting": string;
      "country": string;
      "state": string;
      "lga": string;
      "venueName": string;
      "address": string;
      "startsAt": string;
      "endsAt": string;
      "timezone": string;
      "maxCapacity": number;
      "tags": Array<string>;
      "status": string;
      "moderation": {
        "provider": string;
        "model": string;
        "verdict": string;
        "reviewedAt": string;
        "reasons": Array<unknown>;
        "checks": {
          "content": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "image": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "pricing": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "communityGuidelines": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
        };
      };
      "approvedAt": string;
      "publishedAt": string;
      "createdAt": string;
    };
  };
};

export type GetEventsRecommendedBody = never;
export type GetEventsRecommendedQuery = {
  "latitude"?: number;
  "longitude"?: number;
  "radiusKm"?: number;
  "limit"?: number;
};
export type GetEventsRecommendedPath = {

};
export type GetEventsRecommendedHeaders = {

};
export type GetEventsRecommendedResponse = {
  "success": true;
  "message": string;
  "data": {
    "events": Array<{
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
        "distanceKm": number;
        "recommendationScore": number;
      }>;
    "locationUsed": {
      "latitude": number;
      "longitude": number;
    };
  };
};

export type GetEventsCreatedMeBody = never;
export type GetEventsCreatedMeQuery = {

};
export type GetEventsCreatedMePath = {

};
export type GetEventsCreatedMeHeaders = {

};
export type GetEventsCreatedMeResponse = {
  "success": true;
  "message": string;
  "data": {
    "events": Array<{
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      }>;
  };
};

export type GetEventsIdBody = never;
export type GetEventsIdQuery = {

};
export type GetEventsIdPath = {
  "id": string;
};
export type GetEventsIdHeaders = {

};
export type GetEventsIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "event": {
      "_id": string;
      "creatorId": string;
      "title": string;
      "slug": string;
      "description": string;
      "coverImageUrl": string;
      "activityType": string;
      "setting": string;
      "country": string;
      "state": string;
      "lga": string;
      "venueName": string;
      "address": string;
      "startsAt": string;
      "endsAt": string;
      "timezone": string;
      "maxCapacity": number;
      "tags": Array<string>;
      "status": string;
      "moderation": {
        "provider": string;
        "model": string;
        "verdict": string;
        "reviewedAt": string;
        "reasons": Array<unknown>;
        "checks": {
          "content": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "image": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "pricing": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "communityGuidelines": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
        };
      };
      "approvedAt": string;
      "publishedAt": string;
      "createdAt": string;
    };
    "ticketTypes": Array<{
        "_id": string;
        "eventId": string;
        "title": string;
        "description": string;
        "priceKobo": number;
        "capacity": number;
        "sold": number;
        "reserved": number;
        "active": true;
      }>;
  };
};

export type PatchEventsIdBody = {
  "title"?: string;
  "description"?: string;
  "startsAt"?: string;
  "endsAt"?: string;
  "maxCapacity"?: number;
  "setting"?: "indoor" | "outdoor" | "online" | "hybrid";
  "coordinates"?: {
    "type": "Point";
    "coordinates": [number, number];
  };
};
export type PatchEventsIdQuery = {

};
export type PatchEventsIdPath = {
  "id": string;
};
export type PatchEventsIdHeaders = {

};
export type PatchEventsIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "event": {
      "_id": string;
      "creatorId": string;
      "title": string;
      "slug": string;
      "description": string;
      "coverImageUrl": string;
      "activityType": string;
      "setting": string;
      "country": string;
      "state": string;
      "lga": string;
      "venueName": string;
      "address": string;
      "startsAt": string;
      "endsAt": string;
      "timezone": string;
      "maxCapacity": number;
      "tags": Array<string>;
      "status": string;
      "moderation": {
        "provider": string;
        "model": string;
        "verdict": string;
        "reviewedAt": string;
        "reasons": Array<unknown>;
        "checks": {
          "content": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "image": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "pricing": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "communityGuidelines": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
        };
      };
      "approvedAt": string;
      "publishedAt": string;
      "createdAt": string;
    };
  };
};

export type DeleteEventsIdBody = never;
export type DeleteEventsIdQuery = {

};
export type DeleteEventsIdPath = {
  "id": string;
};
export type DeleteEventsIdHeaders = {

};
export type DeleteEventsIdResponse = {
  "success": true;
  "message": string;
};

export type PostEventsIdOrdersBody = {
  "ticketTypeId": string;
  "quantity": number;
};
export type PostEventsIdOrdersQuery = {

};
export type PostEventsIdOrdersPath = {
  "id": string;
};
export type PostEventsIdOrdersHeaders = {
  "Idempotency-Key": string;
};
export type PostEventsIdOrdersResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "_id": string;
      "orderNumber": string;
      "eventId": {
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      };
      "ticketTypeId": {
        "_id": string;
        "eventId": string;
        "title": string;
        "description": string;
        "priceKobo": number;
        "capacity": number;
        "sold": number;
        "reserved": number;
        "active": true;
      };
      "quantity": number;
      "ticketSubtotalKobo": number;
      "platformFeeKobo": number;
      "totalKobo": number;
      "status": string;
      "createdAt": string;
    };
    "checkoutUrl": string;
    "accessCode": string;
    "publicKey": string;
    "charge": {
      "ticketSubtotalKobo": number;
      "platformFeeKobo": number;
      "totalPayableKobo": number;
    };
  };
};

export type PostEventsIdPublishBody = never;
export type PostEventsIdPublishQuery = {

};
export type PostEventsIdPublishPath = {
  "id": string;
};
export type PostEventsIdPublishHeaders = {

};
export type PostEventsIdPublishResponse = {
  "success": true;
  "message": string;
  "data": {
    "event": {
      "_id": string;
      "creatorId": string;
      "title": string;
      "slug": string;
      "description": string;
      "coverImageUrl": string;
      "activityType": string;
      "setting": string;
      "country": string;
      "state": string;
      "lga": string;
      "venueName": string;
      "address": string;
      "startsAt": string;
      "endsAt": string;
      "timezone": string;
      "maxCapacity": number;
      "tags": Array<string>;
      "status": string;
      "moderation": {
        "provider": string;
        "model": string;
        "verdict": string;
        "reviewedAt": string;
        "reasons": Array<unknown>;
        "checks": {
          "content": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "image": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "pricing": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "communityGuidelines": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
        };
      };
      "approvedAt": string;
      "publishedAt": string;
      "createdAt": string;
    };
  };
};

export type PostEventsIdCancelBody = never;
export type PostEventsIdCancelQuery = {

};
export type PostEventsIdCancelPath = {
  "id": string;
};
export type PostEventsIdCancelHeaders = {

};
export type PostEventsIdCancelResponse = {
  "success": true;
  "message": string;
  "data": {
    "event": {
      "_id": string;
      "creatorId": string;
      "title": string;
      "slug": string;
      "description": string;
      "coverImageUrl": string;
      "activityType": string;
      "setting": string;
      "country": string;
      "state": string;
      "lga": string;
      "venueName": string;
      "address": string;
      "startsAt": string;
      "endsAt": string;
      "timezone": string;
      "maxCapacity": number;
      "tags": Array<string>;
      "status": string;
      "moderation": {
        "provider": string;
        "model": string;
        "verdict": string;
        "reviewedAt": string;
        "reasons": Array<unknown>;
        "checks": {
          "content": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "image": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "pricing": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
          "communityGuidelines": {
            "acceptable": true;
            "reasons": Array<unknown>;
          };
        };
      };
      "approvedAt": string;
      "publishedAt": string;
      "createdAt": string;
    };
  };
};

export type PostEventsIdTicketTypesBody = {
  "title": string;
  "description"?: string;
  "priceKobo": number;
  "capacity"?: number;
};
export type PostEventsIdTicketTypesQuery = {

};
export type PostEventsIdTicketTypesPath = {
  "id": string;
};
export type PostEventsIdTicketTypesHeaders = {

};
export type PostEventsIdTicketTypesResponse = {
  "success": true;
  "message": string;
  "data": {
    "ticketType": {
      "_id": string;
      "eventId": string;
      "title": string;
      "description": string;
      "priceKobo": number;
      "capacity": number;
      "sold": number;
      "reserved": number;
      "active": true;
    };
  };
};

export type PatchEventsIdTicketTypesTicketTypeIdBody = {
  "title"?: string;
  "description"?: string;
  "priceKobo"?: number;
  "capacity"?: number;
};
export type PatchEventsIdTicketTypesTicketTypeIdQuery = {

};
export type PatchEventsIdTicketTypesTicketTypeIdPath = {
  "id": string;
  "ticketTypeId": string;
};
export type PatchEventsIdTicketTypesTicketTypeIdHeaders = {

};
export type PatchEventsIdTicketTypesTicketTypeIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "ticketType": {
      "_id": string;
      "eventId": string;
      "title": string;
      "description": string;
      "priceKobo": number;
      "capacity": number;
      "sold": number;
      "reserved": number;
      "active": true;
    };
  };
};

export type DeleteEventsIdTicketTypesTicketTypeIdBody = never;
export type DeleteEventsIdTicketTypesTicketTypeIdQuery = {

};
export type DeleteEventsIdTicketTypesTicketTypeIdPath = {
  "id": string;
  "ticketTypeId": string;
};
export type DeleteEventsIdTicketTypesTicketTypeIdHeaders = {

};
export type DeleteEventsIdTicketTypesTicketTypeIdResponse = {
  "success": true;
  "message": string;
};

export type GetEventsIdAttendeesBody = never;
export type GetEventsIdAttendeesQuery = {

};
export type GetEventsIdAttendeesPath = {
  "id": string;
};
export type GetEventsIdAttendeesHeaders = {

};
export type GetEventsIdAttendeesResponse = {
  "success": true;
  "message": string;
  "data": {
    "attendees": Array<{
        "_id": string;
        "orderNumber": string;
        "eventId": {
          "_id": string;
          "creatorId": string;
          "title": string;
          "slug": string;
          "description": string;
          "coverImageUrl": string;
          "activityType": string;
          "setting": string;
          "country": string;
          "state": string;
          "lga": string;
          "venueName": string;
          "address": string;
          "startsAt": string;
          "endsAt": string;
          "timezone": string;
          "maxCapacity": number;
          "tags": Array<string>;
          "status": string;
          "moderation": {
            "provider": string;
            "model": string;
            "verdict": string;
            "reviewedAt": string;
            "reasons": Array<unknown>;
            "checks": {
              "content": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "image": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "pricing": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "communityGuidelines": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
            };
          };
          "approvedAt": string;
          "publishedAt": string;
          "createdAt": string;
        };
        "ticketTypeId": {
          "_id": string;
          "eventId": string;
          "title": string;
          "description": string;
          "priceKobo": number;
          "capacity": number;
          "sold": number;
          "reserved": number;
          "active": true;
        };
        "quantity": number;
        "ticketSubtotalKobo": number;
        "platformFeeKobo": number;
        "totalKobo": number;
        "status": string;
        "createdAt": string;
        "buyerId": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "checkedIn": true;
        "checkedInAt": string;
      }>;
    "summary": {
      "orders": number;
      "totalTickets": number;
      "checkedInTickets": number;
      "pendingTickets": number;
    };
  };
};

export type PostEventsIdCheckInsBody = {
  "qrToken": string;
};
export type PostEventsIdCheckInsQuery = {

};
export type PostEventsIdCheckInsPath = {
  "id": string;
};
export type PostEventsIdCheckInsHeaders = {

};
export type PostEventsIdCheckInsResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "_id": string;
      "orderNumber": string;
      "eventId": {
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      };
      "ticketTypeId": {
        "_id": string;
        "eventId": string;
        "title": string;
        "description": string;
        "priceKobo": number;
        "capacity": number;
        "sold": number;
        "reserved": number;
        "active": true;
      };
      "quantity": number;
      "ticketSubtotalKobo": number;
      "platformFeeKobo": number;
      "totalKobo": number;
      "status": string;
      "createdAt": string;
      "checkedInAt": string;
    };
  };
};

export type PostEventsIdReportsBody = {
  "reason": "spam" | "harassment" | "hate" | "violence" | "scam" | "unsafe" | "misinformation" | "other";
  "details"?: string;
};
export type PostEventsIdReportsQuery = {

};
export type PostEventsIdReportsPath = {
  "id": string;
};
export type PostEventsIdReportsHeaders = {

};
export type PostEventsIdReportsResponse = {
  "success": true;
  "message": string;
  "data": {
    "report": {
      "_id": string;
      "targetType": string;
      "targetId": string;
      "reason": string;
      "status": string;
      "createdAt": string;
    };
  };
};

export type GetCommunitiesBody = never;
export type GetCommunitiesQuery = {
  "page"?: number;
  "limit"?: number;
  "search"?: string;
  "category"?: string;
  "state"?: string;
  "lga"?: string;
};
export type GetCommunitiesPath = {

};
export type GetCommunitiesHeaders = {

};
export type GetCommunitiesResponse = {
  "success": true;
  "message": string;
  "data": {
    "communities": Array<{
        "_id": string;
        "ownerId": string;
        "name": string;
        "slug": string;
        "description": string;
        "imageUrl": string;
        "category": string;
        "state": string;
        "lga": string;
        "visibility": string;
        "membershipType": string;
        "membershipPriceKobo": number;
        "members": Array<string>;
        "createdAt": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PostCommunitiesBody = {
  "name": string;
  "description": string;
  "imageUrl"?: string;
  "category": string;
  "state"?: string;
  "lga"?: string;
  "visibility"?: "public" | "private";
  "membershipType"?: "free" | "premium";
  "membershipPriceKobo"?: number;
};
export type PostCommunitiesQuery = {

};
export type PostCommunitiesPath = {

};
export type PostCommunitiesHeaders = {

};
export type PostCommunitiesResponse = {
  "success": true;
  "message": string;
  "data": {
    "community": {
      "_id": string;
      "ownerId": string;
      "name": string;
      "slug": string;
      "description": string;
      "imageUrl": string;
      "category": string;
      "state": string;
      "lga": string;
      "visibility": string;
      "membershipType": string;
      "membershipPriceKobo": number;
      "members": Array<string>;
      "createdAt": string;
    };
  };
};

export type GetCommunitiesIdBody = never;
export type GetCommunitiesIdQuery = {

};
export type GetCommunitiesIdPath = {
  "id": string;
};
export type GetCommunitiesIdHeaders = {

};
export type GetCommunitiesIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "community": {
      "_id": string;
      "ownerId": string;
      "name": string;
      "slug": string;
      "description": string;
      "imageUrl": string;
      "category": string;
      "state": string;
      "lga": string;
      "visibility": string;
      "membershipType": string;
      "membershipPriceKobo": number;
      "members": Array<string>;
      "createdAt": string;
    };
  };
};

export type PatchCommunitiesIdBody = {
  "description"?: string;
  "membershipType"?: "free" | "premium";
  "membershipPriceKobo"?: number;
  "visibility"?: "public" | "private";
};
export type PatchCommunitiesIdQuery = {

};
export type PatchCommunitiesIdPath = {
  "id": string;
};
export type PatchCommunitiesIdHeaders = {

};
export type PatchCommunitiesIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "community": {
      "_id": string;
      "ownerId": string;
      "name": string;
      "slug": string;
      "description": string;
      "imageUrl": string;
      "category": string;
      "state": string;
      "lga": string;
      "visibility": string;
      "membershipType": string;
      "membershipPriceKobo": number;
      "members": Array<string>;
      "createdAt": string;
    };
  };
};

export type PostCommunitiesIdMembersBody = never;
export type PostCommunitiesIdMembersQuery = {

};
export type PostCommunitiesIdMembersPath = {
  "id": string;
};
export type PostCommunitiesIdMembersHeaders = {

};
export type PostCommunitiesIdMembersResponse = {
  "success": true;
  "message": string;
};

export type GetCommunitiesIdMembersBody = never;
export type GetCommunitiesIdMembersQuery = {
  "page"?: number;
  "limit"?: number;
  "search"?: string;
  "role"?: "owner" | "moderator" | "member";
  "status"?: "active" | "banned";
};
export type GetCommunitiesIdMembersPath = {
  "id": string;
};
export type GetCommunitiesIdMembersHeaders = {

};
export type GetCommunitiesIdMembersResponse = {
  "success": true;
  "message": string;
  "data": {
    "members": Array<{
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      }>;
  };
};

export type PostCommunitiesIdMembershipOrdersBody = never;
export type PostCommunitiesIdMembershipOrdersQuery = {

};
export type PostCommunitiesIdMembershipOrdersPath = {
  "id": string;
};
export type PostCommunitiesIdMembershipOrdersHeaders = {
  "Idempotency-Key": string;
};
export type PostCommunitiesIdMembershipOrdersResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "orderNumber": string;
      "communityId": string;
      "grossAmountKobo": number;
      "platformFeeKobo": number;
      "ownerProceedsKobo": number;
      "status": string;
    };
    "checkoutUrl": string;
    "accessCode": string;
    "publicKey": string;
    "charge": {
      "grossAmountKobo": number;
      "platformFeeKobo": number;
      "ownerProceedsKobo": number;
    };
  };
};

export type GetCommunitiesMembershipOrdersOrderNumberVerifyBody = never;
export type GetCommunitiesMembershipOrdersOrderNumberVerifyQuery = {

};
export type GetCommunitiesMembershipOrdersOrderNumberVerifyPath = {
  "orderNumber": string;
};
export type GetCommunitiesMembershipOrdersOrderNumberVerifyHeaders = {

};
export type GetCommunitiesMembershipOrdersOrderNumberVerifyResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "orderNumber": string;
      "communityId": {
        "_id": string;
        "ownerId": string;
        "name": string;
        "slug": string;
        "description": string;
        "imageUrl": string;
        "category": string;
        "state": string;
        "lga": string;
        "visibility": string;
        "membershipType": string;
        "membershipPriceKobo": number;
        "members": Array<string>;
        "createdAt": string;
      };
      "status": string;
      "paidAt": string;
    };
  };
};

export type DeleteCommunitiesIdMembersMeBody = never;
export type DeleteCommunitiesIdMembersMeQuery = {

};
export type DeleteCommunitiesIdMembersMePath = {
  "id": string;
};
export type DeleteCommunitiesIdMembersMeHeaders = {

};
export type DeleteCommunitiesIdMembersMeResponse = {
  "success": true;
  "message": string;
};

export type GetCommunitiesIdPostsBody = never;
export type GetCommunitiesIdPostsQuery = {
  "page"?: number;
  "limit"?: number;
};
export type GetCommunitiesIdPostsPath = {
  "id": string;
};
export type GetCommunitiesIdPostsHeaders = {

};
export type GetCommunitiesIdPostsResponse = {
  "success": true;
  "message": string;
  "data": {
    "posts": Array<{
        "_id": string;
        "communityId": string;
        "authorId": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "kind": string;
        "text": string;
        "imageUrl": string;
        "createdAt": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PostCommunitiesIdPostsBody = {
  "text": string;
  "imageUrl"?: string;
};
export type PostCommunitiesIdPostsQuery = {

};
export type PostCommunitiesIdPostsPath = {
  "id": string;
};
export type PostCommunitiesIdPostsHeaders = {

};
export type PostCommunitiesIdPostsResponse = {
  "success": true;
  "message": string;
  "data": {
    "post": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
    };
  };
};

export type GetCommunitiesIdAnnouncementsBody = never;
export type GetCommunitiesIdAnnouncementsQuery = {
  "page"?: number;
  "limit"?: number;
};
export type GetCommunitiesIdAnnouncementsPath = {
  "id": string;
};
export type GetCommunitiesIdAnnouncementsHeaders = {

};
export type GetCommunitiesIdAnnouncementsResponse = {
  "success": true;
  "message": string;
  "data": {
    "announcements": Array<{
        "_id": string;
        "communityId": string;
        "authorId": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "kind": string;
        "text": string;
        "imageUrl": string;
        "createdAt": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PostCommunitiesIdAnnouncementsBody = {
  "text": string;
  "imageUrl"?: string;
};
export type PostCommunitiesIdAnnouncementsQuery = {

};
export type PostCommunitiesIdAnnouncementsPath = {
  "id": string;
};
export type PostCommunitiesIdAnnouncementsHeaders = {

};
export type PostCommunitiesIdAnnouncementsResponse = {
  "success": true;
  "message": string;
  "data": {
    "announcement": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
    };
  };
};

export type GetCommunitiesIdMessagesBody = never;
export type GetCommunitiesIdMessagesQuery = {
  "limit"?: number;
  "before"?: string;
};
export type GetCommunitiesIdMessagesPath = {
  "id": string;
};
export type GetCommunitiesIdMessagesHeaders = {

};
export type GetCommunitiesIdMessagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "messages": Array<{
        "_id": string;
        "communityId": string;
        "authorId": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "kind": string;
        "text": string;
        "imageUrl": string;
        "createdAt": string;
        "clientMessageId": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PostCommunitiesIdMessagesBody = {
  "clientMessageId": string;
  "text"?: string;
  "attachmentIds"?: Array<string>;
  "replyToMessageId"?: string;
};
export type PostCommunitiesIdMessagesQuery = {

};
export type PostCommunitiesIdMessagesPath = {
  "id": string;
};
export type PostCommunitiesIdMessagesHeaders = {

};
export type PostCommunitiesIdMessagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "message": {
      "_id": string;
      "communityId": string;
      "authorId": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "kind": string;
      "text": string;
      "imageUrl": string;
      "createdAt": string;
      "clientMessageId": string;
    };
  };
};

export type PostCommunitiesIdMessagesMessageIdReportsBody = {
  "reason": "spam" | "harassment" | "hate_speech" | "unsafe" | "inappropriate" | "other";
  "details"?: string;
};
export type PostCommunitiesIdMessagesMessageIdReportsQuery = {

};
export type PostCommunitiesIdMessagesMessageIdReportsPath = {
  "id": string;
  "messageId": string;
};
export type PostCommunitiesIdMessagesMessageIdReportsHeaders = {

};
export type PostCommunitiesIdMessagesMessageIdReportsResponse = {
  "success": true;
  "message": string;
  "data": {
    "report": {
      "_id": string;
      "targetType": string;
      "targetId": string;
      "status": string;
      "createdAt": string;
    };
  };
};

export type PostCommunitiesIdReportsBody = {
  "reason": "spam" | "harassment" | "hate" | "violence" | "scam" | "unsafe" | "misinformation" | "other";
  "details"?: string;
};
export type PostCommunitiesIdReportsQuery = {

};
export type PostCommunitiesIdReportsPath = {
  "id": string;
};
export type PostCommunitiesIdReportsHeaders = {

};
export type PostCommunitiesIdReportsResponse = {
  "success": true;
  "message": string;
  "data": {
    "report": {
      "_id": string;
      "targetType": string;
      "targetId": string;
      "reason": string;
      "status": string;
      "createdAt": string;
    };
  };
};

export type GetFriendsBody = never;
export type GetFriendsQuery = {

};
export type GetFriendsPath = {

};
export type GetFriendsHeaders = {

};
export type GetFriendsResponse = {
  "success": true;
  "message": string;
  "data": {
    "friendships": Array<{
        "_id": string;
        "requesterId": string;
        "addresseeId": string;
        "requester": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "addressee": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "status": string;
        "createdAt": string;
      }>;
  };
};

export type GetFriendsRequestsBody = never;
export type GetFriendsRequestsQuery = {

};
export type GetFriendsRequestsPath = {

};
export type GetFriendsRequestsHeaders = {

};
export type GetFriendsRequestsResponse = {
  "success": true;
  "message": string;
  "data": {
    "requests": Array<{
        "_id": string;
        "requesterId": string;
        "addresseeId": string;
        "requester": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "addressee": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "status": string;
        "createdAt": string;
      }>;
  };
};

export type GetFriendsSuggestionsBody = never;
export type GetFriendsSuggestionsQuery = {

};
export type GetFriendsSuggestionsPath = {

};
export type GetFriendsSuggestionsHeaders = {

};
export type GetFriendsSuggestionsResponse = {
  "success": true;
  "message": string;
  "data": {
    "users": Array<{
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      }>;
  };
};

export type PostFriendsRequestsUserIdBody = never;
export type PostFriendsRequestsUserIdQuery = {

};
export type PostFriendsRequestsUserIdPath = {
  "userId": string;
};
export type PostFriendsRequestsUserIdHeaders = {

};
export type PostFriendsRequestsUserIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "friendship": {
      "_id": string;
      "requesterId": string;
      "addresseeId": string;
      "requester": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "addressee": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "status": string;
      "createdAt": string;
    };
  };
};

export type PatchFriendsRequestsIdBody = {
  "action": "accept" | "decline" | "reject";
};
export type PatchFriendsRequestsIdQuery = {

};
export type PatchFriendsRequestsIdPath = {
  "id": string;
};
export type PatchFriendsRequestsIdHeaders = {

};
export type PatchFriendsRequestsIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "friendship": {
      "_id": string;
      "requesterId": string;
      "addresseeId": string;
      "requester": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "addressee": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "status": string;
      "createdAt": string;
    };
  };
};

export type DeleteFriendsIdBody = never;
export type DeleteFriendsIdQuery = {

};
export type DeleteFriendsIdPath = {
  "id": string;
};
export type DeleteFriendsIdHeaders = {

};
export type DeleteFriendsIdResponse = {
  "success": true;
  "message": string;
};

export type GetChatConversationsBody = never;
export type GetChatConversationsQuery = {

};
export type GetChatConversationsPath = {

};
export type GetChatConversationsHeaders = {

};
export type GetChatConversationsResponse = {
  "success": true;
  "message": string;
  "data": {
    "conversations": Array<{
        "_id": string;
        "type": string;
        "title": null;
        "participantIds": Array<string>;
        "participants": Array<{
            "_id": string;
            "firstName": string;
            "lastName": string;
            "email": string;
            "role": string;
            "status": string;
            "state": string;
            "lga": string;
            "interests": Array<string>;
            "avatarUrl": string;
            "createdAt": string;
          }>;
        "lastMessageAt": string;
        "lastMessagePreview": {
          "_id": string;
          "senderId": string;
          "type": string;
          "text": string;
          "createdAt": string;
        };
        "unreadCount": number;
      }>;
  };
};

export type PostChatConversationsBody = {
  "type": "direct" | "group" | "support";
  "title"?: string;
  "participantIds": Array<string>;
};
export type PostChatConversationsQuery = {

};
export type PostChatConversationsPath = {

};
export type PostChatConversationsHeaders = {

};
export type PostChatConversationsResponse = {
  "success": true;
  "message": string;
  "data": {
    "conversation": {
      "_id": string;
      "type": string;
      "title": null;
      "participantIds": Array<string>;
      "participants": Array<{
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        }>;
      "lastMessageAt": string;
      "lastMessagePreview": {
        "_id": string;
        "senderId": string;
        "type": string;
        "text": string;
        "createdAt": string;
      };
      "unreadCount": number;
    };
  };
};

export type GetChatConversationsIdMessagesBody = never;
export type GetChatConversationsIdMessagesQuery = {
  "limit"?: number;
  "before"?: string;
};
export type GetChatConversationsIdMessagesPath = {
  "id": string;
};
export type GetChatConversationsIdMessagesHeaders = {

};
export type GetChatConversationsIdMessagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "messages": Array<{
        "_id": string;
        "conversationId": string;
        "senderId": string;
        "sender": {
          "_id": string;
          "firstName": string;
          "lastName": string;
          "email": string;
          "role": string;
          "status": string;
          "state": string;
          "lga": string;
          "interests": Array<string>;
          "avatarUrl": string;
          "createdAt": string;
        };
        "clientMessageId": string;
        "type": string;
        "text": string;
        "createdAt": string;
      }>;
  };
};

export type PostChatConversationsIdMessagesBody = {
  "clientMessageId": string;
  "type"?: "text" | "image";
  "text"?: string;
  "mediaUrl"?: string;
};
export type PostChatConversationsIdMessagesQuery = {

};
export type PostChatConversationsIdMessagesPath = {
  "id": string;
};
export type PostChatConversationsIdMessagesHeaders = {

};
export type PostChatConversationsIdMessagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "message": {
      "_id": string;
      "conversationId": string;
      "senderId": string;
      "sender": {
        "_id": string;
        "firstName": string;
        "lastName": string;
        "email": string;
        "role": string;
        "status": string;
        "state": string;
        "lga": string;
        "interests": Array<string>;
        "avatarUrl": string;
        "createdAt": string;
      };
      "clientMessageId": string;
      "type": string;
      "text": string;
      "createdAt": string;
    };
  };
};

export type PostChatConversationsIdReadBody = never;
export type PostChatConversationsIdReadQuery = {

};
export type PostChatConversationsIdReadPath = {
  "id": string;
};
export type PostChatConversationsIdReadHeaders = {

};
export type PostChatConversationsIdReadResponse = {
  "success": true;
  "message": string;
};

export type PostAiChatBody = {
  "message": string;
  "sessionId"?: string;
};
export type PostAiChatQuery = {

};
export type PostAiChatPath = {

};
export type PostAiChatHeaders = {

};
export type PostAiChatResponse = {
  "success": true;
  "message": string;
  "data": {
    "sessionId": string;
    "message": string;
  };
};

export type PostAiEventCopyBody = {
  "title": string;
  "activityType": string;
  "targetAudience"?: string;
  "setting"?: string;
  "details"?: string;
};
export type PostAiEventCopyQuery = {

};
export type PostAiEventCopyPath = {

};
export type PostAiEventCopyHeaders = {

};
export type PostAiEventCopyResponse = {
  "success": true;
  "message": string;
  "data": {
    "sessionId": string;
    "message": string;
  };
};

export type PostAiEventRecommendationsBody = {
  "preferences"?: {
    "categories"?: Array<string>;
  };
  "latitude"?: number;
  "longitude"?: number;
  "radiusKm"?: number;
  "limit"?: number;
};
export type PostAiEventRecommendationsQuery = {

};
export type PostAiEventRecommendationsPath = {

};
export type PostAiEventRecommendationsHeaders = {

};
export type PostAiEventRecommendationsResponse = {
  "success": true;
  "message": string;
  "data": {
    "events": Array<{
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
        "distanceKm": number;
        "recommendationScore": number;
      }>;
  };
};

export type PostAiConversationsIdSummaryBody = never;
export type PostAiConversationsIdSummaryQuery = {

};
export type PostAiConversationsIdSummaryPath = {
  "id": string;
};
export type PostAiConversationsIdSummaryHeaders = {

};
export type PostAiConversationsIdSummaryResponse = {
  "success": true;
  "message": string;
  "data": {
    "sessionId": string;
    "message": string;
  };
};

export type GetAiSessionsBody = never;
export type GetAiSessionsQuery = {

};
export type GetAiSessionsPath = {

};
export type GetAiSessionsHeaders = {

};
export type GetAiSessionsResponse = {
  "success": true;
  "message": string;
  "data": {
    "sessions": Array<{
        "_id": string;
        "purpose": string;
        "lastUsedAt": string;
      }>;
  };
};

export type DeleteAiSessionsIdBody = never;
export type DeleteAiSessionsIdQuery = {

};
export type DeleteAiSessionsIdPath = {
  "id": string;
};
export type DeleteAiSessionsIdHeaders = {

};
export type DeleteAiSessionsIdResponse = {
  "success": true;
  "message": string;
};

export type GetTicketsBody = never;
export type GetTicketsQuery = {

};
export type GetTicketsPath = {

};
export type GetTicketsHeaders = {

};
export type GetTicketsResponse = {
  "success": true;
  "message": string;
  "data": {
    "tickets": Array<{
        "_id": string;
        "orderNumber": string;
        "eventId": {
          "_id": string;
          "creatorId": string;
          "title": string;
          "slug": string;
          "description": string;
          "coverImageUrl": string;
          "activityType": string;
          "setting": string;
          "country": string;
          "state": string;
          "lga": string;
          "venueName": string;
          "address": string;
          "startsAt": string;
          "endsAt": string;
          "timezone": string;
          "maxCapacity": number;
          "tags": Array<string>;
          "status": string;
          "moderation": {
            "provider": string;
            "model": string;
            "verdict": string;
            "reviewedAt": string;
            "reasons": Array<unknown>;
            "checks": {
              "content": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "image": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "pricing": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
              "communityGuidelines": {
                "acceptable": true;
                "reasons": Array<unknown>;
              };
            };
          };
          "approvedAt": string;
          "publishedAt": string;
          "createdAt": string;
        };
        "ticketTypeId": {
          "_id": string;
          "eventId": string;
          "title": string;
          "description": string;
          "priceKobo": number;
          "capacity": number;
          "sold": number;
          "reserved": number;
          "active": true;
        };
        "quantity": number;
        "ticketSubtotalKobo": number;
        "platformFeeKobo": number;
        "totalKobo": number;
        "status": string;
        "createdAt": string;
      }>;
  };
};

export type GetTicketsOrderNumberBody = never;
export type GetTicketsOrderNumberQuery = {

};
export type GetTicketsOrderNumberPath = {
  "orderNumber": string;
};
export type GetTicketsOrderNumberHeaders = {

};
export type GetTicketsOrderNumberResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "_id": string;
      "orderNumber": string;
      "eventId": {
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      };
      "ticketTypeId": {
        "_id": string;
        "eventId": string;
        "title": string;
        "description": string;
        "priceKobo": number;
        "capacity": number;
        "sold": number;
        "reserved": number;
        "active": true;
      };
      "quantity": number;
      "ticketSubtotalKobo": number;
      "platformFeeKobo": number;
      "totalKobo": number;
      "status": string;
      "createdAt": string;
    };
    "qrToken": string;
  };
};

export type GetTicketsOrderNumberVerifyBody = never;
export type GetTicketsOrderNumberVerifyQuery = {

};
export type GetTicketsOrderNumberVerifyPath = {
  "orderNumber": string;
};
export type GetTicketsOrderNumberVerifyHeaders = {

};
export type GetTicketsOrderNumberVerifyResponse = {
  "success": true;
  "message": string;
  "data": {
    "order": {
      "_id": string;
      "orderNumber": string;
      "eventId": {
        "_id": string;
        "creatorId": string;
        "title": string;
        "slug": string;
        "description": string;
        "coverImageUrl": string;
        "activityType": string;
        "setting": string;
        "country": string;
        "state": string;
        "lga": string;
        "venueName": string;
        "address": string;
        "startsAt": string;
        "endsAt": string;
        "timezone": string;
        "maxCapacity": number;
        "tags": Array<string>;
        "status": string;
        "moderation": {
          "provider": string;
          "model": string;
          "verdict": string;
          "reviewedAt": string;
          "reasons": Array<unknown>;
          "checks": {
            "content": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "image": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "pricing": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
            "communityGuidelines": {
              "acceptable": true;
              "reasons": Array<unknown>;
            };
          };
        };
        "approvedAt": string;
        "publishedAt": string;
        "createdAt": string;
      };
      "ticketTypeId": {
        "_id": string;
        "eventId": string;
        "title": string;
        "description": string;
        "priceKobo": number;
        "capacity": number;
        "sold": number;
        "reserved": number;
        "active": true;
      };
      "quantity": number;
      "ticketSubtotalKobo": number;
      "platformFeeKobo": number;
      "totalKobo": number;
      "status": string;
      "createdAt": string;
    };
    "qrToken": string;
  };
};

export type GetNotificationsBody = never;
export type GetNotificationsQuery = {
  "page"?: number;
  "limit"?: number;
  "type"?: string;
  "unread"?: "true" | "false";
};
export type GetNotificationsPath = {

};
export type GetNotificationsHeaders = {

};
export type GetNotificationsResponse = {
  "success": true;
  "message": string;
  "data": {
    "notifications": Array<{
        "_id": string;
        "type": string;
        "title": string;
        "body": string;
        "data": {
          "orderId": string;
          "route": string;
        };
        "createdAt": string;
      }>;
    "unread": number;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type PatchNotificationsReadAllBody = never;
export type PatchNotificationsReadAllQuery = {

};
export type PatchNotificationsReadAllPath = {

};
export type PatchNotificationsReadAllHeaders = {

};
export type PatchNotificationsReadAllResponse = {
  "success": true;
  "message": string;
};

export type PatchNotificationsIdReadBody = never;
export type PatchNotificationsIdReadQuery = {

};
export type PatchNotificationsIdReadPath = {
  "id": string;
};
export type PatchNotificationsIdReadHeaders = {

};
export type PatchNotificationsIdReadResponse = {
  "success": true;
  "message": string;
  "data": {
    "notification": {
      "_id": string;
      "type": string;
      "title": string;
      "body": string;
      "data": {
        "orderId": string;
        "route": string;
      };
      "createdAt": string;
      "readAt": string;
    };
  };
};

export type PostDisputesBody = {
  "transactionId"?: string;
  "category": "payment" | "withdrawal" | "transfer" | "ticket" | "event" | "harassment" | "other";
  "subject": string;
  "description": string;
};
export type PostDisputesQuery = {

};
export type PostDisputesPath = {

};
export type PostDisputesHeaders = {

};
export type PostDisputesResponse = {
  "success": true;
  "message": string;
  "data": {
    "dispute": {
      "_id": string;
      "userId": string;
      "category": string;
      "subject": string;
      "description": string;
      "status": string;
      "messages": Array<{
          "_id": string;
          "authorId": {
            "_id": string;
            "firstName": string;
            "lastName": string;
            "email": string;
            "role": string;
            "status": string;
            "state": string;
            "lga": string;
            "interests": Array<string>;
            "avatarUrl": string;
            "createdAt": string;
          };
          "message": string;
          "attachments": Array<string>;
          "internal": false;
          "createdAt": string;
          "updatedAt": string;
        }>;
      "createdAt": string;
    };
  };
};

export type GetDisputesBody = never;
export type GetDisputesQuery = {
  "status"?: "open" | "under_review" | "awaiting_user" | "resolved" | "closed";
};
export type GetDisputesPath = {

};
export type GetDisputesHeaders = {

};
export type GetDisputesResponse = {
  "success": true;
  "message": string;
  "data": {
    "disputes": Array<{
        "_id": string;
        "userId": string;
        "category": string;
        "subject": string;
        "description": string;
        "status": string;
        "messages": Array<{
            "_id": string;
            "authorId": {
              "_id": string;
              "firstName": string;
              "lastName": string;
              "email": string;
              "role": string;
              "status": string;
              "state": string;
              "lga": string;
              "interests": Array<string>;
              "avatarUrl": string;
              "createdAt": string;
            };
            "message": string;
            "attachments": Array<string>;
            "internal": false;
            "createdAt": string;
            "updatedAt": string;
          }>;
        "createdAt": string;
      }>;
  };
};

export type GetDisputesIdBody = never;
export type GetDisputesIdQuery = {

};
export type GetDisputesIdPath = {
  "id": string;
};
export type GetDisputesIdHeaders = {

};
export type GetDisputesIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "dispute": {
      "_id": string;
      "userId": string;
      "category": string;
      "subject": string;
      "description": string;
      "status": string;
      "messages": Array<{
          "_id": string;
          "authorId": {
            "_id": string;
            "firstName": string;
            "lastName": string;
            "email": string;
            "role": string;
            "status": string;
            "state": string;
            "lga": string;
            "interests": Array<string>;
            "avatarUrl": string;
            "createdAt": string;
          };
          "message": string;
          "attachments": Array<string>;
          "internal": false;
          "createdAt": string;
          "updatedAt": string;
        }>;
      "createdAt": string;
    };
  };
};

export type PostDisputesIdMessagesBody = {
  "message": string;
  "attachments"?: Array<string>;
  "internal"?: boolean;
};
export type PostDisputesIdMessagesQuery = {

};
export type PostDisputesIdMessagesPath = {
  "id": string;
};
export type PostDisputesIdMessagesHeaders = {

};
export type PostDisputesIdMessagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "dispute": {
      "_id": string;
      "userId": string;
      "category": string;
      "subject": string;
      "description": string;
      "status": string;
      "messages": Array<{
          "_id": string;
          "authorId": {
            "_id": string;
            "firstName": string;
            "lastName": string;
            "email": string;
            "role": string;
            "status": string;
            "state": string;
            "lga": string;
            "interests": Array<string>;
            "avatarUrl": string;
            "createdAt": string;
          };
          "message": string;
          "attachments": Array<string>;
          "internal": false;
          "createdAt": string;
          "updatedAt": string;
        }>;
      "createdAt": string;
    };
  };
};

export type PatchDisputesIdStatusBody = {
  "status": "open" | "under_review" | "awaiting_user" | "resolved" | "closed";
  "resolution"?: string;
};
export type PatchDisputesIdStatusQuery = {

};
export type PatchDisputesIdStatusPath = {
  "id": string;
};
export type PatchDisputesIdStatusHeaders = {

};
export type PatchDisputesIdStatusResponse = {
  "success": true;
  "message": string;
  "data": {
    "dispute": {
      "_id": string;
      "userId": string;
      "category": string;
      "subject": string;
      "description": string;
      "status": string;
      "messages": Array<{
          "_id": string;
          "authorId": {
            "_id": string;
            "firstName": string;
            "lastName": string;
            "email": string;
            "role": string;
            "status": string;
            "state": string;
            "lga": string;
            "interests": Array<string>;
            "avatarUrl": string;
            "createdAt": string;
          };
          "message": string;
          "attachments": Array<string>;
          "internal": false;
          "createdAt": string;
          "updatedAt": string;
        }>;
      "createdAt": string;
      "resolution": string;
    };
  };
};

export type GetWalletBody = never;
export type GetWalletQuery = {

};
export type GetWalletPath = {

};
export type GetWalletHeaders = {

};
export type GetWalletResponse = {
  "success": true;
  "message": string;
  "data": {
    "wallet": {
      "_id": string;
      "walletNumber": string;
      "currency": string;
      "availableBalanceKobo": number;
      "pendingBalanceKobo": number;
      "status": string;
    };
  };
};

export type GetWalletTransactionsBody = never;
export type GetWalletTransactionsQuery = {
  "page"?: number;
  "limit"?: number;
  "type"?: "topup" | "internal_transfer" | "withdrawal" | "ticket_purchase" | "community_purchase" | "refund" | "adjustment";
  "status"?: "pending" | "processing" | "successful" | "failed" | "reversed";
  "direction"?: "credit" | "debit";
};
export type GetWalletTransactionsPath = {

};
export type GetWalletTransactionsHeaders = {

};
export type GetWalletTransactionsResponse = {
  "success": true;
  "message": string;
  "data": {
    "transactions": Array<{
        "_id": string;
        "reference": string;
        "type": string;
        "direction": string;
        "amountKobo": number;
        "feeKobo": number;
        "status": string;
        "provider": string;
        "createdAt": string;
      }>;
    "pagination": {
      "page": number;
      "limit": number;
      "total": number;
    };
  };
};

export type GetWalletTransactionsIdBody = never;
export type GetWalletTransactionsIdQuery = {

};
export type GetWalletTransactionsIdPath = {
  "id": string;
};
export type GetWalletTransactionsIdHeaders = {

};
export type GetWalletTransactionsIdResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
    };
  };
};

export type PostWalletTopupsBody = {
  "amountKobo": number;
};
export type PostWalletTopupsQuery = {

};
export type PostWalletTopupsPath = {

};
export type PostWalletTopupsHeaders = {
  "Idempotency-Key": string;
};
export type PostWalletTopupsResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
    };
    "authorizationUrl": string;
    "accessCode": string;
    "reference": string;
    "publicKey": string;
    "charge": {
      "walletCreditKobo": number;
      "feeKobo": number;
      "totalPayableKobo": number;
    };
  };
};

export type GetWalletTopupsReferenceVerifyBody = never;
export type GetWalletTopupsReferenceVerifyQuery = {

};
export type GetWalletTopupsReferenceVerifyPath = {
  "reference": string;
};
export type GetWalletTopupsReferenceVerifyHeaders = {

};
export type GetWalletTopupsReferenceVerifyResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
      "completedAt": string;
    };
  };
};

export type GetWalletBanksBody = never;
export type GetWalletBanksQuery = {

};
export type GetWalletBanksPath = {

};
export type GetWalletBanksHeaders = {

};
export type GetWalletBanksResponse = {
  "success": true;
  "message": string;
  "data": {
    "banks": Array<{
        "name": string;
        "code": string;
        "active": true;
        "country": string;
        "currency": string;
      }>;
  };
};

export type GetWalletBankAccountsBody = never;
export type GetWalletBankAccountsQuery = {

};
export type GetWalletBankAccountsPath = {

};
export type GetWalletBankAccountsHeaders = {

};
export type GetWalletBankAccountsResponse = {
  "success": true;
  "message": string;
  "data": {
    "bankAccounts": Array<{
        "_id": string;
        "bankName": string;
        "bankCode": string;
        "accountName": string;
        "maskedAccountNumber": string;
        "active": true;
      }>;
  };
};

export type PostWalletBankAccountsBody = {
  "accountNumber": string;
  "bankCode": string;
};
export type PostWalletBankAccountsQuery = {

};
export type PostWalletBankAccountsPath = {

};
export type PostWalletBankAccountsHeaders = {

};
export type PostWalletBankAccountsResponse = {
  "success": true;
  "message": string;
  "data": {
    "bankAccount": {
      "_id": string;
      "bankName": string;
      "bankCode": string;
      "accountName": string;
      "maskedAccountNumber": string;
      "active": true;
    };
  };
};

export type DeleteWalletBankAccountsIdBody = never;
export type DeleteWalletBankAccountsIdQuery = {

};
export type DeleteWalletBankAccountsIdPath = {
  "id": string;
};
export type DeleteWalletBankAccountsIdHeaders = {

};
export type DeleteWalletBankAccountsIdResponse = {
  "success": true;
  "message": string;
};

export type PostWalletTransfersBody = {
  "recipient": string;
  "amountKobo": number;
  "note"?: string;
};
export type PostWalletTransfersQuery = {

};
export type PostWalletTransfersPath = {

};
export type PostWalletTransfersHeaders = {
  "Idempotency-Key": string;
};
export type PostWalletTransfersResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
    };
  };
};

export type PostWalletWithdrawalsBody = {
  "bankAccountId": string;
  "amountKobo": number;
};
export type PostWalletWithdrawalsQuery = {

};
export type PostWalletWithdrawalsPath = {

};
export type PostWalletWithdrawalsHeaders = {
  "Idempotency-Key": string;
};
export type PostWalletWithdrawalsResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
    };
    "charge": {
      "withdrawalAmountKobo": number;
      "feeKobo": number;
      "payoutAmountKobo": number;
    };
  };
};

export type PostWalletWithdrawalsReferenceFinalizeBody = {
  "otp": string;
};
export type PostWalletWithdrawalsReferenceFinalizeQuery = {

};
export type PostWalletWithdrawalsReferenceFinalizePath = {
  "reference": string;
};
export type PostWalletWithdrawalsReferenceFinalizeHeaders = {

};
export type PostWalletWithdrawalsReferenceFinalizeResponse = {
  "success": true;
  "message": string;
  "data": {
    "transaction": {
      "_id": string;
      "reference": string;
      "type": string;
      "direction": string;
      "amountKobo": number;
      "feeKobo": number;
      "status": string;
      "provider": string;
      "createdAt": string;
    };
  };
};

export type PostUploadsFilesBody = {
  "file": string;
  "folder": "community-chat";
};
export type PostUploadsFilesQuery = {

};
export type PostUploadsFilesPath = {

};
export type PostUploadsFilesHeaders = {

};
export type PostUploadsFilesResponse = {
  "success": true;
  "message": string;
  "data": {
    "attachment": {
      "_id": string;
      "url": string;
      "type": string;
      "name": string;
      "mimeType": string;
      "sizeBytes": number;
      "thumbnailUrl": null;
    };
  };
};

export type PostUploadsImagesBody = {
  "image": string;
  "folder"?: "avatars" | "events" | "communities" | "disputes" | "chat" | "uploads";
};
export type PostUploadsImagesQuery = {

};
export type PostUploadsImagesPath = {

};
export type PostUploadsImagesHeaders = {

};
export type PostUploadsImagesResponse = {
  "success": true;
  "message": string;
  "data": {
    "url": string;
    "publicId": string;
    "width": number;
    "height": number;
    "format": string;
    "bytes": number;
  };
};

export type PostWebhooksPaystackBody = {
  "event": string;
  "data": {
    "id"?: number;
    "reference"?: string;
    "amount"?: number;
    "status"?: string;
  };
};
export type PostWebhooksPaystackQuery = {

};
export type PostWebhooksPaystackPath = {

};
export type PostWebhooksPaystackHeaders = {
  "x-paystack-signature": string;
};
export type PostWebhooksPaystackResponse = {
  "received": true;
};

export interface ApiOperationMap {
  "post__auth_register": {
    method: "POST";
    path: "/auth/register";
    authenticated: false;
    body: PostAuthRegisterBody;
    query: PostAuthRegisterQuery;
    pathParams: PostAuthRegisterPath;
    headers: PostAuthRegisterHeaders;
    response: PostAuthRegisterResponse;
  };
  "post__auth_verify_email": {
    method: "POST";
    path: "/auth/verify-email";
    authenticated: false;
    body: PostAuthVerifyEmailBody;
    query: PostAuthVerifyEmailQuery;
    pathParams: PostAuthVerifyEmailPath;
    headers: PostAuthVerifyEmailHeaders;
    response: PostAuthVerifyEmailResponse;
  };
  "post__auth_resend_verification": {
    method: "POST";
    path: "/auth/resend-verification";
    authenticated: false;
    body: PostAuthResendVerificationBody;
    query: PostAuthResendVerificationQuery;
    pathParams: PostAuthResendVerificationPath;
    headers: PostAuthResendVerificationHeaders;
    response: PostAuthResendVerificationResponse;
  };
  "post__auth_login": {
    method: "POST";
    path: "/auth/login";
    authenticated: false;
    body: PostAuthLoginBody;
    query: PostAuthLoginQuery;
    pathParams: PostAuthLoginPath;
    headers: PostAuthLoginHeaders;
    response: PostAuthLoginResponse;
  };
  "post__auth_refresh": {
    method: "POST";
    path: "/auth/refresh";
    authenticated: false;
    body: PostAuthRefreshBody;
    query: PostAuthRefreshQuery;
    pathParams: PostAuthRefreshPath;
    headers: PostAuthRefreshHeaders;
    response: PostAuthRefreshResponse;
  };
  "post__auth_logout": {
    method: "POST";
    path: "/auth/logout";
    authenticated: true;
    body: PostAuthLogoutBody;
    query: PostAuthLogoutQuery;
    pathParams: PostAuthLogoutPath;
    headers: PostAuthLogoutHeaders;
    response: PostAuthLogoutResponse;
  };
  "post__auth_forgot_password": {
    method: "POST";
    path: "/auth/forgot-password";
    authenticated: false;
    body: PostAuthForgotPasswordBody;
    query: PostAuthForgotPasswordQuery;
    pathParams: PostAuthForgotPasswordPath;
    headers: PostAuthForgotPasswordHeaders;
    response: PostAuthForgotPasswordResponse;
  };
  "post__auth_reset_password": {
    method: "POST";
    path: "/auth/reset-password";
    authenticated: false;
    body: PostAuthResetPasswordBody;
    query: PostAuthResetPasswordQuery;
    pathParams: PostAuthResetPasswordPath;
    headers: PostAuthResetPasswordHeaders;
    response: PostAuthResetPasswordResponse;
  };
  "get__locations_search": {
    method: "GET";
    path: "/locations/search";
    authenticated: true;
    body: GetLocationsSearchBody;
    query: GetLocationsSearchQuery;
    pathParams: GetLocationsSearchPath;
    headers: GetLocationsSearchHeaders;
    response: GetLocationsSearchResponse;
  };
  "get__users_me": {
    method: "GET";
    path: "/users/me";
    authenticated: true;
    body: GetUsersMeBody;
    query: GetUsersMeQuery;
    pathParams: GetUsersMePath;
    headers: GetUsersMeHeaders;
    response: GetUsersMeResponse;
  };
  "patch__users_me": {
    method: "PATCH";
    path: "/users/me";
    authenticated: true;
    body: PatchUsersMeBody;
    query: PatchUsersMeQuery;
    pathParams: PatchUsersMePath;
    headers: PatchUsersMeHeaders;
    response: PatchUsersMeResponse;
  };
  "delete__users_me": {
    method: "DELETE";
    path: "/users/me";
    authenticated: true;
    body: DeleteUsersMeBody;
    query: DeleteUsersMeQuery;
    pathParams: DeleteUsersMePath;
    headers: DeleteUsersMeHeaders;
    response: DeleteUsersMeResponse;
  };
  "patch__users_me_avatar": {
    method: "PATCH";
    path: "/users/me/avatar";
    authenticated: true;
    body: PatchUsersMeAvatarBody;
    query: PatchUsersMeAvatarQuery;
    pathParams: PatchUsersMeAvatarPath;
    headers: PatchUsersMeAvatarHeaders;
    response: PatchUsersMeAvatarResponse;
  };
  "patch__users_me_password": {
    method: "PATCH";
    path: "/users/me/password";
    authenticated: true;
    body: PatchUsersMePasswordBody;
    query: PatchUsersMePasswordQuery;
    pathParams: PatchUsersMePasswordPath;
    headers: PatchUsersMePasswordHeaders;
    response: PatchUsersMePasswordResponse;
  };
  "post__users_me_push_tokens": {
    method: "POST";
    path: "/users/me/push-tokens";
    authenticated: true;
    body: PostUsersMePushTokensBody;
    query: PostUsersMePushTokensQuery;
    pathParams: PostUsersMePushTokensPath;
    headers: PostUsersMePushTokensHeaders;
    response: PostUsersMePushTokensResponse;
  };
  "delete__users_me_push_tokens": {
    method: "DELETE";
    path: "/users/me/push-tokens";
    authenticated: true;
    body: DeleteUsersMePushTokensBody;
    query: DeleteUsersMePushTokensQuery;
    pathParams: DeleteUsersMePushTokensPath;
    headers: DeleteUsersMePushTokensHeaders;
    response: DeleteUsersMePushTokensResponse;
  };
  "post__users_id_reports": {
    method: "POST";
    path: "/users/{id}/reports";
    authenticated: true;
    body: PostUsersIdReportsBody;
    query: PostUsersIdReportsQuery;
    pathParams: PostUsersIdReportsPath;
    headers: PostUsersIdReportsHeaders;
    response: PostUsersIdReportsResponse;
  };
  "get__users_me_communities": {
    method: "GET";
    path: "/users/me/communities";
    authenticated: true;
    body: GetUsersMeCommunitiesBody;
    query: GetUsersMeCommunitiesQuery;
    pathParams: GetUsersMeCommunitiesPath;
    headers: GetUsersMeCommunitiesHeaders;
    response: GetUsersMeCommunitiesResponse;
  };
  "get__communities_id_rules": {
    method: "GET";
    path: "/communities/{id}/rules";
    authenticated: false;
    body: GetCommunitiesIdRulesBody;
    query: GetCommunitiesIdRulesQuery;
    pathParams: GetCommunitiesIdRulesPath;
    headers: GetCommunitiesIdRulesHeaders;
    response: GetCommunitiesIdRulesResponse;
  };
  "put__communities_id_rules": {
    method: "PUT";
    path: "/communities/{id}/rules";
    authenticated: true;
    body: PutCommunitiesIdRulesBody;
    query: PutCommunitiesIdRulesQuery;
    pathParams: PutCommunitiesIdRulesPath;
    headers: PutCommunitiesIdRulesHeaders;
    response: PutCommunitiesIdRulesResponse;
  };
  "get__communities_id_settings": {
    method: "GET";
    path: "/communities/{id}/settings";
    authenticated: true;
    body: GetCommunitiesIdSettingsBody;
    query: GetCommunitiesIdSettingsQuery;
    pathParams: GetCommunitiesIdSettingsPath;
    headers: GetCommunitiesIdSettingsHeaders;
    response: GetCommunitiesIdSettingsResponse;
  };
  "patch__communities_id_settings": {
    method: "PATCH";
    path: "/communities/{id}/settings";
    authenticated: true;
    body: PatchCommunitiesIdSettingsBody;
    query: PatchCommunitiesIdSettingsQuery;
    pathParams: PatchCommunitiesIdSettingsPath;
    headers: PatchCommunitiesIdSettingsHeaders;
    response: PatchCommunitiesIdSettingsResponse;
  };
  "patch__communities_id_members_userId_": {
    method: "PATCH";
    path: "/communities/{id}/members/{userId}";
    authenticated: true;
    body: PatchCommunitiesIdMembersUserIdBody;
    query: PatchCommunitiesIdMembersUserIdQuery;
    pathParams: PatchCommunitiesIdMembersUserIdPath;
    headers: PatchCommunitiesIdMembersUserIdHeaders;
    response: PatchCommunitiesIdMembersUserIdResponse;
  };
  "delete__communities_id_members_userId_": {
    method: "DELETE";
    path: "/communities/{id}/members/{userId}";
    authenticated: true;
    body: DeleteCommunitiesIdMembersUserIdBody;
    query: DeleteCommunitiesIdMembersUserIdQuery;
    pathParams: DeleteCommunitiesIdMembersUserIdPath;
    headers: DeleteCommunitiesIdMembersUserIdHeaders;
    response: DeleteCommunitiesIdMembersUserIdResponse;
  };
  "put__communities_id_bans_userId_": {
    method: "PUT";
    path: "/communities/{id}/bans/{userId}";
    authenticated: true;
    body: PutCommunitiesIdBansUserIdBody;
    query: PutCommunitiesIdBansUserIdQuery;
    pathParams: PutCommunitiesIdBansUserIdPath;
    headers: PutCommunitiesIdBansUserIdHeaders;
    response: PutCommunitiesIdBansUserIdResponse;
  };
  "delete__communities_id_bans_userId_": {
    method: "DELETE";
    path: "/communities/{id}/bans/{userId}";
    authenticated: true;
    body: DeleteCommunitiesIdBansUserIdBody;
    query: DeleteCommunitiesIdBansUserIdQuery;
    pathParams: DeleteCommunitiesIdBansUserIdPath;
    headers: DeleteCommunitiesIdBansUserIdHeaders;
    response: DeleteCommunitiesIdBansUserIdResponse;
  };
  "post__communities_id_join_requests": {
    method: "POST";
    path: "/communities/{id}/join-requests";
    authenticated: true;
    body: PostCommunitiesIdJoinRequestsBody;
    query: PostCommunitiesIdJoinRequestsQuery;
    pathParams: PostCommunitiesIdJoinRequestsPath;
    headers: PostCommunitiesIdJoinRequestsHeaders;
    response: PostCommunitiesIdJoinRequestsResponse;
  };
  "get__communities_id_join_requests": {
    method: "GET";
    path: "/communities/{id}/join-requests";
    authenticated: true;
    body: GetCommunitiesIdJoinRequestsBody;
    query: GetCommunitiesIdJoinRequestsQuery;
    pathParams: GetCommunitiesIdJoinRequestsPath;
    headers: GetCommunitiesIdJoinRequestsHeaders;
    response: GetCommunitiesIdJoinRequestsResponse;
  };
  "post__communities_id_invites": {
    method: "POST";
    path: "/communities/{id}/invites";
    authenticated: true;
    body: PostCommunitiesIdInvitesBody;
    query: PostCommunitiesIdInvitesQuery;
    pathParams: PostCommunitiesIdInvitesPath;
    headers: PostCommunitiesIdInvitesHeaders;
    response: PostCommunitiesIdInvitesResponse;
  };
  "patch__communities_id_join_requests_requestId_": {
    method: "PATCH";
    path: "/communities/{id}/join-requests/{requestId}";
    authenticated: true;
    body: PatchCommunitiesIdJoinRequestsRequestIdBody;
    query: PatchCommunitiesIdJoinRequestsRequestIdQuery;
    pathParams: PatchCommunitiesIdJoinRequestsRequestIdPath;
    headers: PatchCommunitiesIdJoinRequestsRequestIdHeaders;
    response: PatchCommunitiesIdJoinRequestsRequestIdResponse;
  };
  "delete__communities_id_join_requests_me": {
    method: "DELETE";
    path: "/communities/{id}/join-requests/me";
    authenticated: true;
    body: DeleteCommunitiesIdJoinRequestsMeBody;
    query: DeleteCommunitiesIdJoinRequestsMeQuery;
    pathParams: DeleteCommunitiesIdJoinRequestsMePath;
    headers: DeleteCommunitiesIdJoinRequestsMeHeaders;
    response: DeleteCommunitiesIdJoinRequestsMeResponse;
  };
  "post__communities_id_calls": {
    method: "POST";
    path: "/communities/{id}/calls";
    authenticated: true;
    body: PostCommunitiesIdCallsBody;
    query: PostCommunitiesIdCallsQuery;
    pathParams: PostCommunitiesIdCallsPath;
    headers: PostCommunitiesIdCallsHeaders;
    response: PostCommunitiesIdCallsResponse;
  };
  "get__communities_id_calls_active": {
    method: "GET";
    path: "/communities/{id}/calls/active";
    authenticated: true;
    body: GetCommunitiesIdCallsActiveBody;
    query: GetCommunitiesIdCallsActiveQuery;
    pathParams: GetCommunitiesIdCallsActivePath;
    headers: GetCommunitiesIdCallsActiveHeaders;
    response: GetCommunitiesIdCallsActiveResponse;
  };
  "post__communities_id_calls_callId_join": {
    method: "POST";
    path: "/communities/{id}/calls/{callId}/join";
    authenticated: true;
    body: PostCommunitiesIdCallsCallIdJoinBody;
    query: PostCommunitiesIdCallsCallIdJoinQuery;
    pathParams: PostCommunitiesIdCallsCallIdJoinPath;
    headers: PostCommunitiesIdCallsCallIdJoinHeaders;
    response: PostCommunitiesIdCallsCallIdJoinResponse;
  };
  "delete__communities_id_calls_callId_": {
    method: "DELETE";
    path: "/communities/{id}/calls/{callId}";
    authenticated: true;
    body: DeleteCommunitiesIdCallsCallIdBody;
    query: DeleteCommunitiesIdCallsCallIdQuery;
    pathParams: DeleteCommunitiesIdCallsCallIdPath;
    headers: DeleteCommunitiesIdCallsCallIdHeaders;
    response: DeleteCommunitiesIdCallsCallIdResponse;
  };
  "post__communities_id_ownership_transfer": {
    method: "POST";
    path: "/communities/{id}/ownership-transfer";
    authenticated: true;
    body: PostCommunitiesIdOwnershipTransferBody;
    query: PostCommunitiesIdOwnershipTransferQuery;
    pathParams: PostCommunitiesIdOwnershipTransferPath;
    headers: PostCommunitiesIdOwnershipTransferHeaders;
    response: PostCommunitiesIdOwnershipTransferResponse;
  };
  "put__communities_id_messages_read": {
    method: "PUT";
    path: "/communities/{id}/messages/read";
    authenticated: true;
    body: PutCommunitiesIdMessagesReadBody;
    query: PutCommunitiesIdMessagesReadQuery;
    pathParams: PutCommunitiesIdMessagesReadPath;
    headers: PutCommunitiesIdMessagesReadHeaders;
    response: PutCommunitiesIdMessagesReadResponse;
  };
  "patch__communities_id_notification_preferences_me": {
    method: "PATCH";
    path: "/communities/{id}/notification-preferences/me";
    authenticated: true;
    body: PatchCommunitiesIdNotificationPreferencesMeBody;
    query: PatchCommunitiesIdNotificationPreferencesMeQuery;
    pathParams: PatchCommunitiesIdNotificationPreferencesMePath;
    headers: PatchCommunitiesIdNotificationPreferencesMeHeaders;
    response: PatchCommunitiesIdNotificationPreferencesMeResponse;
  };
  "patch__communities_id_announcements_announcementId_": {
    method: "PATCH";
    path: "/communities/{id}/announcements/{announcementId}";
    authenticated: true;
    body: PatchCommunitiesIdAnnouncementsAnnouncementIdBody;
    query: PatchCommunitiesIdAnnouncementsAnnouncementIdQuery;
    pathParams: PatchCommunitiesIdAnnouncementsAnnouncementIdPath;
    headers: PatchCommunitiesIdAnnouncementsAnnouncementIdHeaders;
    response: PatchCommunitiesIdAnnouncementsAnnouncementIdResponse;
  };
  "delete__communities_id_announcements_announcementId_": {
    method: "DELETE";
    path: "/communities/{id}/announcements/{announcementId}";
    authenticated: true;
    body: DeleteCommunitiesIdAnnouncementsAnnouncementIdBody;
    query: DeleteCommunitiesIdAnnouncementsAnnouncementIdQuery;
    pathParams: DeleteCommunitiesIdAnnouncementsAnnouncementIdPath;
    headers: DeleteCommunitiesIdAnnouncementsAnnouncementIdHeaders;
    response: DeleteCommunitiesIdAnnouncementsAnnouncementIdResponse;
  };
  "patch__communities_id_messages_messageId_": {
    method: "PATCH";
    path: "/communities/{id}/messages/{messageId}";
    authenticated: true;
    body: PatchCommunitiesIdMessagesMessageIdBody;
    query: PatchCommunitiesIdMessagesMessageIdQuery;
    pathParams: PatchCommunitiesIdMessagesMessageIdPath;
    headers: PatchCommunitiesIdMessagesMessageIdHeaders;
    response: PatchCommunitiesIdMessagesMessageIdResponse;
  };
  "delete__communities_id_messages_messageId_": {
    method: "DELETE";
    path: "/communities/{id}/messages/{messageId}";
    authenticated: true;
    body: DeleteCommunitiesIdMessagesMessageIdBody;
    query: DeleteCommunitiesIdMessagesMessageIdQuery;
    pathParams: DeleteCommunitiesIdMessagesMessageIdPath;
    headers: DeleteCommunitiesIdMessagesMessageIdHeaders;
    response: DeleteCommunitiesIdMessagesMessageIdResponse;
  };
  "put__communities_id_messages_messageId_reactions_emoji_": {
    method: "PUT";
    path: "/communities/{id}/messages/{messageId}/reactions/{emoji}";
    authenticated: true;
    body: PutCommunitiesIdMessagesMessageIdReactionsEmojiBody;
    query: PutCommunitiesIdMessagesMessageIdReactionsEmojiQuery;
    pathParams: PutCommunitiesIdMessagesMessageIdReactionsEmojiPath;
    headers: PutCommunitiesIdMessagesMessageIdReactionsEmojiHeaders;
    response: PutCommunitiesIdMessagesMessageIdReactionsEmojiResponse;
  };
  "delete__communities_id_messages_messageId_reactions_emoji_": {
    method: "DELETE";
    path: "/communities/{id}/messages/{messageId}/reactions/{emoji}";
    authenticated: true;
    body: DeleteCommunitiesIdMessagesMessageIdReactionsEmojiBody;
    query: DeleteCommunitiesIdMessagesMessageIdReactionsEmojiQuery;
    pathParams: DeleteCommunitiesIdMessagesMessageIdReactionsEmojiPath;
    headers: DeleteCommunitiesIdMessagesMessageIdReactionsEmojiHeaders;
    response: DeleteCommunitiesIdMessagesMessageIdReactionsEmojiResponse;
  };
  "put__communities_id_messages_messageId_pin": {
    method: "PUT";
    path: "/communities/{id}/messages/{messageId}/pin";
    authenticated: true;
    body: PutCommunitiesIdMessagesMessageIdPinBody;
    query: PutCommunitiesIdMessagesMessageIdPinQuery;
    pathParams: PutCommunitiesIdMessagesMessageIdPinPath;
    headers: PutCommunitiesIdMessagesMessageIdPinHeaders;
    response: PutCommunitiesIdMessagesMessageIdPinResponse;
  };
  "delete__communities_id_messages_messageId_pin": {
    method: "DELETE";
    path: "/communities/{id}/messages/{messageId}/pin";
    authenticated: true;
    body: DeleteCommunitiesIdMessagesMessageIdPinBody;
    query: DeleteCommunitiesIdMessagesMessageIdPinQuery;
    pathParams: DeleteCommunitiesIdMessagesMessageIdPinPath;
    headers: DeleteCommunitiesIdMessagesMessageIdPinHeaders;
    response: DeleteCommunitiesIdMessagesMessageIdPinResponse;
  };
  "patch__communities_id_posts_postId_": {
    method: "PATCH";
    path: "/communities/{id}/posts/{postId}";
    authenticated: true;
    body: PatchCommunitiesIdPostsPostIdBody;
    query: PatchCommunitiesIdPostsPostIdQuery;
    pathParams: PatchCommunitiesIdPostsPostIdPath;
    headers: PatchCommunitiesIdPostsPostIdHeaders;
    response: PatchCommunitiesIdPostsPostIdResponse;
  };
  "delete__communities_id_posts_postId_": {
    method: "DELETE";
    path: "/communities/{id}/posts/{postId}";
    authenticated: true;
    body: DeleteCommunitiesIdPostsPostIdBody;
    query: DeleteCommunitiesIdPostsPostIdQuery;
    pathParams: DeleteCommunitiesIdPostsPostIdPath;
    headers: DeleteCommunitiesIdPostsPostIdHeaders;
    response: DeleteCommunitiesIdPostsPostIdResponse;
  };
  "get__events": {
    method: "GET";
    path: "/events";
    authenticated: false;
    body: GetEventsBody;
    query: GetEventsQuery;
    pathParams: GetEventsPath;
    headers: GetEventsHeaders;
    response: GetEventsResponse;
  };
  "post__events": {
    method: "POST";
    path: "/events";
    authenticated: true;
    body: PostEventsBody;
    query: PostEventsQuery;
    pathParams: PostEventsPath;
    headers: PostEventsHeaders;
    response: PostEventsResponse;
  };
  "get__events_recommended": {
    method: "GET";
    path: "/events/recommended";
    authenticated: true;
    body: GetEventsRecommendedBody;
    query: GetEventsRecommendedQuery;
    pathParams: GetEventsRecommendedPath;
    headers: GetEventsRecommendedHeaders;
    response: GetEventsRecommendedResponse;
  };
  "get__events_created_me": {
    method: "GET";
    path: "/events/created/me";
    authenticated: true;
    body: GetEventsCreatedMeBody;
    query: GetEventsCreatedMeQuery;
    pathParams: GetEventsCreatedMePath;
    headers: GetEventsCreatedMeHeaders;
    response: GetEventsCreatedMeResponse;
  };
  "get__events_id_": {
    method: "GET";
    path: "/events/{id}";
    authenticated: false;
    body: GetEventsIdBody;
    query: GetEventsIdQuery;
    pathParams: GetEventsIdPath;
    headers: GetEventsIdHeaders;
    response: GetEventsIdResponse;
  };
  "patch__events_id_": {
    method: "PATCH";
    path: "/events/{id}";
    authenticated: true;
    body: PatchEventsIdBody;
    query: PatchEventsIdQuery;
    pathParams: PatchEventsIdPath;
    headers: PatchEventsIdHeaders;
    response: PatchEventsIdResponse;
  };
  "delete__events_id_": {
    method: "DELETE";
    path: "/events/{id}";
    authenticated: true;
    body: DeleteEventsIdBody;
    query: DeleteEventsIdQuery;
    pathParams: DeleteEventsIdPath;
    headers: DeleteEventsIdHeaders;
    response: DeleteEventsIdResponse;
  };
  "post__events_id_orders": {
    method: "POST";
    path: "/events/{id}/orders";
    authenticated: true;
    body: PostEventsIdOrdersBody;
    query: PostEventsIdOrdersQuery;
    pathParams: PostEventsIdOrdersPath;
    headers: PostEventsIdOrdersHeaders;
    response: PostEventsIdOrdersResponse;
  };
  "post__events_id_publish": {
    method: "POST";
    path: "/events/{id}/publish";
    authenticated: true;
    body: PostEventsIdPublishBody;
    query: PostEventsIdPublishQuery;
    pathParams: PostEventsIdPublishPath;
    headers: PostEventsIdPublishHeaders;
    response: PostEventsIdPublishResponse;
  };
  "post__events_id_cancel": {
    method: "POST";
    path: "/events/{id}/cancel";
    authenticated: true;
    body: PostEventsIdCancelBody;
    query: PostEventsIdCancelQuery;
    pathParams: PostEventsIdCancelPath;
    headers: PostEventsIdCancelHeaders;
    response: PostEventsIdCancelResponse;
  };
  "post__events_id_ticket_types": {
    method: "POST";
    path: "/events/{id}/ticket-types";
    authenticated: true;
    body: PostEventsIdTicketTypesBody;
    query: PostEventsIdTicketTypesQuery;
    pathParams: PostEventsIdTicketTypesPath;
    headers: PostEventsIdTicketTypesHeaders;
    response: PostEventsIdTicketTypesResponse;
  };
  "patch__events_id_ticket_types_ticketTypeId_": {
    method: "PATCH";
    path: "/events/{id}/ticket-types/{ticketTypeId}";
    authenticated: true;
    body: PatchEventsIdTicketTypesTicketTypeIdBody;
    query: PatchEventsIdTicketTypesTicketTypeIdQuery;
    pathParams: PatchEventsIdTicketTypesTicketTypeIdPath;
    headers: PatchEventsIdTicketTypesTicketTypeIdHeaders;
    response: PatchEventsIdTicketTypesTicketTypeIdResponse;
  };
  "delete__events_id_ticket_types_ticketTypeId_": {
    method: "DELETE";
    path: "/events/{id}/ticket-types/{ticketTypeId}";
    authenticated: true;
    body: DeleteEventsIdTicketTypesTicketTypeIdBody;
    query: DeleteEventsIdTicketTypesTicketTypeIdQuery;
    pathParams: DeleteEventsIdTicketTypesTicketTypeIdPath;
    headers: DeleteEventsIdTicketTypesTicketTypeIdHeaders;
    response: DeleteEventsIdTicketTypesTicketTypeIdResponse;
  };
  "get__events_id_attendees": {
    method: "GET";
    path: "/events/{id}/attendees";
    authenticated: true;
    body: GetEventsIdAttendeesBody;
    query: GetEventsIdAttendeesQuery;
    pathParams: GetEventsIdAttendeesPath;
    headers: GetEventsIdAttendeesHeaders;
    response: GetEventsIdAttendeesResponse;
  };
  "post__events_id_check_ins": {
    method: "POST";
    path: "/events/{id}/check-ins";
    authenticated: true;
    body: PostEventsIdCheckInsBody;
    query: PostEventsIdCheckInsQuery;
    pathParams: PostEventsIdCheckInsPath;
    headers: PostEventsIdCheckInsHeaders;
    response: PostEventsIdCheckInsResponse;
  };
  "post__events_id_reports": {
    method: "POST";
    path: "/events/{id}/reports";
    authenticated: true;
    body: PostEventsIdReportsBody;
    query: PostEventsIdReportsQuery;
    pathParams: PostEventsIdReportsPath;
    headers: PostEventsIdReportsHeaders;
    response: PostEventsIdReportsResponse;
  };
  "get__communities": {
    method: "GET";
    path: "/communities";
    authenticated: false;
    body: GetCommunitiesBody;
    query: GetCommunitiesQuery;
    pathParams: GetCommunitiesPath;
    headers: GetCommunitiesHeaders;
    response: GetCommunitiesResponse;
  };
  "post__communities": {
    method: "POST";
    path: "/communities";
    authenticated: true;
    body: PostCommunitiesBody;
    query: PostCommunitiesQuery;
    pathParams: PostCommunitiesPath;
    headers: PostCommunitiesHeaders;
    response: PostCommunitiesResponse;
  };
  "get__communities_id_": {
    method: "GET";
    path: "/communities/{id}";
    authenticated: false;
    body: GetCommunitiesIdBody;
    query: GetCommunitiesIdQuery;
    pathParams: GetCommunitiesIdPath;
    headers: GetCommunitiesIdHeaders;
    response: GetCommunitiesIdResponse;
  };
  "patch__communities_id_": {
    method: "PATCH";
    path: "/communities/{id}";
    authenticated: true;
    body: PatchCommunitiesIdBody;
    query: PatchCommunitiesIdQuery;
    pathParams: PatchCommunitiesIdPath;
    headers: PatchCommunitiesIdHeaders;
    response: PatchCommunitiesIdResponse;
  };
  "post__communities_id_members": {
    method: "POST";
    path: "/communities/{id}/members";
    authenticated: true;
    body: PostCommunitiesIdMembersBody;
    query: PostCommunitiesIdMembersQuery;
    pathParams: PostCommunitiesIdMembersPath;
    headers: PostCommunitiesIdMembersHeaders;
    response: PostCommunitiesIdMembersResponse;
  };
  "get__communities_id_members": {
    method: "GET";
    path: "/communities/{id}/members";
    authenticated: true;
    body: GetCommunitiesIdMembersBody;
    query: GetCommunitiesIdMembersQuery;
    pathParams: GetCommunitiesIdMembersPath;
    headers: GetCommunitiesIdMembersHeaders;
    response: GetCommunitiesIdMembersResponse;
  };
  "post__communities_id_membership_orders": {
    method: "POST";
    path: "/communities/{id}/membership-orders";
    authenticated: true;
    body: PostCommunitiesIdMembershipOrdersBody;
    query: PostCommunitiesIdMembershipOrdersQuery;
    pathParams: PostCommunitiesIdMembershipOrdersPath;
    headers: PostCommunitiesIdMembershipOrdersHeaders;
    response: PostCommunitiesIdMembershipOrdersResponse;
  };
  "get__communities_membership_orders_orderNumber_verify": {
    method: "GET";
    path: "/communities/membership-orders/{orderNumber}/verify";
    authenticated: true;
    body: GetCommunitiesMembershipOrdersOrderNumberVerifyBody;
    query: GetCommunitiesMembershipOrdersOrderNumberVerifyQuery;
    pathParams: GetCommunitiesMembershipOrdersOrderNumberVerifyPath;
    headers: GetCommunitiesMembershipOrdersOrderNumberVerifyHeaders;
    response: GetCommunitiesMembershipOrdersOrderNumberVerifyResponse;
  };
  "delete__communities_id_members_me": {
    method: "DELETE";
    path: "/communities/{id}/members/me";
    authenticated: true;
    body: DeleteCommunitiesIdMembersMeBody;
    query: DeleteCommunitiesIdMembersMeQuery;
    pathParams: DeleteCommunitiesIdMembersMePath;
    headers: DeleteCommunitiesIdMembersMeHeaders;
    response: DeleteCommunitiesIdMembersMeResponse;
  };
  "get__communities_id_posts": {
    method: "GET";
    path: "/communities/{id}/posts";
    authenticated: true;
    body: GetCommunitiesIdPostsBody;
    query: GetCommunitiesIdPostsQuery;
    pathParams: GetCommunitiesIdPostsPath;
    headers: GetCommunitiesIdPostsHeaders;
    response: GetCommunitiesIdPostsResponse;
  };
  "post__communities_id_posts": {
    method: "POST";
    path: "/communities/{id}/posts";
    authenticated: true;
    body: PostCommunitiesIdPostsBody;
    query: PostCommunitiesIdPostsQuery;
    pathParams: PostCommunitiesIdPostsPath;
    headers: PostCommunitiesIdPostsHeaders;
    response: PostCommunitiesIdPostsResponse;
  };
  "get__communities_id_announcements": {
    method: "GET";
    path: "/communities/{id}/announcements";
    authenticated: true;
    body: GetCommunitiesIdAnnouncementsBody;
    query: GetCommunitiesIdAnnouncementsQuery;
    pathParams: GetCommunitiesIdAnnouncementsPath;
    headers: GetCommunitiesIdAnnouncementsHeaders;
    response: GetCommunitiesIdAnnouncementsResponse;
  };
  "post__communities_id_announcements": {
    method: "POST";
    path: "/communities/{id}/announcements";
    authenticated: true;
    body: PostCommunitiesIdAnnouncementsBody;
    query: PostCommunitiesIdAnnouncementsQuery;
    pathParams: PostCommunitiesIdAnnouncementsPath;
    headers: PostCommunitiesIdAnnouncementsHeaders;
    response: PostCommunitiesIdAnnouncementsResponse;
  };
  "get__communities_id_messages": {
    method: "GET";
    path: "/communities/{id}/messages";
    authenticated: true;
    body: GetCommunitiesIdMessagesBody;
    query: GetCommunitiesIdMessagesQuery;
    pathParams: GetCommunitiesIdMessagesPath;
    headers: GetCommunitiesIdMessagesHeaders;
    response: GetCommunitiesIdMessagesResponse;
  };
  "post__communities_id_messages": {
    method: "POST";
    path: "/communities/{id}/messages";
    authenticated: true;
    body: PostCommunitiesIdMessagesBody;
    query: PostCommunitiesIdMessagesQuery;
    pathParams: PostCommunitiesIdMessagesPath;
    headers: PostCommunitiesIdMessagesHeaders;
    response: PostCommunitiesIdMessagesResponse;
  };
  "post__communities_id_messages_messageId_reports": {
    method: "POST";
    path: "/communities/{id}/messages/{messageId}/reports";
    authenticated: true;
    body: PostCommunitiesIdMessagesMessageIdReportsBody;
    query: PostCommunitiesIdMessagesMessageIdReportsQuery;
    pathParams: PostCommunitiesIdMessagesMessageIdReportsPath;
    headers: PostCommunitiesIdMessagesMessageIdReportsHeaders;
    response: PostCommunitiesIdMessagesMessageIdReportsResponse;
  };
  "post__communities_id_reports": {
    method: "POST";
    path: "/communities/{id}/reports";
    authenticated: true;
    body: PostCommunitiesIdReportsBody;
    query: PostCommunitiesIdReportsQuery;
    pathParams: PostCommunitiesIdReportsPath;
    headers: PostCommunitiesIdReportsHeaders;
    response: PostCommunitiesIdReportsResponse;
  };
  "get__friends": {
    method: "GET";
    path: "/friends";
    authenticated: true;
    body: GetFriendsBody;
    query: GetFriendsQuery;
    pathParams: GetFriendsPath;
    headers: GetFriendsHeaders;
    response: GetFriendsResponse;
  };
  "get__friends_requests": {
    method: "GET";
    path: "/friends/requests";
    authenticated: true;
    body: GetFriendsRequestsBody;
    query: GetFriendsRequestsQuery;
    pathParams: GetFriendsRequestsPath;
    headers: GetFriendsRequestsHeaders;
    response: GetFriendsRequestsResponse;
  };
  "get__friends_suggestions": {
    method: "GET";
    path: "/friends/suggestions";
    authenticated: true;
    body: GetFriendsSuggestionsBody;
    query: GetFriendsSuggestionsQuery;
    pathParams: GetFriendsSuggestionsPath;
    headers: GetFriendsSuggestionsHeaders;
    response: GetFriendsSuggestionsResponse;
  };
  "post__friends_requests_userId_": {
    method: "POST";
    path: "/friends/requests/{userId}";
    authenticated: true;
    body: PostFriendsRequestsUserIdBody;
    query: PostFriendsRequestsUserIdQuery;
    pathParams: PostFriendsRequestsUserIdPath;
    headers: PostFriendsRequestsUserIdHeaders;
    response: PostFriendsRequestsUserIdResponse;
  };
  "patch__friends_requests_id_": {
    method: "PATCH";
    path: "/friends/requests/{id}";
    authenticated: true;
    body: PatchFriendsRequestsIdBody;
    query: PatchFriendsRequestsIdQuery;
    pathParams: PatchFriendsRequestsIdPath;
    headers: PatchFriendsRequestsIdHeaders;
    response: PatchFriendsRequestsIdResponse;
  };
  "delete__friends_id_": {
    method: "DELETE";
    path: "/friends/{id}";
    authenticated: true;
    body: DeleteFriendsIdBody;
    query: DeleteFriendsIdQuery;
    pathParams: DeleteFriendsIdPath;
    headers: DeleteFriendsIdHeaders;
    response: DeleteFriendsIdResponse;
  };
  "get__chat_conversations": {
    method: "GET";
    path: "/chat/conversations";
    authenticated: true;
    body: GetChatConversationsBody;
    query: GetChatConversationsQuery;
    pathParams: GetChatConversationsPath;
    headers: GetChatConversationsHeaders;
    response: GetChatConversationsResponse;
  };
  "post__chat_conversations": {
    method: "POST";
    path: "/chat/conversations";
    authenticated: true;
    body: PostChatConversationsBody;
    query: PostChatConversationsQuery;
    pathParams: PostChatConversationsPath;
    headers: PostChatConversationsHeaders;
    response: PostChatConversationsResponse;
  };
  "get__chat_conversations_id_messages": {
    method: "GET";
    path: "/chat/conversations/{id}/messages";
    authenticated: true;
    body: GetChatConversationsIdMessagesBody;
    query: GetChatConversationsIdMessagesQuery;
    pathParams: GetChatConversationsIdMessagesPath;
    headers: GetChatConversationsIdMessagesHeaders;
    response: GetChatConversationsIdMessagesResponse;
  };
  "post__chat_conversations_id_messages": {
    method: "POST";
    path: "/chat/conversations/{id}/messages";
    authenticated: true;
    body: PostChatConversationsIdMessagesBody;
    query: PostChatConversationsIdMessagesQuery;
    pathParams: PostChatConversationsIdMessagesPath;
    headers: PostChatConversationsIdMessagesHeaders;
    response: PostChatConversationsIdMessagesResponse;
  };
  "post__chat_conversations_id_read": {
    method: "POST";
    path: "/chat/conversations/{id}/read";
    authenticated: true;
    body: PostChatConversationsIdReadBody;
    query: PostChatConversationsIdReadQuery;
    pathParams: PostChatConversationsIdReadPath;
    headers: PostChatConversationsIdReadHeaders;
    response: PostChatConversationsIdReadResponse;
  };
  "post__ai_chat": {
    method: "POST";
    path: "/ai/chat";
    authenticated: true;
    body: PostAiChatBody;
    query: PostAiChatQuery;
    pathParams: PostAiChatPath;
    headers: PostAiChatHeaders;
    response: PostAiChatResponse;
  };
  "post__ai_event_copy": {
    method: "POST";
    path: "/ai/event-copy";
    authenticated: true;
    body: PostAiEventCopyBody;
    query: PostAiEventCopyQuery;
    pathParams: PostAiEventCopyPath;
    headers: PostAiEventCopyHeaders;
    response: PostAiEventCopyResponse;
  };
  "post__ai_event_recommendations": {
    method: "POST";
    path: "/ai/event-recommendations";
    authenticated: true;
    body: PostAiEventRecommendationsBody;
    query: PostAiEventRecommendationsQuery;
    pathParams: PostAiEventRecommendationsPath;
    headers: PostAiEventRecommendationsHeaders;
    response: PostAiEventRecommendationsResponse;
  };
  "post__ai_conversations_id_summary": {
    method: "POST";
    path: "/ai/conversations/{id}/summary";
    authenticated: true;
    body: PostAiConversationsIdSummaryBody;
    query: PostAiConversationsIdSummaryQuery;
    pathParams: PostAiConversationsIdSummaryPath;
    headers: PostAiConversationsIdSummaryHeaders;
    response: PostAiConversationsIdSummaryResponse;
  };
  "get__ai_sessions": {
    method: "GET";
    path: "/ai/sessions";
    authenticated: true;
    body: GetAiSessionsBody;
    query: GetAiSessionsQuery;
    pathParams: GetAiSessionsPath;
    headers: GetAiSessionsHeaders;
    response: GetAiSessionsResponse;
  };
  "delete__ai_sessions_id_": {
    method: "DELETE";
    path: "/ai/sessions/{id}";
    authenticated: true;
    body: DeleteAiSessionsIdBody;
    query: DeleteAiSessionsIdQuery;
    pathParams: DeleteAiSessionsIdPath;
    headers: DeleteAiSessionsIdHeaders;
    response: DeleteAiSessionsIdResponse;
  };
  "get__tickets": {
    method: "GET";
    path: "/tickets";
    authenticated: true;
    body: GetTicketsBody;
    query: GetTicketsQuery;
    pathParams: GetTicketsPath;
    headers: GetTicketsHeaders;
    response: GetTicketsResponse;
  };
  "get__tickets_orderNumber_": {
    method: "GET";
    path: "/tickets/{orderNumber}";
    authenticated: true;
    body: GetTicketsOrderNumberBody;
    query: GetTicketsOrderNumberQuery;
    pathParams: GetTicketsOrderNumberPath;
    headers: GetTicketsOrderNumberHeaders;
    response: GetTicketsOrderNumberResponse;
  };
  "get__tickets_orderNumber_verify": {
    method: "GET";
    path: "/tickets/{orderNumber}/verify";
    authenticated: true;
    body: GetTicketsOrderNumberVerifyBody;
    query: GetTicketsOrderNumberVerifyQuery;
    pathParams: GetTicketsOrderNumberVerifyPath;
    headers: GetTicketsOrderNumberVerifyHeaders;
    response: GetTicketsOrderNumberVerifyResponse;
  };
  "get__notifications": {
    method: "GET";
    path: "/notifications";
    authenticated: true;
    body: GetNotificationsBody;
    query: GetNotificationsQuery;
    pathParams: GetNotificationsPath;
    headers: GetNotificationsHeaders;
    response: GetNotificationsResponse;
  };
  "patch__notifications_read_all": {
    method: "PATCH";
    path: "/notifications/read-all";
    authenticated: true;
    body: PatchNotificationsReadAllBody;
    query: PatchNotificationsReadAllQuery;
    pathParams: PatchNotificationsReadAllPath;
    headers: PatchNotificationsReadAllHeaders;
    response: PatchNotificationsReadAllResponse;
  };
  "patch__notifications_id_read": {
    method: "PATCH";
    path: "/notifications/{id}/read";
    authenticated: true;
    body: PatchNotificationsIdReadBody;
    query: PatchNotificationsIdReadQuery;
    pathParams: PatchNotificationsIdReadPath;
    headers: PatchNotificationsIdReadHeaders;
    response: PatchNotificationsIdReadResponse;
  };
  "post__disputes": {
    method: "POST";
    path: "/disputes";
    authenticated: true;
    body: PostDisputesBody;
    query: PostDisputesQuery;
    pathParams: PostDisputesPath;
    headers: PostDisputesHeaders;
    response: PostDisputesResponse;
  };
  "get__disputes": {
    method: "GET";
    path: "/disputes";
    authenticated: true;
    body: GetDisputesBody;
    query: GetDisputesQuery;
    pathParams: GetDisputesPath;
    headers: GetDisputesHeaders;
    response: GetDisputesResponse;
  };
  "get__disputes_id_": {
    method: "GET";
    path: "/disputes/{id}";
    authenticated: true;
    body: GetDisputesIdBody;
    query: GetDisputesIdQuery;
    pathParams: GetDisputesIdPath;
    headers: GetDisputesIdHeaders;
    response: GetDisputesIdResponse;
  };
  "post__disputes_id_messages": {
    method: "POST";
    path: "/disputes/{id}/messages";
    authenticated: true;
    body: PostDisputesIdMessagesBody;
    query: PostDisputesIdMessagesQuery;
    pathParams: PostDisputesIdMessagesPath;
    headers: PostDisputesIdMessagesHeaders;
    response: PostDisputesIdMessagesResponse;
  };
  "patch__disputes_id_status": {
    method: "PATCH";
    path: "/disputes/{id}/status";
    authenticated: true;
    body: PatchDisputesIdStatusBody;
    query: PatchDisputesIdStatusQuery;
    pathParams: PatchDisputesIdStatusPath;
    headers: PatchDisputesIdStatusHeaders;
    response: PatchDisputesIdStatusResponse;
  };
  "get__wallet": {
    method: "GET";
    path: "/wallet";
    authenticated: true;
    body: GetWalletBody;
    query: GetWalletQuery;
    pathParams: GetWalletPath;
    headers: GetWalletHeaders;
    response: GetWalletResponse;
  };
  "get__wallet_transactions": {
    method: "GET";
    path: "/wallet/transactions";
    authenticated: true;
    body: GetWalletTransactionsBody;
    query: GetWalletTransactionsQuery;
    pathParams: GetWalletTransactionsPath;
    headers: GetWalletTransactionsHeaders;
    response: GetWalletTransactionsResponse;
  };
  "get__wallet_transactions_id_": {
    method: "GET";
    path: "/wallet/transactions/{id}";
    authenticated: true;
    body: GetWalletTransactionsIdBody;
    query: GetWalletTransactionsIdQuery;
    pathParams: GetWalletTransactionsIdPath;
    headers: GetWalletTransactionsIdHeaders;
    response: GetWalletTransactionsIdResponse;
  };
  "post__wallet_topups": {
    method: "POST";
    path: "/wallet/topups";
    authenticated: true;
    body: PostWalletTopupsBody;
    query: PostWalletTopupsQuery;
    pathParams: PostWalletTopupsPath;
    headers: PostWalletTopupsHeaders;
    response: PostWalletTopupsResponse;
  };
  "get__wallet_topups_reference_verify": {
    method: "GET";
    path: "/wallet/topups/{reference}/verify";
    authenticated: true;
    body: GetWalletTopupsReferenceVerifyBody;
    query: GetWalletTopupsReferenceVerifyQuery;
    pathParams: GetWalletTopupsReferenceVerifyPath;
    headers: GetWalletTopupsReferenceVerifyHeaders;
    response: GetWalletTopupsReferenceVerifyResponse;
  };
  "get__wallet_banks": {
    method: "GET";
    path: "/wallet/banks";
    authenticated: true;
    body: GetWalletBanksBody;
    query: GetWalletBanksQuery;
    pathParams: GetWalletBanksPath;
    headers: GetWalletBanksHeaders;
    response: GetWalletBanksResponse;
  };
  "get__wallet_bank_accounts": {
    method: "GET";
    path: "/wallet/bank-accounts";
    authenticated: true;
    body: GetWalletBankAccountsBody;
    query: GetWalletBankAccountsQuery;
    pathParams: GetWalletBankAccountsPath;
    headers: GetWalletBankAccountsHeaders;
    response: GetWalletBankAccountsResponse;
  };
  "post__wallet_bank_accounts": {
    method: "POST";
    path: "/wallet/bank-accounts";
    authenticated: true;
    body: PostWalletBankAccountsBody;
    query: PostWalletBankAccountsQuery;
    pathParams: PostWalletBankAccountsPath;
    headers: PostWalletBankAccountsHeaders;
    response: PostWalletBankAccountsResponse;
  };
  "delete__wallet_bank_accounts_id_": {
    method: "DELETE";
    path: "/wallet/bank-accounts/{id}";
    authenticated: true;
    body: DeleteWalletBankAccountsIdBody;
    query: DeleteWalletBankAccountsIdQuery;
    pathParams: DeleteWalletBankAccountsIdPath;
    headers: DeleteWalletBankAccountsIdHeaders;
    response: DeleteWalletBankAccountsIdResponse;
  };
  "post__wallet_transfers": {
    method: "POST";
    path: "/wallet/transfers";
    authenticated: true;
    body: PostWalletTransfersBody;
    query: PostWalletTransfersQuery;
    pathParams: PostWalletTransfersPath;
    headers: PostWalletTransfersHeaders;
    response: PostWalletTransfersResponse;
  };
  "post__wallet_withdrawals": {
    method: "POST";
    path: "/wallet/withdrawals";
    authenticated: true;
    body: PostWalletWithdrawalsBody;
    query: PostWalletWithdrawalsQuery;
    pathParams: PostWalletWithdrawalsPath;
    headers: PostWalletWithdrawalsHeaders;
    response: PostWalletWithdrawalsResponse;
  };
  "post__wallet_withdrawals_reference_finalize": {
    method: "POST";
    path: "/wallet/withdrawals/{reference}/finalize";
    authenticated: true;
    body: PostWalletWithdrawalsReferenceFinalizeBody;
    query: PostWalletWithdrawalsReferenceFinalizeQuery;
    pathParams: PostWalletWithdrawalsReferenceFinalizePath;
    headers: PostWalletWithdrawalsReferenceFinalizeHeaders;
    response: PostWalletWithdrawalsReferenceFinalizeResponse;
  };
  "post__uploads_files": {
    method: "POST";
    path: "/uploads/files";
    authenticated: true;
    body: PostUploadsFilesBody;
    query: PostUploadsFilesQuery;
    pathParams: PostUploadsFilesPath;
    headers: PostUploadsFilesHeaders;
    response: PostUploadsFilesResponse;
  };
  "post__uploads_images": {
    method: "POST";
    path: "/uploads/images";
    authenticated: true;
    body: PostUploadsImagesBody;
    query: PostUploadsImagesQuery;
    pathParams: PostUploadsImagesPath;
    headers: PostUploadsImagesHeaders;
    response: PostUploadsImagesResponse;
  };
  "post__webhooks_paystack": {
    method: "POST";
    path: "/webhooks/paystack";
    authenticated: false;
    body: PostWebhooksPaystackBody;
    query: PostWebhooksPaystackQuery;
    pathParams: PostWebhooksPaystackPath;
    headers: PostWebhooksPaystackHeaders;
    response: PostWebhooksPaystackResponse;
  };
}

export type ApiOperationId = keyof ApiOperationMap;
