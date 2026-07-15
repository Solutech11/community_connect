import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
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

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletWithdraw">;

const BANKS = [
  "Access Bank",
  "First Bank",
  "Guaranty Trust Bank",
  "Kuda Bank",
  "Opay",
  "PalmPay",
  "United Bank for Africa",
  "Zenith Bank",
];

export default function WalletWithdrawScreen({ navigation }: Props) {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("Guaranty Trust Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBanks, setShowBanks] = useState(false);
  const [notice, setNotice] = useState("");

  const numericAmount = Number(amount) || 0;
  const fee = numericAmount > 0 ? 1.5 : 0;
  const accountReady = accountNumber.trim().length === 10;

  const submit = () => {
    if (numericAmount <= 0 || numericAmount > 2840.5) {
      setNotice("Enter an amount within your available wallet balance.");
      return;
    }
    if (!accountReady) {
      setNotice("Enter a valid 10-digit account number.");
      return;
    }
    setNotice(
      "Your withdrawal of $" +
        numericAmount.toFixed(2) +
        " to " +
        bank +
        " has been submitted.",
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.safe}
      >
        <ProfilePageHeader title="Withdraw Funds" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balance}>$2,840.50</Text>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons color={colors.lime} name="wallet-outline" size={24} />
            </View>
          </View>

          <Text style={styles.label}>Amount to withdraw</Text>
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
          <View style={styles.quickAmounts}>
            {["50", "100", "250", "500"].map((value) => (
              <Pressable
                key={value}
                onPress={() => setAmount(value)}
                style={[
                  styles.quickAmount,
                  amount === value && styles.quickAmountSelected,
                ]}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === value && styles.quickAmountTextSelected,
                  ]}
                >
                  {"$" + value}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Destination account</Text>
          <Text style={styles.fieldLabel}>BANK</Text>
          <Pressable onPress={() => setShowBanks(true)} style={styles.field}>
            <Ionicons color="#27905a" name="business-outline" size={20} />
            <Text style={styles.fieldValue}>{bank}</Text>
            <Ionicons color="#718078" name="chevron-down" size={18} />
          </Pressable>

          <Text style={styles.fieldLabel}>ACCOUNT NUMBER</Text>
          <View style={styles.field}>
            <Ionicons color="#27905a" name="card-outline" size={20} />
            <TextInput
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={setAccountNumber}
              placeholder="Enter 10-digit account number"
              placeholderTextColor="#718078"
              style={styles.textInput}
              value={accountNumber}
            />
          </View>
          {accountReady ? (
            <View style={styles.accountFound}>
              <Ionicons color="#08ad54" name="checkmark-circle" size={20} />
              <View>
                <Text style={styles.accountFoundLabel}>ACCOUNT VERIFIED</Text>
                <Text style={styles.accountName}>Alex Rivera</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.aiCheck}>
            <View style={styles.aiIcon}>
              <Ionicons color={colors.ink} name="sparkles" size={19} />
            </View>
            <View style={styles.aiCopy}>
              <Text style={styles.aiLabel}>AI WITHDRAWAL CHECK</Text>
              <Text style={styles.aiText}>
                I will verify the destination and flag unusual withdrawal
                activity before processing.
              </Text>
            </View>
          </View>

          <View style={styles.summary}>
            <SummaryRow
              label="Withdrawal amount"
              value={"$" + numericAmount.toFixed(2)}
            />
            <SummaryRow label="Processing fee" value={"$" + fee.toFixed(2)} />
            <View style={styles.summaryDivider} />
            <SummaryRow
              bold
              label="You will receive"
              value={"$" + Math.max(0, numericAmount - fee).toFixed(2)}
            />
          </View>

          <Pressable onPress={submit} style={styles.submit}>
            <Text style={styles.submitText}>Review Withdrawal</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={21} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppSelectSheet
        onClose={() => setShowBanks(false)}
        onSelect={setBank}
        options={BANKS}
        title="Select bank"
        value={bank}
        visible={showBanks}
      />
      <AppAlertModal
        message={notice}
        onClose={() => setNotice("")}
        title={
          notice.includes("submitted")
            ? "Withdrawal submitted"
            : "Check withdrawal"
        }
        visible={Boolean(notice)}
      />
    </>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 24, paddingBottom: 44 },
  balanceCard: {
    alignItems: "center",
    backgroundColor: "#0a3526",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 22,
  },
  balanceLabel: {
    color: "#a8c8b9",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  balance: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    marginTop: 5,
  },
  walletIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  label: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
    marginTop: 30,
  },
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
  quickAmounts: { flexDirection: "row", gap: 9, marginTop: 12 },
  quickAmount: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#cde9d9",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  quickAmountSelected: { backgroundColor: "#08bd58", borderColor: "#08bd58" },
  quickAmountText: { color: "#258e55", fontFamily: fonts.bold, fontSize: 12 },
  quickAmountTextSelected: { color: colors.ink },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    marginTop: 34,
  },
  fieldLabel: {
    color: "#34905b",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginLeft: 8,
    marginTop: 17,
  },
  field: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 27,
    flexDirection: "row",
    gap: 11,
    marginTop: 8,
    minHeight: 56,
    paddingHorizontal: 18,
  },
  fieldValue: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  textInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  accountFound: {
    alignItems: "center",
    backgroundColor: "#e9f9f0",
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    padding: 13,
  },
  accountFoundLabel: { color: "#2f8e58", fontFamily: fonts.bold, fontSize: 9 },
  accountName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 2,
  },
  aiCheck: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 24,
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    padding: 16,
  },
  aiIcon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  aiCopy: { flex: 1 },
  aiLabel: {
    color: "#078f43",
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  aiText: {
    color: "#357458",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 26,
    gap: 13,
    marginTop: 20,
    padding: 18,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: "#687a71", fontFamily: fonts.medium, fontSize: 13 },
  summaryValue: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  summaryBold: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 },
  summaryDivider: { backgroundColor: "#e7eeea", height: 1 },
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
