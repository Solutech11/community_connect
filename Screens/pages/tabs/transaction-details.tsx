import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { walletApi } from "../../services/api/wallet.api";
import { colors, fonts } from "../../styles/theme";
import type { GetWalletTransactionsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "TransactionDetails">;
type Transaction = GetWalletTransactionsIdResponse["data"]["transaction"];

const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
const label = (value: string) => value.split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");

export default function TransactionDetailsScreen({ navigation, route }: Props) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    walletApi.transaction(route.params.transactionId, controller.signal)
      .then((response) => setTransaction(response.data.transaction))
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.code === "REQUEST_CANCELLED") return;
        setError(requestError instanceof ApiError ? requestError.message : "Unable to load this transaction.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.transactionId]);

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Transaction Details" onBack={navigation.goBack} />
        {loading ? <View style={styles.loading}><ActivityIndicator color="#08b657" /></View> : null}
        {transaction ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.amountCard}>
              <View style={[styles.icon, transaction.direction === "credit" && styles.credit]}>
                <Ionicons color={transaction.direction === "credit" ? "#08b657" : colors.ink} name={transaction.direction === "credit" ? "arrow-down" : "arrow-up"} size={28} />
              </View>
              <Text style={styles.type}>{label(transaction.type)}</Text>
              <Text style={styles.amount}>{transaction.direction === "credit" ? "+" : "-"}{money(transaction.amountKobo)}</Text>
              <Text style={styles.status}>{transaction.status}</Text>
            </View>
            <View style={styles.details}>
              <Row title="Reference" value={transaction.reference} />
              <Row title="Provider" value={transaction.provider} />
              <Row title="Direction" value={transaction.direction} />
              <Row title="Amount" value={money(transaction.amountKobo)} />
              <Row title="Fee" value={money(transaction.feeKobo)} />
              <Row title="Created" value={new Date(transaction.createdAt).toLocaleString("en-NG")} />
            </View>
            <Pressable
              onPress={() => navigation.navigate("WalletDispute", { transaction: { id: transaction._id, title: label(transaction.type), date: transaction.createdAt, amount: money(transaction.amountKobo) } })}
              style={styles.dispute}
            >
              <Ionicons color="#a34b4b" name="help-circle-outline" size={21} />
              <Text style={styles.disputeText}>Report a problem with this transaction</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </SafeAreaView>
      <AppAlertModal message={error ?? ""} onClose={() => { setError(null); navigation.goBack(); }} title="Transaction unavailable" visible={Boolean(error)} />
    </>
  );
}

function Row({ title, value }: { title: string; value: string }) {
  return <View style={styles.row}><Text style={styles.key}>{title}</Text><Text selectable style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, loading: { alignItems: "center", flex: 1, justifyContent: "center" }, content: { padding: 22, paddingBottom: 70 }, amountCard: { alignItems: "center", backgroundColor: "#083120", borderRadius: 30, padding: 25 }, icon: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 28, height: 56, justifyContent: "center", width: 56 }, credit: { backgroundColor: "#d9f8e7" }, type: { color: "#c7dbd0", fontFamily: fonts.bold, fontSize: 12, marginTop: 14 }, amount: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 28, marginTop: 6 }, status: { color: colors.lime, fontFamily: fonts.bold, fontSize: 11, marginTop: 8, textTransform: "capitalize" },
  details: { backgroundColor: colors.white, borderRadius: 24, marginTop: 16, paddingHorizontal: 16 }, row: { alignItems: "flex-start", borderBottomColor: "#e8efeb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 }, key: { color: "#718078", fontFamily: fonts.medium, fontSize: 11 }, value: { color: colors.ink, flex: 1, fontFamily: fonts.bold, fontSize: 11, marginLeft: 18, textAlign: "right", textTransform: "capitalize" }, dispute: { alignItems: "center", backgroundColor: "#f9eeee", borderRadius: 21, flexDirection: "row", gap: 9, justifyContent: "center", marginTop: 17, padding: 14 }, disputeText: { color: "#934646", fontFamily: fonts.bold, fontSize: 11 },
});
