import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletTransfer">;

const recipients = [
  {
    id: "@alex",
    name: "Alex",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85",
  },
  {
    id: "@jordan",
    name: "Jordan",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=85",
  },
  {
    id: "@mia",
    name: "Mia",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85",
  },
];

export default function WalletTransferScreen({ navigation }: Props) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const numericAmount = Number(amount) || 0;
  const knownRecipient = recipients.some((item) => item.id === recipient);

  const submit = () => {
    if (!recipient.trim()) {
      setNotice("Choose a recipient or enter their CommunityConnect ID.");
      return;
    }
    if (numericAmount <= 0 || numericAmount > 2840.5) {
      setNotice("Enter a transfer amount within your available balance.");
      return;
    }
    setNotice(
      "$" +
        numericAmount.toFixed(2) +
        " is ready to transfer to " +
        recipient +
        ".",
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safe}
      >
        <ProfilePageHeader title="Transfer Money" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View>
              <Text style={styles.heroLabel}>AVAILABLE TO SEND</Text>
              <Text style={styles.heroBalance}>$2,840.50</Text>
            </View>
            <Ionicons color={colors.lime} name="swap-horizontal" size={32} />
          </View>

          <Text style={styles.sectionTitle}>Send to</Text>
          <View style={styles.recipientField}>
            <Ionicons color="#268e55" name="at" size={22} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setRecipient}
              placeholder="Username or wallet ID"
              placeholderTextColor="#718078"
              style={styles.recipientInput}
              value={recipient}
            />
            {knownRecipient ? (
              <Ionicons color="#08ad54" name="checkmark-circle" size={21} />
            ) : null}
          </View>

          <Text style={styles.recentLabel}>RECENT RECIPIENTS</Text>
          <ScrollView
            contentContainerStyle={styles.recipients}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recipients.map((person) => (
              <Pressable
                key={person.id}
                onPress={() => setRecipient(person.id)}
                style={[
                  styles.recipient,
                  recipient === person.id && styles.recipientSelected,
                ]}
              >
                <Image source={{ uri: person.image }} style={styles.avatar} />
                <Text style={styles.recipientName}>{person.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Transfer amount</Text>
          <View style={styles.amountField}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#93a198"
              style={styles.amountInput}
              value={amount}
            />
          </View>

          <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            maxLength={100}
            multiline
            onChangeText={setNote}
            placeholder="What is this transfer for?"
            placeholderTextColor="#718078"
            style={styles.note}
            textAlignVertical="top"
            value={note}
          />

          <View style={styles.aiSafety}>
            <View style={styles.aiIcon}>
              <Ionicons color={colors.ink} name="sparkles" size={19} />
            </View>
            <View style={styles.aiBody}>
              <Text style={styles.aiLabel}>AI SAFETY CHECK</Text>
              <Text style={styles.aiTitle}>
                {knownRecipient
                  ? "Known recipient recognized"
                  : "Recipient will be verified before transfer"}
              </Text>
              <Text style={styles.aiText}>
                Community AI checks recipient history and unusual payment
                patterns to help prevent mistakes.
              </Text>
            </View>
            <Ionicons color="#08ad54" name="shield-checkmark" size={23} />
          </View>

          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>RECIPIENT RECEIVES</Text>
              <Text style={styles.summaryAmount}>
                {"$" + numericAmount.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.fee}>No transfer fee</Text>
          </View>

          <Pressable onPress={submit} style={styles.submit}>
            <Text style={styles.submitText}>Review Transfer</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={21} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppAlertModal
        message={notice}
        onClose={() => setNotice("")}
        title={
          notice.includes("ready to transfer")
            ? "Confirm transfer"
            : "Check transfer"
        }
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 24, paddingBottom: 44 },
  hero: {
    alignItems: "center",
    backgroundColor: "#0a3526",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 22,
  },
  heroLabel: {
    color: "#a8c8b9",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  heroBalance: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    marginTop: 5,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    marginTop: 30,
  },
  recipientField: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    minHeight: 58,
    paddingHorizontal: 18,
  },
  recipientInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  recentLabel: {
    color: "#35915c",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 18,
  },
  recipients: { gap: 12, paddingTop: 11 },
  recipient: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "transparent",
    borderRadius: 22,
    borderWidth: 2,
    flexDirection: "row",
    gap: 8,
    padding: 8,
    paddingRight: 13,
  },
  recipientSelected: { borderColor: "#08bd58" },
  avatar: { borderRadius: 18, height: 36, width: 36 },
  recipientName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  amountField: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: "row",
    marginTop: 12,
    minHeight: 68,
    paddingHorizontal: 20,
  },
  currency: { color: "#08ad54", fontFamily: fonts.extraBold, fontSize: 27 },
  amountInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    paddingHorizontal: 10,
  },
  fieldLabel: {
    color: "#34905b",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginLeft: 8,
    marginTop: 20,
  },
  note: {
    backgroundColor: colors.white,
    borderRadius: 25,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
    height: 92,
    marginTop: 8,
    padding: 16,
  },
  aiSafety: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 24,
    flexDirection: "row",
    gap: 11,
    marginTop: 22,
    padding: 15,
  },
  aiIcon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  aiBody: { flex: 1 },
  aiLabel: {
    color: "#078f43",
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  aiTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 3,
  },
  aiText: {
    color: "#357458",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  summary: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 18,
  },
  summaryLabel: { color: "#6b8075", fontFamily: fonts.bold, fontSize: 9 },
  summaryAmount: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginTop: 2,
  },
  fee: { color: "#08ad54", fontFamily: fonts.bold, fontSize: 11 },
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
