import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
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

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletDispute">;

const REASONS = [
  "I do not recognize this transaction",
  "I was charged the wrong amount",
  "I did not receive the service",
  "I was charged more than once",
  "Refund has not arrived",
  "Other",
];

export default function WalletDisputeScreen({ navigation, route }: Props) {
  const { transaction } = route.params;
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [showReasons, setShowReasons] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pickEvidence = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEvidence(result.assets[0].uri);
    }
  };

  const draftWithAi = () => {
    setDescription(
      "I am disputing " +
        transaction.title +
        " for " +
        transaction.amount +
        " on " +
        transaction.date +
        ". " +
        reason +
        ". Please review the payment record and help resolve this transaction.",
    );
  };

  const submit = () => {
    if (description.trim().length < 20) {
      setNotice(
        "Add a little more detail so the support team can investigate.",
      );
      return;
    }
    setSubmitted(true);
    setNotice(
      "Your dispute has been submitted. Community AI organized the evidence and the wallet team will review it within 2–3 business days.",
    );
  };

  const closeNotice = () => {
    setNotice("");
    if (submitted) {
      navigation.navigate("Transactions");
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safe}
      >
        <ProfilePageHeader
          title="Report a Transaction"
          onBack={navigation.goBack}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <Ionicons color="#08ad54" name="receipt-outline" size={25} />
            </View>
            <View style={styles.transactionBody}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text style={styles.transactionAmount}>{transaction.amount}</Text>
          </View>

          <View style={styles.aiIntro}>
            <View style={styles.aiOrb}>
              <Ionicons color={colors.ink} name="sparkles" size={21} />
            </View>
            <View style={styles.aiIntroBody}>
              <Text style={styles.aiLabel}>AI DISPUTE ASSISTANT</Text>
              <Text style={styles.aiIntroTitle}>
                I will help make your report clear
              </Text>
              <Text style={styles.aiIntroText}>
                I can organize the transaction details and draft a concise
                explanation for faster review.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>What went wrong?</Text>
          <Pressable onPress={() => setShowReasons(true)} style={styles.select}>
            <Text numberOfLines={2} style={styles.selectText}>
              {reason}
            </Text>
            <Ionicons color="#6f8177" name="chevron-down" size={19} />
          </Pressable>

          <View style={styles.descriptionHeading}>
            <Text style={styles.sectionTitle}>Describe the issue</Text>
            <Pressable onPress={draftWithAi} style={styles.aiDraftButton}>
              <Ionicons color="#08ad54" name="sparkles" size={15} />
              <Text style={styles.aiDraftText}>Draft with AI</Text>
            </Pressable>
          </View>
          <TextInput
            maxLength={600}
            multiline
            onChangeText={setDescription}
            placeholder="Tell us what happened and what outcome you expect..."
            placeholderTextColor="#718078"
            style={styles.description}
            textAlignVertical="top"
            value={description}
          />
          <Text style={styles.counter}>{description.length}/600</Text>

          <Text style={styles.sectionTitle}>Add evidence</Text>
          <Pressable onPress={pickEvidence} style={styles.evidence}>
            {evidence ? (
              <Image source={{ uri: evidence }} style={styles.evidenceImage} />
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons
                    color="#08ad54"
                    name="cloud-upload-outline"
                    size={25}
                  />
                </View>
                <Text style={styles.evidenceTitle}>
                  Upload screenshot or receipt
                </Text>
                <Text style={styles.evidenceText}>JPG or PNG, up to 10 MB</Text>
              </>
            )}
          </Pressable>

          <View style={styles.protection}>
            <Ionicons
              color="#08ad54"
              name="shield-checkmark-outline"
              size={23}
            />
            <Text style={styles.protectionText}>
              Your report and evidence are encrypted and only shared with the
              wallet resolution team.
            </Text>
          </View>

          <Pressable onPress={submit} style={styles.submit}>
            <Text style={styles.submitText}>Submit Dispute</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={21} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppSelectSheet
        onClose={() => setShowReasons(false)}
        onSelect={setReason}
        options={REASONS}
        title="Select dispute reason"
        value={reason}
        visible={showReasons}
      />
      <AppAlertModal
        confirmText={submitted ? "View Transactions" : "Okay"}
        message={notice}
        onClose={closeNotice}
        title={submitted ? "Dispute submitted" : "Add more details"}
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 24, paddingBottom: 46 },
  transactionCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 27,
    flexDirection: "row",
    padding: 15,
  },
  transactionIcon: {
    alignItems: "center",
    backgroundColor: "#e8f9ef",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  transactionBody: { flex: 1, marginLeft: 12 },
  transactionTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  transactionDate: {
    color: "#3c9560",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  transactionAmount: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  aiIntro: {
    backgroundColor: "#0a3526",
    borderRadius: 27,
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
    padding: 17,
  },
  aiOrb: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  aiIntroBody: { flex: 1 },
  aiLabel: {
    color: colors.lime,
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  aiIntroTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 3,
  },
  aiIntroText: {
    color: "#acd4c0",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 28,
  },
  select: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 26,
    flexDirection: "row",
    marginTop: 11,
    minHeight: 58,
    paddingHorizontal: 17,
  },
  selectText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    paddingRight: 10,
  },
  descriptionHeading: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  aiDraftButton: {
    alignItems: "center",
    backgroundColor: "#e6f8ee",
    borderRadius: 17,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  aiDraftText: { color: "#078f43", fontFamily: fonts.bold, fontSize: 10 },
  description: {
    backgroundColor: colors.white,
    borderRadius: 26,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
    height: 150,
    lineHeight: 20,
    marginTop: 11,
    padding: 17,
  },
  counter: {
    color: "#839087",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginRight: 8,
    marginTop: 5,
    textAlign: "right",
  },
  evidence: {
    alignItems: "center",
    backgroundColor: "#eef9f3",
    borderColor: "#bfe5cf",
    borderRadius: 26,
    borderStyle: "dashed",
    borderWidth: 1.5,
    height: 150,
    justifyContent: "center",
    marginTop: 11,
    overflow: "hidden",
  },
  evidenceImage: { height: "100%", width: "100%" },
  uploadIcon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  evidenceTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 9,
  },
  evidenceText: {
    color: "#4e9270",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  protection: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 21,
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    padding: 14,
  },
  protectionText: {
    color: "#357458",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
  },
  submit: {
    alignItems: "center",
    backgroundColor: "#08bd58",
    borderRadius: 29,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 58,
  },
  submitText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16 },
});
