import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
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

import AppLoader from "../../components/ui/app-loader";
import AppAlertModal from "../../components/ui/app-alert-modal";
import AppSelectField from "../../components/ui/app-select-field";
import { useBankAccountResolution } from "../../hooks/use-bank-account-resolution";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { GetWalletBankAccountsResponse, GetWalletBanksResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "BankAccounts">;
type Account = GetWalletBankAccountsResponse["data"]["bankAccounts"][number];
type Bank = GetWalletBanksResponse["data"]["banks"][number];

export default function BankAccountsScreen({ navigation }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAccount, setConfirmAccount] = useState<Account | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const { resolution, resolving, error: resolutionError, retry } = useBankAccountResolution(bankCode, accountNumber);
  const bankNames = [...new Set(banks.map((bank) => bank.name))].sort((a, b) => a.localeCompare(b));
  const canSave = Boolean(resolution) && !resolving && !loading && !submitting;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accountResponse, bankResponse] = await Promise.all([walletApi.bankAccounts(), walletApi.banks()]);
      setAccounts(accountResponse.data.bankAccounts);
      setBanks(bankResponse.data.banks);
    } catch (error) {
      setNotice({ title: "Bank accounts unavailable", message: error instanceof ApiError ? error.message : "Unable to load bank accounts." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!canSave) {
      setNotice({ title: "Check bank details", message: "Choose a bank, enter a 10-digit account number and wait for the account name to be verified." });
      return;
    }
    setSubmitting(true);
    try {
      await walletApi.saveBankAccount({ bankCode, accountNumber: accountNumber.trim() });
      setAccountNumber("");
      setBankCode("");
      await load();
      setNotice({ title: "Account saved", message: "Your bank account is linked securely. Balances of NGN 1,000 or more are paid at midnight (Africa/Lagos). Smaller balances carry forward." });
    } catch (error) {
      setNotice({ title: "Account not saved", message: error instanceof ApiError ? error.message : "Unable to save this bank account." });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (account: Account) => {
    setSubmitting(true);
    try {
      await walletApi.removeBankAccount(account._id);
      setAccounts((current) => current.filter((item) => item._id !== account._id));
    } catch (error) {
      setNotice({ title: "Account not removed", message: error instanceof ApiError ? error.message : "Unable to remove this bank account." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Bank Accounts" onBack={navigation.goBack} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.form}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>Payout bank accounts</Text>
            <Text style={styles.payoutInfo}>Your default active bank receives daily midnight payouts. If there is no default, we use your first linked active account. Without an account, funds stay pending and we email you a daily reminder.</Text>
            {loading ? <AppLoader color="#08b657" /> : null}
            {!loading && !accounts.length ? <Text style={styles.empty}>No saved bank accounts.</Text> : null}
            {accounts.map((account) => (
              <View key={account._id} style={styles.account}>
                <View style={styles.accountIcon}><Ionicons color="#078d45" name="business-outline" size={22} /></View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{account.bankName}</Text>
                  <Text style={styles.meta}>{account.accountName} - {account.maskedAccountNumber}</Text>
                </View>
                <Pressable disabled={submitting} onPress={() => setConfirmAccount(account)} style={styles.delete}>
                  <Ionicons color="#a34b4b" name="trash-outline" size={20} />
                </Pressable>
              </View>
            ))}

            <Text style={styles.heading}>Add an account</Text>
            <AppSelectField
              label="Bank"
              placeholder={loading ? "Loading banks..." : "Select your bank"}
              options={bankNames}
              value={banks.find((bank) => bank.code === bankCode)?.name ?? ""}
              disabled={loading || submitting || !banks.length}
              onChange={(name) => setBankCode(banks.find((bank) => bank.name === name)?.code ?? "")}
            />
            <TextInput
              accessibilityLabel="Account number"
              editable={!submitting}
              keyboardType="number-pad"
              maxLength={10}
              onChangeText={(value) => setAccountNumber(value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit account number"
              placeholderTextColor="#718078"
              style={styles.input}
              value={accountNumber}
            />
            {resolving ? (
              <View accessibilityLiveRegion="polite" style={styles.verification}>
                <AppLoader color="#078d45" />
                <Text style={styles.verificationText}>Verifying account name...</Text>
              </View>
            ) : resolution ? (
              <View accessibilityLiveRegion="polite" style={styles.verification}>
                <Ionicons color="#078d45" name="checkmark-circle" size={22} />
                <View style={styles.copy}>
                  <Text style={styles.name}>{resolution.accountName}</Text>
                  <Text style={styles.meta}>Verified account - {resolution.maskedAccountNumber}</Text>
                </View>
              </View>
            ) : resolutionError ? (
              <View accessibilityLiveRegion="polite" style={styles.verificationError}>
                <Text style={styles.errorText}>{resolutionError}</Text>
                <Pressable accessibilityRole="button" disabled={submitting} onPress={retry} style={styles.retry}>
                  <Text style={styles.retryText}>Try verification again</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.hint}>Select your bank and enter all 10 digits to verify the account name before saving.</Text>
            )}
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={() => void save()} style={[styles.primary, !canSave && styles.disabled]}>
              {submitting ? <AppLoader color={colors.ink} /> : <Text style={styles.primaryText}>Save bank account</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <AppAlertModal
        cancelText="Keep account"
        confirmText="Remove"
        message={`Remove ${confirmAccount?.bankName ?? "this bank account"} from your wallet? If no linked account remains, your payout will stay pending.`}
        onClose={() => setConfirmAccount(null)}
        onConfirm={() => {
          const account = confirmAccount;
          setConfirmAccount(null);
          if (account) void remove(account);
        }}
        title="Remove bank account?"
        visible={Boolean(confirmAccount)}
      />
      <AppAlertModal message={notice?.message ?? ""} onClose={() => setNotice(null)} title={notice?.title ?? ""} visible={Boolean(notice)} />
    </>
  );
}

const styles = StyleSheet.create({
  payoutInfo: { color: "#526b5f", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginBottom: 14 },
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 22, paddingBottom: 70 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginBottom: 11, marginTop: 18 },
  account: { alignItems: "center", backgroundColor: colors.white, borderRadius: 20, flexDirection: "row", marginBottom: 9, padding: 13 }, accountIcon: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 20, height: 40, justifyContent: "center", width: 40 }, copy: { flex: 1, marginLeft: 11 }, name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 }, delete: { alignItems: "center", backgroundColor: "#f9eeee", borderRadius: 19, height: 38, justifyContent: "center", width: 38 }, empty: { color: "#718078", fontFamily: fonts.medium, textAlign: "center" },
  form: { flex: 1 },
  verification: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 16, flexDirection: "row", marginTop: 12, padding: 13 },
  verificationText: { color: "#078d45", flex: 1, fontFamily: fonts.medium, fontSize: 12, marginLeft: 10 },
  verificationError: { backgroundColor: "#f9eeee", borderRadius: 16, marginTop: 12, padding: 13 },
  errorText: { color: "#a34b4b", fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  retry: { alignSelf: "flex-start", paddingVertical: 8 },
  retryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 12 },
  hint: { color: "#718078", fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 10 },
  input: { backgroundColor: colors.white, borderRadius: 19, color: colors.ink, height: 52, marginTop: 13, paddingHorizontal: 15 }, primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 23, height: 50, justifyContent: "center", marginTop: 13 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
});
