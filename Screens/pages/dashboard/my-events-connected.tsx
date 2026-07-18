import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../../services/api/client";
import { ticketsApi } from "../../services/api/tickets.api";
import { colors, fonts } from "../../styles/theme";
import type { GetTicketsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MyEvents">;
type Ticket = GetTicketsResponse["data"]["tickets"][number];
type Tab = "Upcoming" | "Past";
const IMAGES = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=86",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=86",
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=86",
];

export default function MyEventsConnectedScreen({ navigation }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    try { setTickets((await ticketsApi.list()).data.tickets); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to load your tickets."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => tickets.filter((ticket) => {
    const ended = new Date(ticket.eventId.endsAt).getTime() < Date.now();
    return tab === "Past" ? ended : !ended;
  }), [tab, tickets]);

  return <SafeAreaView edges={["top"]} style={styles.safe}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={styles.back}><Ionicons color={colors.ink} name="arrow-back" size={27} /></Pressable><Text style={styles.headerTitle}>My Events</Text><View style={styles.back} /></View>
    <View style={styles.tabs}>{(["Upcoming", "Past"] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
      {loading ? <View style={styles.state}><ActivityIndicator color="#08b657" /></View> : null}
      {error ? <View style={styles.state}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
      {!loading && !error && visible.map((ticket, index) => {
        const date = new Date(ticket.eventId.startsAt);
        return <Pressable key={ticket._id} onPress={() => navigation.navigate("MyEventDetails", { orderNumber: ticket.orderNumber, eventId: ticket.eventId._id })} style={styles.card}>
          <ImageBackground imageStyle={styles.imageRadius} source={{ uri: IMAGES[index % IMAGES.length] }} style={styles.image}><View style={styles.shade} /><View style={styles.date}><Text style={styles.month}>{date.toLocaleString("en-NG", { month: "short" }).toUpperCase()}</Text><Text style={styles.day}>{date.getDate()}</Text></View><View style={styles.qr}><Ionicons color={colors.white} name="qr-code-outline" size={24} /></View></ImageBackground>
          <View style={styles.body}><Text style={styles.title}>{ticket.eventId.title}</Text><Text style={styles.meta}><Ionicons color="#4aa26f" name="time-outline" size={15} /> {date.toLocaleString("en-NG")}</Text><Text style={styles.meta}><Ionicons color="#4aa26f" name="location-outline" size={15} /> {ticket.eventId.venueName}, {ticket.eventId.lga}</Text><View style={styles.footer}><Text style={styles.tier}>{ticket.ticketTypeId.title} x{ticket.quantity}</Text><Text style={styles.view}>View Ticket</Text></View></View>
        </Pressable>;
      })}
      {!loading && !error && !visible.length ? <View style={styles.state}><Ionicons color="#70a888" name="ticket-outline" size={40} /><Text style={styles.emptyTitle}>No {tab.toLowerCase()} tickets</Text></View> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 20 }, back: { width: 38 }, headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 23 },
  tabs: { backgroundColor: colors.white, borderRadius: 23, flexDirection: "row", marginHorizontal: 22, padding: 5 }, tab: { alignItems: "center", borderRadius: 18, flex: 1, padding: 12 }, tabActive: { backgroundColor: "#15bb59" }, tabText: { color: "#4aa26f", fontFamily: fonts.bold }, tabTextActive: { color: colors.white }, content: { padding: 22, paddingBottom: 60 },
  card: { backgroundColor: colors.white, borderRadius: 30, marginBottom: 18, overflow: "hidden" }, image: { height: 180, padding: 14 }, imageRadius: { borderTopLeftRadius: 30, borderTopRightRadius: 30 }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,25,15,.18)" }, date: { alignItems: "center", backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, position: "absolute", left: 14, top: 14 }, month: { color: "#08a850", fontFamily: fonts.bold, fontSize: 9 }, day: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, qr: { alignItems: "center", backgroundColor: "rgba(5,30,18,.75)", borderRadius: 20, height: 40, justifyContent: "center", position: "absolute", right: 14, top: 14, width: 40 },
  body: { padding: 18 }, title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 19 }, meta: { color: "#557066", fontFamily: fonts.medium, fontSize: 11, marginTop: 9 }, footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 15 }, tier: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 }, view: { backgroundColor: colors.lime, borderRadius: 17, color: colors.ink, fontFamily: fonts.bold, fontSize: 10, overflow: "hidden", paddingHorizontal: 13, paddingVertical: 9 },
  state: { alignItems: "center", backgroundColor: colors.white, borderRadius: 24, padding: 30 }, error: { color: "#9c3f3f", fontFamily: fonts.medium, textAlign: "center" }, retry: { backgroundColor: colors.lime, borderRadius: 17, marginTop: 12, paddingHorizontal: 16, paddingVertical: 9 }, retryText: { color: colors.ink, fontFamily: fonts.bold }, emptyTitle: { color: colors.ink, fontFamily: fonts.bold, marginTop: 10 },
});
