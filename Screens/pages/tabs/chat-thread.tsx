import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useRef, useState } from "react";
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

import AppAlertModal from "../../components/ui/app-alert-modal";
import { INITIAL_MESSAGES, type ChatMessage } from "../../data/chat-data";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ChatThread">;

function currentTime() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

export default function ChatThreadScreen({ navigation, route }: Props) {
  const { conversationId, image, name, online } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_MESSAGES[conversationId] ?? [],
  );
  const [draft, setDraft] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const summary = useMemo(() => {
    if (!messages.length) {
      return "This conversation has just started.";
    }
    return (
      "You and " +
      name +
      " are discussing community plans and an upcoming event. The next useful step is to confirm attendance and share any required ticket details."
    );
  }, [messages.length, name]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setMessages((current) => [
      ...current,
      {
        id: "message-" + Date.now(),
        mine: true,
        text,
        time: currentTime(),
      },
    ]);
    setDraft("");
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd());
  };

  return (
    <>
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
            <View>
              <Image source={{ uri: image }} style={styles.avatar} />
              {online ? <View style={styles.onlineDot} /> : null}
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.status}>
                {online ? "Online" : "Active recently"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Summarize conversation with AI"
              onPress={() => setShowSummary(true)}
              style={styles.aiHeaderButton}
            >
              <Ionicons color="#08ad54" name="sparkles" size={21} />
            </Pressable>
          </View>
        </SafeAreaView>

        <View style={styles.aiHint}>
          <Ionicons color="#08ad54" name="sparkles" size={16} />
          <Text style={styles.aiHintText}>
            AI can summarize this chat or help write your reply.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.day}>TODAY</Text>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.messageRow, message.mine && styles.messageRowMine]}
            >
              {!message.mine ? (
                <Image source={{ uri: image }} style={styles.messageAvatar} />
              ) : null}
              <View
                style={[
                  styles.bubble,
                  message.mine ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.mine && styles.myMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.mine && styles.myMessageTime,
                  ]}
                >
                  {message.time}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.composerSafe}>
          <View style={styles.composer}>
            <Pressable
              accessibilityLabel="Ask AI to help write"
              onPress={() => navigation.navigate("AIChat")}
              style={styles.composerAi}
            >
              <Ionicons color={colors.ink} name="sparkles" size={19} />
            </Pressable>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Write a message..."
              placeholderTextColor="#718078"
              style={styles.input}
              value={draft}
            />
            <Pressable
              accessibilityLabel="Send message"
              disabled={!draft.trim()}
              onPress={sendMessage}
              style={[styles.send, !draft.trim() && styles.sendDisabled]}
            >
              <Ionicons color={colors.ink} name="arrow-up" size={22} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <AppAlertModal
        confirmText="Got it"
        message={summary}
        onClose={() => setShowSummary(false)}
        title="AI conversation summary"
        visible={showSummary}
      />
    </>
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
    minHeight: 70,
    paddingHorizontal: 16,
  },
  headerButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatar: { borderRadius: 23, height: 46, width: 46 },
  onlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 2,
    bottom: 0,
    height: 12,
    position: "absolute",
    right: 0,
    width: 12,
  },
  headerCopy: { flex: 1, marginLeft: 11 },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  status: {
    color: "#30935c",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  aiHeaderButton: {
    alignItems: "center",
    backgroundColor: "#e9faf1",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  aiHint: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 17,
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  aiHintText: {
    color: "#328b59",
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  messages: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 30,
  },
  day: {
    color: "#789087",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    marginBottom: 22,
    textAlign: "center",
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  messageRowMine: { justifyContent: "flex-end" },
  messageAvatar: { borderRadius: 16, height: 32, width: 32 },
  bubble: {
    borderRadius: 22,
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  theirBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 7,
  },
  myBubble: {
    backgroundColor: "#08bd58",
    borderBottomRightRadius: 7,
  },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: { color: colors.ink },
  messageTime: {
    color: "#829087",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 5,
  },
  myMessageTime: { color: "#165e39", textAlign: "right" },
  composerSafe: {
    backgroundColor: colors.white,
    borderTopColor: "#e6efea",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  composerAi: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
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
    backgroundColor: "#08bd58",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sendDisabled: { opacity: 0.38 },
});
