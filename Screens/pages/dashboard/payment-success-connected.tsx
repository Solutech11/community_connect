import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentSuccess">;
type Event = GetEventsIdResponse["data"]["event"];
const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

export default function PaymentSuccessConnectedScreen({ navigation, route }: Props) {
  const [event, setEvent] = useState<Event | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    eventsApi.get(route.params.eventId, controller.signal).then((response) => setEvent(response.data.event)).catch(() => undefined);
    return () => controller.abort();
  }, [route.params.eventId]);

  return <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
    <View style={styles.container}>
      <View style={styles.badge}><Ionicons color={colors.ink} name="checkmark" size={44} /></View>
      <Text style={styles.title}>Congratulations!</Text>
      <Text style={styles.subtitle}>Your payment was verified by the backend and your tickets are confirmed.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>EVENT</Text>
        {event ? <Text style={styles.event}>{event.title}</Text> : <ActivityIndicator color="#08b657" style={{ marginTop: 12 }} />}
        <View style={styles.divider} />
        <Row label="Tickets" value={String(route.params.quantity)} />
        <Row label="Amount paid" value={money(route.params.total)} />
        <Row label="Status" value="Confirmed" success />
      </View>
    </View>
    <View style={styles.actions}>
      <Pressable onPress={() => navigation.navigate("MyEvents")} style={styles.primary}><Text style={styles.primaryText}>View My Tickets</Text></Pressable>
      <Pressable onPress={() => navigation.navigate("Home")} style={styles.secondary}><Text style={styles.secondaryText}>Back to Home</Text></Pressable>
    </View>
  </SafeAreaView>;
}

function Row({ label, value, success = false }: { label: string; value: string; success?: boolean }) { return <View style={styles.row}><Text style={styles.key}>{label}</Text><Text style={[styles.value, success && styles.success]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, container: { alignItems: "center", flex: 1, paddingHorizontal: 28, paddingTop: 52 }, badge: { alignItems: "center", backgroundColor: colors.lime, borderColor: "#dbffea", borderRadius: 60, borderWidth: 18, height: 122, justifyContent: "center", width: 122 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 32, marginTop: 27 }, subtitle: { color: "#66758c", fontFamily: fonts.medium, fontSize: 15, lineHeight: 23, marginTop: 12, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: 30, marginTop: 32, padding: 22, width: "100%" }, label: { color: "#08b657", fontFamily: fonts.bold, fontSize: 10 }, event: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 21, marginTop: 8 }, divider: { backgroundColor: "#edf1f5", height: 1, marginVertical: 17 }, row: { flexDirection: "row", justifyContent: "space-between", marginTop: 13 }, key: { color: "#66758c", fontFamily: fonts.medium, fontSize: 14 }, value: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 14 }, success: { color: "#18c964" },
  actions: { padding: 24 }, primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 26, height: 58, justifyContent: "center" }, primaryText: { color: colors.ink, fontFamily: fonts.extraBold }, secondary: { alignItems: "center", padding: 14 }, secondaryText: { color: "#65758c", fontFamily: fonts.bold },
});
