import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError, createIdempotencyKey } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { GetWalletBankAccountsResponse, GetWalletBanksResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "WalletWithdraw">;
type Bank = GetWalletBanksResponse["data"]["banks"][number];
type Account = GetWalletBankAccountsResponse["data"]["bankAccounts"][number];

export default function WalletWithdrawConnectedScreen({ navigation }: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const keyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [banksResponse, accountsResponse] = await Promise.all([walletApi.banks(), walletApi.bankAccounts()]);
      setBanks(banksResponse.data.banks);
      setAccounts(accountsResponse.data.bankAccounts);
      setSelectedAccount((current) => current ?? accountsResponse.data.bankAccounts[0]?._id ?? null);
    } catch (error) {
      setNotice({ title: "Bank accounts unavailable", message: error instanceof ApiError ? error.message : "Unable to load bank accounts." });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const saveAccount = async () => {
    if (accountNumber.trim().length !== 10 || !bankCode) {
      setNotice({ title: "Check bank details", message: "Choose a bank and enter a 10-digit account number." }); return;
    }
    setSubmitting(true);
    try {
      const response = await walletApi.saveBankAccount({ accountNumber: accountNumber.trim(), bankCode });
      setSelectedAccount(response.data.bankAccount._id);
      setAccountNumber("");
      await load();
    } catch (error) {
      setNotice({ title: "Account not saved", message: error instanceof ApiError ? error.message : "Unable to verify this bank account." });
    } finally { setSubmitting(false); }
  };

  const withdraw = async () => {
    const naira = Number(amount);
    if (!selectedAccount || !Number.isFinite(naira) || naira <= 0) {
      setNotice({ title: "Check withdrawal", message: "Select a bank account and enter a valid amount." }); return;
    }
    setSubmitting(true);
    try {
      keyRef.current ??= createIdempotencyKey();
      const response = await walletApi.withdraw({ bankAccountId: selectedAccount, amountKobo: Math.round(naira * 100) }, keyRef.current);
      setReference(response.data.transaction.reference);
      setNotice({ title: "Withdrawal submitted", message: `Backend status: ${response.data.transaction.status}. Payout: NGN ${(response.data.charge.payoutAmountKobo / 100).toFixed(2)}.` });
      keyRef.current = null;
    } catch (error) {
      setNotice({ title: "Withdrawal failed", message: error instanceof ApiError ? error.message : "Unable to submit this withdrawal." });
    } finally { setSubmitting(false); }
  };

  const finalize = async () => {
    if (!reference || otp.length !== 6) return;
    setSubmitting(true);
    try {
      const response = await walletApi.finalizeWithdrawal(reference, otp);
      setNotice({ title: "OTP accepted", message: `Backend status: ${response.data.transaction.status}.` });
      setOtp("");
    } catch (error) {
      setNotice({ title: "OTP failed", message: error instanceof ApiError ? error.message : "Unable to finalize this withdrawal." });
    } finally { setSubmitting(false); }
  };

  return <>
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="Withdraw" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color="#08b657" /> : null}
        <Text style={styles.section}>Saved accounts</Text>
        {accounts.map((account) => <Pressable key={account._id} onPress={() => { setSelectedAccount(account._id); keyRef.current = null; }} style={[styles.account, selectedAccount === account._id && styles.accountActive]}>
          <Ionicons color="#078d45" name="business-outline" size={22} /><View style={styles.accountCopy}><Text style={styles.accountName}>{account.bankName}</Text><Text style={styles.meta}>{account.accountName} - {account.maskedAccountNumber}</Text></View>{selectedAccount === account._id ? <Ionicons color="#08b657" name="checkmark-circle" size={22} /> : null}
        </Pressable>)}
        <Text style={styles.section}>Add bank account</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.banks}>{banks.map((bank) => <Pressable key={bank.code} onPress={() => setBankCode(bank.code)} style={[styles.bank, bankCode === bank.code && styles.bankActive]}><Text style={styles.bankText}>{bank.name}</Text></Pressable>)}</ScrollView>
        <TextInput keyboardType="number-pad" maxLength={10} onChangeText={setAccountNumber} placeholder="10-digit account number" placeholderTextColor="#718078" style={styles.input} value={accountNumber} />
        <Pressable disabled={submitting} onPress={() => void saveAccount()} style={styles.secondary}><Text style={styles.secondaryText}>Verify and save account</Text></Pressable>
        <Text style={styles.section}>Withdrawal amount (NGN)</Text>
        <TextInput keyboardType="decimal-pad" onChangeText={(value) => { setAmount(value); keyRef.current = null; }} placeholder="10000" placeholderTextColor="#718078" style={styles.input} value={amount} />
        <Pressable disabled={submitting} onPress={() => void withdraw()} style={[styles.primary, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryText}>Submit withdrawal</Text>}</Pressable>
        {reference ? <View style={styles.otpCard}><Text style={styles.accountName}>Only if Paystack requests an OTP</Text><TextInput keyboardType="number-pad" maxLength={6} onChangeText={setOtp} placeholder="6-digit OTP" placeholderTextColor="#718078" style={styles.input} value={otp} /><Pressable disabled={otp.length !== 6 || submitting} onPress={() => void finalize()} style={styles.secondary}><Text style={styles.secondaryText}>Finalize OTP</Text></Pressable></View> : null}
      </ScrollView>
    </SafeAreaView>
    <AppAlertModal visible={Boolean(notice)} title={notice?.title ?? ""} message={notice?.message ?? ""} onClose={() => setNotice(null)} />
  </>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 24, paddingBottom: 70 }, section: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 16, marginBottom: 10, marginTop: 22 },
  account: { alignItems: "center", backgroundColor: colors.white, borderColor: "transparent", borderRadius: 19, borderWidth: 1, flexDirection: "row", marginBottom: 9, padding: 13 }, accountActive: { borderColor: "#08b657" }, accountCopy: { flex: 1, marginLeft: 10 }, accountName: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 3 },
  banks: { marginBottom: 10 }, bank: { backgroundColor: colors.white, borderColor: "transparent", borderRadius: 16, borderWidth: 1, marginRight: 8, maxWidth: 145, padding: 10 }, bankActive: { borderColor: "#08b657", backgroundColor: "#e9f8f0" }, bankText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 10 },
  input: { backgroundColor: colors.white, borderRadius: 18, color: colors.ink, fontFamily: fonts.medium, height: 50, marginTop: 8, paddingHorizontal: 15 }, secondary: { alignItems: "center", borderColor: "#08b657", borderRadius: 19, borderWidth: 1, marginTop: 10, padding: 12 }, secondaryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 12 },
  primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 24, height: 52, justifyContent: "center", marginTop: 16 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 }, otpCard: { backgroundColor: "#e9f8f0", borderRadius: 20, marginTop: 18, padding: 15 },
});
