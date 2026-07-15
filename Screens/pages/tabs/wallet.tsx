import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TransactionDetailsSheet,
  WalletAccountDetailsSheet,
  type TransactionDetail,
} from "../../components/ui/wallet-detail-sheets";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;
const actions = [
  ["add-circle", "Top Up"],
  ["arrow-up", "Withdraw"],
  ["swap-horizontal", "Transfer"],
  ["information-circle-outline", "Details"],
] as const;
const tx = [
  ["body", "Ticket: Sunset Yoga", "Today, 4:30 PM", "-$25.00"],
  ["wallet", "Wallet Top-up", "Yesterday, 9:15 AM", "+$500.00"],
  ["cafe-outline", "Community Cafe", "Oct 12, 8:45 AM", "-$12.50"],
] as const;
export default function WalletScreen({ navigation }: Props) {
  const [account, setAccount] = useState(false);
  const [selected, setSelected] = useState<TransactionDetail | null>(null);
  return (
    <>
      <SafeAreaView edges={[]} style={s.safe}>
        <ProfilePageHeader title="My Wallet" onBack={navigation.goBack} />
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.card}>
            <Text style={s.label}>Total Balance</Text>
            <Text style={s.balance}>$2,840.50</Text>
            <View style={s.footer}>
              <Text style={s.mask}>**** 4920</Text>
              <Text style={s.active}>Active</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("AIChat")}
            style={s.aiInsight}
          >
            <View style={s.aiInsightIcon}>
              <Ionicons name="sparkles" size={20} color={colors.ink} />
            </View>
            <View style={s.aiInsightCopy}>
              <Text style={s.aiInsightLabel}>AI WALLET INSIGHT</Text>
              <Text style={s.aiInsightTitle}>
                Spending is 18% lower than last month
              </Text>
              <Text style={s.aiInsightText}>
                Ask AI for a breakdown or a personalized event budget.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={21} color="#08b657" />
          </Pressable>
          <View style={s.actions}>
            {actions.map(([i, l]) => (
              <Pressable
                key={l}
                onPress={() =>
                  l === "Top Up"
                    ? navigation.navigate("WalletTopUp")
                    : l === "Withdraw"
                      ? navigation.navigate("WalletWithdraw")
                      : l === "Transfer"
                        ? navigation.navigate("WalletTransfer")
                        : setAccount(true)
                }
                style={s.action}
              >
                <View style={s.circle}>
                  <Ionicons
                    name={i}
                    size={26}
                    color={l === "Top Up" ? "#08b657" : colors.ink}
                  />
                </View>
                <Text style={s.actionText}>{l}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.heading}>
            <Text style={s.title}>Recent Transactions</Text>
            <Pressable onPress={() => navigation.navigate("Transactions")}>
              <Text style={s.see}>See All</Text>
            </Pressable>
          </View>
          <View style={s.list}>
            {tx.map(([i, t, d, a], k) => (
              <View key={t}>
                <Pressable
                  onPress={() => setSelected({ title: t, date: d, amount: a })}
                  style={s.row}
                >
                  <View style={[s.txIcon, a[0] === "+" && s.credit]}>
                    <Ionicons
                      name={i}
                      size={22}
                      color={a[0] === "+" ? "#08b657" : colors.ink}
                    />
                  </View>
                  <View style={s.copy}>
                    <Text style={s.txTitle}>{t}</Text>
                    <Text style={s.date}>{d}</Text>
                  </View>
                  <Text style={[s.amount, a[0] === "+" && s.green]}>{a}</Text>
                </Pressable>
                {k < 2 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <WalletAccountDetailsSheet
        visible={account}
        onClose={() => setAccount(false)}
      />
      <TransactionDetailsSheet
        visible={!!selected}
        transaction={selected}
        onClose={() => setSelected(null)}
        onDispute={(transaction) => {
          setSelected(null);
          navigation.navigate("WalletDispute", { transaction });
        }}
      />
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 24, paddingBottom: 44 },
  card: {
    backgroundColor: "#083120",
    borderRadius: 44,
    marginTop: 30,
    minHeight: 158,
    padding: 24,
  },
  label: { color: "#bed0c7", fontFamily: fonts.medium, fontSize: 14 },
  balance: {
    color: "#fff",
    fontFamily: fonts.extraBold,
    fontSize: 27,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 31,
  },
  mask: { color: "#d3ddd8", fontFamily: fonts.bold },
  active: { color: "#0ed666", fontFamily: fonts.bold },
  aiInsight: {
    alignItems: "center",
    backgroundColor: "#e7f8ef",
    borderRadius: 25,
    flexDirection: "row",
    gap: 11,
    marginTop: 20,
    padding: 15,
  },
  aiInsightIcon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  aiInsightCopy: { flex: 1 },
  aiInsightLabel: {
    color: "#078f43",
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  aiInsightTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 2,
  },
  aiInsightText: {
    color: "#3b785a",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  action: { alignItems: "center", width: 70 },
  circle: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  actionText: { fontFamily: fonts.bold, fontSize: 12, marginTop: 8 },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 33,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 19 },
  see: { color: "#08b657", fontFamily: fonts.bold },
  list: {
    backgroundColor: "#fff",
    borderRadius: 38,
    marginTop: 15,
    paddingHorizontal: 16,
  },
  row: { alignItems: "center", flexDirection: "row", minHeight: 81 },
  txIcon: {
    alignItems: "center",
    backgroundColor: "#f3f5f4",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginRight: 15,
    width: 48,
  },
  credit: { backgroundColor: "#e5f8ee" },
  copy: { flex: 1 },
  txTitle: { fontFamily: fonts.bold, fontSize: 14 },
  date: { color: "#43a16b", fontFamily: fonts.bold, fontSize: 12 },
  amount: { fontFamily: fonts.extraBold, fontSize: 14 },
  green: { color: "#08b657" },
  divider: { backgroundColor: "#e9efec", height: 1, marginLeft: 63 },
});
