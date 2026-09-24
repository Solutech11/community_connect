import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { aiApi } from "../../services/api/ai.api";
import { ApiError } from "../../services/api/client";
import { colors, fonts } from "../../styles/theme";
import type { PostAiEventRecommendationsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;
type RecommendedEvent =
  PostAiEventRecommendationsResponse["data"]["events"][number];
type AiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  events?: RecommendedEvent[];
};

const SUGGESTIONS = [
  "Find events near me",
  "Help me create an event",
  "Recommend communities",
  "Where are my tickets?",
];

export default function AIChatConnectedScreen({ navigation, route }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I am Community AI. I can help with events, communities, tickets, and people. What can I do for you?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(
    route.params?.sessionId,
  );
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const sendPrompt = async (prompt = draft) => {
    const text = prompt.trim();
    if (!text || thinking) return;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text },
    ]);
    setDraft("");
    setThinking(true);
    setError(null);
    try {
      if (/find|recommend/i.test(text) && /event/i.test(text)) {
        const response = await aiApi.eventRecommendations({ limit: 5 });
        const events = response.data.events;
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: events.length
              ? "These events best match your profile and location."
              : "I could not find a matching event yet. Try widening your preferences.",
            events,
          },
        ]);
      } else {
        const response = await aiApi.chat({ message: text, sessionId });
        setSessionId(response.data.sessionId);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: response.data.message,
          },
        ]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Community AI is unavailable right now.",
      );
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safe}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.header}>
            <Pressable onPress={navigation.goBack} style={styles.headerButton}>
              <Ionicons color={colors.ink} name="chevron-back" size={26} />
            </Pressable>
            <LinearGradient
              colors={[colors.lime, "#7af2aa"]}
              style={styles.aiAvatar}
            >
              <Ionicons color={colors.ink} name="sparkles" size={23} />
            </LinearGradient>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Community AI</Text>
              <Text style={styles.status}>
                {thinking ? "Thinking..." : "Ready to help"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Open AI session history"
              onPress={() => navigation.navigate("AISessions")}
              style={styles.poweredPill}
            >
              <Ionicons color="#078d45" name="time-outline" size={18} />
            </Pressable>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contextCard}>
            <Ionicons
              color="#08ad54"
              name="shield-checkmark-outline"
              size={18}
            />
            <Text style={styles.contextText}>
              AI answers can be inaccurate. Verify important event or payment
              details.
            </Text>
          </View>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === "user" && styles.userRow,
              ]}
            >
              {message.role === "assistant" ? (
                <View style={styles.smallAiAvatar}>
                  <Ionicons color={colors.ink} name="sparkles" size={15} />
                </View>
              ) : null}
              <View
                style={[
                  styles.bubble,
                  message.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
                {message.events?.map((event) => (
                  <Pressable
                    key={event._id}
                    onPress={() =>
                      navigation.navigate("EventDetails", {
                        eventId: event._id,
                      })
                    }
                    style={styles.eventRecommendation}
                  >
                    <View style={styles.eventCopy}>
                      <Text numberOfLines={1} style={styles.eventTitle}>
                        {event.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.eventMeta}>
                        {event.venueName}, {event.state}
                      </Text>
                    </View>
                    <Ionicons color="#078d45" name="arrow-forward" size={18} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          {thinking ? (
            <View style={styles.messageRow}>
              <View style={styles.smallAiAvatar}>
                <Ionicons color={colors.ink} name="sparkles" size={15} />
              </View>
              <View style={styles.assistantBubble}>
                <ActivityIndicator color="#08ad54" />
              </View>
            </View>
          ) : null}
          {messages.length === 1 ? (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  disabled={thinking}
                  onPress={() => void sendPrompt(suggestion)}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.composerSafe}>
          <View style={styles.composer}>
            <TextInput
              editable={!thinking}
              multiline
              onChangeText={setDraft}
              placeholder="Ask Community AI..."
              placeholderTextColor="#718078"
              style={styles.input}
              value={draft}
            />
            <Pressable
              disabled={!draft.trim() || thinking}
              onPress={() => void sendPrompt()}
              style={[
                styles.send,
                (!draft.trim() || thinking) && styles.sendDisabled,
              ]}
            >
              <Ionicons color={colors.ink} name="arrow-up" size={22} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <AppAlertModal
        visible={Boolean(error)}
        title="Community AI"
        message={error ?? ""}
        onClose={() => setError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  headerSafe: {
    backgroundColor: colors.white,
    borderBottomColor: "#e5eee9",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 16,
  },
  headerButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  aiAvatar: {
    alignItems: "center",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  headerCopy: { flex: 1, marginLeft: 11 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16 },
  status: {
    color: "#30935c",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  poweredPill: {
    backgroundColor: "#e8f8ef",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  poweredText: { color: "#078d45", fontFamily: fonts.extraBold, fontSize: 10 },
  messages: { flexGrow: 1, padding: 20, paddingBottom: 30 },
  contextCard: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
    padding: 12,
  },
  contextText: {
    color: "#38835a",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  userRow: { justifyContent: "flex-end" },
  smallAiAvatar: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  bubble: {
    borderRadius: 22,
    maxWidth: "80%",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 7,
    borderRadius: 22,
    padding: 12,
  },
  userBubble: { backgroundColor: "#08bd58", borderBottomRightRadius: 7 },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  eventRecommendation: {
    alignItems: "center",
    backgroundColor: "#eef9f3",
    borderRadius: 15,
    flexDirection: "row",
    marginTop: 9,
    padding: 11,
  },
  eventCopy: { flex: 1, marginRight: 8 },
  eventTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  eventMeta: {
    color: "#4f7c63",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 3,
  },
  suggestions: { gap: 9, marginLeft: 40 },
  suggestion: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderColor: "#dcebe3",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: { color: "#26784c", fontFamily: fonts.bold, fontSize: 11 },
  composerSafe: {
    backgroundColor: colors.white,
    borderTopColor: "#e5eee9",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  input: {
    backgroundColor: "#f1f7f4",
    borderRadius: 23,
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    maxHeight: 110,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendDisabled: { opacity: 0.38 },
});
