import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppLoader from "../../components/ui/app-loader";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { GetWalletResponse, GetWalletTransactionsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;
type Wallet = GetWalletResponse["data"]["wallet"];
type Transaction = GetWalletTransactionsResponse["data"]["transactions"][number];

function money(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

function transactionTitle(type: string) {
  return type.split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}

export default function WalletConnectedScreen({ navigation }: Props) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletApi.get(),
        walletApi.transactions({ page: 1, limit: 5 }),
      ]);
      setWallet(walletResponse.data.wallet);
      setTransactions(transactionsResponse.data.transactions);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load your wallet.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="My Wallet" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        {loading ? <View style={styles.state}><AppLoader color="#08b657" /><Text style={styles.stateCopy}>Loading wallet...</Text></View> : null}
        {error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
        {wallet ? <>
          <View style={styles.card}>
            <Text style={styles.label}>Available Balance</Text>
            <Text style={styles.balance}>{money(wallet.availableBalanceKobo)}</Text>
            <View style={styles.footer}>
              <Text style={styles.mask}>{wallet.walletNumber}</Text>
              <Text style={styles.active}>{wallet.status}</Text>
            </View>
            {wallet.pendingBalanceKobo ? <Text style={styles.pending}>Pending: {money(wallet.pendingBalanceKobo)}</Text> : null}
          </View>
          <View style={styles.actions}>
            {[
              ["add-circle", "Top Up", "WalletTopUp"],
              ["arrow-up", "Withdraw", "WalletWithdraw"],
              ["swap-horizontal", "Transfer", "WalletTransfer"],
              ["business-outline", "Banks", "BankAccounts"],
            ].map(([icon, label, route]) => (
              <Pressable key={label} onPress={() => {
                if (route === "WalletTopUp") navigation.navigate("WalletTopUp");
                else if (route === "WalletWithdraw") navigation.navigate("WalletWithdraw");
                else if (route === "WalletTransfer") navigation.navigate("WalletTransfer");
                else navigation.navigate("BankAccounts");
              }} style={styles.action}>
                <View style={styles.circle}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={25} color={label === "Top Up" ? "#08b657" : colors.ink} /></View>
                <Text style={styles.actionText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.heading}><Text style={styles.title}>Recent Transactions</Text><Pressable onPress={() => navigation.navigate("Transactions")}><Text style={styles.see}>See All</Text></Pressable></View>
          <View style={styles.list}>
            {transactions.length ? transactions.map((transaction) => (
              <Pressable
                key={transaction._id}
                onPress={() => navigation.navigate("TransactionDetails", { transactionId: transaction._id })}
                style={styles.row}
              >
                <View style={[styles.txIcon, transaction.direction === "credit" && styles.credit]}><Ionicons name={transaction.direction === "credit" ? "arrow-down" : "arrow-up"} size={21} color={transaction.direction === "credit" ? "#08b657" : colors.ink} /></View>
                <View style={styles.copy}><Text style={styles.txTitle}>{transactionTitle(transaction.type)}</Text><Text style={styles.date}>{transaction.status}</Text></View>
                <Text style={[styles.amount, transaction.direction === "credit" && styles.green]}>{transaction.direction === "credit" ? "+" : "-"}{money(transaction.amountKobo)}</Text>
              </Pressable>
            )) : <Text style={styles.empty}>No wallet transactions yet.</Text>}
          </View>
        </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 44, paddingHorizontal: 24 },
  state: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, marginTop: 24, padding: 28 },
  stateCopy: { color: "#718078", fontFamily: fonts.medium, marginTop: 10 },
  error: { color: "#9c3f3f", fontFamily: fonts.medium, textAlign: "center" },
  retry: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 14, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: colors.ink, fontFamily: fonts.bold },
  card: { backgroundColor: "#083120", borderRadius: 38, marginTop: 30, minHeight: 158, padding: 24 },
  label: { color: "#bed0c7", fontFamily: fonts.medium, fontSize: 14 },
  balance: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 27, marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 26 },
  mask: { color: "#d3ddd8", fontFamily: fonts.bold },
  active: { color: "#0ed666", fontFamily: fonts.bold, textTransform: "capitalize" },
  pending: { color: "#a9c4b7", fontFamily: fonts.medium, fontSize: 10, marginTop: 8 },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 30 },
  action: { alignItems: "center", width: 85 },
  circle: { alignItems: "center", backgroundColor: colors.white, borderRadius: 30, height: 56, justifyContent: "center", width: 56 },
  actionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12, marginTop: 8 },
  heading: { flexDirection: "row", justifyContent: "space-between", marginTop: 33 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 19 },
  see: { color: "#08b657", fontFamily: fonts.bold },
  list: { backgroundColor: colors.white, borderRadius: 30, marginTop: 15, overflow: "hidden", paddingHorizontal: 16 },
  row: { alignItems: "center", borderBottomColor: "#e9efec", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 81 },
  txIcon: { alignItems: "center", backgroundColor: "#f3f5f4", borderRadius: 24, height: 48, justifyContent: "center", marginRight: 15, width: 48 },
  credit: { backgroundColor: "#e5f8ee" },
  copy: { flex: 1 },
  txTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  date: { color: "#43a16b", fontFamily: fonts.bold, fontSize: 10, marginTop: 4, textTransform: "capitalize" },
  amount: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 12 },
  green: { color: "#08b657" },
  empty: { color: "#718078", fontFamily: fonts.medium, padding: 24, textAlign: "center" },
});
