import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
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
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { chatApi } from "../../services/api/chat.api";
import type { GetChatConversationsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";
import { colors, fonts } from "../../styles/theme";

type Conversation = GetChatConversationsResponse["data"]["conversations"][number];

function otherParticipant(conversation: Conversation, currentUserId?: string) {
  return conversation.participants.find(
    (participant) => participant._id !== currentUserId,
  );
}

function conversationLabel(conversation: Conversation, currentUserId?: string) {
  if (conversation.title) return conversation.title;
  if (conversation.type === "group") return "Group conversation";

  const participant = otherParticipant(conversation, currentUserId);
  const fullName = [participant?.firstName, participant?.lastName]
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;

  const participantId = conversation.participantIds.find(
    (id) => id !== currentUserId,
  );
  return participantId
    ? `Member ${participantId.slice(-6).toUpperCase()}`
    : "Community conversation";
}

function conversationAvatar(conversation: Conversation, currentUserId?: string) {
  if (conversation.type === "group") return "";
  return otherParticipant(conversation, currentUserId)?.avatarUrl ?? "";
}

function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function previewText(conversation: Conversation, currentUserId?: string) {
  const preview = conversation.lastMessagePreview;
  if (!preview) return "Start a conversation";

  let message = preview.text?.trim();
  if (preview.type === "image") message = "Shared a photo";
  else if (!message) message = "Shared a message";

  return preview.senderId === currentUserId ? `You: ${message}` : message;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function ChatConnectedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await chatApi.conversations();
      setConversations(response.data.conversations);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load conversations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) =>
      conversationLabel(conversation, user?._id).toLowerCase().includes(normalized),
    );
  }, [conversations, query, user?._id]);

  const openConversation = (conversation: Conversation) => {
    navigation.navigate("ChatThread", {
      conversationId: conversation._id,
      image: conversationAvatar(conversation, user?._id),
      name: conversationLabel(conversation, user?._id),
      online: false,
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Catch up with your people</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Friends")} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="create-outline" size={23} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["#0b3927", "#0c5634", "#087b43"]} style={styles.aiCard}>
          <View style={styles.aiOrb}>
            <Ionicons color={colors.ink} name="sparkles" size={20} />
          </View>
          <View style={styles.aiCopyWrap}>
            <Text style={styles.aiTitle}>A little help, anytime</Text>
            <Text numberOfLines={1} style={styles.aiCopy}>Plan events and find ideas with Community AI</Text>
          </View>
          <Pressable accessibilityLabel="Ask Community AI" onPress={() => navigation.navigate("AIChat")} style={styles.aiButton}>
            <Ionicons color={colors.ink} name="arrow-forward" size={19} />
          </Pressable>
        </LinearGradient>

        <View style={styles.search}>
          <Ionicons color="#32965d" name="search" size={21} />
          <TextInput
            onChangeText={setQuery}
            placeholder="Search conversations"
            placeholderTextColor="#718078"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent conversations</Text>
          {!loading && visibleConversations.length ? (
            <Text style={styles.conversationCount}>{visibleConversations.length}</Text>
          ) : null}
        </View>
        {loading ? (
          <View style={styles.state}><AppLoader color="#08ad54" /><Text style={styles.stateCopy}>Loading conversations...</Text></View>
        ) : error ? (
          <View style={styles.state}>
            <Ionicons color="#b54d4d" name="cloud-offline-outline" size={34} />
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        ) : visibleConversations.length ? (
          <View style={styles.conversations}>
            {visibleConversations.map((conversation) => (
              <Pressable key={conversation._id} onPress={() => openConversation(conversation)} style={styles.conversation}>
                <View style={styles.avatarWrap}>
                  {conversationAvatar(conversation, user?._id) ? (
                    <Image source={{ uri: conversationAvatar(conversation, user?._id) }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>{initials(conversationLabel(conversation, user?._id))}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.conversationBody}>
                  <Text style={styles.name}>{conversationLabel(conversation, user?._id)}</Text>
                  <Text numberOfLines={1} style={styles.preview}>
                    {previewText(conversation, user?._id)}
                  </Text>
                </View>
                <View style={styles.conversationMeta}>
                  <Text style={styles.time}>{formatTime(conversation.lastMessageAt)}</Text>
                  {conversation.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.state}>
            <Ionicons color="#70a888" name="chatbubbles-outline" size={38} />
            <Text style={styles.emptyTitle}>{query ? "No conversations found" : "No conversations yet"}</Text>
            <Text style={styles.stateCopy}>Find a friend to start a secure conversation.</Text>
            <Pressable onPress={() => navigation.navigate("Friends")} style={styles.retry}><Text style={styles.retryText}>Find people</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 8, paddingBottom: 15 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 29, letterSpacing: -0.7 },
  subtitle: { color: "#718078", fontFamily: fonts.medium, fontSize: 12, marginTop: 1 },
  headerButton: { alignItems: "center", backgroundColor: colors.white, borderColor: "#e5eee8", borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, height: 46, justifyContent: "center", width: 46 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 135 },
  aiCard: { alignItems: "center", borderRadius: 22, flexDirection: "row", gap: 12, marginBottom: 21, minHeight: 80, paddingHorizontal: 14, paddingVertical: 12 },
  aiOrb: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  aiCopyWrap: { flex: 1, minWidth: 0 },
  aiTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 14 },
  aiCopy: { color: "#c9e7d6", fontFamily: fonts.medium, fontSize: 10, marginTop: 3 },
  aiButton: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  search: { alignItems: "center", backgroundColor: colors.white, borderColor: "#e5eee8", borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, marginBottom: 23, paddingHorizontal: 15 },
  searchInput: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, height: 50 },
  sectionHeading: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17 },
  conversationCount: { backgroundColor: "#e8f5ec", borderRadius: 10, color: "#368457", fontFamily: fonts.bold, fontSize: 10, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  conversations: { gap: 9 },
  conversation: { alignItems: "center", backgroundColor: colors.white, borderColor: "#e6eee8", borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 78, paddingHorizontal: 12, paddingVertical: 11 },
  avatarWrap: { height: 52, position: "relative", width: 52 },
  avatar: { borderColor: "#d7eddf", borderRadius: 26, borderWidth: 1, height: 52, width: 52 },
  avatarFallback: { alignItems: "center", backgroundColor: "#e6f8ed", justifyContent: "center" },
  avatarInitials: { color: "#087b43", fontFamily: fonts.extraBold, fontSize: 14 },
  conversationBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  preview: { color: "#718078", fontFamily: fonts.medium, fontSize: 11, marginTop: 5 },
  conversationMeta: { alignItems: "flex-end", justifyContent: "center", marginLeft: 7, minWidth: 47 },
  time: { color: "#7b8d84", fontFamily: fonts.medium, fontSize: 9, textAlign: "right" },
  unreadBadge: { alignItems: "center", backgroundColor: "#0bae53", borderRadius: 10, justifyContent: "center", marginTop: 6, minWidth: 19, paddingHorizontal: 5, paddingVertical: 2 },
  unreadText: { color: colors.white, fontFamily: fonts.bold, fontSize: 9 },
  state: { alignItems: "center", backgroundColor: colors.white, borderRadius: 22, padding: 28 },
  stateCopy: { color: "#718078", fontFamily: fonts.medium, fontSize: 12, marginTop: 9, textAlign: "center" },
  error: { color: "#9c3f3f", fontFamily: fonts.medium, fontSize: 12, marginTop: 9, textAlign: "center" },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16, marginTop: 10 },
  retry: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 14, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
