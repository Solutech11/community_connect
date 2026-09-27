import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import PaystackCheckoutModal, {
  type PaystackVerificationResult,
} from "../../components/ui/paystack-checkout-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetUsersMeCommunityJoinRequestsResponse,
  PostCommunitiesResolveCodeResponse,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityJoin">;
type JoinMethod = "accessCode" | "inviteToken" | "request";
type PendingRequest =
  GetUsersMeCommunityJoinRequestsResponse["data"]["joinRequests"][number];
type ResolvedCommunity =
  PostCommunitiesResolveCodeResponse["data"]["community"];

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
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState(false);
  const [resolvedCommunity, setResolvedCommunity] =
    useState<ResolvedCommunity | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentCommunityId, setPaymentCommunityId] = useState<string | null>(
    null,
  );
  const paymentKey = useRef(createIdempotencyKey());
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const loadPending = useCallback(async (signal?: AbortSignal) => {
    setLoadingPending(true);
    try {
      const requests = await communitiesApi.allMyJoinRequests(signal);
      setPendingRequests(requests);
      setPendingError(false);
    } catch (error) {
      if (error instanceof ApiError && error.code === "REQUEST_CANCELLED")
        return;
      setPendingError(true);
      setNotice({
        title: "Requests unavailable",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to load your join requests.",
      });
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadPending(controller.signal);
    return () => controller.abort();
  }, [loadPending]);

  useEffect(() => {
    const id = extractCommunityId(communityInput);
    setPendingId(
      id && pendingRequests.some((item) => item.communityId?._id === id)
        ? id
        : null,
    );
  }, [communityInput, pendingRequests]);

  const startCheckout = async (id: string) => {
    const response = await communitiesApi.createMembershipOrder(
      id,
      paymentKey.current,
    );
    setPaymentCommunityId(id);
    setOrderNumber(response.data.order.orderNumber);
    setCheckoutUrl(response.data.checkoutUrl);
    setCheckoutVisible(true);
  };

  const verifyMembershipPayment =
    async (): Promise<PaystackVerificationResult> => {
      if (!paymentCommunityId || !orderNumber) {
        return {
          verified: false,
          message: "No membership payment is ready to verify.",
        };
      }
      try {
        const response =
          await communitiesApi.verifyMembershipOrder(orderNumber);
        if (response.data.order.status !== "paid") {
          return {
            verified: false,
            message: "The backend has not confirmed this payment yet.",
          };
        }
        paymentKey.current = createIdempotencyKey();
        setCheckoutVisible(false);
        navigation.replace("CommunityProfile", {
          communityId: paymentCommunityId,
        });
        return { verified: true };
      } catch (error) {
        return {
          verified: false,
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to verify this payment.",
        };
      }
    };

  const join = async () => {
    if (submitting) return;
    const id = extractCommunityId(communityInput.trim());
    if (orderNumber && checkoutUrl) {
      setCheckoutVisible(true);
      return;
    }
    if (!id && method !== "accessCode") {
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
      if (!id && method === "accessCode") {
        const response = await communitiesApi.resolveCode({
          accessCode: credential.trim(),
        });
        setResolvedCommunity(response.data.community);
        setCommunityInput(response.data.community.id);
        return;
      }
      if (!id) return;
      const response = await communitiesApi.createJoinRequest(id, {
        ...(method === "accessCode" ? { accessCode: credential.trim() } : {}),
        ...(method === "inviteToken" ? { inviteToken: credential.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      });
      if ("membership" in response.data) {
        navigation.replace("CommunityProfile", { communityId: id });
      } else if (response.data.joinRequest?.status === "approved") {
        await startCheckout(id);
      } else if ("joinRequest" in response.data) {
        setPendingId(id);
        setNotice({ title: "Request sent", message: response.message });
        void loadPending();
      } else {
        setNotice({
          title: "Join response unclear",
          message: "Check your membership before trying again.",
        });
      }
    } catch (error) {
      if (
        id &&
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

  const cancelRequest = async (id: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await communitiesApi.cancelMyJoinRequest(id);
      if (pendingId === id) setPendingId(null);
      setPendingRequests((current) =>
        current.filter((item) => item.communityId?._id !== id),
      );
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
            Enter a private access code to find the community. For an invite
            token or public approval request, paste the community ID too.
          </Text>
          <Text style={styles.label}>
            Community ID or shared link (optional with a code)
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => {
              setCommunityInput(value);
              setResolvedCommunity(null);
            }}
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
                  setResolvedCommunity(null);
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
                onChangeText={(value) => {
                  if (
                    resolvedCommunity &&
                    communityInput === resolvedCommunity.id
                  )
                    setCommunityInput("");
                  setCredential(value);
                  setResolvedCommunity(null);
                }}
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
          {resolvedCommunity ? (
            <View style={styles.resolvedCard}>
              {resolvedCommunity.imageUrl ? (
                <Image
                  source={{ uri: resolvedCommunity.imageUrl }}
                  style={styles.resolvedImage}
                />
              ) : null}
              <View style={styles.resolvedCopy}>
                <Text style={styles.resolvedName}>
                  {resolvedCommunity.name}
                </Text>
                <Text style={styles.resolvedMeta}>
                  Private community ·{" "}
                  {resolvedCommunity.joinPolicy.replace("_", " ")}
                </Text>
              </View>
            </View>
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
                onPress={() => void cancelRequest(pendingId)}
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
                  {orderNumber && checkoutUrl
                    ? "Continue payment"
                    : method === "accessCode" &&
                        !extractCommunityId(communityInput)
                      ? "Find community"
                      : method === "request"
                        ? "Request to join"
                        : "Join community"}
                </Text>
              )}
            </Pressable>
          )}
          <View style={styles.pendingSection}>
            <View style={styles.pendingHeading}>
              <Text style={styles.pendingTitle}>Pending requests</Text>
              <Pressable
                disabled={loadingPending}
                onPress={() => void loadPending()}
              >
                <Text style={styles.refreshText}>
                  {loadingPending ? "Loading..." : "Refresh"}
                </Text>
              </Pressable>
            </View>
            {pendingRequests.length === 0 && !loadingPending ? (
              <Text style={styles.pendingEmpty}>
                {pendingError
                  ? "Could not load requests. Tap Refresh to try again."
                  : "No requests awaiting review."}
              </Text>
            ) : null}
            {pendingRequests.map((request) => (
              <View key={request._id} style={styles.pendingRow}>
                <View style={styles.resolvedCopy}>
                  <Text style={styles.pendingName}>
                    {request.communityId?.name || "Community"}
                  </Text>
                  <Text style={styles.pendingMeta}>
                    Requested{" "}
                    {new Date(request.createdAt).toLocaleDateString("en-NG")}
                  </Text>
                </View>
                <Pressable
                  disabled={submitting || !request.communityId}
                  onPress={() => {
                    if (request.communityId)
                      void cancelRequest(request.communityId._id);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(notice)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
      <PaystackCheckoutModal
        visible={checkoutVisible}
        url={checkoutUrl}
        title="Community membership payment"
        onClose={() => setCheckoutVisible(false)}
        onVerify={verifyMembershipPayment}
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
  resolvedCard: {
    alignItems: "center",
    backgroundColor: "#e7f6ee",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 12,
  },
  resolvedImage: { borderRadius: 24, height: 48, width: 48 },
  resolvedCopy: { flex: 1 },
  resolvedName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 },
  resolvedMeta: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  pendingSection: { marginTop: 36 },
  pendingHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pendingTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  refreshText: { color: "#087b42", fontFamily: fonts.bold, fontSize: 12 },
  pendingEmpty: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 12,
  },
  pendingRow: {
    alignItems: "center",
    borderBottomColor: "#dbece3",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 14,
  },
  pendingName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  pendingMeta: {
    color: "#53665a",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
});
