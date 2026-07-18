import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { GetWalletTransactionsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Transactions">;
type Transaction = GetWalletTransactionsResponse["data"]["transactions"][number];

const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
const title = (value: string) => value.split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");

export default function TransactionsConnectedScreen({ navigation }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1, refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const response = await walletApi.transactions({ page: nextPage, limit: 20 });
      setTransactions(response.data.transactions);
      setPage(response.data.pagination.page);
      setTotal(response.data.pagination.total);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load transactions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="Transactions" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(1, true)} />}>
        {loading ? <View style={styles.state}><ActivityIndicator color="#08b657" /></View> : null}
        {error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load(page)} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
        {!loading && !error && !transactions.length ? <View style={styles.state}><Ionicons color="#70a888" name="receipt-outline" size={38} /><Text style={styles.emptyTitle}>No transactions</Text></View> : null}
        <View style={styles.list}>
          {transactions.map((transaction) => (
            <Pressable
              key={transaction._id}
              onPress={() => navigation.navigate("TransactionDetails", { transactionId: transaction._id })}
              style={styles.row}
            >
              <View style={[styles.icon, transaction.direction === "credit" && styles.credit]}><Ionicons color={transaction.direction === "credit" ? "#08b657" : colors.ink} name={transaction.direction === "credit" ? "arrow-down" : "arrow-up"} size={21} /></View>
              <View style={styles.copy}><Text style={styles.title}>{title(transaction.type)}</Text><Text style={styles.meta}>{new Date(transaction.createdAt).toLocaleDateString("en-NG")} - {transaction.status}</Text></View>
              <Text style={[styles.amount, transaction.direction === "credit" && styles.green]}>{transaction.direction === "credit" ? "+" : "-"}{money(transaction.amountKobo)}</Text>
            </Pressable>
          ))}
        </View>
        {total > 20 ? <View style={styles.pagination}>
          <Pressable disabled={page <= 1} onPress={() => void load(page - 1)} style={styles.pageButton}><Text style={styles.pageText}>Previous</Text></Pressable>
          <Text style={styles.meta}>Page {page}</Text>
          <Pressable disabled={page * 20 >= total} onPress={() => void load(page + 1)} style={styles.pageButton}><Text style={styles.pageText}>Next</Text></Pressable>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 22, paddingBottom: 60 },
  list: { backgroundColor: colors.white, borderRadius: 28, overflow: "hidden", paddingHorizontal: 14 },
  row: { alignItems: "center", borderBottomColor: "#e8efeb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 80 },
  icon: { alignItems: "center", backgroundColor: "#f2f5f3", borderRadius: 22, height: 44, justifyContent: "center", width: 44 }, credit: { backgroundColor: "#e5f8ee" },
  copy: { flex: 1, marginLeft: 12 }, title: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 },
  amount: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 12 }, green: { color: "#08b657" },
  state: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, marginBottom: 16, padding: 28 }, error: { color: "#9c3f3f", fontFamily: fonts.medium, textAlign: "center" }, emptyTitle: { color: colors.ink, fontFamily: fonts.bold, marginTop: 10 },
  retry: { backgroundColor: colors.lime, borderRadius: 18, marginTop: 12, paddingHorizontal: 16, paddingVertical: 9 }, retryText: { color: colors.ink, fontFamily: fonts.bold },
  pagination: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 18 }, pageButton: { backgroundColor: colors.lime, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 9 }, pageText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
});
