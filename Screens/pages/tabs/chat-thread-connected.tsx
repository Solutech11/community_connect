import { useCachedState } from "../../hooks/use-cached-state";
import { SessionCache } from "../../services/cache/session-cache";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from "../../hooks/use-auth";
import { aiApi } from "../../services/api/ai.api";
import {
  ApiError,
  apiClient,
  createIdempotencyKey,
} from "../../services/api/client";
import { chatApi } from "../../services/api/chat.api";
import {
  chatSocket,
  type RealtimeMessage,
} from "../../services/socket/chat-socket";
import type { GetChatConversationsIdMessagesResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";
import { colors, fonts } from "../../styles/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ChatThread">;
type Message =
  GetChatConversationsIdMessagesResponse["data"]["messages"][number];

const messagesCache = new SessionCache<Message[]>(20);
const emptyMessages: Message[] = [];

function mergeMessages(current: Message[], incoming: Message[]) {
  const byKey = new Map<string, Message>();
  [...current, ...incoming].forEach((message) => {
    byKey.set(message._id || message.clientMessageId, message);
  });
  return [...byKey.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-NG", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ChatThreadConnectedScreen({
  navigation,
  route,
}: Props) {
  const { conversationId, image, name, online } = route.params;
  const { user } = useAuth();
  const [messages, setMessages, hasCachedMessages] = useCachedState(
    messagesCache,
    user?._id,
    conversationId,
    emptyMessages,
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!hasCachedMessages);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "offline"
  >("connecting");
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const synchronizeRef = useRef<((initial?: boolean) => Promise<void>) | null>(
    null,
  );
  const loadMessages = useCallback(async () => {
    await synchronizeRef.current?.(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const socket = chatSocket.current();
      const controller = new AbortController();
      let active = true;
      let loaded = false;
      let synchronizing = false;
      let synchronizeAgain = false;
      setError(null);
      setTyping(false);
      setReadAt(null);
      setLoading(
        !user?._id ||
          messagesCache.read(user._id, conversationId) === undefined,
      );
      setRealtimeStatus(socket.connected ? "connecting" : "offline");
      const markRead = () => {
        // A read-receipt failure must never prevent joining or receiving messages.
        void chatApi
          .markRead(conversationId, controller.signal)
          .catch(() => undefined);
      };
      const synchronize = async (initial = false): Promise<void> => {
        if (!active) return;
        if (synchronizing) {
          synchronizeAgain = true;
          return;
        }
        synchronizing = true;
        if (initial) {
          setLoading(
            !user?._id ||
              messagesCache.read(user._id, conversationId) === undefined,
          );
          setError(null);
        }
        try {
          if (!loaded) {
            const history = await chatApi.messages(
              conversationId,
              { limit: 50 },
              controller.signal,
            );
            if (!active) return;
            setMessages((current) =>
              mergeMessages(current, history.data.messages),
            );
            loaded = true;
          }
          if (socket.connected) {
            await chatSocket.join(conversationId);
            if (!active) return;
            setRealtimeStatus("connected");
            setRealtimeError(null);
            // Catch messages missed between loading history and joining, or during a disconnect.
            const latest = await chatApi.messages(
              conversationId,
              { limit: 50 },
              controller.signal,
            );
            if (!active) return;
            setMessages((current) =>
              mergeMessages(current, latest.data.messages),
            );
          } else {
            setRealtimeStatus(socket.active ? "connecting" : "offline");
          }
          markRead();
        } catch (requestError) {
          if (!active) return;
          const accessDenied =
            requestError instanceof ApiError &&
            [401, 403, 404].includes(requestError.status);
          if (accessDenied && user?._id)
            messagesCache.invalidate(user._id, conversationId);
          if (
            accessDenied ||
            (!loaded &&
              (!user?._id ||
                messagesCache.read(user._id, conversationId) === undefined))
          )
            setError(
              requestError instanceof ApiError
                ? requestError.message
                : "Unable to load this conversation.",
            );
          else {
            setRealtimeStatus("offline");
            setRealtimeError("Live updates are unavailable. Tap to reconnect.");
          }
        } finally {
          synchronizing = false;
          if (active) setLoading(false);
          if (active && synchronizeAgain) {
            synchronizeAgain = false;
            void synchronize();
          }
        }
      };
      synchronizeRef.current = synchronize;
      const onConnected = () => {
        if (active) void synchronize();
      };
      const onDisconnected = () => {
        if (!active) return;
        setTyping(false);
        setRealtimeStatus("offline");
        setRealtimeError("Live updates are unavailable. Tap to reconnect.");
      };
      const onMessage = (message: RealtimeMessage) => {
        if (!active || message.conversationId !== conversationId) return;
        setMessages((current) => mergeMessages(current, [message]));
        markRead();
      };
      const onTypingStart = (payload: {
        conversationId: string;
        userId: string;
      }) => {
        if (
          active &&
          payload.conversationId === conversationId &&
          payload.userId !== user?._id
        )
          setTyping(true);
      };
      const onTypingStop = (payload: {
        conversationId: string;
        userId: string;
      }) => {
        if (
          active &&
          payload.conversationId === conversationId &&
          payload.userId !== user?._id
        )
          setTyping(false);
      };
      const onTyping = (payload: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }) => {
        if (
          active &&
          payload.conversationId === conversationId &&
          payload.userId !== user?._id
        )
          setTyping(payload.isTyping);
      };
      const onRead = (payload: {
        conversationId: string;
        userId: string;
        readAt: string;
      }) => {
        if (
          active &&
          payload.conversationId === conversationId &&
          payload.userId !== user?._id
        )
          setReadAt(payload.readAt);
      };
      socket.on("connect", onConnected);
      socket.on("socket:ready", onConnected);
      socket.on("disconnect", onDisconnected);
      socket.on("connect_error", onDisconnected);
      socket.on("message:new", onMessage);
      socket.on("conversation:read", onRead);
      socket.on("typing", onTyping);
      socket.on("typing:start", onTypingStart);
      socket.on("typing:stop", onTypingStop);
      const appStateSubscription = AppState.addEventListener(
        "change",
        (state) => {
          if (state === "active") onConnected();
        },
      );
      void synchronize(true);
      return () => {
        active = false;
        controller.abort();
        synchronizeRef.current = null;
        if (typingTimer.current) clearTimeout(typingTimer.current);
        chatSocket.stopTyping(conversationId);
        chatSocket.leave(conversationId);
        appStateSubscription.remove();
        socket.off("connect", onConnected);
        socket.off("socket:ready", onConnected);
        socket.off("disconnect", onDisconnected);
        socket.off("connect_error", onDisconnected);
        socket.off("message:new", onMessage);
        socket.off("conversation:read", onRead);
        socket.off("typing", onTyping);
        socket.off("typing:start", onTypingStart);
        socket.off("typing:stop", onTypingStop);
      };
    }, [conversationId, user?._id]),
  );

  const reconnect = () => {
    const token = apiClient.getAccessToken();
    if (token) chatSocket.connect(token);
    void loadMessages();
  };

  const updateDraft = (value: string) => {
    setDraft(value);
    chatSocket.startTyping(conversationId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => chatSocket.stopTyping(conversationId),
      900,
    );
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await chatApi.sendMessage(conversationId, {
        clientMessageId: createIdempotencyKey(),
        type: "text",
        text,
      });
      setMessages((current) => mergeMessages(current, [response.data.message]));
      setDraft("");
      chatSocket.stopTyping(conversationId);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to send the message.",
      );
    } finally {
      setSending(false);
    }
  };

  const summarize = async () => {
    if (summarizing) return;
    setSummarizing(true);
    try {
      const response = await aiApi.summarizeConversation(conversationId);
      setSummary(response.data.message);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to summarize this conversation.",
      );
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.safe}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.header}>
            <Pressable onPress={navigation.goBack} style={styles.headerButton}>
              <Ionicons color={colors.ink} name="chevron-back" size={26} />
            </Pressable>
            <View style={styles.avatarWrap}>
              {image ? (
                <Image source={{ uri: image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials(name)}</Text>
                </View>
              )}
              {online ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.name}>
                {name}
              </Text>
              <View style={styles.statusLine}>
                {online && !typing ? <View style={styles.statusDot} /> : null}
                <Text style={styles.status}>
                  {realtimeStatus !== "connected"
                    ? realtimeStatus === "connecting"
                      ? "Connecting live updates..."
                      : "Live updates unavailable"
                    : typing
                      ? "Typing..."
                      : readAt
                        ? "Read receipt updated"
                        : online
                          ? "Online"
                          : "Direct message"}
                </Text>
              </View>
            </View>
            <Pressable
              disabled={summarizing}
              onPress={() => void summarize()}
              style={styles.aiHeaderButton}
            >
              {summarizing ? (
                <AppLoader color="#08ad54" />
              ) : (
                <Ionicons color="#078e48" name="sparkles" size={19} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
        {realtimeStatus === "offline" && !loading ? (
          <Pressable
            accessibilityRole="button"
            onPress={reconnect}
            style={styles.realtimeNotice}
          >
            <Text style={styles.realtimeNoticeText}>
              {realtimeError ||
                "Live updates are unavailable. Tap to reconnect."}
            </Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.state}>
            <AppLoader color="#08ad54" />
            <Text style={styles.stateText}>Loading messages...</Text>
          </View>
        ) : error && !messages.length ? (
          <View style={styles.state}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadMessages()} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.messages}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
          >
            {!messages.length ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    color="#168b4d"
                    name="chatbubble-ellipses-outline"
                    size={24}
                  />
                </View>
                <Text style={styles.emptyTitle}>A new conversation</Text>
                <Text style={styles.empty}>
                  Send a friendly hello to get things started.
                </Text>
              </View>
            ) : null}
            {messages.map((message, index) => {
              const mine = message.senderId === user?._id;
              const previous = messages[index - 1];
              const day = formatDay(message.createdAt);
              const showDay =
                !previous || formatDay(previous.createdAt) !== day;
              return (
                <View key={message._id || message.clientMessageId}>
                  {showDay && day ? (
                    <View style={styles.dayPill}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                  ) : null}
                  <View
                    style={[styles.messageRow, mine && styles.messageRowMine]}
                  >
                    {!mine ? (
                      image ? (
                        <Image
                          source={{ uri: image }}
                          style={styles.messageAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.messageAvatar,
                            styles.messageAvatarFallback,
                          ]}
                        >
                          <Text style={styles.messageAvatarInitials}>
                            {initials(name)}
                          </Text>
                        </View>
                      )
                    ) : null}
                    <View
                      style={[
                        styles.bubble,
                        mine ? styles.myBubble : styles.theirBubble,
                      ]}
                    >
                      <Text style={styles.messageText}>{message.text}</Text>
                      <Text style={styles.messageTime}>
                        {formatTime(message.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.composerSafe}>
          <View style={styles.composer}>
            <TextInput
              editable={!sending && !loading}
              multiline
              onChangeText={updateDraft}
              placeholder="Write a message..."
              placeholderTextColor="#718078"
              style={styles.input}
              value={draft}
            />
            <Pressable
              disabled={!draft.trim() || sending}
              onPress={() => void sendMessage()}
              style={[
                styles.send,
                (!draft.trim() || sending) && styles.sendDisabled,
              ]}
            >
              {sending ? (
                <AppLoader color={colors.ink} />
              ) : (
                <Ionicons color={colors.ink} name="arrow-up" size={22} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AppAlertModal
        visible={Boolean(summary)}
        title="AI conversation summary"
        message={summary ?? ""}
        confirmText="Got it"
        onClose={() => setSummary(null)}
      />
      <AppAlertModal
        visible={Boolean(error && messages.length)}
        title="Chat error"
        message={error ?? ""}
        onClose={() => setError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  realtimeNotice: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#fff4dc",
  },
  realtimeNoticeText: {
    color: "#70521a",
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  safe: { backgroundColor: "#f6faf7", flex: 1 },
  headerSafe: {
    backgroundColor: colors.white,
    borderBottomColor: "#e2eee5",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "#f1f7f3",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    marginRight: 9,
    width: 40,
  },
  avatarWrap: { height: 48, position: "relative", width: 48 },
  avatar: {
    borderColor: "#c8efd5",
    borderRadius: 24,
    borderWidth: 1.5,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "#dff4e8",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#087b43",
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  onlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: "absolute",
    right: 0,
    width: 14,
  },
  headerCopy: { flex: 1, marginLeft: 10, minWidth: 0 },
  name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 14 },
  statusLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 3,
  },
  statusDot: {
    backgroundColor: "#13c965",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  status: { color: "#688574", fontFamily: fonts.medium, fontSize: 10 },
  aiHeaderButton: {
    alignItems: "center",
    backgroundColor: "#eaf7ef",
    borderColor: "#d6efdf",
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  messages: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  dayPill: {
    alignSelf: "center",
    backgroundColor: "#eaf3ed",
    borderRadius: 16,
    marginBottom: 18,
    marginTop: 4,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  dayText: { color: "#688574", fontFamily: fonts.bold, fontSize: 10 },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  messageRowMine: { justifyContent: "flex-end" },
  messageAvatar: { borderRadius: 17, height: 34, width: 34 },
  messageAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#dff4e8",
    justifyContent: "center",
  },
  messageAvatarInitials: {
    color: "#087b43",
    fontFamily: fonts.extraBold,
    fontSize: 9,
  },
  bubble: {
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: "79%",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  theirBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    borderColor: "#e1ece4",
  },
  myBubble: {
    backgroundColor: colors.lime,
    borderBottomRightRadius: 6,
    borderColor: "#10d563",
  },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  messageTime: {
    color: "#5c806b",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 5,
    textAlign: "right",
  },
  composerSafe: {
    backgroundColor: "#f6faf7",
    borderTopColor: "#e2eee5",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderColor: "#dce9df",
    borderRadius: 29,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 7,
    padding: 5,
    shadowColor: "#174b2c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  input: {
    backgroundColor: "#f2f7f4",
    borderRadius: 24,
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 2,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 23,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendDisabled: { backgroundColor: "#e3eee6", opacity: 1 },
  state: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  stateText: { color: "#718078", fontFamily: fonts.medium, marginTop: 10 },
  errorText: {
    color: "#9c3f3f",
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  retry: {
    backgroundColor: colors.lime,
    borderRadius: 18,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: colors.ink, fontFamily: fonts.bold },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#e7faef",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 14,
  },
  empty: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
