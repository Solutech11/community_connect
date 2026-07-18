import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppShareSheet from "../../components/ui/app-share-sheet";
import { ApiError } from "../../services/api/client";
import { ticketsApi } from "../../services/api/tickets.api";
import { colors, fonts } from "../../styles/theme";
import type { GetTicketsOrderNumberResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MyEventDetails">;
type TicketDetails = GetTicketsOrderNumberResponse["data"];

export default function MyEventDetailsConnectedScreen({ navigation, route }: Props) {
  const orderNumber = route.params.orderNumber;
  const [details, setDetails] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    if (!orderNumber) { setError("This ticket was opened without an order number."); setLoading(false); return; }
    const controller = new AbortController();
    ticketsApi.get(orderNumber, controller.signal).then((response) => setDetails(response.data)).catch((requestError) => {
      if (requestError instanceof ApiError && requestError.code === "REQUEST_CANCELLED") return;
      setError(requestError instanceof ApiError ? requestError.message : "Unable to load this ticket.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [orderNumber]);

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color="#08b657" /></SafeAreaView>;
  if (!details) return <SafeAreaView style={styles.safe}><View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={navigation.goBack} style={styles.primary}><Text style={styles.primaryText}>Go back</Text></Pressable></View></SafeAreaView>;

  const { order, qrToken } = details;
  const qrSource = { uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrToken)}` };
  const share = async () => { try { await Share.share({ message: `Ticket ${order.orderNumber} for ${order.eventId.title}` }); } catch { setError("Unable to share this ticket."); } };

  return <>
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}><Pressable onPress={navigation.goBack}><Ionicons color={colors.ink} name="arrow-back" size={27} /></Pressable><Text style={styles.headerTitle}>Your Ticket</Text><Pressable onPress={() => setShareVisible(true)}><Ionicons color={colors.ink} name="share-social-outline" size={24} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ticket}><Text style={styles.ready}>READY FOR CHECK-IN</Text><Text style={styles.title}>{order.eventId.title}</Text><Text style={styles.number}>#{order.orderNumber}</Text><View style={styles.qr}><Image source={qrSource} style={styles.qrImage} /></View><Text style={styles.hint}>Present this backend-issued QR token at the entrance</Text><View style={styles.divider} /><Text style={styles.label}>TICKET</Text><Text style={styles.value}>{order.ticketTypeId.title} x{order.quantity}</Text><Text style={styles.label}>WHEN</Text><Text style={styles.value}>{new Date(order.eventId.startsAt).toLocaleString("en-NG")}</Text><Text style={styles.label}>WHERE</Text><Text style={styles.value}>{order.eventId.venueName}{"\n"}{order.eventId.address}</Text><Text style={styles.label}>STATUS</Text><Text style={styles.value}>{order.status}</Text></View>
      </ScrollView>
    </SafeAreaView>
    <AppShareSheet visible={shareVisible} description={`Share your ticket for ${order.eventId.title}`} onClose={() => setShareVisible(false)} onCopyLink={() => setError(`Ticket number: ${order.orderNumber}`)} onInvite={share} onShareTo={share} />
    <AppAlertModal visible={Boolean(error)} title="Ticket" message={error ?? ""} onClose={() => setError(null)} />
  </>;
}

const styles = StyleSheet.create({
  safe: { alignItems: "stretch", backgroundColor: colors.paper, flex: 1, justifyContent: "center" }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 20 }, headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20 }, content: { padding: 22, paddingBottom: 60 },
  ticket: { backgroundColor: colors.white, borderRadius: 32, padding: 24 }, ready: { alignSelf: "center", backgroundColor: "#e7fff0", borderRadius: 15, color: "#08a850", fontFamily: fonts.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 13, paddingVertical: 7 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 25, marginTop: 17, textAlign: "center" }, number: { color: "#269b5b", fontFamily: fonts.medium, fontSize: 12, marginTop: 5, textAlign: "center" },
  qr: { alignItems: "center", alignSelf: "center", backgroundColor: "#fbfdfc", borderRadius: 26, height: 210, justifyContent: "center", marginTop: 22, width: 210 }, qrImage: { height: 180, width: 180 }, hint: { color: "#82948b", fontFamily: fonts.medium, fontSize: 10, marginTop: 12, textAlign: "center" }, divider: { backgroundColor: "#e5ece8", height: 1, marginVertical: 20 }, label: { color: "#159b51", fontFamily: fonts.bold, fontSize: 9, marginTop: 13 }, value: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13, lineHeight: 19, marginTop: 4, textTransform: "capitalize" },
  state: { alignItems: "center", padding: 30 }, error: { color: "#9c3f3f", fontFamily: fonts.medium, textAlign: "center" }, primary: { backgroundColor: colors.lime, borderRadius: 19, marginTop: 15, paddingHorizontal: 17, paddingVertical: 11 }, primaryText: { color: colors.ink, fontFamily: fonts.bold },
});
