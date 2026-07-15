import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
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

import { generateCommunityAiReply } from "../../data/chat-data";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AIChat">;
type AiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SUGGESTIONS = [
  "Find events near me",
  "Help me create an event",
  "Recommend communities",
  "Where are my tickets?",
  "Review my wallet spending",
];

export default function AIChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I am Community AI. I can help you discover events, plan gatherings, find communities, manage tickets, and connect with people. What can I do for you?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendPrompt = async (prompt = draft) => {
    const text = prompt.trim();
    if (!text || thinking) {
      return;
    }

    const userMessage: AiMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text,
    };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setThinking(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd());

    const response = await generateCommunityAiReply(text);
    setMessages((current) => [
      ...current,
      {
        id: "assistant-" + Date.now(),
        role: "assistant",
        text: response,
      },
    ]);
    setThinking(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.safe}
    >
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={navigation.goBack}
            style={styles.headerButton}
          >
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
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.status}>Ready to help</Text>
            </View>
          </View>
          <View style={styles.poweredPill}>
            <Text style={styles.poweredText}>AI</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contextCard}>
          <Ionicons color="#08ad54" name="shield-checkmark-outline" size={18} />
          <Text style={styles.contextText}>
            Answers are personalized using your CommunityConnect activity.
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
            </View>
          </View>
        ))}

        {thinking ? (
          <View style={styles.messageRow}>
            <View style={styles.smallAiAvatar}>
              <Ionicons color={colors.ink} name="sparkles" size={15} />
            </View>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <View style={styles.typing}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        ) : null}

        {messages.length === 1 ? (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionLabel}>TRY ASKING</Text>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => void sendPrompt(suggestion)}
                style={styles.suggestion}
              >
                <Ionicons color="#08ad54" name="sparkles-outline" size={17} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Ionicons color="#5f8f73" name="chevron-forward" size={17} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.composerSafe}>
        <View style={styles.composer}>
          <TextInput
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => void sendPrompt()}
            placeholder="Ask Community AI anything..."
            placeholderTextColor="#718078"
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Send to Community AI"
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
        <Text style={styles.disclaimer}>
          AI may make mistakes. Check important event and payment details.
        </Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  headerSafe: {
    backgroundColor: colors.white,
    borderBottomColor: "#e6efea",
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
  headerCopy: { flex: 1, marginLeft: 10 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    backgroundColor: "#08bd58",
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  status: {
    color: "#318f59",
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  poweredPill: {
    backgroundColor: "#e9faf1",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  poweredText: {
    color: "#078f43",
    fontFamily: fonts.extraBold,
    fontSize: 11,
  },
  messages: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 28,
  },
  contextCard: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  contextText: {
    color: "#328b59",
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
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
    borderRadius: 23,
    maxWidth: "82%",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 7,
  },
  userBubble: {
    backgroundColor: "#08bd58",
    borderBottomRightRadius: 7,
  },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  typing: { flexDirection: "row", gap: 5, paddingVertical: 4 },
  typingDot: {
    backgroundColor: "#61a47d",
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  suggestions: { gap: 9, marginTop: 4 },
  suggestionLabel: {
    color: "#698077",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 2,
    marginLeft: 3,
  },
  suggestion: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#dfede5",
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  suggestionText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  composerSafe: {
    backgroundColor: colors.white,
    borderTopColor: "#e4ede8",
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
    borderRadius: 24,
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    maxHeight: 115,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sendDisabled: { opacity: 0.4 },
  disclaimer: {
    color: "#839189",
    fontFamily: fonts.medium,
    fontSize: 9,
    paddingBottom: 2,
    paddingTop: 8,
    textAlign: "center",
  },
});
