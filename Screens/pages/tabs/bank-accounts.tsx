import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
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
    if (!bankCode || accountNumber.trim().length !== 10 || submitting) {
      setNotice({ title: "Check bank details", message: "Choose a bank and enter a 10-digit account number." });
      return;
    }
    setSubmitting(true);
    try {
      await walletApi.saveBankAccount({ bankCode, accountNumber: accountNumber.trim() });
      setAccountNumber("");
      setBankCode("");
      await load();
      setNotice({ title: "Account saved", message: "The bank account was verified and saved securely." });
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Saved accounts</Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {banks.map((bank) => (
              <Pressable key={bank.code} onPress={() => setBankCode(bank.code)} style={[styles.bank, bankCode === bank.code && styles.bankActive]}>
                <Text numberOfLines={2} style={styles.bankText}>{bank.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput keyboardType="number-pad" maxLength={10} onChangeText={setAccountNumber} placeholder="10-digit account number" placeholderTextColor="#718078" style={styles.input} value={accountNumber} />
          <Pressable disabled={submitting} onPress={() => void save()} style={[styles.primary, submitting && styles.disabled]}>
            {submitting ? <AppLoader color={colors.ink} /> : <Text style={styles.primaryText}>Verify and save</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <AppAlertModal
        cancelText="Keep account"
        confirmText="Remove"
        message={`Remove ${confirmAccount?.bankName ?? "this bank account"} from your wallet?`}
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
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 22, paddingBottom: 70 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18, marginBottom: 11, marginTop: 18 },
  account: { alignItems: "center", backgroundColor: colors.white, borderRadius: 20, flexDirection: "row", marginBottom: 9, padding: 13 }, accountIcon: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 20, height: 40, justifyContent: "center", width: 40 }, copy: { flex: 1, marginLeft: 11 }, name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 }, delete: { alignItems: "center", backgroundColor: "#f9eeee", borderRadius: 19, height: 38, justifyContent: "center", width: 38 }, empty: { color: "#718078", fontFamily: fonts.medium, textAlign: "center" },
  bank: { backgroundColor: colors.white, borderColor: "transparent", borderRadius: 17, borderWidth: 1, marginRight: 8, maxWidth: 145, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10 }, bankActive: { backgroundColor: "#e9f8f0", borderColor: "#08b657" }, bankText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 10 }, input: { backgroundColor: colors.white, borderRadius: 19, color: colors.ink, height: 52, marginTop: 13, paddingHorizontal: 15 }, primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 23, height: 50, justifyContent: "center", marginTop: 13 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
});
