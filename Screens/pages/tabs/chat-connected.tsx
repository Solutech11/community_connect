import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { chatApi } from "../../services/api/chat.api";
import type { GetChatConversationsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";
import { colors, fonts } from "../../styles/theme";

type Conversation = GetChatConversationsResponse["data"]["conversations"][number];

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80";

function conversationLabel(conversation: Conversation, currentUserId?: string) {
  if (conversation.title) return conversation.title;
  const otherParticipant = conversation.participantIds.find((id) => id !== currentUserId);
  return otherParticipant ? `Member ${otherParticipant.slice(-6).toUpperCase()}` : "Community conversation";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
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
      image: FALLBACK_AVATAR,
      name: conversationLabel(conversation, user?._id),
      online: false,
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>COMMUNITYCONNECT</Text>
          <Text style={styles.title}>Messages</Text>
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
        <LinearGradient colors={["#09291d", "#0c5634", "#08b657"]} style={styles.aiCard}>
          <View style={styles.aiOrb}>
            <Ionicons color={colors.ink} name="sparkles" size={25} />
          </View>
          <Text style={styles.aiTitle}>Meet Community AI</Text>
          <Text style={styles.aiCopy}>Discover events, plan gatherings, and get instant help across the app.</Text>
          <Pressable onPress={() => navigation.navigate("AIChat")} style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Ask Community AI</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={20} />
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

        <Text style={styles.sectionTitle}>Conversations</Text>
        {loading ? (
          <View style={styles.state}><ActivityIndicator color="#08ad54" /><Text style={styles.stateCopy}>Loading conversations...</Text></View>
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
                <Image source={{ uri: FALLBACK_AVATAR }} style={styles.avatar} />
                <View style={styles.conversationBody}>
                  <Text style={styles.name}>{conversationLabel(conversation, user?._id)}</Text>
                  <Text numberOfLines={1} style={styles.preview}>
                    {conversation.type === "group" ? "Group conversation" : "Open conversation"}
                  </Text>
                </View>
                <Text style={styles.time}>{formatTime(conversation.lastMessageAt)}</Text>
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
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12 },
  eyebrow: { color: "#2e9660", fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.1 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 30, marginTop: 2 },
  headerButton: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  content: { padding: 24, paddingBottom: 135 },
  aiCard: { borderRadius: 28, marginBottom: 20, padding: 22 },
  aiOrb: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 23, height: 46, justifyContent: "center", marginBottom: 18, width: 46 },
  aiTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 23 },
  aiCopy: { color: "#c9e7d6", fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, marginTop: 7 },
  aiButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.lime, borderRadius: 22, flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 16, paddingVertical: 11 },
  aiButtonText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  search: { alignItems: "center", backgroundColor: colors.white, borderRadius: 20, flexDirection: "row", gap: 10, marginBottom: 22, paddingHorizontal: 15 },
  searchInput: { color: colors.ink, flex: 1, fontFamily: fonts.medium, fontSize: 14, height: 50 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginBottom: 12 },
  conversations: { gap: 10 },
  conversation: { alignItems: "center", backgroundColor: colors.white, borderRadius: 20, flexDirection: "row", padding: 13 },
  avatar: { borderRadius: 25, height: 50, width: 50 },
  conversationBody: { flex: 1, marginLeft: 12 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14 },
  preview: { color: "#718078", fontFamily: fonts.medium, fontSize: 12, marginTop: 5 },
  time: { color: "#7b8d84", fontFamily: fonts.medium, fontSize: 9, marginLeft: 8, maxWidth: 75, textAlign: "right" },
  state: { alignItems: "center", backgroundColor: colors.white, borderRadius: 22, padding: 28 },
  stateCopy: { color: "#718078", fontFamily: fonts.medium, fontSize: 12, marginTop: 9, textAlign: "center" },
  error: { color: "#9c3f3f", fontFamily: fonts.medium, fontSize: 12, marginTop: 9, textAlign: "center" },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16, marginTop: 10 },
  retry: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 14, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
