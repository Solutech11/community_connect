import { mergeRefreshedMessages } from "../../hooks/merge-cached-messages";
import { useFocusEffect } from "@react-navigation/native";
import { useCachedState } from "../../hooks/use-cached-state";
import { SessionCache } from "../../services/cache/session-cache";
import CacheRefreshNotice from "../../components/ui/cache-refresh-notice";
import type { SetStateAction } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppLoader from "../../components/ui/app-loader";
import AppAlertModal from "../../components/ui/app-alert-modal";
import AppReportSheet from "../../components/ui/app-report-sheet";
import { communityImage, initials } from "../../data/community-presentation";
import {
  communityMessageReportReasons,
  communityReportReasons,
  toCommunityMessageReportReason,
  toCommunityReportReason,
  type ReportReason,
} from "../../data/report-options";
import { useAuth } from "../../hooks/use-auth";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { liveKitUrl } from "../../services/api/config";
import { communitiesApi } from "../../services/api/communities.api";
import { uploadsApi } from "../../services/api/uploads.api";
import {
  chatSocket,
  type CommunityCallPayload,
  type CommunityTypingPayload,
} from "../../services/socket/chat-socket";
import { colors, fonts } from "../../styles/theme";
import type { GetCommunitiesIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityRoom">;
type Community = GetCommunitiesIdResponse["data"]["community"];
type PickedImage = { uri: string; name: string; type: string };
type CommunityRole = "owner" | "moderator" | "member" | null;
type CommunityCallType = "voice" | "video";
type ReactionIconName = keyof typeof Ionicons.glyphMap;

type RoomAttachment = {
  _id: string;
  url: string;
  type: "image" | "pdf" | "file";
  name: string;
  mimeType: string;
  sizeBytes: number;
};

type RoomMessage = {
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

type RoomSnapshot = {
  community: Community | null;
  messages: RoomMessage[];
  olderCursor: string | null;
  hasOlderMessages: boolean;
};
const emptyRoom: RoomSnapshot = {
  community: null,
  messages: [],
  olderCursor: null,
  hasOlderMessages: false,
};
const roomCache = new SessionCache<RoomSnapshot>(15);

function reactionPresentation(reaction: string): {
  icon: ReactionIconName;
  label: string;
} {
  const codePoint = Array.from(reaction)[0]?.codePointAt(0);
  switch (codePoint) {
    case 0x2764:
      return { icon: "heart", label: "Love" };
    case 0x1f44d:
      return { icon: "thumbs-up", label: "Like" };
    case 0x1f44e:
      return { icon: "thumbs-down", label: "Dislike" };
    case 0x1f525:
      return { icon: "flame", label: "Fire" };
    case 0x1f389:
      return { icon: "sparkles", label: "Celebration" };
    case 0x1f44f:
      return { icon: "hand-left", label: "Applause" };
    case 0x1f64f:
      return { icon: "heart", label: "Thanks" };
    case 0x2b50:
      return { icon: "star", label: "Star" };
    default:
      return { icon: "sparkles", label: "Reaction" };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapRoomMessage(value: unknown): RoomMessage | null {
  const item = asRecord(value);
  if (!item) return null;
  const author = asRecord(item.author) ?? asRecord(item.authorId);
  if (!author) return null;
  const attachments = Array.isArray(item.attachments)
    ? item.attachments
        .map((entry) => {
          const attachment = asRecord(entry);
          if (!attachment) return null;
          return {
            _id: asString(attachment._id),
            url: asString(attachment.url),
            type: asString(attachment.type, "file") as RoomAttachment["type"],
            name: asString(attachment.name, "Attachment"),
            mimeType: asString(attachment.mimeType),
            sizeBytes:
              typeof attachment.sizeBytes === "number"
                ? attachment.sizeBytes
                : 0,
          };
        })
        .filter((entry): entry is RoomAttachment => entry !== null)
    : [];
  const legacyImage = asString(item.imageUrl);
  if (legacyImage && attachments.length === 0) {
    attachments.push({
      _id: `legacy-${asString(item._id)}`,
      url: legacyImage,
      type: "image",
      name: "Shared image",
      mimeType: "image/*",
      sizeBytes: 0,
    });
  }
  return {
    _id: asString(item._id),
    communityId: asString(item.communityId),
    author: {
      _id: asString(author._id),
      firstName: asString(author.firstName),
      lastName: asString(author.lastName),
      avatarUrl: asString(author.avatarUrl),
      communityRole: asString(author.communityRole, "member"),
    },
    text: asString(item.text),
    attachments,
    clientMessageId: asString(item.clientMessageId),
    replyToMessageId: asString(item.replyToMessageId) || null,
    createdAt: asString(item.createdAt),
    editedAt: typeof item.editedAt === "string" ? item.editedAt : null,
    pinnedAt: typeof item.pinnedAt === "string" ? item.pinnedAt : null,
    reactions: Array.isArray(item.reactions)
      ? item.reactions
          .map((entry) => {
            const reaction = asRecord(entry);
            return {
              emoji: asString(reaction?.emoji),
              count: typeof reaction?.count === "number" ? reaction.count : 0,
              reactedByViewer: reaction?.reactedByViewer === true,
            };
          })
          .filter((entry) => entry.emoji)
      : [],
  };
}

type CommunityCall = {
  _id: string;
  communityId: string;
  type: CommunityCallType;
  status: string;
  startedBy: string;
  participantCount: number;
  startedAt: string;
  endedAt: string | null;
};

function mapCommunityCall(value: unknown): CommunityCall | null {
  const call = asRecord(value);
  const id = asString(call?._id);
  if (!id) return null;
  const type = asString(call?.type) === "video" ? "video" : "voice";
  return {
    _id: id,
    communityId: asString(call?.communityId),
    type,
    status: asString(call?.status, "active"),
    startedBy: asString(call?.startedBy),
    participantCount:
      typeof call?.participantCount === "number" ? call.participantCount : 0,
    startedAt: asString(call?.startedAt),
    endedAt: typeof call?.endedAt === "string" ? call.endedAt : null,
  };
}

function CallConnectingIllustration({ type }: { type: CommunityCallType }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const ringAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: -1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.delay(350),
      ]),
    );

    pulseAnimation.start();
    ringAnimation.start();
    return () => {
      pulseAnimation.stop();
      ringAnimation.stop();
    };
  }, [pulse, ring]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.35],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });
  const ringRotation = ring.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-14deg", "14deg"],
  });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        type === "video"
          ? "Connecting to video call"
          : "Connecting to voice call"
      }
      pointerEvents="none"
      style={styles.callConnectingIllustration}
    >
      <Animated.View
        style={[
          styles.callIllustrationPulse,
          {
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.callIllustrationIcon,
          { transform: [{ rotate: ringRotation }] },
        ]}
      >
        <Ionicons
          name={type === "video" ? "videocam" : "call"}
          size={14}
          color="#087b42"
        />
      </Animated.View>
      <View style={styles.callIllustrationSparkle}>
        <Ionicons name="sparkles" size={8} color="#21a85f" />
      </View>
    </View>
  );
}

function isCommunityPayload(
  payload: Record<string, unknown>,
  communityId: string,
) {
  return asString(payload.communityId) === communityId;
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
}

export default function CommunityRoomScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const communityId = route.params.communityId;
  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [room, setRoom, hasCachedRoom] = useCachedState(
    roomCache,
    user?._id,
    communityId,
    emptyRoom,
  );
  const { community, messages, olderCursor, hasOlderMessages } = room;
  const setMessages = useCallback(
    (next: SetStateAction<RoomMessage[]>) => {
      setRoom((current) => ({
        ...current,
        messages: typeof next === "function" ? next(current.messages) : next,
      }));
    },
    [setRoom],
  );
  const [accessChecked, setAccessChecked] = useState(false);
  const [roomRefreshError, setRoomRefreshError] = useState<string | null>(null);
  const roomRequestEpoch = useRef(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [membershipRole, setMembershipRole] = useState<CommunityRole>(null);
  const [messagePermission, setMessagePermission] = useState("everyone");
  const [activeCall, setActiveCall] = useState<CommunityCall | null>(null);
  const [startingCallType, setStartingCallType] =
    useState<CommunityCallType | null>(null);
  const startingCallRef = useRef(false);
  const callTonePlayer = useAudioPlayer(
    require("../../../assets/sounds/community-call-connecting.wav"),
  );
  const playCallConnectingTone = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
      });
      if (!startingCallRef.current) return;

      callTonePlayer.volume = 0.28;
      callTonePlayer.loop = true;
      await callTonePlayer.seekTo(0);
      if (startingCallRef.current) callTonePlayer.play();
    } catch {
      // Audio feedback is optional; it must not block call setup.
    }
  }, [callTonePlayer]);
  const stopCallConnectingTone = useCallback(() => {
    try {
      callTonePlayer.loop = false;
      callTonePlayer.pause();
      void callTonePlayer.seekTo(0).catch(() => undefined);
    } catch {
      // The player may already be released if the screen is closing.
    }
  }, [callTonePlayer]);
  const [typingMembers, setTypingMembers] = useState<Record<string, string>>(
    {},
  );
  const [draft, setDraft] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(!hasCachedRoom);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [messageReportTarget, setMessageReportTarget] =
    useState<RoomMessage | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [replyTarget, setReplyTarget] = useState<RoomMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoomMessage | null>(null);
  const [notificationLevel, setNotificationLevel] = useState<
    "all" | "announcements" | "mentions" | "muted" | "unknown"
  >("unknown");

  useEffect(
    () => () => {
      startingCallRef.current = false;
      stopCallConnectingTone();
    },
    [stopCallConnectingTone],
  );
  const [notificationMenuVisible, setNotificationMenuVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const show = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const canModerate =
    membershipRole === "owner" || membershipRole === "moderator";
  const canSendMessages =
    accessChecked &&
    membershipRole !== null &&
    (messagePermission !== "moderators" || canModerate);
  const hasSendableContent = Boolean(draft.trim() || pickedImage);

  const upsertMessage = useCallback(
    (next: RoomMessage) => {
      setMessages((current) => {
        const index = current.findIndex((message) => message._id === next._id);
        if (index < 0)
          return [...current, next].sort((left, right) =>
            left.createdAt.localeCompare(right.createdAt),
          );
        const copy = [...current];
        copy[index] = next;
        return copy;
      });
    },
    [setMessages],
  );

  const load = useCallback(
    async (signal?: AbortSignal, scrollToLatest = false) => {
      const epoch = roomRequestEpoch.current;
      const atRequestStart = user?._id
        ? (roomCache.read(user._id, communityId)?.messages ?? [])
        : [];
      const [
        detail,
        messageResponse,
        settingsResponse,
        mineResponse,
        callResponse,
      ] = await Promise.all([
        communitiesApi.get(communityId, signal),
        communitiesApi.messages(communityId, { limit: 50 }, signal),
        communitiesApi.settings(communityId, signal),
        communitiesApi.allMyCommunities(signal),
        communitiesApi.activeCall(communityId, signal),
      ]).catch((error: unknown) => {
        if (
          !signal?.aborted &&
          epoch === roomRequestEpoch.current &&
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          if (user?._id) roomCache.invalidate(user._id, communityId);
          setAccessChecked(false);
          setMembershipRole(null);
        }
        throw error;
      });
      if (signal?.aborted || epoch !== roomRequestEpoch.current) return;
      const parsed = messageResponse.data.messages
        .map(mapRoomMessage)
        .filter((message): message is RoomMessage => message !== null);
      const viewer = mineResponse.find(
        (item) => item._id === communityId,
      )?.viewerMembership;
      setRoom((current) => {
        const merged = mergeRefreshedMessages(
          current.messages,
          parsed,
          atRequestStart,
        );
        const keptOlderPages =
          parsed.length > 0 &&
          merged.some(
            (message) =>
              message.createdAt <
              parsed.reduce(
                (oldest, next) =>
                  next.createdAt < oldest ? next.createdAt : oldest,
                parsed[0].createdAt,
              ),
          );
        return {
          community: detail.data.community,
          messages: merged,
          olderCursor: keptOlderPages
            ? current.olderCursor
            : (messageResponse.data.pageInfo?.nextCursor ?? null),
          hasOlderMessages: keptOlderPages
            ? current.hasOlderMessages
            : (messageResponse.data.pageInfo?.hasMore ?? false),
        };
      });
      setRoomRefreshError(null);
      setAccessChecked(Boolean(viewer));
      setMembershipRole((viewer?.role as CommunityRole | undefined) ?? null);
      setNotificationLevel(
        viewer?.notificationLevel ?? (viewer?.muted ? "muted" : "unknown"),
      );
      setMessagePermission(settingsResponse.data.settings.messagePermission);
      setActiveCall(mapCommunityCall(callResponse.data.call));
      const latest = parsed.at(-1);
      if (latest)
        void communitiesApi
          .markMessagesRead(communityId, { lastReadMessageId: latest._id })
          .catch(() => undefined);
      if (scrollToLatest)
        requestAnimationFrame(() =>
          scrollRef.current?.scrollToEnd({ animated: false }),
        );
    },
    [communityId, setRoom, user?._id],
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      const epoch = ++roomRequestEpoch.current;
      setLoading(
        !user?._id || roomCache.read(user._id, communityId) === undefined,
      );
      setAccessChecked(false);
      const handleLoadFailure = (error: unknown) => {
        if (controller.signal.aborted || epoch !== roomRequestEpoch.current)
          return;
        if (
          error instanceof ApiError &&
          [401, 403, 404].includes(error.status)
        ) {
          if (user?._id) roomCache.invalidate(user._id, communityId);
          setAccessChecked(false);
          setMembershipRole(null);
        }
        const message =
          error instanceof ApiError
            ? error.message
            : "Unable to refresh this room. Showing your last loaded messages.";
        if (user?._id && roomCache.read(user._id, communityId))
          setRoomRefreshError(message);
        else setAlert({ title: "Community room unavailable", message });
      };
      load(controller.signal, true)
        .then(() => {
          if (!controller.signal.aborted && epoch === roomRequestEpoch.current)
            joinRealtimeCommunity();
        })
        .catch(handleLoadFailure)
        .finally(() => {
          if (!controller.signal.aborted && epoch === roomRequestEpoch.current)
            setLoading(false);
        });

      const joinRealtimeCommunity = () => {
        chatSocket.joinCommunity(communityId, (response) => {
          if (
            !response.success &&
            response.code !== "COMMUNITY_SOCKET_UNAVAILABLE"
          ) {
            setAlert({
              title: "Realtime unavailable",
              message:
                response.message || "Unable to join live community updates.",
            });
          }
        });
      };
      const stopSocketConnect = chatSocket.onConnect(() => {
        void load(controller.signal)
          .then(() => {
            if (
              !controller.signal.aborted &&
              epoch === roomRequestEpoch.current
            )
              joinRealtimeCommunity();
          })
          .catch(handleLoadFailure);
      });
      const stopNewMessage = chatSocket.onCommunityMessage((payload) => {
        const message = mapRoomMessage(payload);
        if (message?.communityId === communityId) upsertMessage(message);
      });
      const stopUpdatedMessage = chatSocket.onCommunityMessageUpdated(
        (payload) => {
          const message = mapRoomMessage(payload);
          if (message?.communityId === communityId) upsertMessage(message);
        },
      );
      const stopDeletedMessage = chatSocket.onCommunityMessageDeleted(
        (payload) => {
          if (payload.communityId === communityId)
            setMessages((current) =>
              current.filter((message) => message._id !== payload.messageId),
            );
        },
      );
      const stopCommunityPost = chatSocket.onCommunityPost((payload) => {
        if (isCommunityPayload(payload, communityId))
          void load(controller.signal).catch(handleLoadFailure);
      });
      const stopCommunityAnnouncement = chatSocket.onCommunityAnnouncement(
        (payload) => {
          if (isCommunityPayload(payload, communityId))
            void load(controller.signal).catch(handleLoadFailure);
        },
      );
      const stopMemberUpdated = chatSocket.onCommunityMemberUpdated(
        (payload) => {
          if (isCommunityPayload(payload, communityId))
            void load(controller.signal).catch(handleLoadFailure);
        },
      );
      const stopCommunityTyping = chatSocket.onCommunityTyping(
        (payload: CommunityTypingPayload) => {
          if (
            payload.communityId !== communityId ||
            payload.userId === user?._id
          )
            return;
          setTypingMembers((current) => {
            const next = { ...current };
            if (payload.typing)
              next[payload.userId] = payload.firstName || "A member";
            else delete next[payload.userId];
            return next;
          });
        },
      );
      const updateActiveCall = (payload: CommunityCallPayload) => {
        if (!isCommunityPayload(payload, communityId)) return;
        setActiveCall(mapCommunityCall(payload));
      };
      const stopCallStarted =
        chatSocket.onCommunityCallStarted(updateActiveCall);
      const stopCallUpdated =
        chatSocket.onCommunityCallUpdated(updateActiveCall);
      const stopCallEnded = chatSocket.onCommunityCallEnded((payload) => {
        if (isCommunityPayload(payload, communityId)) setActiveCall(null);
      });

      return () => {
        roomRequestEpoch.current += 1;
        controller.abort();
        if (typingTimer.current) clearTimeout(typingTimer.current);
        chatSocket.setCommunityTyping(communityId, false);
        chatSocket.leaveCommunity(communityId);
        stopSocketConnect();
        stopNewMessage();
        stopUpdatedMessage();
        stopDeletedMessage();
        stopCommunityPost();
        stopCommunityAnnouncement();
        stopMemberUpdated();
        stopCommunityTyping();
        stopCallStarted();
        stopCallUpdated();
        stopCallEnded();
      };
    }, [communityId, load, upsertMessage, user?._id]),
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load(undefined, false);
      setRoomRefreshError(null);
    } catch (error) {
      setAlert({
        title: "Unable to refresh",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await communitiesApi.messages(communityId, {
        limit: 50,
        before: olderCursor,
      });
      const older = response.data.messages
        .map(mapRoomMessage)
        .filter((message): message is RoomMessage => message !== null);
      setMessages((current) => {
        const existing = new Set(current.map((message) => message._id));
        return [
          ...older.filter((message) => !existing.has(message._id)),
          ...current,
        ];
      });
      setRoom((current) => ({
        ...current,
        olderCursor: response.data.pageInfo?.nextCursor ?? null,
        hasOlderMessages: response.data.pageInfo?.hasMore ?? false,
      }));
    } catch (error) {
      setAlert({
        title: "Unable to load older messages",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  const changeDraft = (value: string) => {
    setDraft(value);
    if (!canSendMessages) return;
    chatSocket.setCommunityTyping(communityId, value.trim().length > 0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => chatSocket.setCommunityTyping(communityId, false),
      1400,
    );
  };

  const pickImage = async () => {
    if (editingMessageId) {
      setAlert({
        title: "Finish editing",
        message: "Save or cancel the message edit before adding an attachment.",
      });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAlert({
        title: "Photo permission needed",
        message: "Allow photo access to share an image with this community.",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.82,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPickedImage({
      uri: asset.uri,
      name: asset.fileName || `community-chat-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if ((!text && !pickedImage) || sending || !canSendMessages) return;
    setSending(true);
    try {
      if (editingMessageId) {
        if (!text) {
          setAlert({
            title: "Message required",
            message: "An edited message cannot be empty.",
          });
          return;
        }
        const response = await communitiesApi.updateMessage(
          communityId,
          editingMessageId,
          { text },
        );
        const message = mapRoomMessage(response.data.message);
        if (message) upsertMessage(message);
        setDraft("");
        setEditingMessageId(null);
        setSelectedMessageId(null);
        chatSocket.setCommunityTyping(communityId, false);
        return;
      }
      const attachmentIds: string[] = [];
      if (pickedImage) {
        const upload = await uploadsApi.communityFile(pickedImage);
        attachmentIds.push(upload.data.attachment._id);
      }
      const response = await communitiesApi.sendMessage(communityId, {
        clientMessageId: createIdempotencyKey(),
        ...(text ? { text } : {}),
        ...(attachmentIds.length ? { attachmentIds } : {}),
        ...(replyTarget ? { replyToMessageId: replyTarget._id } : {}),
      });
      const message = mapRoomMessage(response.data.message);
      if (message) upsertMessage(message);
      setDraft("");
      setPickedImage(null);
      setReplyTarget(null);
      chatSocket.setCommunityTyping(communityId, false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    } catch (error) {
      setAlert({
        title: "Message not sent",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (message: RoomMessage, emoji: string) => {
    try {
      const existing = message.reactions.find(
        (reaction) => reaction.emoji === emoji,
      );
      const response = existing?.reactedByViewer
        ? await communitiesApi.removeReaction(communityId, message._id, emoji)
        : await communitiesApi.addReaction(communityId, message._id, emoji);
      upsertMessage({ ...message, reactions: response.data.reactions });
    } catch (error) {
      setAlert({
        title: "Reaction unavailable",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const editMessage = (message: RoomMessage) => {
    setDraft(message.text);
    setPickedImage(null);
    setEditingMessageId(message._id);
    setSelectedMessageId(null);
  };

  const deleteMessage = async () => {
    const message = deleteTarget;
    setDeleteTarget(null);
    if (!message) return;
    try {
      await communitiesApi.deleteMessage(communityId, message._id);
      setMessages((current) =>
        current.filter((item) => item._id !== message._id),
      );
      if (editingMessageId === message._id) {
        setEditingMessageId(null);
        setDraft("");
      }
      setAlert({
        title: "Message deleted",
        message: "The message was removed from the community.",
      });
    } catch (error) {
      setAlert({
        title: "Delete failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const togglePin = async (message: RoomMessage) => {
    try {
      const response = message.pinnedAt
        ? await communitiesApi.unpinMessage(communityId, message._id)
        : await communitiesApi.pinMessage(communityId, message._id);
      const updated = mapRoomMessage(response.data.message);
      if (updated) upsertMessage(updated);
      setSelectedMessageId(null);
    } catch (error) {
      setAlert({
        title: "Pin unavailable",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const submitMessageReport = async (reason: ReportReason, details: string) => {
    if (!messageReportTarget) return;
    try {
      const response = await communitiesApi.reportMessage(
        communityId,
        messageReportTarget._id,
        {
          reason: toCommunityMessageReportReason(reason),
          ...(details ? { details } : {}),
        },
      );
      setAlert({ title: "Report submitted", message: response.message });
    } catch (error) {
      setAlert({
        title: "Unable to report",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const changeNotifications = async (
    nextLevel: "all" | "announcements" | "mentions" | "muted",
  ) => {
    try {
      const response = await communitiesApi.updateNotificationPreference(
        communityId,
        { level: nextLevel },
      );
      setNotificationLevel(nextLevel);
      setMenuVisible(false);
      setNotificationMenuVisible(false);
      setAlert({
        title: "Notification preference saved",
        message: response.message,
      });
    } catch (error) {
      setAlert({
        title: "Preference not saved",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  const startOrJoinCall = async (
    preferredType: CommunityCallType = "voice",
  ) => {
    if (startingCallRef.current) return;
    startingCallRef.current = true;
    setStartingCallType(preferredType);

    try {
      await playCallConnectingTone();
      let call = activeCall;
      if (!call) {
        const activeResponse = await communitiesApi.activeCall(communityId);
        call = mapCommunityCall(activeResponse.data.call);
      }
      if (!call && canModerate) {
        const createResponse = await communitiesApi.createCall(communityId, {
          type: preferredType,
        });
        call = mapCommunityCall(createResponse.data.call);
      }
      if (!call) {
        setAlert({
          title: "No active call",
          message: "Only a community owner or moderator can start a call.",
        });
        return;
      }
      const response = await communitiesApi.joinCall(communityId, call._id);
      if (response.data.provider !== "livekit") {
        setAlert({
          title: "Call unavailable",
          message:
            "This community call provider is not supported by the mobile app.",
        });
        return;
      }
      if (!liveKitUrl) {
        setAlert({
          title: "Call setup needed",
          message:
            "Set EXPO_PUBLIC_LIVEKIT_URL to the public LiveKit server URL, then rebuild the Expo development client.",
        });
        return;
      }
      navigation.navigate("CommunityCall", {
        communityId,
        callId: call._id,
        callType: call.type,
        roomName: response.data.roomName,
        participantToken: response.data.participantToken,
        expiresAt: response.data.expiresAt,
        canEndCall: canModerate || call.startedBy === user?._id,
      });
    } catch (error) {
      setAlert({
        title: "Call unavailable",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      startingCallRef.current = false;
      stopCallConnectingTone();
      setStartingCallType(null);
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

  const communityImages = community as
    (Community & { coverImageUrl?: string; avatarImageUrl?: string }) | null;
  const cover = communityImage(
    communityImages?.coverImageUrl || community?.imageUrl,
    community?.name.length ?? 0,
  );
  const avatar = communityImage(
    communityImages?.avatarImageUrl || community?.imageUrl,
    community?.name.length ?? 0,
  );
  const isEmpty = !loading && messages.length === 0;
  const typingNames = Object.values(typingMembers);
  const typingLabel =
    typingNames.length === 0
      ? ""
      : `${typingNames.slice(0, 2).join(" and ")} ${typingNames.length > 1 ? "are" : "is"} typing...`;

  return (
    <>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : keyboardVisible
                ? "height"
                : undefined
          }
          style={styles.keyboard}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={6}
              onPress={() => navigation.goBack()}
              style={styles.headerBack}
            >
              <Ionicons name="chevron-back" size={25} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityLabel="Open community profile"
              disabled={!community}
              onPress={() =>
                navigation.navigate("CommunityProfile", { communityId })
              }
              style={styles.identity}
            >
              <Image source={{ uri: avatar }} style={styles.avatar} />
              <View style={styles.onlineDot} />
              <View style={styles.identityCopy}>
                <Text numberOfLines={1} style={styles.title}>
                  {community?.name ?? "Community Room"}
                </Text>
                <Text style={styles.subtitle}>
                  {community
                    ? `${community.members.length.toLocaleString()} Members`
                    : "Loading..."}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel="Start or join voice call"
              accessibilityState={{
                busy: startingCallType === "voice",
                disabled: startingCallType !== null,
              }}
              disabled={startingCallType !== null}
              hitSlop={4}
              onPress={() => void startOrJoinCall("voice")}
              style={[
                styles.headerIcon,
                startingCallType !== null && styles.headerIconDisabled,
              ]}
            >
              {startingCallType === "voice" ? (
                <CallConnectingIllustration type="voice" />
              ) : (
                <Ionicons name="call" size={19} color="#168b4d" />
              )}
            </Pressable>
            <Pressable
              accessibilityLabel="Start or join video call"
              accessibilityState={{
                busy: startingCallType === "video",
                disabled: startingCallType !== null,
              }}
              disabled={startingCallType !== null}
              hitSlop={4}
              onPress={() => void startOrJoinCall("video")}
              style={[
                styles.headerIcon,
                startingCallType !== null && styles.headerIconDisabled,
              ]}
            >
              {startingCallType === "video" ? (
                <CallConnectingIllustration type="video" />
              ) : (
                <Ionicons name="videocam" size={20} color="#168b4d" />
              )}
            </Pressable>
            <Pressable
              accessibilityLabel="Community room options"
              hitSlop={4}
              onPress={() => setMenuVisible((value) => !value)}
              style={[styles.headerIcon, styles.headerMenuIcon]}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.ink} />
            </Pressable>
            {menuVisible ? (
              <View style={styles.menu}>
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("CommunityProfile", { communityId });
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons
                    name="people-outline"
                    size={19}
                    color={colors.ink}
                  />
                  <Text style={styles.menuText}>Community profile</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("CommunityRules", { communityId });
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons
                    name="hammer-outline"
                    size={19}
                    color={colors.ink}
                  />
                  <Text style={styles.menuText}>Community rules</Text>
                </Pressable>
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
                <Pressable
                  onPress={() =>
                    setNotificationMenuVisible((visible) => !visible)
                  }
                  style={styles.menuItem}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={19}
                    color={colors.ink}
                  />
                  <Text style={styles.menuText}>
                    Notifications:{" "}
                    {notificationLevel === "unknown"
                      ? "choose"
                      : notificationLevel}
                  </Text>
                </Pressable>
                {notificationMenuVisible
                  ? (
                      [
                        ["all", "All activity"],
                        ["announcements", "Announcements"],
                        ["mentions", "Mentions"],
                        ["muted", "Muted"],
                      ] as const
                    ).map(([level, label]) => (
                      <Pressable
                        key={level}
                        onPress={() => void changeNotifications(level)}
                        style={styles.menuItem}
                      >
                        <Ionicons
                          name={
                            notificationLevel === level
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={17}
                          color="#078d45"
                        />
                        <Text style={styles.menuText}>{label}</Text>
                      </Pressable>
                    ))
                  : null}
                <Pressable
                  onPress={() => {
                    setMenuVisible(false);
                    setReportVisible(true);
                  }}
                  style={styles.menuItem}
                >
                  <Ionicons name="flag-outline" size={19} color="#cf3c3c" />
                  <Text style={styles.menuDanger}>Report community</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          {roomRefreshError ? (
            <CacheRefreshNotice
              message={roomRefreshError}
              onRetry={() => void refresh()}
            />
          ) : null}
          {loading && !hasCachedRoom ? (
            <View style={styles.loading}>
              <AppLoader color="#00c95a" size="large" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messages}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={colors.lime}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {hasOlderMessages ? (
                <Pressable
                  onPress={() => void loadOlderMessages()}
                  disabled={loadingOlder}
                  style={styles.olderButton}
                >
                  <Text style={styles.olderText}>
                    {loadingOlder ? "Loading..." : "Load older messages"}
                  </Text>
                </Pressable>
              ) : null}
              <View style={styles.datePill}>
                <Text style={styles.dateText}>Today</Text>
              </View>
              {activeCall ? (
                <Pressable
                  disabled={startingCallType !== null}
                  onPress={() => void startOrJoinCall(activeCall.type)}
                  style={[
                    styles.liveCallBanner,
                    startingCallType !== null && styles.headerIconDisabled,
                  ]}
                >
                  <View style={styles.liveCallIcon}>
                    <Ionicons
                      name={activeCall.type === "video" ? "videocam" : "call"}
                      size={18}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.liveCallCopy}>
                    <Text style={styles.liveCallTitle}>
                      {activeCall.type === "video" ? "Video" : "Voice"} call in
                      progress
                    </Text>
                    <Text style={styles.liveCallMeta}>
                      {activeCall.participantCount} participant
                      {activeCall.participantCount === 1 ? "" : "s"} - Tap to
                      join
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={22}
                    color={colors.white}
                  />
                </Pressable>
              ) : null}
              {isEmpty ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={34}
                      color="#08b657"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Start the conversation</Text>
                  <Text style={styles.emptyText}>
                    Say hello and help your community feel at home.
                  </Text>
                </View>
              ) : null}
              {messages.map((message) => {
                const mine = message.author._id === user?._id;
                const moderator =
                  message.author.communityRole === "owner" ||
                  message.author.communityRole === "moderator";
                const image = message.attachments.find(
                  (attachment) => attachment.type === "image",
                );
                const files = message.attachments.filter(
                  (attachment) => attachment.type !== "image",
                );
                return (
                  <View
                    key={message._id}
                    style={[styles.messageRow, mine && styles.messageRowMine]}
                  >
                    {!mine ? (
                      message.author.avatarUrl ? (
                        <Image
                          source={{ uri: message.author.avatarUrl }}
                          style={styles.authorAvatar}
                        />
                      ) : (
                        <View style={styles.authorFallback}>
                          <Text style={styles.authorInitials}>
                            {initials(
                              message.author.firstName,
                              message.author.lastName,
                            )}
                          </Text>
                        </View>
                      )
                    ) : null}
                    <View
                      style={[
                        styles.messageColumn,
                        mine && styles.messageColumnMine,
                      ]}
                    >
                      {!mine ? (
                        <View style={styles.authorLine}>
                          <Text
                            style={[
                              styles.authorName,
                              moderator && styles.ownerName,
                            ]}
                          >
                            {`${message.author.firstName} ${message.author.lastName}`.trim() ||
                              "Member"}
                          </Text>
                          {moderator ? (
                            <Text style={styles.ownerBadge}>
                              {message.author.communityRole === "owner"
                                ? "OWNER"
                                : "ADMIN"}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      <Pressable
                        onLongPress={() => setSelectedMessageId(message._id)}
                        style={[
                          styles.bubble,
                          mine
                            ? styles.myBubble
                            : moderator
                              ? styles.ownerBubble
                              : styles.otherBubble,
                        ]}
                      >
                        {message.pinnedAt ? (
                          <View style={styles.pinnedLabel}>
                            <Ionicons name="pin" size={11} color="#078d45" />
                            <Text style={styles.pinnedText}>PINNED</Text>
                          </View>
                        ) : null}
                        {message.replyToMessageId ? (
                          <Text style={styles.replyPreview} numberOfLines={1}>
                            Reply to:{" "}
                            {messages.find(
                              (item) => item._id === message.replyToMessageId,
                            )?.text || "earlier message"}
                          </Text>
                        ) : null}
                        {image ? (
                          <Image
                            source={{ uri: image.url }}
                            style={styles.attachmentImage}
                          />
                        ) : null}
                        {files.map((attachment) => (
                          <View
                            key={attachment._id}
                            style={styles.fileAttachment}
                          >
                            <Ionicons
                              name="document-text-outline"
                              size={22}
                              color="#00b955"
                            />
                            <View style={styles.fileCopy}>
                              <Text numberOfLines={1} style={styles.fileName}>
                                {attachment.name}
                              </Text>
                              <Text style={styles.fileMeta}>
                                {attachment.type.toUpperCase()} -{" "}
                                {Math.ceil(attachment.sizeBytes / 1024)} KB
                              </Text>
                            </View>
                          </View>
                        ))}
                        {message.text ? (
                          <Text style={styles.messageText}>{message.text}</Text>
                        ) : null}
                        {message.reactions.length ? (
                          <View style={styles.reactionRow}>
                            {message.reactions.map((reaction) => {
                              const presentation = reactionPresentation(
                                reaction.emoji,
                              );
                              return (
                                <Pressable
                                  key={reaction.emoji}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${presentation.label} reaction, ${reaction.count}`}
                                  onPress={() =>
                                    void toggleReaction(message, reaction.emoji)
                                  }
                                  style={[
                                    styles.reaction,
                                    reaction.reactedByViewer &&
                                      styles.reactionActive,
                                  ]}
                                >
                                  <Ionicons
                                    name={presentation.icon}
                                    size={14}
                                    color={
                                      reaction.reactedByViewer
                                        ? "#078d45"
                                        : "#52677c"
                                    }
                                  />
                                  <Text style={styles.reactionCount}>
                                    {reaction.count}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : null}
                      </Pressable>
                      <View style={styles.messageMetaRow}>
                        <Text style={[styles.time, mine && styles.timeMine]}>
                          {formatTime(message.createdAt)}
                          {message.editedAt ? " - edited" : ""}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setSelectedMessageId((current) =>
                              current === message._id ? null : message._id,
                            )
                          }
                        >
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={17}
                            color="#8496aa"
                          />
                        </Pressable>
                      </View>
                      {selectedMessageId === message._id ? (
                        <View style={styles.messageActions}>
                          {canSendMessages ? (
                            <Pressable
                              onPress={() => {
                                setReplyTarget(message);
                                setSelectedMessageId(null);
                              }}
                              style={styles.messageAction}
                            >
                              <Text style={styles.messageActionText}>
                                Reply
                              </Text>
                            </Pressable>
                          ) : null}
                          <Pressable
                            onPress={() => {
                              void toggleReaction(message, "Like");
                              setSelectedMessageId(null);
                            }}
                            style={styles.messageAction}
                          >
                            <Text style={styles.messageActionText}>Like</Text>
                          </Pressable>
                          {mine && message.text ? (
                            <Pressable
                              onPress={() => editMessage(message)}
                              style={styles.messageAction}
                            >
                              <Text style={styles.messageActionText}>Edit</Text>
                            </Pressable>
                          ) : null}
                          {canModerate ? (
                            <Pressable
                              onPress={() => {
                                void togglePin(message);
                              }}
                              style={styles.messageAction}
                            >
                              <Text style={styles.messageActionText}>
                                {message.pinnedAt ? "Unpin" : "Pin"}
                              </Text>
                            </Pressable>
                          ) : null}
                          {mine || canModerate ? (
                            <Pressable
                              onPress={() => {
                                setSelectedMessageId(null);
                                setDeleteTarget(message);
                              }}
                              style={styles.messageAction}
                            >
                              <Text style={styles.messageActionDanger}>
                                Delete
                              </Text>
                            </Pressable>
                          ) : null}
                          {!mine ? (
                            <Pressable
                              onPress={() => {
                                setSelectedMessageId(null);
                                setMessageReportTarget(message);
                              }}
                              style={styles.messageAction}
                            >
                              <Text style={styles.messageActionDanger}>
                                Report
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
          {canSendMessages ? (
            <SafeAreaView edges={["bottom"]} style={styles.composerWrap}>
              {replyTarget ? (
                <View style={styles.editingBanner}>
                  <Text numberOfLines={1} style={styles.editingText}>
                    Replying to {replyTarget.text || "attachment"}
                  </Text>
                  <Pressable onPress={() => setReplyTarget(null)}>
                    <Text style={styles.editingCancel}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
              {typingLabel ? (
                <Text style={styles.typingLabel}>{typingLabel}</Text>
              ) : null}
              {editingMessageId ? (
                <View style={styles.editingBanner}>
                  <Text style={styles.editingText}>Editing message</Text>
                  <Pressable
                    onPress={() => {
                      setEditingMessageId(null);
                      setDraft("");
                    }}
                  >
                    <Text style={styles.editingCancel}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
              {pickedImage ? (
                <View style={styles.preview}>
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={styles.previewImage}
                  />
                  <Text numberOfLines={1} style={styles.previewText}>
                    Image ready to send
                  </Text>
                  <Pressable onPress={() => setPickedImage(null)}>
                    <Ionicons name="close-circle" size={24} color="#697a92" />
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.composer}>
                <Pressable
                  accessibilityLabel="Add photo"
                  accessibilityRole="button"
                  disabled={sending || Boolean(editingMessageId)}
                  onPress={() => void pickImage()}
                  style={[
                    styles.addButton,
                    (sending || editingMessageId) && styles.addDisabled,
                  ]}
                >
                  <Ionicons name="add" size={24} color="#24774a" />
                </Pressable>
                <View style={styles.inputWrap}>
                  <TextInput
                    editable={!sending}
                    multiline
                    onChangeText={changeDraft}
                    placeholder={
                      editingMessageId
                        ? "Edit your message..."
                        : "Type a message..."
                    }
                    placeholderTextColor="#8a9b91"
                    style={styles.input}
                    value={draft}
                  />
                </View>
                <Pressable
                  accessibilityLabel={
                    editingMessageId ? "Save message" : "Send message"
                  }
                  accessibilityRole="button"
                  disabled={sending || !hasSendableContent}
                  onPress={() => void sendMessage()}
                  style={[
                    styles.sendButton,
                    (sending || !hasSendableContent) && styles.sendDisabled,
                  ]}
                >
                  {sending ? (
                    <AppLoader color="#07130d" />
                  ) : (
                    <Ionicons
                      name={editingMessageId ? "checkmark" : "send"}
                      size={20}
                      color={hasSendableContent ? "#07130d" : "#779081"}
                    />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          ) : (
            <SafeAreaView edges={["bottom"]} style={styles.readOnly}>
              <Ionicons name="lock-closed" size={21} color="#6c7e98" />
              <Text style={styles.readOnlyText}>
                Only admins can send messages
              </Text>
            </SafeAreaView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <AppReportSheet
        reasons={communityReportReasons}
        minimumDetailsLength={10}
        visible={reportVisible}
        title="Report Community"
        description="Tell us why this community should be reviewed. Your report is confidential."
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
      <AppReportSheet
        reasons={communityMessageReportReasons}
        visible={Boolean(messageReportTarget)}
        title="Report Message"
        description="Tell us why this message should be reviewed. Your report is confidential."
        onClose={() => setMessageReportTarget(null)}
        onSubmit={submitMessageReport}
      />
      <AppAlertModal
        visible={Boolean(deleteTarget)}
        title="Delete message?"
        message="This message will be removed from the community conversation."
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void deleteMessage();
        }}
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
  safe: { backgroundColor: "#f6faf7", flex: 1 },
  liveCallBanner: {
    alignItems: "center",
    backgroundColor: "#123d2a",
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: 18,
    padding: 12,
  },
  liveCallIcon: {
    alignItems: "center",
    backgroundColor: "#286348",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  liveCallCopy: { flex: 1, marginLeft: 11 },
  liveCallTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  liveCallMeta: {
    color: "#b9dcc7",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  keyboard: { flex: 1 },
  messageList: { flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderBottomColor: "#e2eee5",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 10,
  },
  headerBack: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 36,
  },
  identity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },
  avatar: {
    borderColor: "#c8efd5",
    borderRadius: 24,
    borderWidth: 1.5,
    height: 48,
    width: 48,
  },
  onlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    left: 37,
    position: "absolute",
    top: 34,
    width: 14,
  },
  identityCopy: { flex: 1, marginLeft: 10 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16 },
  subtitle: {
    color: "#708579",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  headerIcon: {
    alignItems: "center",
    backgroundColor: "#eff8f1",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    marginLeft: 5,
    width: 38,
  },
  callConnectingIllustration: {
    alignItems: "center",
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  callIllustrationPulse: {
    borderColor: "#45c779",
    borderRadius: 14,
    borderWidth: 1.5,
    height: 24,
    position: "absolute",
    width: 24,
  },
  callIllustrationIcon: {
    alignItems: "center",
    backgroundColor: "#e1f5e8",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  callIllustrationSparkle: {
    position: "absolute",
    right: -1,
    top: -1,
  },
  headerIconDisabled: { opacity: 0.6 },
  headerMenuIcon: { backgroundColor: "#f2f5f3" },
  menu: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 7,
    position: "absolute",
    right: 13,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    top: 68,
    width: 190,
    zIndex: 30,
  },
  menuItem: { alignItems: "center", flexDirection: "row", gap: 9, padding: 12 },
  menuText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 12 },
  olderButton: { alignItems: "center", paddingVertical: 12 },
  olderText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 12 },
  replyPreview: {
    borderLeftColor: "#08b657",
    borderLeftWidth: 3,
    color: "#52677c",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginBottom: 7,
    paddingLeft: 7,
  },
  menuDanger: { color: "#cf3c3c", fontFamily: fonts.semiBold, fontSize: 12 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadingText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 12,
  },
  messages: {
    flexGrow: 1,
    paddingBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  datePill: {
    alignSelf: "center",
    backgroundColor: "#eaf3ed",
    borderRadius: 20,
    marginBottom: 22,
    paddingHorizontal: 17,
    paddingVertical: 7,
  },
  dateText: { color: "#688574", fontFamily: fonts.bold, fontSize: 11 },
  empty: { alignItems: "center", marginTop: 75, padding: 24 },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#e7faef",
    borderRadius: 28,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 14,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    marginBottom: 17,
    maxWidth: "90%",
  },
  messageRowMine: { alignSelf: "flex-end", justifyContent: "flex-end" },
  authorAvatar: {
    borderRadius: 18,
    height: 36,
    marginBottom: 15,
    marginRight: 8,
    width: 36,
  },
  authorFallback: {
    alignItems: "center",
    backgroundColor: "#dff4e8",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginBottom: 15,
    marginRight: 8,
    width: 36,
  },
  authorInitials: {
    color: "#087b43",
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  messageColumn: { maxWidth: "82%" },
  messageColumnMine: { alignItems: "flex-end" },
  authorLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 6,
    marginLeft: 5,
  },
  authorName: { color: "#5d7667", fontFamily: fonts.bold, fontSize: 11 },
  ownerName: { color: "#11864a" },
  ownerBadge: {
    backgroundColor: "#e7faef",
    borderColor: "#a8eec4",
    borderRadius: 10,
    borderWidth: 1,
    color: "#00bd57",
    fontFamily: fonts.bold,
    fontSize: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  bubble: {
    borderRadius: 19,
    overflow: "hidden",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    borderColor: "#e5efe8",
    borderWidth: StyleSheet.hairlineWidth,
  },
  ownerBubble: {
    backgroundColor: "#e0f7e8",
    borderColor: "#c6edd4",
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  myBubble: { backgroundColor: colors.lime, borderBottomRightRadius: 6 },
  attachmentImage: {
    borderRadius: 14,
    height: 185,
    marginBottom: 12,
    width: 230,
  },
  fileAttachment: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 13,
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  fileCopy: { flex: 1, marginLeft: 8 },
  fileName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
  fileMeta: {
    color: "#60718d",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 2,
  },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  reactionRow: { flexDirection: "row", gap: 5, marginTop: 9 },
  reaction: {
    alignItems: "center",
    backgroundColor: "#eff4f1",
    borderRadius: 12,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  reactionActive: { backgroundColor: "#d5f8e3" },
  reactionCount: { color: "#52677c", fontFamily: fonts.bold, fontSize: 9 },
  time: {
    color: "#8ba398",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginLeft: 4,
    marginTop: 5,
  },
  timeMine: { marginRight: 5 },
  composerWrap: {
    backgroundColor: "#f7faf8",
    borderTopColor: "#e5eee8",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  preview: {
    alignItems: "center",
    backgroundColor: "#eff6f2",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 9,
    padding: 8,
  },
  previewImage: { borderRadius: 10, height: 44, width: 44 },
  previewText: {
    color: "#536477",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginLeft: 10,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderColor: "#dce9df",
    borderRadius: 30,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    padding: 5,
    shadowColor: "#174b2c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#eaf6ed",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  addDisabled: { opacity: 0.45 },
  inputWrap: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 10,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 110,
    minHeight: 44,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendDisabled: { backgroundColor: "#e3eee6" },
  readOnly: {
    alignItems: "center",
    backgroundColor: "#f0f4f8",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingBottom: 12,
    paddingTop: 18,
  },
  readOnlyText: { color: "#637590", fontFamily: fonts.medium, fontSize: 14 },
  typingLabel: {
    color: "#557366",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginBottom: 7,
    marginLeft: 8,
  },
  pinnedLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 7,
  },
  pinnedText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 8 },
  messageMetaRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  messageActions: {
    backgroundColor: colors.white,
    borderRadius: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 7,
    padding: 5,
  },
  messageAction: {
    backgroundColor: "#eef5f1",
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  messageActionText: { color: "#37644d", fontFamily: fonts.bold, fontSize: 9 },
  messageActionDanger: {
    color: "#b24545",
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  editingBanner: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 9,
  },
  editingText: { color: "#28744e", fontFamily: fonts.bold, fontSize: 10 },
  editingCancel: { color: "#a33f3f", fontFamily: fonts.bold, fontSize: 10 },
});
