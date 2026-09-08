import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
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
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { disputesApi } from "../../services/api/disputes.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetDisputesIdResponse,
  GetDisputesResponse,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletDispute">;
type Dispute = GetDisputesResponse["data"]["disputes"][number];
type DisputeDetails = GetDisputesIdResponse["data"]["dispute"];

const CATEGORIES = [
  "payment",
  "withdrawal",
  "transfer",
  "ticket",
  "event",
  "harassment",
  "other",
];

export default function WalletDisputeConnectedScreen({
  navigation,
  route,
}: Props) {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "moderator";
  const transaction = route.params.transaction;
  const [category, setCategory] = useState("payment");
  const [subject, setSubject] = useState(`Issue with ${transaction.title}`);
  const [description, setDescription] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<DisputeDetails | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await disputesApi.list();
      setDisputes(response.data.disputes);
    } catch (error) {
      setNotice({
        title: "Disputes unavailable",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to load disputes.",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!subject.trim() || description.trim().length < 10 || submitting) {
      setNotice({
        title: "Add more detail",
        message:
          "Enter a subject and at least 10 characters describing the issue.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const response = await disputesApi.create({
        ...(transaction.id ? { transactionId: transaction.id } : {}),
        category,
        subject: subject.trim(),
        description: description.trim(),
      });
      setNotice({
        title: "Dispute submitted",
        message: `Reference: ${response.data.dispute._id}. Status: ${response.data.dispute.status}.`,
      });
      setDescription("");
      await load();
    } catch (error) {
      setNotice({
        title: "Submission failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to create this dispute.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const choose = async (dispute: Dispute) => {
    setDetailLoading(true);
    try {
      const response = await disputesApi.get(dispute._id);
      setSelected(response.data.dispute);
    } catch (error) {
      setNotice({
        title: "Dispute unavailable",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to load this dispute.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await disputesApi.reply(selected._id, {
        message: reply.trim(),
      });
      setSelected(response.data.dispute);
      setReply("");
      setNotice({
        title: "Reply sent",
        message: "Your message was added to the dispute.",
      });
      await load();
    } catch (error) {
      setNotice({
        title: "Reply failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to send this reply.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Disputes" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.transaction}>
            <Ionicons color="#078d45" name="receipt-outline" size={23} />
            <View style={styles.transactionCopy}>
              <Text style={styles.title}>{transaction.title}</Text>
              <Text style={styles.meta}>
                {transaction.date} - {transaction.amount}
              </Text>
            </View>
          </View>
          <Text style={styles.heading}>Open a dispute</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, category === item && styles.chipActive]}
              >
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            onChangeText={setSubject}
            placeholder="Subject"
            placeholderTextColor="#718078"
            style={styles.input}
            value={subject}
          />
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Explain what happened and the outcome you expect"
            placeholderTextColor="#718078"
            style={[styles.input, styles.description]}
            value={description}
          />
          <Pressable
            disabled={submitting}
            onPress={() => void create()}
            style={[styles.primary, submitting && styles.disabled]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={styles.primaryText}>Submit dispute</Text>
            )}
          </Pressable>

          <View style={styles.disputeHeading}>
            <Text style={styles.heading}>Your disputes</Text>
            {canManage ? (
              <Pressable
                onPress={() => navigation.navigate("DisputeManagement")}
              >
                <Text style={styles.manage}>Manage all</Text>
              </Pressable>
            ) : null}
          </View>
          {loading ? (
            <ActivityIndicator color="#08b657" />
          ) : disputes.length ? (
            disputes.map((dispute) => (
              <Pressable
                key={dispute._id}
                onPress={() => {
                  void choose(dispute);
                }}
                style={[
                  styles.dispute,
                  selected?._id === dispute._id && styles.disputeActive,
                ]}
              >
                <View style={styles.disputeCopy}>
                  <Text style={styles.title}>{dispute.subject}</Text>
                  <Text numberOfLines={2} style={styles.meta}>
                    {dispute.description}
                  </Text>
                </View>
                <Text style={styles.status}>
                  {dispute.status.replace("_", " ")}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.empty}>You have no previous disputes.</Text>
          )}
          {detailLoading ? <ActivityIndicator color="#08b657" /> : null}
          {selected ? (
            <View style={styles.replyCard}>
              <Text style={styles.title}>Reply to: {selected.subject}</Text>
              <Text style={styles.detailDescription}>
                {selected.description}
              </Text>
              {selected.messages.map((message) => (
                <View key={message._id} style={styles.message}>
                  <Text style={styles.messageText}>{message.message}</Text>
                  <Text style={styles.messageMeta}>
                    {new Date(message.createdAt).toLocaleString("en-NG")}
                  </Text>
                </View>
              ))}
              <TextInput
                multiline
                onChangeText={setReply}
                placeholder="Add a message"
                placeholderTextColor="#718078"
                style={[styles.input, styles.reply]}
                value={reply}
              />
              <Pressable
                disabled={!reply.trim() || submitting}
                onPress={() => void sendReply()}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Send reply</Text>
              </Pressable>
            </View>
          ) : null}
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
  content: { padding: 22, paddingBottom: 70 },
  transaction: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 20,
    flexDirection: "row",
    padding: 15,
  },
  transactionCopy: { flex: 1, marginLeft: 11 },
  title: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  meta: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  heading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginBottom: 10,
    marginTop: 23,
  },
  disputeHeading: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  manage: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  chip: {
    backgroundColor: colors.white,
    borderColor: "transparent",
    borderRadius: 17,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: "#e9f8f0", borderColor: "#08b657" },
  chipText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: "capitalize",
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 18,
    color: colors.ink,
    fontFamily: fonts.medium,
    marginTop: 10,
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  description: { minHeight: 110, textAlignVertical: "top" },
  reply: { minHeight: 80, textAlignVertical: "top" },
  primary: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 23,
    height: 50,
    justifyContent: "center",
    marginTop: 14,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold },
  disabled: { opacity: 0.55 },
  dispute: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "transparent",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 9,
    padding: 14,
  },
  disputeActive: { borderColor: "#08b657" },
  disputeCopy: { flex: 1 },
  status: {
    color: "#078d45",
    fontFamily: fonts.bold,
    fontSize: 9,
    marginLeft: 10,
    textTransform: "capitalize",
  },
  empty: { color: "#718078", fontFamily: fonts.medium, textAlign: "center" },
  replyCard: {
    backgroundColor: "#e9f8f0",
    borderRadius: 20,
    marginTop: 14,
    padding: 15,
  },
  secondary: {
    alignItems: "center",
    borderColor: "#08b657",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    padding: 11,
  },
  secondaryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  detailDescription: {
    color: "#547061",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },
  message: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginTop: 9,
    padding: 11,
  },
  messageText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  messageMeta: {
    color: "#85958d",
    fontFamily: fonts.medium,
    fontSize: 8,
    marginTop: 5,
  },
});
