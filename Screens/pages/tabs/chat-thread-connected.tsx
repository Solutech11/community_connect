import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import AppAlertModal from "../../components/ui/app-alert-modal";
import { useAuth } from "../../hooks/use-auth";
import { aiApi } from "../../services/api/ai.api";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { chatApi } from "../../services/api/chat.api";
import { chatSocket, type RealtimeMessage } from "../../services/socket/chat-socket";
import type { GetChatConversationsIdMessagesResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";
import { colors, fonts } from "../../styles/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ChatThread">;
type Message = GetChatConversationsIdMessagesResponse["data"]["messages"][number];

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
    : new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default function ChatThreadConnectedScreen({ navigation, route }: Props) {
  const { conversationId, image, name, online } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationLoaded = useRef(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chatApi.messages(conversationId, { limit: 50 });
      setMessages(response.data.messages);
      await chatApi.markRead(conversationId);
      conversationLoaded.current = true;
      chatSocket.join(conversationId);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load this conversation.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
    const socket = chatSocket.current();
    const joinAfterLoad = () => { if (conversationLoaded.current) chatSocket.join(conversationId); };
    const onConnect = joinAfterLoad;
    const onReady = joinAfterLoad;
    const onMessage = (message: RealtimeMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => mergeMessages(current, [message]));
      void chatApi.markRead(conversationId).catch(() => undefined);
    };
    const onTypingStart = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === conversationId && payload.userId !== user?._id) setTyping(true);
    };
    const onTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === conversationId && payload.userId !== user?._id) setTyping(false);
    };
    const onTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId === conversationId && payload.userId !== user?._id) setTyping(payload.isTyping);
    };
    const onRead = (payload: { conversationId: string; userId: string; readAt: string }) => {
      if (payload.conversationId === conversationId && payload.userId !== user?._id) setReadAt(payload.readAt);
    };
    socket?.on("connect", onConnect);
    socket?.on("socket:ready", onReady);
    socket?.on("typing", onTyping);
    socket?.on("conversation:read", onRead);
    socket?.on("message:new", onMessage);
    socket?.on("typing:start", onTypingStart);
    socket?.on("typing:stop", onTypingStop);
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      conversationLoaded.current = false;
      chatSocket.stopTyping(conversationId);
      chatSocket.leave(conversationId);
      socket?.off("connect", onConnect);
      socket?.off("socket:ready", onReady);
      socket?.off("typing", onTyping);
      socket?.off("conversation:read", onRead);
      socket?.off("message:new", onMessage);
      socket?.off("typing:start", onTypingStart);
      socket?.off("typing:stop", onTypingStop);
    };
  }, [conversationId, loadMessages, user?._id]);

  const updateDraft = (value: string) => {
    setDraft(value);
    chatSocket.startTyping(conversationId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => chatSocket.stopTyping(conversationId), 900);
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
      setError(requestError instanceof ApiError ? requestError.message : "Unable to send the message.");
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
      setError(requestError instanceof ApiError ? requestError.message : "Unable to summarize this conversation.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.safe}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.header}>
            <Pressable onPress={navigation.goBack} style={styles.headerButton}>
              <Ionicons color={colors.ink} name="chevron-back" size={26} />
            </Pressable>
            <Image source={{ uri: image }} style={styles.avatar} />
            <View style={styles.headerCopy}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.status}>{typing ? "Typing..." : readAt ? "Read receipt updated" : online ? "Online" : "Conversation"}</Text>
            </View>
            <Pressable disabled={summarizing} onPress={() => void summarize()} style={styles.aiHeaderButton}>
              {summarizing ? <ActivityIndicator color="#08ad54" /> : <Ionicons color="#08ad54" name="sparkles" size={21} />}
            </Pressable>
          </View>
        </SafeAreaView>

        {loading ? (
          <View style={styles.state}><ActivityIndicator color="#08ad54" /><Text style={styles.stateText}>Loading messages...</Text></View>
        ) : error && !messages.length ? (
          <View style={styles.state}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void loadMessages()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
          >
            {!messages.length ? <Text style={styles.empty}>Start the conversation with a friendly message.</Text> : null}
            {messages.map((message) => {
              const mine = message.senderId === user?._id;
              return (
                <View key={message._id || message.clientMessageId} style={[styles.messageRow, mine && styles.messageRowMine]}>
                  {!mine ? <Image source={{ uri: image }} style={styles.messageAvatar} /> : null}
                  <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={styles.messageText}>{message.text}</Text>
                    <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        <SafeAreaView edges={["bottom"]} style={styles.composerSafe}>
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
            <Pressable disabled={!draft.trim() || sending} onPress={() => void sendMessage()} style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}>
              {sending ? <ActivityIndicator color={colors.ink} /> : <Ionicons color={colors.ink} name="arrow-up" size={22} />}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <AppAlertModal visible={Boolean(summary)} title="AI conversation summary" message={summary ?? ""} confirmText="Got it" onClose={() => setSummary(null)} />
      <AppAlertModal visible={Boolean(error && messages.length)} title="Chat error" message={error ?? ""} onClose={() => setError(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  headerSafe: { backgroundColor: colors.white, borderBottomColor: "#e6efea", borderBottomWidth: StyleSheet.hairlineWidth },
  header: { alignItems: "center", flexDirection: "row", minHeight: 70, paddingHorizontal: 16 },
  headerButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  avatar: { borderRadius: 23, height: 46, width: 46 },
  headerCopy: { flex: 1, marginLeft: 11 },
  name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 },
  status: { color: "#30935c", fontFamily: fonts.medium, fontSize: 11, marginTop: 2 },
  aiHeaderButton: { alignItems: "center", backgroundColor: "#e9faf1", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  messages: { flexGrow: 1, padding: 20, paddingBottom: 30 },
  messageRow: { alignItems: "flex-end", flexDirection: "row", gap: 8, marginBottom: 16 },
  messageRowMine: { justifyContent: "flex-end" },
  messageAvatar: { borderRadius: 16, height: 32, width: 32 },
  bubble: { borderRadius: 22, maxWidth: "78%", paddingHorizontal: 15, paddingVertical: 12 },
  theirBubble: { backgroundColor: colors.white, borderBottomLeftRadius: 7 },
  myBubble: { backgroundColor: "#08bd58", borderBottomRightRadius: 7 },
  messageText: { color: colors.ink, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  messageTime: { color: "#416c56", fontFamily: fonts.medium, fontSize: 9, marginTop: 5, textAlign: "right" },
  composerSafe: { backgroundColor: colors.white, borderTopColor: "#e6efea", borderTopWidth: StyleSheet.hairlineWidth },
  composer: { alignItems: "flex-end", flexDirection: "row", gap: 9, paddingHorizontal: 16, paddingTop: 12 },
  input: { backgroundColor: "#f1f7f4", borderRadius: 23, color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, maxHeight: 110, minHeight: 46, paddingHorizontal: 16, paddingVertical: 12 },
  send: { alignItems: "center", backgroundColor: "#08bd58", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  sendDisabled: { opacity: 0.38 },
  state: { alignItems: "center", flex: 1, justifyContent: "center", padding: 30 },
  stateText: { color: "#718078", fontFamily: fonts.medium, marginTop: 10 },
  errorText: { color: "#9c3f3f", fontFamily: fonts.medium, textAlign: "center" },
  retry: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 14, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.ink, fontFamily: fonts.bold },
  empty: { color: "#718078", fontFamily: fonts.medium, marginTop: 40, textAlign: "center" },
});
