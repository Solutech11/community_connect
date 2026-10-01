import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AppState,
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
type Payout = GetWalletResponse["data"]["payout"];
type Transaction = GetWalletTransactionsResponse["data"]["transactions"][number];

function money(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}

function transactionTitle(type: string) {
  return type.split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}

export default function WalletConnectedScreen({ navigation }: Props) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payout, setPayout] = useState<Payout | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const clock = useRef({ remainingMs: 0, sampledAt: 0 });
  const loadingRequest = useRef<{ signal?: AbortSignal } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false, signal?: AbortSignal) => {
    if (signal?.aborted || (loadingRequest.current && !loadingRequest.current.signal?.aborted)) return;
    const activeRequest = { signal };
    loadingRequest.current = activeRequest;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletApi.get(signal),
        walletApi.transactions({ page: 1, limit: 5 }, signal),
      ]);
      if (signal?.aborted) return;
      setWallet(walletResponse.data.wallet);
      setPayout(walletResponse.data.payout);
      const schedule = walletResponse.data.payout;
      clock.current = {
        remainingMs: Math.max(0, Date.parse(schedule.nextPayoutAt) - Date.parse(schedule.serverTime)),
        sampledAt: performance.now(),
      };
      setRemainingSeconds(Math.ceil(clock.current.remainingMs / 1000));
      setTransactions(transactionsResponse.data.transactions);
    } catch (requestError) {
      if (signal?.aborted) return;
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load your wallet.");
    } finally {
      if (loadingRequest.current === activeRequest) loadingRequest.current = null;
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void load(false, controller.signal);
    // Use a monotonic elapsed clock; changing the phone's time cannot move the
    // server's midnight schedule. Refetch on foreground and across settlement.
    const countdown = setInterval(() => {
      const remaining = Math.max(0, clock.current.remainingMs - (performance.now() - clock.current.sampledAt));
      setRemainingSeconds(Math.ceil(remaining / 1000));
    }, 1000);
    const refresh = setInterval(() => { void load(true, controller.signal); }, 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void load(true, controller.signal);
    });
    return () => {
      controller.abort();
      clearInterval(countdown);
      clearInterval(refresh);
      subscription.remove();
    };
  }, [load]));

  const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="My Wallet" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        {loading ? <View style={styles.state}><AppLoader color="#08b657" /><Text style={styles.stateCopy}>Loading wallet...</Text></View> : null}
        {error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
        {wallet ? <>
          <View style={styles.card}>
            <Text style={styles.label}>Wallet balance</Text>
            <Text style={styles.balance}>{money(wallet.availableBalanceKobo + wallet.pendingBalanceKobo)}</Text>
            <View style={styles.footer}>
              <Text style={styles.mask}>{wallet.walletNumber}</Text>
              <Text style={styles.active}>{wallet.status}</Text>
            </View>
            {wallet.pendingBalanceKobo ? <Text style={styles.pending}>Payout processing: {money(wallet.pendingBalanceKobo)}</Text> : null}
          </View>
          {payout ? (
            <View style={styles.payoutCard}>
              <View style={styles.payoutHeading}>
                <Ionicons name="time-outline" size={22} color="#08b657" />
                <Text style={styles.title}>Automatic payout</Text>
              </View>
              <Text style={styles.countdown}>{hours}:{minutes}:{seconds}</Text>
              <Text style={styles.payoutCopy}>Daily at midnight (Africa/Lagos)</Text>
              <Text style={styles.payoutCopy}>Minimum payout: {money(payout.minimumAmountKobo)}</Text>
              <Text style={styles.payoutCopy}>
                {payout.status === "paused"
                  ? "Your wallet is paused. Contact support about your payout."
                  : payout.status === "processing"
                    ? "Your payout is processing. Your balance clears when the bank transfer is confirmed."
                    : payout.status === "bank_required"
                      ? "Your funds stay pending until you link a bank account. We will email you a reminder at each daily payout."
                      : payout.status === "below_minimum"
                        ? `Your balance is below ${money(payout.minimumAmountKobo)}. Funds stay in your wallet until you reach the minimum.`
                        : payout.status === "empty"
                        ? "Ticket and community earnings will appear here and be paid automatically."
                        : "Your wallet balance will be sent to your linked bank at the next daily payout."}
              </Text>
              {payout.bankAccount ? (
                <View style={styles.bankDetails}>
                  <Text style={styles.txTitle}>{payout.bankAccount.bankName}</Text>
                  <Text style={styles.payoutCopy}>{payout.bankAccount.accountName} - {payout.bankAccount.maskedAccountNumber}</Text>
                </View>
              ) : null}
              <Pressable onPress={() => navigation.navigate("BankAccounts")} style={styles.bankButton}>
                <Ionicons name="business-outline" size={19} color={colors.ink} />
                <Text style={styles.retryText}>{payout.bankAccount ? "Manage bank accounts" : "Link bank account"}</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.heading}><Text style={styles.title}>Recent Transactions</Text><Pressable onPress={() => navigation.navigate("Transactions")}><Text style={styles.see}>See All</Text></Pressable></View>
          <View style={styles.list}>
            {transactions.length ? transactions.map((transaction) => (
              <Pressable
                key={transaction._id}
                onPress={() => navigation.navigate("TransactionDetails", { transactionId: transaction._id })}
                style={styles.row}
              >
                <View style={[styles.txIcon, transaction.direction === "credit" && styles.credit]}><Ionicons name={transaction.direction === "credit" ? "arrow-down" : "arrow-up"} size={21} color={transaction.direction === "credit" ? "#08b657" : colors.ink} /></View>
                <View style={styles.copy}><Text style={styles.txTitle}>{transaction.type === "withdrawal" ? "Bank payout" : transactionTitle(transaction.type)}</Text><Text style={styles.date}>{transaction.status}</Text></View>
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
  payoutCard: {
    backgroundColor: colors.white,
    borderRadius: 26,
    marginTop: 20,
    padding: 22,
  },
  payoutHeading: { alignItems: "center", flexDirection: "row", gap: 10 },
  countdown: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    marginTop: 16,
  },
  payoutCopy: { color: "#526b5f", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, marginTop: 7 },
  bankDetails: { borderTopColor: "#e9efec", borderTopWidth: 1, marginTop: 16, paddingTop: 14 },
  bankButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 13,
  },
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
