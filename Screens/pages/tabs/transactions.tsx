import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import {
  TransactionDetailsSheet,
  type TransactionDetail,
} from "../../components/ui/wallet-detail-sheets";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type P = NativeStackScreenProps<RootStackParamList, "Transactions">;
const rows = [
  ["ticket-outline", "Ticket: Sunset Yoga", "Oct 24, 6:30 PM", "-$25.00"],
  ["wallet", "Wallet Top-up", "Oct 20, 10:15 AM", "+$500.00"],
  ["restaurant", "Food: Vegan Fest", "Oct 12, 1:00 PM", "-$18.50"],
  ["sync", "Refund: Cancelled Class", "Sep 28, 9:00 AM", "+$15.00"],
  ["ticket-outline", "Ticket: Pottery Workshop", "Sep 15, 4:45 PM", "-$45.00"],
] as const;
export default function Transactions({ navigation }: P) {
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TransactionDetail | null>(null);
  const shown = rows.filter(
    (r) =>
      (f === "All" ||
        (f === "Purchases" && r[3][0] === "-") ||
        (f === "Refunds" && r[1].startsWith("Refund")) ||
        (f === "Wallet Top-ups" && r[1].includes("Top-up"))) &&
      r[1].toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <SafeAreaView edges={[]} style={s.safe}>
        <ProfilePageHeader title="Transactions" onBack={navigation.goBack} />
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.search}>
            <Ionicons name="search" size={22} color="#439965" />
            <TextInput
              placeholder="Search transactions..."
              value={q}
              onChangeText={setQ}
              style={s.input}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filters}
          >
            {["All", "Purchases", "Refunds", "Wallet Top-ups"].map((x) => (
              <Pressable
                key={x}
                onPress={() => setF(x)}
                style={[s.pill, f === x && s.sel]}
              >
                <Text style={[s.pillText, f === x && s.white]}>{x}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {shown.map((r, i) => (
            <View key={r[1]}>
              <Text style={s.month}>
                {i === 0 ? "OCTOBER 2023" : i === 3 ? "SEPTEMBER 2023" : ""}
              </Text>
              <Pressable
                onPress={() =>
                  setSelected({ title: r[1], date: r[2], amount: r[3] })
                }
                style={s.row}
              >
                <View style={s.icon}>
                  <Ionicons name={r[0]} size={22} color="#08b657" />
                </View>
                <View style={s.copy}>
                  <Text style={s.name}>{r[1]}</Text>
                  <Text style={s.date}>{r[2]}</Text>
                </View>
                <Text style={[s.amount, r[3][0] === "+" && s.green]}>
                  {r[3]}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
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
  content: { paddingBottom: 40 },
  search: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    flexDirection: "row",
    margin: 24,
    paddingHorizontal: 22,
  },
  input: { flex: 1, fontFamily: fonts.medium, height: 56, marginLeft: 12 },
  filters: { gap: 12 },
  pill: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sel: { backgroundColor: "#0ab85a" },
  pillText: { fontFamily: fonts.bold, fontSize: 13 },
  white: { color: "#fff" },
  month: {
    color: "#439965",
    fontFamily: fonts.bold,
    fontSize: 13,
    marginHorizontal: 24,
    marginTop: 28,
  },
  row: {
    alignItems: "center",
    backgroundColor: "#fff",
    flexDirection: "row",
    marginHorizontal: 24,
    marginTop: 14,
    minHeight: 72,
    padding: 14,
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#f1faf5",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginRight: 14,
    width: 48,
  },
  copy: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  date: {
    color: "#439965",
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 4,
  },
  amount: { fontFamily: fonts.extraBold },
  green: { color: "#08b657" },
});
