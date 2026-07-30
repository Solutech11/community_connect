import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppAlertModal from '../../components/ui/app-alert-modal';
import AppReportSheet from '../../components/ui/app-report-sheet';
import { communityImage, initials } from '../../data/community-presentation';
import { useAuth } from '../../hooks/use-auth';
import { ApiError, createIdempotencyKey } from '../../services/api/client';
import { liveKitUrl } from '../../services/api/config';
import { communitiesApi } from '../../services/api/communities.api';
import { uploadsApi } from '../../services/api/uploads.api';
import {
  chatSocket,
  type CommunityCallPayload,
  type CommunityTypingPayload,
} from '../../services/socket/chat-socket';
import { colors, fonts } from '../../styles/theme';
import type { GetCommunitiesIdResponse } from '../../types/api.generated';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityRoom'>;
type Community = GetCommunitiesIdResponse['data']['community'];
type PickedImage = { uri: string; name: string; type: string };
type CommunityRole = 'owner' | 'moderator' | 'member' | null;
type CommunityCallType = 'voice' | 'video';

type RoomAttachment = {
  _id: string;
  url: string;
  type: 'image' | 'pdf' | 'file';
  name: string;
  mimeType: string;
  sizeBytes: number;
};

type RoomMessage = {
  _id: string;
  communityId: string;
  author: { _id: string; firstName: string; lastName: string; avatarUrl: string; communityRole: string };
  text: string;
  attachments: RoomAttachment[];
  clientMessageId: string;
  createdAt: string;
  editedAt: string | null;
  reactions: Array<{ emoji: string; count: number; reactedByViewer: boolean }>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function mapRoomMessage(value: unknown): RoomMessage | null {
  const item = asRecord(value);
  if (!item) return null;
  const author = asRecord(item.author) ?? asRecord(item.authorId);
  if (!author) return null;
  const attachments = Array.isArray(item.attachments)
    ? item.attachments.map((entry) => {
      const attachment = asRecord(entry);
      if (!attachment) return null;
      return {
        _id: asString(attachment._id),
        url: asString(attachment.url),
        type: (asString(attachment.type, 'file') as RoomAttachment['type']),
        name: asString(attachment.name, 'Attachment'),
        mimeType: asString(attachment.mimeType),
        sizeBytes: typeof attachment.sizeBytes === 'number' ? attachment.sizeBytes : 0,
      };
    }).filter((entry): entry is RoomAttachment => entry !== null)
    : [];
  const legacyImage = asString(item.imageUrl);
  if (legacyImage && attachments.length === 0) {
    attachments.push({ _id: `legacy-${asString(item._id)}`, url: legacyImage, type: 'image', name: 'Shared image', mimeType: 'image/*', sizeBytes: 0 });
  }
  return {
    _id: asString(item._id),
    communityId: asString(item.communityId),
    author: {
      _id: asString(author._id),
      firstName: asString(author.firstName),
      lastName: asString(author.lastName),
      avatarUrl: asString(author.avatarUrl),
      communityRole: asString(author.communityRole, 'member'),
    },
    text: asString(item.text),
    attachments,
    clientMessageId: asString(item.clientMessageId),
    createdAt: asString(item.createdAt),
    editedAt: typeof item.editedAt === 'string' ? item.editedAt : null,
    reactions: Array.isArray(item.reactions)
      ? item.reactions.map((entry) => {
        const reaction = asRecord(entry);
        return {
          emoji: asString(reaction?.emoji),
          count: typeof reaction?.count === 'number' ? reaction.count : 0,
          reactedByViewer: reaction?.reactedByViewer === true,
        };
      }).filter((entry) => entry.emoji)
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
  const type = asString(call?.type) === 'video' ? 'video' : 'voice';
  return {
    _id: id,
    communityId: asString(call?.communityId),
    type,
    status: asString(call?.status, 'active'),
    startedBy: asString(call?.startedBy),
    participantCount: typeof call?.participantCount === 'number' ? call.participantCount : 0,
    startedAt: asString(call?.startedAt),
    endedAt: typeof call?.endedAt === 'string' ? call.endedAt : null,
  };
}

function isCommunityPayload(payload: Record<string, unknown>, communityId: string) {
  return asString(payload.communityId) === communityId;
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

function normalizeReportReason(reason: string) {
  return reason.toLowerCase().replace(/\s+/g, '-');
}

export default function CommunityRoomScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const communityId = route.params.communityId;
  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [membershipRole, setMembershipRole] = useState<CommunityRole>(null);
  const [messagePermission, setMessagePermission] = useState('everyone');
  const [activeCall, setActiveCall] = useState<CommunityCall | null>(null);
  const [typingMembers, setTypingMembers] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const canModerate = membershipRole === 'owner' || membershipRole === 'moderator';
  const canSendMessages = messagePermission !== 'moderators' || canModerate;

  const upsertMessage = useCallback((next: RoomMessage) => {
    setMessages((current) => {
      const index = current.findIndex((message) => message._id === next._id);
      if (index < 0) return [...current, next].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      const copy = [...current];
      copy[index] = next;
      return copy;
    });
  }, []);

  const load = useCallback(async (signal?: AbortSignal, scrollToLatest = false) => {
    const [detail, messageResponse, settingsResponse, mineResponse, callResponse] = await Promise.all([
      communitiesApi.get(communityId, signal),
      communitiesApi.messages(communityId, { limit: 50 }, signal),
      communitiesApi.settings(communityId, signal),
      communitiesApi.myCommunities({ page: 1, limit: 50 }, signal),
      communitiesApi.activeCall(communityId, signal),
    ]);
    const parsed = messageResponse.data.messages.map(mapRoomMessage).filter((message): message is RoomMessage => message !== null);
    const viewer = mineResponse.data.communities.find((item) => item._id === communityId)?.viewerMembership;
    setCommunity(detail.data.community);
    setMessages(parsed);
    setMembershipRole((viewer?.role as CommunityRole | undefined) ?? null);
    setMessagePermission(settingsResponse.data.settings.messagePermission);
    setActiveCall(mapCommunityCall(callResponse.data.call));
    const latest = parsed.at(-1);
    if (latest) void communitiesApi.markMessagesRead(communityId, { lastReadMessageId: latest._id }).catch(() => undefined);
    if (scrollToLatest) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }, [communityId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal, true)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'REQUEST_CANCELLED') return;
        setAlert({ title: 'Community room unavailable', message: error instanceof ApiError ? error.message : 'Unable to load this room.' });
      })
      .finally(() => setLoading(false));

    const joinRealtimeCommunity = () => {
      chatSocket.joinCommunity(communityId, (response) => {
        if (!response.success && response.code !== 'COMMUNITY_SOCKET_UNAVAILABLE') {
          setAlert({ title: 'Realtime unavailable', message: response.message || 'Unable to join live community updates.' });
        }
      });
    };
    joinRealtimeCommunity();
    const stopSocketConnect = chatSocket.onConnect(joinRealtimeCommunity);
    const stopNewMessage = chatSocket.onCommunityMessage((payload) => {
      const message = mapRoomMessage(payload);
      if (message?.communityId === communityId) upsertMessage(message);
    });
    const stopUpdatedMessage = chatSocket.onCommunityMessageUpdated((payload) => {
      const message = mapRoomMessage(payload);
      if (message?.communityId === communityId) upsertMessage(message);
    });
    const stopDeletedMessage = chatSocket.onCommunityMessageDeleted((payload) => {
      if (payload.communityId === communityId) setMessages((current) => current.filter((message) => message._id !== payload.messageId));
    });
    const stopCommunityPost = chatSocket.onCommunityPost((payload) => {
      if (isCommunityPayload(payload, communityId)) void load();
    });
    const stopCommunityAnnouncement = chatSocket.onCommunityAnnouncement((payload) => {
      if (isCommunityPayload(payload, communityId)) void load();
    });
    const stopMemberUpdated = chatSocket.onCommunityMemberUpdated((payload) => {
      if (isCommunityPayload(payload, communityId)) void load();
    });
    const stopCommunityTyping = chatSocket.onCommunityTyping((payload: CommunityTypingPayload) => {
      if (payload.communityId !== communityId || payload.userId === user?._id) return;
      setTypingMembers((current) => {
        const next = { ...current };
        if (payload.typing) next[payload.userId] = payload.firstName || 'A member';
        else delete next[payload.userId];
        return next;
      });
    });
    const updateActiveCall = (payload: CommunityCallPayload) => {
      if (!isCommunityPayload(payload, communityId)) return;
      setActiveCall(mapCommunityCall(payload));
    };
    const stopCallStarted = chatSocket.onCommunityCallStarted(updateActiveCall);
    const stopCallUpdated = chatSocket.onCommunityCallUpdated(updateActiveCall);
    const stopCallEnded = chatSocket.onCommunityCallEnded((payload) => {
      if (isCommunityPayload(payload, communityId)) setActiveCall(null);
    });

    return () => {
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
  }, [communityId, load, upsertMessage, user?._id]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load(undefined, false);
    } catch (error) {
      setAlert({ title: 'Unable to refresh', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally {
      setRefreshing(false);
    }
  };

  const changeDraft = (value: string) => {
    setDraft(value);
    if (!canSendMessages) return;
    chatSocket.setCommunityTyping(communityId, value.trim().length > 0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => chatSocket.setCommunityTyping(communityId, false), 1400);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAlert({ title: 'Photo permission needed', message: 'Allow photo access to share an image with this community.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPickedImage({ uri: asset.uri, name: asset.fileName || `community-chat-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' });
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if ((!text && !pickedImage) || sending || !canSendMessages) return;
    setSending(true);
    try {
      const attachmentIds: string[] = [];
      if (pickedImage) {
        const upload = await uploadsApi.communityFile(pickedImage);
        attachmentIds.push(upload.data.attachment._id);
      }
      const response = await communitiesApi.sendMessage(communityId, {
        clientMessageId: createIdempotencyKey(),
        ...(text ? { text } : {}),
        ...(attachmentIds.length ? { attachmentIds } : {}),
      });
      const message = mapRoomMessage(response.data.message);
      if (message) upsertMessage(message);
      setDraft('');
      setPickedImage(null);
      chatSocket.setCommunityTyping(communityId, false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      setAlert({ title: 'Message not sent', message: error instanceof ApiError ? error.message : 'Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const toggleReaction = async (message: RoomMessage, emoji: string) => {
    try {
      const existing = message.reactions.find((reaction) => reaction.emoji === emoji);
      const response = existing?.reactedByViewer
        ? await communitiesApi.removeReaction(communityId, message._id, emoji)
        : await communitiesApi.addReaction(communityId, message._id, emoji);
      upsertMessage({ ...message, reactions: response.data.reactions });
    } catch (error) {
      setAlert({ title: 'Reaction unavailable', message: error instanceof ApiError ? error.message : 'Please try again.' });
    }
  };

  const startOrJoinCall = async (preferredType: CommunityCallType = 'voice') => {
    try {
      let call = activeCall;
      if (!call) {
        const activeResponse = await communitiesApi.activeCall(communityId);
        call = mapCommunityCall(activeResponse.data.call);
      }
      if (!call && canModerate) {
        const createResponse = await communitiesApi.createCall(communityId, { type: preferredType });
        call = mapCommunityCall(createResponse.data.call);
      }
      if (!call) {
        setAlert({ title: 'No active call', message: 'Only a community owner or moderator can start a call.' });
        return;
      }
      const response = await communitiesApi.joinCall(communityId, call._id);
      if (response.data.provider !== 'livekit') {
        setAlert({ title: 'Call unavailable', message: 'This community call provider is not supported by the mobile app.' });
        return;
      }
      if (!liveKitUrl) {
        setAlert({ title: 'Call setup needed', message: 'Set EXPO_PUBLIC_LIVEKIT_URL to the public LiveKit server URL, then rebuild the Expo development client.' });
        return;
      }
      navigation.navigate('CommunityCall', {
        communityId,
        callId: call._id,
        callType: call.type,
        roomName: response.data.roomName,
        participantToken: response.data.participantToken,
        expiresAt: response.data.expiresAt,
        canEndCall: canModerate || call.startedBy === user?._id,
      });
    } catch (error) {
      setAlert({ title: 'Call unavailable', message: error instanceof ApiError ? error.message : 'Please try again.' });
    }
  };

  const submitReport = async (reason: string, details: string) => {
    try {
      const response = await communitiesApi.report(communityId, { reason: normalizeReportReason(reason), ...(details ? { details } : {}) });
      setAlert({ title: 'Report submitted', message: response.message });
    } catch (error) {
      setAlert({ title: 'Unable to report', message: error instanceof ApiError ? error.message : 'Please try again.' });
    }
  };

  const communityImages = community as (Community & { coverImageUrl?: string; avatarImageUrl?: string }) | null;
  const cover = communityImage(communityImages?.coverImageUrl || community?.imageUrl, community?.name.length ?? 0);
  const avatar = communityImage(communityImages?.avatarImageUrl || community?.imageUrl, community?.name.length ?? 0);
  const isEmpty = !loading && messages.length === 0;
  const typingNames = Object.values(typingMembers);
  const typingLabel = typingNames.length === 0 ? '' : `${typingNames.slice(0, 2).join(' and ')} ${typingNames.length > 1 ? 'are' : 'is'} typing...`;

  return <>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBack}><Ionicons name="chevron-back" size={29} color="#60718d" /></Pressable>
          <Pressable disabled={!community} onPress={() => navigation.navigate('CommunityProfile', { communityId })} style={styles.identity}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={styles.onlineDot} />
            <View style={styles.identityCopy}><Text numberOfLines={1} style={styles.title}>{community?.name ?? 'Community Room'}</Text><Text style={styles.subtitle}>{community ? `${community.members.length.toLocaleString()} Members` : 'Loading...'}</Text></View>
          </Pressable>
          <Pressable onPress={() => void startOrJoinCall('voice')} style={styles.headerIcon}><Ionicons name="call" size={23} color="#06d263" /></Pressable>
          <Pressable onPress={() => void startOrJoinCall('video')} style={styles.headerIcon}><Ionicons name="videocam" size={23} color="#06d263" /></Pressable>
          <Pressable onPress={() => setMenuVisible((value) => !value)} style={styles.headerIcon}><Ionicons name="ellipsis-vertical" size={24} color="#60718d" /></Pressable>
          {menuVisible ? <View style={styles.menu}>
            <Pressable onPress={() => { setMenuVisible(false); navigation.navigate('CommunityProfile', { communityId }); }} style={styles.menuItem}><Ionicons name="people-outline" size={19} color={colors.ink} /><Text style={styles.menuText}>Community profile</Text></Pressable>
            <Pressable onPress={() => { setMenuVisible(false); navigation.navigate('CommunityRules', { communityId }); }} style={styles.menuItem}><Ionicons name="hammer-outline" size={19} color={colors.ink} /><Text style={styles.menuText}>Community rules</Text></Pressable>
            <Pressable onPress={() => { setMenuVisible(false); setReportVisible(true); }} style={styles.menuItem}><Ionicons name="flag-outline" size={19} color="#cf3c3c" /><Text style={styles.menuDanger}>Report community</Text></Pressable>
          </View> : null}
        </View>
        {loading ? <View style={styles.loading}><ActivityIndicator color="#00c95a" size="large" /><Text style={styles.loadingText}>Loading messages...</Text></View> : <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.lime} />} showsVerticalScrollIndicator={false}>
          <View style={styles.datePill}><Text style={styles.dateText}>Today</Text></View>
          {activeCall ? <Pressable onPress={() => void startOrJoinCall(activeCall.type)} style={styles.liveCallBanner}><Ionicons name={activeCall.type === 'video' ? 'videocam' : 'call'} size={18} color={colors.white} /><View style={styles.liveCallCopy}><Text style={styles.liveCallTitle}>{activeCall.type === 'video' ? 'Video' : 'Voice'} call in progress</Text><Text style={styles.liveCallMeta}>{activeCall.participantCount} participant{activeCall.participantCount === 1 ? '' : 's'} - Tap to join</Text></View><Ionicons name="arrow-forward" size={18} color={colors.white} /></Pressable> : null}
          {isEmpty ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={34} color="#08b657" /></View><Text style={styles.emptyTitle}>Start the conversation</Text><Text style={styles.emptyText}>Say hello and help your community feel at home.</Text></View> : null}
          {messages.map((message) => {
            const mine = message.author._id === user?._id;
            const moderator = message.author.communityRole === 'owner' || message.author.communityRole === 'moderator';
            const image = message.attachments.find((attachment) => attachment.type === 'image');
            const files = message.attachments.filter((attachment) => attachment.type !== 'image');
            return <View key={message._id} style={[styles.messageRow, mine && styles.messageRowMine]}>
              {!mine ? message.author.avatarUrl ? <Image source={{ uri: message.author.avatarUrl }} style={styles.authorAvatar} /> : <View style={styles.authorFallback}><Text style={styles.authorInitials}>{initials(message.author.firstName, message.author.lastName)}</Text></View> : null}
              <View style={[styles.messageColumn, mine && styles.messageColumnMine]}>
                {!mine ? <View style={styles.authorLine}><Text style={[styles.authorName, moderator && styles.ownerName]}>{`${message.author.firstName} ${message.author.lastName}`.trim() || 'Member'}</Text>{moderator ? <Text style={styles.ownerBadge}>{message.author.communityRole === 'owner' ? 'OWNER' : 'ADMIN'}</Text> : null}</View> : null}
                <View style={[styles.bubble, mine ? styles.myBubble : moderator ? styles.ownerBubble : styles.otherBubble]}>
                  {image ? <Image source={{ uri: image.url }} style={styles.attachmentImage} /> : null}
                  {files.map((attachment) => <View key={attachment._id} style={styles.fileAttachment}><Ionicons name="document-text-outline" size={22} color="#00b955" /><View style={styles.fileCopy}><Text numberOfLines={1} style={styles.fileName}>{attachment.name}</Text><Text style={styles.fileMeta}>{attachment.type.toUpperCase()} - {Math.ceil(attachment.sizeBytes / 1024)} KB</Text></View></View>)}
                  {message.text ? <Text style={styles.messageText}>{message.text}</Text> : null}
                  {message.reactions.length ? <View style={styles.reactionRow}>{message.reactions.map((reaction) => <Pressable key={reaction.emoji} onPress={() => void toggleReaction(message, reaction.emoji)} style={[styles.reaction, reaction.reactedByViewer && styles.reactionActive]}><Text>{reaction.emoji}</Text><Text style={styles.reactionCount}>{reaction.count}</Text></Pressable>)}</View> : null}
                </View>
                <Pressable onPress={() => void toggleReaction(message, 'Like')}><Text style={[styles.time, mine && styles.timeMine]}>{formatTime(message.createdAt)}{message.editedAt ? ' - edited' : ''}</Text></Pressable>
              </View>
            </View>;
          })}
        </ScrollView>}
        {canSendMessages ? <View style={styles.composerWrap}>{typingLabel ? <Text style={styles.typingLabel}>{typingLabel}</Text> : null}
          {pickedImage ? <View style={styles.preview}><Image source={{ uri: pickedImage.uri }} style={styles.previewImage} /><Text numberOfLines={1} style={styles.previewText}>Image ready to send</Text><Pressable onPress={() => setPickedImage(null)}><Ionicons name="close-circle" size={24} color="#697a92" /></Pressable></View> : null}
          <View style={styles.composer}><Pressable disabled={sending} onPress={() => void pickImage()} style={styles.addButton}><Ionicons name="add" size={29} color="#5e718d" /></Pressable><View style={styles.inputWrap}><TextInput editable={!sending} multiline onChangeText={changeDraft} placeholder="Type a message..." placeholderTextColor="#98a8bd" style={styles.input} value={draft} /><Ionicons name="happy-outline" size={23} color="#8b9bb0" /></View><Pressable disabled={sending || (!draft.trim() && !pickedImage)} onPress={() => void sendMessage()} style={[styles.sendButton, (sending || (!draft.trim() && !pickedImage)) && styles.sendDisabled]}>{sending ? <ActivityIndicator color="#07130d" /> : <Ionicons name="send" size={25} color="#07130d" />}</Pressable></View>
        </View> : <View style={styles.readOnly}><Ionicons name="lock-closed" size={21} color="#6c7e98" /><Text style={styles.readOnlyText}>Only admins can send messages</Text></View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
    <AppReportSheet visible={reportVisible} title="Report Community" description="Tell us why this community should be reviewed. Your report is confidential." onClose={() => setReportVisible(false)} onSubmit={(reason, details) => { void submitReport(reason, details); }} />
    <AppAlertModal visible={Boolean(alert)} title={alert?.title ?? ''} message={alert?.message ?? ''} onClose={() => setAlert(null)} />
  </>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#f7faf8', flex: 1 }, liveCallBanner: { alignItems: 'center', backgroundColor: '#062b1a', borderRadius: 18, flexDirection: 'row', marginBottom: 22, padding: 14 }, liveCallCopy: { flex: 1, marginLeft: 10 }, liveCallTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 }, liveCallMeta: { color: '#b6e3c9', fontFamily: fonts.medium, fontSize: 10, marginTop: 3 }, keyboard: { flex: 1 }, header: { alignItems: 'center', backgroundColor: colors.white, borderBottomColor: '#e8f3ed', borderBottomWidth: 1, flexDirection: 'row', minHeight: 86, paddingHorizontal: 14, zIndex: 10 }, headerBack: { alignItems: 'center', height: 48, justifyContent: 'center', width: 42 }, identity: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 }, avatar: { borderColor: colors.lime, borderRadius: 28, borderWidth: 2, height: 56, width: 56 }, onlineDot: { backgroundColor: colors.lime, borderColor: colors.white, borderRadius: 8, borderWidth: 2, height: 16, left: 44, position: 'absolute', top: 40, width: 16 }, identityCopy: { flex: 1, marginLeft: 12 }, title: { color: '#081126', fontFamily: fonts.extraBold, fontSize: 18 }, subtitle: { color: '#61728f', fontFamily: fonts.medium, fontSize: 13, marginTop: 2 }, headerIcon: { alignItems: 'center', height: 46, justifyContent: 'center', width: 42 }, menu: { backgroundColor: colors.white, borderRadius: 18, padding: 7, position: 'absolute', right: 13, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, top: 70, width: 190, zIndex: 30 }, menuItem: { alignItems: 'center', flexDirection: 'row', gap: 9, padding: 12 }, menuText: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 12 }, menuDanger: { color: '#cf3c3c', fontFamily: fonts.semiBold, fontSize: 12 }, loading: { alignItems: 'center', flex: 1, justifyContent: 'center' }, loadingText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 12 }, messages: { flexGrow: 1, paddingBottom: 24, paddingHorizontal: 18, paddingTop: 24 }, datePill: { alignSelf: 'center', backgroundColor: colors.white, borderRadius: 20, marginBottom: 30, paddingHorizontal: 21, paddingVertical: 9 }, dateText: { color: '#90a0b7', fontFamily: fonts.bold, fontSize: 12 }, empty: { alignItems: 'center', marginTop: 75, padding: 24 }, emptyIcon: { alignItems: 'center', backgroundColor: '#e7faef', borderRadius: 28, height: 58, justifyContent: 'center', width: 58 }, emptyTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginTop: 14 }, emptyText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, marginTop: 7, textAlign: 'center' }, messageRow: { alignItems: 'flex-end', flexDirection: 'row', marginBottom: 22, maxWidth: '92%' }, messageRowMine: { alignSelf: 'flex-end', justifyContent: 'flex-end' }, authorAvatar: { borderRadius: 23, height: 46, marginBottom: 18, marginRight: 9, width: 46 }, authorFallback: { alignItems: 'center', backgroundColor: '#dff4e8', borderRadius: 23, height: 46, justifyContent: 'center', marginBottom: 18, marginRight: 9, width: 46 }, authorInitials: { color: '#087b43', fontFamily: fonts.extraBold, fontSize: 12 }, messageColumn: { maxWidth: '82%' }, messageColumnMine: { alignItems: 'flex-end' }, authorLine: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 6, marginLeft: 5 }, authorName: { color: '#536985', fontFamily: fonts.bold, fontSize: 12 }, ownerName: { color: '#00bd57' }, ownerBadge: { backgroundColor: '#e7faef', borderColor: '#a8eec4', borderRadius: 10, borderWidth: 1, color: '#00bd57', fontFamily: fonts.bold, fontSize: 7, paddingHorizontal: 7, paddingVertical: 3 }, bubble: { borderRadius: 22, overflow: 'hidden', padding: 16 }, otherBubble: { backgroundColor: colors.white, borderBottomLeftRadius: 4 }, ownerBubble: { backgroundColor: '#dcf7e8', borderColor: '#b8efd0', borderWidth: 1, borderBottomLeftRadius: 4 }, myBubble: { backgroundColor: colors.lime, borderBottomRightRadius: 4 }, attachmentImage: { borderRadius: 14, height: 185, marginBottom: 12, width: 230 }, fileAttachment: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 13, flexDirection: 'row', marginBottom: 10, padding: 10 }, fileCopy: { flex: 1, marginLeft: 8 }, fileName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 }, fileMeta: { color: '#60718d', fontFamily: fonts.medium, fontSize: 9, marginTop: 2 }, messageText: { color: '#091126', fontFamily: fonts.medium, fontSize: 15, lineHeight: 23 }, reactionRow: { flexDirection: 'row', gap: 5, marginTop: 9 }, reaction: { alignItems: 'center', backgroundColor: '#eff4f1', borderRadius: 12, flexDirection: 'row', gap: 3, paddingHorizontal: 7, paddingVertical: 4 }, reactionActive: { backgroundColor: '#d5f8e3' }, reactionCount: { color: '#52677c', fontFamily: fonts.bold, fontSize: 9 }, time: { color: '#95a6bc', fontFamily: fonts.medium, fontSize: 10, marginLeft: 5, marginTop: 6 }, timeMine: { marginRight: 5 }, composerWrap: { backgroundColor: colors.white, borderTopColor: '#eef1f0', borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 8 : 14, paddingHorizontal: 16, paddingTop: 12 }, preview: { alignItems: 'center', backgroundColor: '#eff6f2', borderRadius: 16, flexDirection: 'row', marginBottom: 9, padding: 8 }, previewImage: { borderRadius: 10, height: 44, width: 44 }, previewText: { color: '#536477', flex: 1, fontFamily: fonts.medium, fontSize: 11, marginLeft: 10 }, composer: { alignItems: 'center', flexDirection: 'row', gap: 10 }, addButton: { alignItems: 'center', backgroundColor: '#f0f4f7', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 }, inputWrap: { alignItems: 'center', backgroundColor: '#f1f5f8', borderRadius: 26, flex: 1, flexDirection: 'row', minHeight: 50, paddingHorizontal: 16 }, input: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, maxHeight: 100, paddingVertical: 11 }, sendButton: { alignItems: 'center', backgroundColor: colors.lime, borderRadius: 26, height: 52, justifyContent: 'center', width: 52 }, sendDisabled: { opacity: 0.45 }, readOnly: { alignItems: 'center', backgroundColor: '#f0f4f8', flexDirection: 'row', gap: 10, justifyContent: 'center', paddingBottom: Platform.OS === 'ios' ? 18 : 24, paddingTop: 18 }, readOnlyText: { color: '#637590', fontFamily: fonts.medium, fontSize: 14 },
  typingLabel: { color: '#557366', fontFamily: fonts.medium, fontSize: 11, marginBottom: 7, marginLeft: 8 }
});
