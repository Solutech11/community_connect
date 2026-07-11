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
import AppAlertModal from "../../components/ui/app-alert-modal";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";
type P = NativeStackScreenProps<RootStackParamList, "WalletTopUp">;
export default function TopUp({ navigation }: P) {
  const [a, setA] = useState("0.00");
  const [m, setM] = useState("Paystack");
  const [pay, setPay] = useState(false);
  return (
    <>
      <SafeAreaView edges={[]} style={s.safe}>
        <ProfilePageHeader title="Top-up Wallet" onBack={navigation.goBack} />
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.label}>Enter Amount</Text>
          <View style={s.box}>
            <Text style={s.dollar}>$</Text>
            <TextInput
              value={a}
              onChangeText={setA}
              keyboardType="decimal-pad"
              style={s.input}
            />
          </View>
          <View style={s.quick}>
            {["10", "20", "50", "100"].map((x) => (
              <Pressable
                key={x}
                onPress={() => setA(x + ".00")}
                style={[s.pill, a === x + ".00" && s.selected]}
              >
                <Text style={[s.bold, a === x + ".00" && s.white]}>$ {x}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.label, s.methods]}>Select Payment Method</Text>
          {["Paystack", "Korapay"].map((x) => (
            <Pressable
              key={x}
              onPress={() => setM(x)}
              style={[s.method, m === x && s.methodOn]}
            >
              <View style={s.icon}>
                <Ionicons
                  name={x === "Paystack" ? "business" : "card-outline"}
                  size={24}
                  color="#08b657"
                />
              </View>
              <Text style={s.methodName}>{x}</Text>
              <View style={[s.radio, m === x && s.radioOn]}>
                {m === x && (
                  <Ionicons name="checkmark" size={17} color="#fff" />
                )}
              </View>
            </Pressable>
          ))}
          <Pressable onPress={() => setPay(true)} style={s.proceed}>
            <Text style={s.proceedText}>Proceed to Pay</Text>
            <Ionicons name="arrow-forward" size={21} color="#fff" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={pay}
        title="Confirm Top-up"
        message={"Add $" + a + " to your wallet with " + m + "?"}
        onClose={() => setPay(false)}
      />
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24 },
  label: { color: "#439965", fontFamily: fonts.bold, fontSize: 13 },
  box: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 34,
    flexDirection: "row",
    height: 62,
    marginTop: 14,
    paddingHorizontal: 18,
  },
  dollar: { color: "#08b657", fontFamily: fonts.extraBold, fontSize: 25 },
  input: { flex: 1, fontFamily: fonts.extraBold, fontSize: 26, marginLeft: 9 },
  quick: { flexDirection: "row", gap: 12, marginTop: 24 },
  pill: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#bfead0",
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  selected: { backgroundColor: "#08b657" },
  bold: { fontFamily: fonts.bold },
  white: { color: "#fff" },
  methods: { marginTop: 46 },
  method: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "transparent",
    borderRadius: 42,
    borderWidth: 2,
    flexDirection: "row",
    marginTop: 14,
    minHeight: 84,
    padding: 16,
  },
  methodOn: { borderColor: "#08b657" },
  icon: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 25,
    height: 48,
    justifyContent: "center",
    marginRight: 16,
    width: 48,
  },
  methodName: { flex: 1, fontFamily: fonts.bold, fontSize: 18 },
  radio: {
    borderColor: "#bfe1cd",
    borderRadius: 14,
    borderWidth: 2,
    height: 25,
    width: 25,
  },
  radioOn: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderColor: "#08b657",
    justifyContent: "center",
  },
  proceed: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 30,
    flexDirection: "row",
    gap: 10,
    height: 58,
    justifyContent: "center",
    marginTop: 42,
  },
  proceedText: { color: "#fff", fontFamily: fonts.extraBold, fontSize: 17 },
});
