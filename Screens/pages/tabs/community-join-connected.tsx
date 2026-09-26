import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityJoin">;
type JoinMethod = "accessCode" | "inviteToken" | "request";

function extractCommunityId(input: string) {
  return (
    input.match(/(?:^|[^a-fA-F0-9])([a-fA-F0-9]{24})(?:$|[^a-fA-F0-9])/)?.[1] ??
    null
  );
}

export default function CommunityJoinConnectedScreen({
  navigation,
  route,
}: Props) {
  const [communityInput, setCommunityInput] = useState(
    route.params?.communityId ?? "",
  );
  const [method, setMethod] = useState<JoinMethod>("accessCode");
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const join = async () => {
    if (submitting) return;
    const id = extractCommunityId(communityInput.trim());
    if (!id) {
      setNotice({
        title: "Community ID needed",
        message:
          "Paste a 24-character community ID or a shared link containing one.",
      });
      return;
    }
    if (method === "accessCode" && credential.trim().length < 4) {
      setNotice({
        title: "Access code needed",
        message: "Enter the code shared by the community owner.",
      });
      return;
    }
    if (method === "inviteToken" && credential.trim().length < 8) {
      setNotice({
        title: "Invite token needed",
        message: "Enter the invite token shared with you.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await communitiesApi.createJoinRequest(id, {
        ...(method === "accessCode" ? { accessCode: credential.trim() } : {}),
        ...(method === "inviteToken" ? { inviteToken: credential.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      if ("membership" in response.data) {
        navigation.replace("CommunityProfile", { communityId: id });
      } else if ("joinRequest" in response.data) {
        setPendingId(id);
        setNotice({ title: "Request sent", message: response.message });
      } else {
        setNotice({
          title: "Join response unclear",
          message: "Check your membership before trying again.",
        });
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "COMMUNITY_JOIN_REQUEST_EXISTS"
      ) {
        setPendingId(id);
      }
      setNotice({
        title:
          error instanceof ApiError &&
          error.code === "COMMUNITY_JOIN_REQUEST_EXISTS"
            ? "Request already pending"
            : "Unable to join",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async () => {
    if (!pendingId || submitting) return;
    setSubmitting(true);
    try {
      await communitiesApi.cancelMyJoinRequest(pendingId);
      setPendingId(null);
      setNotice({
        title: "Request cancelled",
        message: "You can request to join again later.",
      });
    } catch (error) {
      setNotice({
        title: "Unable to cancel",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Join Community" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.icon}>
            <Ionicons name="lock-closed-outline" color="#078d45" size={30} />
          </View>
          <Text style={styles.title}>Join with a code or invite</Text>
          <Text style={styles.help}>
            Ask the owner for the community ID and an access code or invite
            token.
          </Text>
          <Text style={styles.label}>Community ID or shared link</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setCommunityInput}
            placeholder="Paste community ID or link"
            placeholderTextColor="#718078"
            style={styles.input}
            value={communityInput}
          />
          <Text style={styles.label}>How were you invited?</Text>
          <View style={styles.methods}>
            {(
              [
                ["accessCode", "Access code"],
                ["inviteToken", "Invite token"],
                ["request", "Request access"],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => {
                  setMethod(value);
                  setCredential("");
                }}
                style={[styles.method, method === value && styles.methodActive]}
              >
                <Text style={styles.methodText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {method !== "request" ? (
            <>
              <Text style={styles.label}>
                {method === "accessCode" ? "Access code" : "Invite token"}
              </Text>
              <TextInput
                autoCapitalize={method === "accessCode" ? "characters" : "none"}
                autoCorrect={false}
                onChangeText={setCredential}
                placeholder={
                  method === "accessCode"
                    ? "Enter access code"
                    : "Enter invite token"
                }
                placeholderTextColor="#718078"
                style={styles.input}
                value={credential}
              />
            </>
          ) : null}
          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            multiline
            maxLength={500}
            onChangeText={setMessage}
            placeholder="Introduce yourself to the moderators"
            placeholderTextColor="#718078"
            style={[styles.input, styles.messageInput]}
            value={message}
          />
          {pendingId ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>
                Your request is awaiting review.
              </Text>
              <Pressable
                disabled={submitting}
                onPress={() => void cancelRequest()}
              >
                <Text style={styles.cancelText}>Cancel request</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              disabled={submitting}
              onPress={() => void join()}
              style={[styles.primary, submitting && styles.disabled]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Text style={styles.primaryText}>
                  {method === "request" ? "Request to join" : "Join community"}
                </Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(notice)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 24, paddingBottom: 90 },
  icon: {
    alignItems: "center",
    backgroundColor: "#e7f6ee",
    borderRadius: 24,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 20,
  },
  help: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 22,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: "#dbece3",
    borderRadius: 17,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fonts.medium,
    minHeight: 54,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  messageInput: { minHeight: 90, textAlignVertical: "top" },
  methods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  method: {
    backgroundColor: colors.white,
    borderColor: "#dbece3",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  methodActive: { backgroundColor: "#e7f6ee", borderColor: "#08b657" },
  methodText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  primary: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 54,
    justifyContent: "center",
    marginTop: 28,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 },
  disabled: { opacity: 0.55 },
  pending: {
    backgroundColor: "#e7f6ee",
    borderRadius: 18,
    marginTop: 26,
    padding: 18,
  },
  pendingText: { color: colors.ink, fontFamily: fonts.bold },
  cancelText: { color: "#087b42", fontFamily: fonts.bold, marginTop: 10 },
});
