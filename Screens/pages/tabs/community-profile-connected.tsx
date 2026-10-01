import { useFocusEffect } from "@react-navigation/native";
import { useCachedObjectState } from "../../hooks/use-cached-object-state";
import { SessionCache } from "../../services/cache/session-cache";
import CacheRefreshNotice from "../../components/ui/cache-refresh-notice";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppLoader from "../../components/ui/app-loader";
import AppAlertModal from "../../components/ui/app-alert-modal";
import PaystackCheckoutModal, {
  type PaystackVerificationResult,
} from "../../components/ui/paystack-checkout-modal";
import AppReportSheet from "../../components/ui/app-report-sheet";
import {
  communityImage,
  DEFAULT_COMMUNITY_GUIDELINES,
  initials,
} from "../../data/community-presentation";
import {
  communityReportReasons,
  toCommunityReportReason,
  type ReportReason,
} from "../../data/report-options";
import { useAuth } from "../../hooks/use-auth";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetCommunitiesIdAnnouncementsResponse,
  GetCommunitiesIdPostsResponse,
  GetCommunitiesIdResponse,
  GetCommunitiesIdRulesResponse,
  GetUsersMeCommunitiesResponse,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityProfile">;
type Community = GetCommunitiesIdResponse["data"]["community"];
type Member = {
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
type Announcement =
  GetCommunitiesIdAnnouncementsResponse["data"]["announcements"][number];
type Post = GetCommunitiesIdPostsResponse["data"]["posts"][number];
type CommunityUpdate = Announcement | Post;
type CommunityRules = GetCommunitiesIdRulesResponse["data"]["rules"];
type ViewerMembership =
  GetUsersMeCommunitiesResponse["data"]["communities"][number]["viewerMembership"];
type ProfileTab = "About" | "Members" | "Rules" | "Updates";
type UpdateTab = "posts" | "announcements";

type CommunityProfileSnapshot = {
  community: Community | null;
  members: Member[];
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
const emptyProfile: CommunityProfileSnapshot = {
  community: null,
  members: [],
  memberPage: 1,
  moreMembers: false,
  announcements: [],
  posts: [],
  postPage: 1,
  announcementPage: 1,
  morePosts: false,
  moreAnnouncements: false,
  communityRules: null,
  viewerMembership: null,
  messagePermission: "everyone",
  memberListVisible: true,
};
const communityProfileCache = new SessionCache<CommunityProfileSnapshot>(15);

const COMMUNITY_UPDATE_PAGE_SIZE = 20;

function readableDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapMember(value: unknown): Member | null {
  const item = asRecord(value);
  const memberUser = asRecord(item?.user) ?? item;
  const id = asString(memberUser?._id);
  if (!item || !memberUser || !id) return null;
  const role = asString(item.communityRole, "member");
  return {
    user: {
      _id: id,
      firstName: asString(memberUser.firstName),
      lastName: asString(memberUser.lastName),
      avatarUrl: asString(memberUser.avatarUrl),
      state: asString(memberUser.state),
      lga: asString(memberUser.lga),
    },
    communityRole: role === "owner" || role === "moderator" ? role : "member",
    status: asString(item.status, "active"),
    joinedAt: asString(item.joinedAt),
  };
}

function CommunityUpdateCard({
  item,
  communityName,
  kind,
}: {
  item: CommunityUpdate;
  communityName: string;
  kind: UpdateTab;
}) {
  const authorName =
    `${item.authorId.firstName} ${item.authorId.lastName}`.trim() ||
    communityName;

  return (
    <View style={styles.updateCard}>
      <View style={styles.updateCardHeader}>
        <View style={styles.updateIcon}>
          <Ionicons
            color="#078d45"
            name={
              kind === "announcements"
                ? "megaphone-outline"
                : "chatbubble-outline"
            }
            size={18}
          />
        </View>
        <View style={styles.updateAuthor}>
          <Text style={styles.updateAuthorName}>{authorName}</Text>
          <Text style={styles.updateDate}>{readableDate(item.createdAt)}</Text>
        </View>
        {kind === "announcements" ? (
          <Text style={styles.announcementBadge}>ANNOUNCEMENT</Text>
        ) : null}
      </View>
      <Text style={styles.updateText}>{item.text}</Text>
      {item.imageUrl ? (
        <Image
          accessibilityLabel="Community update image"
          source={{ uri: item.imageUrl }}
          style={styles.updateImage}
        />
      ) : null}
    </View>
  );
}

export default function CommunityProfileScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const communityId = route.params.communityId;
  const [snapshot, setters, hasCachedProfile] = useCachedObjectState(
    communityProfileCache,
    user?._id,
    communityId,
    emptyProfile,
  );
  const {
    community,
    members,
    memberPage,
    moreMembers,
    announcements,
    posts,
    postPage,
    announcementPage,
    morePosts,
    moreAnnouncements,
    communityRules,
    viewerMembership,
    messagePermission,
    memberListVisible,
  } = snapshot;
  const {
    community: setCommunity,
    members: setMembers,
    memberPage: setMemberPage,
    moreMembers: setMoreMembers,
    announcements: setAnnouncements,
    posts: setPosts,
    postPage: setPostPage,
    announcementPage: setAnnouncementPage,
    morePosts: setMorePosts,
    moreAnnouncements: setMoreAnnouncements,
    communityRules: setCommunityRules,
    viewerMembership: setViewerMembership,
    messagePermission: setMessagePermission,
    memberListVisible: setMemberListVisible,
  } = setters;
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeUpdateTab, setActiveUpdateTab] =
    useState<UpdateTab>("announcements");
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreAnnouncements, setLoadingMoreAnnouncements] =
    useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("About");
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading] = useState(!hasCachedProfile);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [joinRequestPending, setJoinRequestPending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [leaveConfirmVisible, setLeaveConfirmVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(
    null,
  );
  const updateRequestsRef = useRef(new Set<AbortController>());
  const paymentKey = useRef(createIdempotencyKey());

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const hadCachedProfile = Boolean(
        user?._id && communityProfileCache.read(user._id, communityId),
      );
      try {
        const [detailResponse, rulesResponse, mineResponse, pendingRequests] =
          await Promise.all([
            communitiesApi.get(communityId, signal),
            communitiesApi.rules(communityId, signal),
            communitiesApi.allMyCommunities(signal),
            communitiesApi.allMyJoinRequests(signal),
          ]);
        if (signal?.aborted) return;
        const nextCommunity = detailResponse.data.community;
        const membership =
          mineResponse.find((item) => item._id === communityId)
            ?.viewerMembership ?? null;
        setCommunity(nextCommunity);
        setCommunityRules(rulesResponse.data.rules);
        setViewerMembership(membership);
        setMembershipChecked(true);
        setJoinRequestPending(
          pendingRequests.some(
            (request) => request.communityId?._id === communityId,
          ),
        );

        if (membership?.status === "active") {
          setLoadingUpdates(!hadCachedProfile);
          try {
            const [postsResponse, announcementResponse, settingsResponse] =
              await Promise.all([
                communitiesApi.posts(
                  communityId,
                  { page: 1, limit: COMMUNITY_UPDATE_PAGE_SIZE },
                  signal,
                ),
                communitiesApi.announcements(
                  communityId,
                  { page: 1, limit: COMMUNITY_UPDATE_PAGE_SIZE },
                  signal,
                ),
                communitiesApi.settings(communityId, signal),
              ]);
            if (signal?.aborted) return;
            setPosts(postsResponse.data.posts);
            setPostPage(1);
            setMorePosts(
              postsResponse.data.posts.length <
                postsResponse.data.pagination.total,
            );
            setAnnouncements(announcementResponse.data.announcements);
            setAnnouncementPage(1);
            setMoreAnnouncements(
              announcementResponse.data.announcements.length <
                announcementResponse.data.pagination.total,
            );
            const canListMembers =
              settingsResponse.data.settings.showMemberList ||
              membership.role === "owner" ||
              membership.role === "moderator";
            setMemberListVisible(canListMembers);
            if (canListMembers) {
              const memberResponse = await communitiesApi.members(
                communityId,
                { page: 1, limit: 100 },
                signal,
              );
              if (signal?.aborted) return;
              setMembers(
                (memberResponse.data.members as unknown[])
                  .map(mapMember)
                  .filter((item): item is Member => item !== null),
              );
              setMemberPage(1);
              setMoreMembers(
                (memberResponse.data.pagination?.total ??
                  memberResponse.data.members.length) >
                  memberResponse.data.members.length,
              );
            } else {
              setMembers([]);
              setMoreMembers(false);
              setActiveTab("About");
            }
            setMessagePermission(
              settingsResponse.data.settings.messagePermission,
            );
          } finally {
            if (!signal?.aborted) setLoadingUpdates(false);
          }
        } else {
          setMembers([]);
          setMemberListVisible(false);
          setMoreMembers(false);
          setPosts([]);
          setPostPage(1);
          setMorePosts(false);
          setAnnouncements([]);
          setAnnouncementPage(1);
          setMoreAnnouncements(false);
          setLoadingUpdates(false);
          setMessagePermission("everyone");
          setActiveTab("About");
        }
      } catch (error) {
        if (
          !signal?.aborted &&
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          if (user?._id)
            communityProfileCache.invalidate(user._id, communityId);
          setMembershipChecked(false);
        }
        throw error;
      }
    },
    [communityId, setters, user?._id],
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(
        !user?._id ||
          communityProfileCache.read(user._id, communityId) === undefined,
      );
      setMembershipChecked(false);
      setRefreshError(null);
      load(controller.signal)
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (
            error instanceof ApiError &&
            [401, 403, 404].includes(error.status)
          ) {
            if (user?._id)
              communityProfileCache.invalidate(user._id, communityId);
            setMembershipChecked(false);
          }
          const message =
            error instanceof ApiError
              ? error.message
              : "Unable to refresh this community. Showing your last loaded content.";
          if (user?._id && communityProfileCache.read(user._id, communityId))
            setRefreshError(message);
          else setAlert({ title: "Community unavailable", message });
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => {
        controller.abort();
        updateRequestsRef.current.forEach((request) => request.abort());
        updateRequestsRef.current.clear();
      };
    }, [load, communityId, user?._id]),
  );

  const joined = viewerMembership?.status === "active";
  const ownerId =
    typeof community?.ownerId === "string"
      ? community.ownerId
      : community?.ownerId?._id;
  const isOwner =
    viewerMembership?.role === "owner" || Boolean(user && ownerId === user._id);
  const canModerate =
    membershipChecked && (isOwner || viewerMembership?.role === "moderator");
  const activeRules = communityRules?.rules?.length
    ? communityRules.rules
    : DEFAULT_COMMUNITY_GUIDELINES;
  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();
    if (!search) return members;
    return members.filter((member) =>
      `${member.user.firstName} ${member.user.lastName}`
        .toLowerCase()
        .includes(search),
    );
  }, [memberSearch, members]);
  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [posts],
  );
  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [announcements],
  );
  const latestAnnouncements = sortedAnnouncements.slice(0, 2);

  const loadMoreMembers = async () => {
    if (!moreMembers || loadingMembers) return;
    setLoadingMembers(true);
    try {
      const nextPage = memberPage + 1;
      const response = await communitiesApi.members(communityId, {
        page: nextPage,
        limit: 100,
      });
      const nextMembers = (response.data.members as unknown[])
        .map(mapMember)
        .filter((item): item is Member => item !== null);
      setMembers((current) => {
        const ids = new Set(current.map((member) => member.user._id));
        return [
          ...current,
          ...nextMembers.filter((member) => !ids.has(member.user._id)),
        ];
      });
      setMemberPage(nextPage);
      setMoreMembers(nextPage * 100 < (response.data.pagination?.total ?? 0));
    } catch (error) {
      setAlert({
        title: "Unable to load members",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadMorePosts = async () => {
    if (!morePosts || loadingMorePosts) return;
    setLoadingMorePosts(true);
    const controller = new AbortController();
    updateRequestsRef.current.add(controller);
    try {
      const nextPage = postPage + 1;
      const response = await communitiesApi.posts(
        communityId,
        {
          page: nextPage,
          limit: COMMUNITY_UPDATE_PAGE_SIZE,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setPosts((current) => {
        const ids = new Set(current.map((item) => item._id));
        return [
          ...current,
          ...response.data.posts.filter((item) => !ids.has(item._id)),
        ];
      });
      setPostPage(nextPage);
      setMorePosts(
        nextPage * COMMUNITY_UPDATE_PAGE_SIZE < response.data.pagination.total,
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setAlert({
        title: "Unable to load posts",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      updateRequestsRef.current.delete(controller);
      if (!controller.signal.aborted) setLoadingMorePosts(false);
    }
  };

  const loadMoreAnnouncements = async () => {
    if (!moreAnnouncements || loadingMoreAnnouncements) return;
    setLoadingMoreAnnouncements(true);
    const controller = new AbortController();
    updateRequestsRef.current.add(controller);
    try {
      const nextPage = announcementPage + 1;
      const response = await communitiesApi.announcements(
        communityId,
        {
          page: nextPage,
          limit: COMMUNITY_UPDATE_PAGE_SIZE,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setAnnouncements((current) => {
        const ids = new Set(current.map((item) => item._id));
        return [
          ...current,
          ...response.data.announcements.filter((item) => !ids.has(item._id)),
        ];
      });
      setAnnouncementPage(nextPage);
      setMoreAnnouncements(
        nextPage * COMMUNITY_UPDATE_PAGE_SIZE < response.data.pagination.total,
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setAlert({
        title: "Unable to load announcements",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      updateRequestsRef.current.delete(controller);
      if (!controller.signal.aborted) setLoadingMoreAnnouncements(false);
    }
  };

  const verifyMembershipPayment =
    async (): Promise<PaystackVerificationResult> => {
      if (!community || !orderNumber) {
        return {
          verified: false,
          message: "No membership payment is ready to verify.",
        };
      }
      if (submitting) {
        return {
          verified: false,
          message: "A membership request is already running.",
        };
      }
      setSubmitting(true);
      try {
        const verification =
          await communitiesApi.verifyMembershipOrder(orderNumber);
        if (verification.data.order.status !== "paid") {
          return {
            verified: false,
            message:
              "The backend has not confirmed this membership payment yet.",
          };
        }
        await load();
        setOrderNumber(null);
        setAuthorizationUrl(null);
        paymentKey.current = createIdempotencyKey();
        setAlert({
          title: "Welcome!",
          message: `You are now a member of ${community.name}.`,
        });
        return { verified: true };
      } catch (error) {
        return {
          verified: false,
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to verify this membership payment.",
        };
      } finally {
        setSubmitting(false);
      }
    };

  const joinOrVerify = async () => {
    if (!community || submitting || !membershipChecked) return;
    if (orderNumber) {
      const result = await verifyMembershipPayment();
      if (!result.verified) {
        setAlert({
          title: "Payment pending",
          message: result.message ?? "Unable to verify this payment.",
        });
      }
      return;
    }
    setSubmitting(true);
    try {
      if (
        community.visibility === "private" ||
        community.joinPolicy === "access_code" ||
        community.joinPolicy === "invite_only"
      ) {
        navigation.navigate("CommunityJoin", { communityId: community._id });
      } else if (community.joinPolicy === "approval") {
        if (community.membershipType === "premium") {
          try {
            const order = await communitiesApi.createMembershipOrder(
              community._id,
              paymentKey.current,
            );
            setOrderNumber(order.data.order.orderNumber);
            setAuthorizationUrl(order.data.checkoutUrl);
            setCheckoutVisible(true);
          } catch (error) {
            if (
              !(error instanceof ApiError) ||
              error.code !== "COMMUNITY_APPROVAL_REQUIRED"
            )
              throw error;
            const response = await communitiesApi.createJoinRequest(
              community._id,
              {},
            );
            setJoinRequestPending(true);
            setAlert({ title: "Request sent", message: response.message });
          }
        } else {
          const response = await communitiesApi.createJoinRequest(
            community._id,
            {},
          );
          if ("membership" in response.data) {
            await load();
            setAlert({ title: "Joined community", message: response.message });
          } else {
            setJoinRequestPending(true);
            setAlert({ title: "Request sent", message: response.message });
          }
        }
      } else if (community.membershipType === "free") {
        const response = await communitiesApi.createJoinRequest(
          community._id,
          {},
        );
        if (response.data.membership?.status === "active") {
          await load();
          setAlert({ title: "Joined community", message: response.message });
        } else if (response.data.joinRequest) {
          setJoinRequestPending(true);
          setAlert({ title: "Request sent", message: response.message });
        } else {
          await load();
          setAlert({
            title: "Join status unclear",
            message: "Check your membership before trying again.",
          });
        }
      } else {
        const response = await communitiesApi.createMembershipOrder(
          community._id,
          paymentKey.current,
        );
        setOrderNumber(response.data.order.orderNumber);
        setAuthorizationUrl(response.data.checkoutUrl);
        setCheckoutVisible(true);
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "COMMUNITY_ACCESS_REQUIRED"
      ) {
        navigation.navigate("CommunityJoin", { communityId: community._id });
        return;
      }
      setAlert({
        title: "Unable to join",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const leave = async () => {
    if (!community || submitting || !membershipChecked) return;
    setLeaveConfirmVisible(false);
    setSubmitting(true);
    try {
      await communitiesApi.leave(community._id);
      await load();
      setAlert({
        title: "Community left",
        message: `You have left ${community.name}.`,
      });
    } catch (error) {
      setAlert({
        title: "Unable to leave",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelJoinRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await communitiesApi.cancelMyJoinRequest(communityId);
      setJoinRequestPending(false);
      await load();
      setAlert({ title: "Request cancelled", message: response.message });
    } catch (error) {
      setAlert({
        title: "Unable to cancel",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshJoinStatus = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await load();
    } catch (error) {
      setAlert({
        title: "Unable to check request",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (reason: ReportReason, details: string) => {
    try {
      const response = await communitiesApi.report(communityId, {
        reason: toCommunityReportReason(reason),
        ...(details ? { details } : {}),
      });
      setAlert({ title: "Report submitted", message: response.message });
    } catch (error) {
      setAlert({
        title: "Unable to report",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  if (loading && !community) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingState}>
          <AppLoader color="#08b657" size="large" />
          <Text style={styles.stateText}>Loading community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingState}>
          <Ionicons name="cloud-offline-outline" color="#5c8d70" size={38} />
          <Text style={styles.stateText}>
            This community could not be loaded.
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>Go back</Text>
          </Pressable>
        </View>
        <AppAlertModal
          visible={Boolean(alert)}
          title={alert?.title ?? ""}
          message={alert?.message ?? ""}
          onClose={() => setAlert(null)}
        />
      </SafeAreaView>
    );
  }

  const communityImages = community as Community & {
    coverImageUrl?: string;
    avatarImageUrl?: string;
  };
  const cover = communityImage(
    communityImages.coverImageUrl || community.imageUrl,
    community.name.length,
  );
  const avatar = communityImage(
    communityImages.avatarImageUrl || community.imageUrl,
    community.name.length,
  );

  return (
    <>
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {refreshError ? (
            <CacheRefreshNotice
              message={refreshError}
              onRetry={() => {
                setRefreshError(null);
                void load().catch((error: unknown) =>
                  setRefreshError(
                    error instanceof ApiError
                      ? error.message
                      : "Unable to refresh this community.",
                  ),
                );
              }}
            />
          ) : null}
          <ImageBackground source={{ uri: cover }} style={styles.hero}>
            <View style={styles.heroShade} />
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.heroAction}
            >
              <Ionicons name="chevron-back" size={29} color={colors.white} />
            </Pressable>
            <Pressable
              onPress={() => setMenuVisible((value) => !value)}
              style={[styles.heroAction, styles.menuButton]}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={25}
                color={colors.white}
              />
            </Pressable>
            {menuVisible ? (
              <View style={styles.menu}>
                {isOwner ? (
                  <Pressable
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate("EditCommunity", { communityId });
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons
                      name="create-outline"
                      size={19}
                      color={colors.ink}
                    />
                    <Text style={styles.menuText}>Edit community</Text>
                  </Pressable>
                ) : null}
                {canModerate ? (
                  <Pressable
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate("CommunityManagement", {
                        communityId,
                      });
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={19}
                      color={colors.ink}
                    />
                    <Text style={styles.menuText}>Manage community</Text>
                  </Pressable>
                ) : null}
                {!isOwner ? (
                  <Pressable
                    onPress={() => {
                      setMenuVisible(false);
                      setReportVisible(true);
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons name="flag-outline" size={19} color="#d63737" />
                    <Text style={styles.menuDanger}>Report community</Text>
                  </Pressable>
                ) : null}
                {joined && !isOwner ? (
                  <Pressable
                    onPress={() => {
                      setMenuVisible(false);
                      setLeaveConfirmVisible(true);
                    }}
                    style={styles.menuItem}
                  >
                    <Ionicons name="exit-outline" size={19} color="#d63737" />
                    <Text style={styles.menuDanger}>Leave community</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </ImageBackground>

          <View style={styles.identity}>
            <Image source={{ uri: avatar }} style={styles.communityAvatar} />
            <Text style={styles.name}>{community.name}</Text>
            <Text style={styles.memberMeta}>
              {community.members.length.toLocaleString()} Members -{" "}
              {community.visibility === "private"
                ? "Private Group"
                : "Public Group"}
            </Text>

            {joined ? (
              <Pressable
                disabled={submitting || !membershipChecked}
                onPress={() =>
                  navigation.navigate("CommunityRoom", { communityId })
                }
                style={styles.joinedButton}
              >
                <Ionicons name="checkmark" size={23} color="#04ca5a" />
                <Text style={styles.joinedText}>Joined - Open Chat</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={submitting || !membershipChecked}
                onPress={
                  joinRequestPending
                    ? () => {
                        void cancelJoinRequest();
                      }
                    : orderNumber && authorizationUrl
                      ? () => setCheckoutVisible(true)
                      : joinOrVerify
                }
                style={[styles.joinButton, submitting && styles.disabled]}
              >
                {submitting ? (
                  <AppLoader color={colors.ink} />
                ) : (
                  <Ionicons name="add-circle" size={21} color={colors.ink} />
                )}
                <Text style={styles.joinText}>
                  {orderNumber
                    ? "Continue Membership Payment"
                    : joinRequestPending
                      ? "Cancel Join Request"
                      : community.visibility === "private" ||
                          community.joinPolicy === "access_code" ||
                          community.joinPolicy === "invite_only"
                        ? "Enter Access Code"
                        : community.joinPolicy === "approval"
                          ? "Request to Join"
                          : community.membershipType === "free"
                            ? "Join Community"
                            : `Join for NGN ${Math.round(community.membershipPriceKobo / 100).toLocaleString()}`}
                </Text>
              </Pressable>
            )}
            {!joined && joinRequestPending ? (
              <Pressable
                disabled={submitting || !membershipChecked}
                onPress={() => void refreshJoinStatus()}
                style={styles.checkStatusButton}
              >
                <Text style={styles.checkStatusText}>Check request status</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.tabs}>
            {(
              [
                "About",
                ...(joined ? ["Updates"] : []),
                ...(joined && memberListVisible ? ["Members"] : []),
                "Rules",
              ] as ProfileTab[]
            ).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tabBody}>
            {activeTab === "About" ? (
              <>
                <Text style={styles.bodyHeading}>About Us</Text>
                <Text style={styles.aboutText}>{community.description}</Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color="#05b954"
                    />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Category</Text>
                    <Text style={styles.infoValue}>{community.category}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="location-outline"
                      size={19}
                      color="#05b954"
                    />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>
                      {[community.lga, community.state]
                        .filter(Boolean)
                        .join(", ") || "Online"}
                    </Text>
                  </View>
                </View>
                {joined ? (
                  <View style={styles.announcementCard}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons name="megaphone" size={20} color="#05b954" />
                      <Text style={styles.rulesTitle}>
                        Latest announcements
                      </Text>
                    </View>
                    {latestAnnouncements.length ? (
                      latestAnnouncements.map((item) => (
                        <View key={item._id} style={styles.announcement}>
                          <Text style={styles.announcementText}>
                            {item.text}
                          </Text>
                          <Text style={styles.announcementDate}>
                            {readableDate(item.createdAt)}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyUpdateText}>
                        No announcements yet.
                      </Text>
                    )}
                    <Pressable
                      onPress={() => setActiveTab("Updates")}
                      style={styles.viewUpdatesButton}
                    >
                      <Text style={styles.viewUpdatesText}>
                        See all posts and announcements
                      </Text>
                      <Ionicons
                        color="#087b42"
                        name="arrow-forward"
                        size={17}
                      />
                    </Pressable>
                  </View>
                ) : null}
                <Pressable
                  onPress={() =>
                    navigation.navigate("CommunityRules", { communityId })
                  }
                  style={styles.rulesPreview}
                >
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="hammer" size={22} color="#05c65b" />
                    <Text style={styles.rulesTitle}>Community Rules</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#779086"
                    />
                  </View>
                  {activeRules.slice(0, 2).map((rule, index) => (
                    <View key={rule.title} style={styles.previewRule}>
                      <Text style={styles.previewNumber}>{index + 1}</Text>
                      <Text style={styles.previewText}>{rule.title}</Text>
                    </View>
                  ))}
                  <Text style={styles.defaultNote}>
                    {communityRules?.introduction ??
                      "Community guidelines are being prepared."}
                  </Text>
                </Pressable>
              </>
            ) : null}

            {activeTab === "Updates" && joined ? (
              <>
                <Text style={styles.bodyHeading}>Community updates</Text>
                <Text style={styles.updatesIntro}>
                  Posts and announcements shared with members.
                </Text>
                <View style={styles.updateTabs}>
                  {(["posts", "announcements"] as UpdateTab[]).map(
                    (updateTab) => (
                      <Pressable
                        key={updateTab}
                        onPress={() => setActiveUpdateTab(updateTab)}
                        style={[
                          styles.updateTab,
                          activeUpdateTab === updateTab &&
                            styles.updateTabActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.updateTabText,
                            activeUpdateTab === updateTab &&
                              styles.updateTabTextActive,
                          ]}
                        >
                          {updateTab === "posts" ? "Posts" : "Announcements"}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>

                {loadingUpdates ? (
                  <View style={styles.updatesLoading}>
                    <AppLoader color="#08b657" size="large" />
                    <Text style={styles.emptyUpdateText}>
                      Loading community updates...
                    </Text>
                  </View>
                ) : activeUpdateTab === "posts" ? (
                  <>
                    {sortedPosts.map((item) => (
                      <CommunityUpdateCard
                        key={item._id}
                        communityName={community.name}
                        item={item}
                        kind="posts"
                      />
                    ))}
                    {!sortedPosts.length ? (
                      <View style={styles.updateEmpty}>
                        <Ionicons
                          color="#6b987d"
                          name="chatbubbles-outline"
                          size={28}
                        />
                        <Text style={styles.emptyUpdateText}>
                          No posts yet.
                        </Text>
                      </View>
                    ) : null}
                    {morePosts ? (
                      <Pressable
                        disabled={loadingMorePosts}
                        onPress={() => void loadMorePosts()}
                        style={styles.loadUpdatesButton}
                      >
                        {loadingMorePosts ? (
                          <View style={styles.loadUpdatesLabel}>
                            <AppLoader color="#078d45" />
                            <Text style={styles.loadUpdatesText}>
                              Loading posts...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.loadUpdatesText}>
                            Load more posts
                          </Text>
                        )}
                      </Pressable>
                    ) : null}
                  </>
                ) : (
                  <>
                    {sortedAnnouncements.map((item) => (
                      <CommunityUpdateCard
                        key={item._id}
                        communityName={community.name}
                        item={item}
                        kind="announcements"
                      />
                    ))}
                    {!sortedAnnouncements.length ? (
                      <View style={styles.updateEmpty}>
                        <Ionicons
                          color="#6b987d"
                          name="megaphone-outline"
                          size={28}
                        />
                        <Text style={styles.emptyUpdateText}>
                          No announcements yet.
                        </Text>
                      </View>
                    ) : null}
                    {moreAnnouncements ? (
                      <Pressable
                        disabled={loadingMoreAnnouncements}
                        onPress={() => void loadMoreAnnouncements()}
                        style={styles.loadUpdatesButton}
                      >
                        {loadingMoreAnnouncements ? (
                          <View style={styles.loadUpdatesLabel}>
                            <AppLoader color="#078d45" />
                            <Text style={styles.loadUpdatesText}>
                              Loading announcements...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.loadUpdatesText}>
                            Load more announcements
                          </Text>
                        )}
                      </Pressable>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {activeTab === "Members" ? (
              <>
                <View style={styles.memberSearch}>
                  <Ionicons name="search-outline" size={23} color="#8ca0bc" />
                  <TextInput
                    onChangeText={setMemberSearch}
                    placeholder="Search members..."
                    placeholderTextColor="#96a8c1"
                    style={styles.memberSearchInput}
                    value={memberSearch}
                  />
                </View>
                <View style={styles.memberList}>
                  {filteredMembers.map((member) => {
                    const memberUser = member.user;
                    const owner =
                      member.communityRole === "owner" ||
                      memberUser._id === ownerId;
                    const moderator = member.communityRole === "moderator";
                    return (
                      <View key={memberUser._id} style={styles.memberRow}>
                        {memberUser.avatarUrl ? (
                          <Image
                            source={{ uri: memberUser.avatarUrl }}
                            style={styles.memberAvatar}
                          />
                        ) : (
                          <View style={styles.memberAvatarFallback}>
                            <Text style={styles.initials}>
                              {initials(
                                memberUser.firstName,
                                memberUser.lastName,
                              )}
                            </Text>
                          </View>
                        )}
                        <View style={styles.memberCopy}>
                          <View style={styles.memberNameRow}>
                            <Text style={styles.memberName}>
                              {memberUser.firstName} {memberUser.lastName}
                            </Text>
                            {owner || moderator ? (
                              <Text style={styles.adminBadge}>
                                {owner ? "OWNER" : "ADMIN"}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.memberSub}>
                            {owner
                              ? "Community organizer"
                              : [memberUser.lga, memberUser.state]
                                  .filter(Boolean)
                                  .join(", ") || "Community member"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {filteredMembers.length === 0 ? (
                    <Text style={styles.noMembers}>
                      No members match your search.
                    </Text>
                  ) : null}
                  {moreMembers ? (
                    <Pressable
                      disabled={loadingMembers}
                      onPress={() => void loadMoreMembers()}
                      style={styles.moreMembersButton}
                    >
                      <Text style={styles.moreMembersText}>
                        {loadingMembers ? "Loading..." : "Load more members"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            ) : null}

            {activeTab === "Rules" ? (
              <>
                <View style={styles.rulesHeader}>
                  <View style={styles.rulesIcon}>
                    <Ionicons name="hammer" size={28} color="#00b955" />
                  </View>
                  <Text style={styles.rulesHeaderTitle}>
                    Community Guidelines
                  </Text>
                  <Text style={styles.rulesHeaderText}>
                    {communityRules?.introduction ??
                      "Community guidelines help keep every gathering safe and welcoming."}
                  </Text>
                </View>
                {activeRules.map((rule, index) => (
                  <View key={rule.title} style={styles.ruleCard}>
                    <Text style={styles.ruleNumber}>{index + 1}</Text>
                    <View style={styles.ruleCopy}>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                      <Text style={styles.ruleDescription}>
                        {rule.description}
                      </Text>
                    </View>
                  </View>
                ))}
                <Pressable
                  onPress={() =>
                    navigation.navigate("CommunityRules", { communityId })
                  }
                  style={styles.fullRulesButton}
                >
                  <Text style={styles.fullRulesText}>View full guidelines</Text>
                  <Ionicons name="arrow-forward" size={19} color={colors.ink} />
                </Pressable>
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <PaystackCheckoutModal
        visible={checkoutVisible}
        url={authorizationUrl}
        title="Community Membership"
        onClose={() => setCheckoutVisible(false)}
        onVerify={verifyMembershipPayment}
      />
      <AppReportSheet
        reasons={communityReportReasons}
        visible={reportVisible}
        minimumDetailsLength={10}
        title="Report Community"
        description="Tell us why this community should be reviewed. Your report is confidential."
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
      <AppAlertModal
        visible={leaveConfirmVisible}
        title="Leave community?"
        message="You will lose access to this community room until you join again."
        confirmText="Leave"
        onConfirm={() => {
          void leave();
        }}
        onClose={() => setLeaveConfirmVisible(false)}
      />
      <AppAlertModal
        visible={Boolean(alert)}
        title={alert?.title ?? ""}
        message={alert?.message ?? ""}
        onClose={() => setAlert(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 74 },
  hero: {
    height: 280,
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingTop: 54,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,24,15,0.28)",
  },
  heroAction: {
    alignItems: "center",
    backgroundColor: "rgba(9,35,25,0.58)",
    borderRadius: 30,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  menuButton: { position: "absolute", right: 25, top: 54 },
  menu: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 7,
    position: "absolute",
    right: 24,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 15,
    top: 112,
    width: 190,
    zIndex: 20,
  },
  menuItem: { alignItems: "center", flexDirection: "row", gap: 9, padding: 12 },
  menuText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 12 },
  menuDanger: { color: "#c73737", fontFamily: fonts.semiBold, fontSize: 12 },
  identity: {
    alignItems: "center",
    backgroundColor: colors.white,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  communityAvatar: {
    borderColor: colors.white,
    borderRadius: 65,
    borderWidth: 7,
    height: 130,
    marginTop: -65,
    width: 130,
  },
  name: {
    color: "#081126",
    fontFamily: fonts.extraBold,
    fontSize: 29,
    marginTop: 13,
    textAlign: "center",
  },
  memberMeta: {
    color: "#61728f",
    fontFamily: fonts.medium,
    fontSize: 15,
    marginTop: 5,
  },
  joinedButton: {
    alignItems: "center",
    backgroundColor: "#e8fbef",
    borderColor: "#a9f4c8",
    borderRadius: 29,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 10,
    height: 58,
    justifyContent: "center",
    marginTop: 21,
    width: "100%",
  },
  joinedText: { color: "#00c85a", fontFamily: fonts.bold, fontSize: 16 },
  checkStatusButton: { marginTop: 12, padding: 8 },
  checkStatusText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 13 },
  joinButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 29,
    flexDirection: "row",
    gap: 9,
    height: 58,
    justifyContent: "center",
    marginTop: 21,
    width: "100%",
  },
  joinText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 },
  disabled: { opacity: 0.55 },
  tabs: {
    backgroundColor: colors.white,
    borderBottomColor: "#e9edef",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 34,
  },
  tab: { alignItems: "center", flex: 1, paddingVertical: 18 },
  activeTab: { borderBottomColor: colors.lime, borderBottomWidth: 3 },
  tabText: { color: "#61728f", fontFamily: fonts.medium, fontSize: 15 },
  activeTabText: { color: "#00c95a", fontFamily: fonts.bold },
  tabBody: { paddingHorizontal: 24, paddingTop: 27 },
  bodyHeading: { color: "#0a1328", fontFamily: fonts.extraBold, fontSize: 22 },
  aboutText: {
    color: "#425673",
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 25,
    marginTop: 14,
  },
  infoRow: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    flexDirection: "row",
    marginTop: 12,
    padding: 14,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#e7faef",
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    marginRight: 12,
    width: 38,
  },
  infoLabel: { color: "#839287", fontFamily: fonts.medium, fontSize: 10 },
  infoValue: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 2,
  },
  announcementCard: {
    backgroundColor: colors.white,
    borderRadius: 25,
    marginTop: 18,
    padding: 18,
  },
  cardTitleRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  rulesTitle: {
    color: "#0a1328",
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  announcement: {
    borderTopColor: "#edf2ef",
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  announcementText: {
    color: "#3f5c4c",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  announcementDate: {
    color: "#91a09a",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 5,
  },
  viewUpdatesButton: {
    alignItems: "center",
    borderTopColor: "#edf2ef",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 13,
  },
  viewUpdatesText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 11 },
  updatesIntro: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 15,
    marginTop: 6,
  },
  updateTabs: {
    backgroundColor: "#eaf3ed",
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 15,
    padding: 4,
  },
  updateTab: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    paddingVertical: 10,
  },
  updateTabActive: {
    backgroundColor: colors.white,
    elevation: 1,
  },
  updateTabText: { color: "#6e8175", fontFamily: fonts.bold, fontSize: 12 },
  updateTabTextActive: { color: "#087b42" },
  updateCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    marginBottom: 13,
    padding: 15,
  },
  updateCardHeader: { alignItems: "center", flexDirection: "row", gap: 10 },
  updateIcon: {
    alignItems: "center",
    backgroundColor: "#e8f7ed",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  updateAuthor: { flex: 1 },
  updateAuthorName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  updateDate: {
    color: "#8a9a91",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 3,
  },
  announcementBadge: {
    backgroundColor: "#e8f8ee",
    borderRadius: 11,
    color: "#087b42",
    fontFamily: fonts.bold,
    fontSize: 8,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  updateText: {
    color: "#314d3c",
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 13,
  },
  updateImage: {
    borderRadius: 16,
    height: 200,
    marginTop: 12,
    width: "100%",
  },
  updateEmpty: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
  },
  updatesLoading: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
  },
  emptyUpdateText: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 9,
    textAlign: "center",
  },
  loadUpdatesButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dbece1",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 13,
  },
  loadUpdatesLabel: { alignItems: "center", flexDirection: "row", gap: 8 },
  loadUpdatesText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 11 },
  rulesPreview: {
    backgroundColor: colors.white,
    borderRadius: 25,
    marginTop: 18,
    padding: 18,
  },
  previewRule: { alignItems: "center", flexDirection: "row", marginTop: 14 },
  previewNumber: {
    backgroundColor: "#eef3f6",
    borderRadius: 16,
    color: "#60718e",
    fontFamily: fonts.bold,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewText: {
    color: "#3f506c",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginLeft: 12,
  },
  defaultNote: {
    color: "#84958c",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 14,
  },
  memberSearch: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: "row",
    height: 58,
    paddingHorizontal: 18,
  },
  memberSearchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 10,
  },
  memberList: {
    backgroundColor: colors.white,
    borderRadius: 26,
    marginTop: 18,
    overflow: "hidden",
  },
  moreMembersButton: { alignItems: "center", padding: 16 },
  moreMembersText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 12 },
  memberRow: {
    alignItems: "center",
    borderBottomColor: "#edf1f4",
    borderBottomWidth: 1,
    flexDirection: "row",
    padding: 17,
  },
  memberAvatar: { borderRadius: 28, height: 54, width: 54 },
  memberAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#e4f7eb",
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  initials: { color: "#087d43", fontFamily: fonts.extraBold, fontSize: 14 },
  memberCopy: { flex: 1, marginLeft: 13 },
  memberNameRow: { alignItems: "center", flexDirection: "row" },
  memberName: { color: "#081126", fontFamily: fonts.bold, fontSize: 15 },
  adminBadge: {
    backgroundColor: "#e9fff1",
    borderColor: "#a7f1c4",
    borderRadius: 12,
    borderWidth: 1,
    color: "#00c85a",
    fontFamily: fonts.bold,
    fontSize: 8,
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  memberSub: {
    color: "#718198",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  noMembers: {
    color: colors.muted,
    fontFamily: fonts.medium,
    padding: 28,
    textAlign: "center",
  },
  rulesHeader: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
  },
  rulesIcon: {
    alignItems: "center",
    backgroundColor: "#e1f8eb",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  rulesHeaderTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 15,
  },
  rulesHeaderText: {
    color: "#348b5d",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    textAlign: "center",
  },
  ruleCard: {
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 25,
    flexDirection: "row",
    marginTop: 13,
    padding: 19,
  },
  ruleNumber: {
    backgroundColor: "#e5f8ed",
    borderRadius: 20,
    color: "#00ae50",
    fontFamily: fonts.bold,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ruleCopy: { flex: 1, marginLeft: 14 },
  ruleTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 },
  ruleDescription: {
    color: "#348b5d",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },
  fullRulesButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    flexDirection: "row",
    gap: 9,
    height: 54,
    justifyContent: "center",
    marginTop: 17,
  },
  fullRulesText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  smallButton: {
    backgroundColor: colors.lime,
    borderRadius: 20,
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  smallButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
