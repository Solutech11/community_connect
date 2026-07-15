import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
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

import { CHAT_CONVERSATIONS } from "../../data/chat-data";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type ChatFilter = "All" | "Unread";

export default function ChatScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ChatFilter>("All");

  const visibleConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CHAT_CONVERSATIONS.filter((conversation) => {
      const matchesFilter = filter === "All" || conversation.unread > 0;
      const matchesQuery = [conversation.name, conversation.preview]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const openConversation = (
    conversation: (typeof CHAT_CONVERSATIONS)[number],
  ) =>
    navigation.navigate("ChatThread", {
      conversationId: conversation.id,
      image: conversation.image,
      name: conversation.name,
      online: conversation.online,
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={styles.safe}
    >
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>COMMUNITYCONNECT</Text>
            <Text style={styles.title}>Messages</Text>
          </View>
          <Pressable
            accessibilityLabel="Find people to message"
            onPress={() => navigation.navigate("Friends")}
            style={styles.headerButton}
          >
            <Ionicons color={colors.ink} name="create-outline" size={23} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#09291d", "#0c5634", "#08b657"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.aiCard}
          >
            <View style={styles.aiTop}>
              <View style={styles.aiOrb}>
                <Ionicons color={colors.ink} name="sparkles" size={25} />
              </View>
              <View style={styles.aiStatus}>
                <View style={styles.aiStatusDot} />
                <Text style={styles.aiStatusText}>AI ONLINE</Text>
              </View>
            </View>
            <Text style={styles.aiTitle}>Meet Community AI</Text>
            <Text style={styles.aiCopy}>
              Discover events, plan gatherings, find people, and get instant
              help across the app.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("AIChat")}
              style={styles.aiButton}
            >
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
            {query ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons color="#7c8c84" name="close-circle" size={20} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Online now</Text>
            <Text style={styles.smartLabel}>
              <Ionicons color="#08ad54" name="sparkles" size={12} /> Smart
              matches
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.onlineList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {CHAT_CONVERSATIONS.filter((item) => item.online).map((person) => (
              <Pressable
                key={person.id}
                onPress={() => openConversation(person)}
                style={styles.onlinePerson}
              >
                <View>
                  <Image
                    source={{ uri: person.image }}
                    style={styles.onlineImage}
                  />
                  <View style={styles.onlineDot} />
                </View>
                <Text numberOfLines={1} style={styles.onlineName}>
                  {person.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => navigation.navigate("Friends")}
              style={styles.findPeople}
            >
              <Ionicons color="#08ad54" name="person-add-outline" size={23} />
              <Text style={styles.findPeopleText}>Find people</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.conversationHeading}>
            <Text style={styles.sectionTitle}>Conversations</Text>
            <View style={styles.filters}>
              {(["All", "Unread"] as ChatFilter[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filter,
                    filter === item && styles.filterActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === item && styles.filterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.conversations}>
            {visibleConversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                onPress={() => openConversation(conversation)}
                style={({ pressed }) => [
                  styles.conversation,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <Image
                    source={{ uri: conversation.image }}
                    style={styles.avatar}
                  />
                  {conversation.online ? (
                    <View style={styles.avatarDot} />
                  ) : null}
                </View>
                <View style={styles.conversationBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{conversation.name}</Text>
                    <Text style={styles.time}>{conversation.time}</Text>
                  </View>
                  {conversation.community ? (
                    <Text style={styles.community}>
                      {conversation.community}
                    </Text>
                  ) : null}
                  <View style={styles.previewRow}>
                    <Text numberOfLines={1} style={styles.preview}>
                      {conversation.preview}
                    </Text>
                    {conversation.unread ? (
                      <View style={styles.unread}>
                        <Text style={styles.unreadText}>
                          {conversation.unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {!visibleConversations.length ? (
            <View style={styles.empty}>
              <Ionicons color="#70a888" name="chatbubbles-outline" size={38} />
              <Text style={styles.emptyTitle}>No conversations found</Text>
              <Text style={styles.emptyCopy}>
                Try another search or view all conversations.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eyebrow: {
    color: "#2e9660",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 30,
    marginTop: 2,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  content: { padding: 24, paddingBottom: 135 },
  aiCard: {
    borderRadius: 30,
    minHeight: 220,
    overflow: "hidden",
    padding: 22,
  },
  aiTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  aiOrb: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  aiStatus: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.13)",
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiStatusDot: {
    backgroundColor: colors.lime,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  aiStatusText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  aiTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 20,
  },
  aiCopy: {
    color: "#d8f9e5",
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 315,
  },
  aiButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    borderRadius: 22,
    flexDirection: "row",
    gap: 8,
    marginTop: 17,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  aiButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: "row",
    marginTop: 22,
    minHeight: 56,
    paddingHorizontal: 17,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingHorizontal: 11,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  smartLabel: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  onlineList: { gap: 17, paddingTop: 17 },
  onlinePerson: { alignItems: "center", width: 62 },
  onlineImage: { borderRadius: 27, height: 54, width: 54 },
  onlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.paper,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: "absolute",
    right: 2,
    width: 14,
  },
  onlineName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 6,
  },
  findPeople: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    width: 92,
  },
  findPeopleText: {
    color: "#13894a",
    fontFamily: fonts.bold,
    fontSize: 9,
    marginTop: 2,
  },
  conversationHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  filters: {
    backgroundColor: "#e9f4ee",
    borderRadius: 17,
    flexDirection: "row",
    padding: 3,
  },
  filter: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterActive: { backgroundColor: colors.white },
  filterText: {
    color: "#57906f",
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  filterTextActive: { color: colors.ink },
  conversations: { gap: 12, marginTop: 16 },
  conversation: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 27,
    flexDirection: "row",
    minHeight: 84,
    padding: 13,
  },
  pressed: { opacity: 0.72 },
  avatar: { borderRadius: 27, height: 54, width: 54 },
  avatarDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 1,
    height: 14,
    position: "absolute",
    right: 1,
    width: 14,
  },
  conversationBody: { flex: 1, marginLeft: 12 },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 14,
  },
  time: {
    color: "#799086",
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  community: {
    color: "#08a84f",
    fontFamily: fonts.bold,
    fontSize: 9,
    marginTop: 2,
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 4,
  },
  preview: {
    color: "#64766d",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  unread: {
    alignItems: "center",
    backgroundColor: "#08bd58",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    marginLeft: 8,
    minWidth: 20,
  },
  unreadText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    marginTop: 18,
    padding: 28,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    marginTop: 10,
  },
  emptyCopy: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});
