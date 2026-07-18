import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppAlertModal from "../../components/ui/app-alert-modal";
import TicketPurchaseDetailsSheet, {
  type PurchasedTicket,
} from "../../components/ui/ticket-purchase-details-sheet";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import type { GetEventsIdResponse } from "../../types/api.generated";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ManageCreatedEvent">;
const fallbackGuests: PurchasedTicket[] = [
  {
    name: "Elena Rodriguez",
    ticket: "VIP Access",
    status: "Checked In",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85",
  },
  {
    name: "Marcus Chen",
    ticket: "General Admission",
    status: "Pending",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=85",
  },
  {
    name: "Sarah Jenkins",
    ticket: "Backstage Pass",
    status: "Checked In",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85",
  },
  {
    name: "Jordan Smith",
    ticket: "General Admission",
    status: "Pending",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=85",
  },
];
export default function ManageCreatedEventScreen({ navigation, route }: Props) {
  const eventId = route.params?.eventId;
  const [event, setEvent] = useState<GetEventsIdResponse["data"]["event"] | null>(null);
  const [guests, setGuests] = useState<PurchasedTicket[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchasedTicket | null>(null);
  useEffect(() => {
    if (!eventId) {
      setNotice("No event was selected.");
      return;
    }
    const controller = new AbortController();
    Promise.all([eventsApi.get(eventId, controller.signal), eventsApi.attendees(eventId, controller.signal)])
      .then(([eventResponse, attendeeResponse]) => {
        setEvent(eventResponse.data.event);
        setTotalGuests(attendeeResponse.data.attendees.reduce((sum, order) => sum + order.quantity, 0));
        setGuests(attendeeResponse.data.attendees.map((order, index) => ({
          name: order.buyerId.firstName + " " + order.buyerId.lastName,
          ticket: order.ticketTypeId.title,
          status: "Pending",
          avatar: index % 2
            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=85"
            : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85",
        })));
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED") return;
        setNotice(error instanceof ApiError ? error.message : "Unable to load event management data.");
      });
    return () => controller.abort();
  }, [eventId]);
  const shown = useMemo(
    () =>
      guests.filter(
        (x) =>
          (!pendingOnly || x.status === "Pending") &&
          x.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [pendingOnly, query],
  );
  return (
    <>
      <SafeAreaView edges={[]} style={s.safe}>
        <ProfilePageHeader title="Manage Event" onBack={navigation.goBack} />
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=90",
            }}
            style={s.hero}
            imageStyle={s.heroImage}
          >
            <View style={s.shade} />
            <View style={s.live}>
              <Text style={s.liveText}>LIVE NOW</Text>
            </View>
            <Text style={s.heroTitle}>{event?.title ?? "Loading event..."}</Text>
          </ImageBackground>
          <View style={s.location}>
            <Ionicons name="location-outline" size={21} color="#29965a" />
            <Text style={s.locationText}>
              {event ? event.venueName + ", " + event.address : "Loading location..."}
            </Text>
          </View>
          <Text numberOfLines={2} style={s.description}>
            {event?.description ?? "Loading event details..."}
          </Text>
          <Pressable
            onPress={() => eventId && navigation.navigate("TicketScanner", { eventId })}
            style={s.scanner}
          >
            <View>
              <Text style={s.scannerLabel}>Check-in Terminal</Text>
              <Text style={s.scannerTitle}>Scan Tickets</Text>
            </View>
            <View style={s.qr}>
              <Ionicons name="qr-code-outline" size={42} color="#fff" />
            </View>
          </Pressable>
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statLabel}>Total Guests</Text>
              <Text style={s.statValue}>{totalGuests}</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Checked In</Text>
              <Text style={[s.statValue, s.green]}>0</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Sold</Text>
              <Text style={s.statValue}>{event?.maxCapacity ? Math.round((totalGuests / event.maxCapacity) * 100) + "%" : "0%"}</Text>
            </View>
          </View>
          <View style={s.ticketHeading}>
            <Text style={s.ticketTitle}>Tickets</Text>
            <View style={s.tools}>
              <Pressable onPress={() => setSearching((x) => !x)} style={s.tool}>
                <Ionicons name="search" size={24} color="#29965a" />
              </Pressable>
              <Pressable
                onPress={() => setPendingOnly((x) => !x)}
                style={[s.tool, pendingOnly && s.toolOn]}
              >
                <Ionicons name="filter" size={23} color="#29965a" />
              </Pressable>
            </View>
          </View>
          {searching && (
            <View style={s.search}>
              <Ionicons name="search" size={20} color="#29965a" />
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search guests..."
                style={s.searchInput}
              />
            </View>
          )}
          {shown.map((x) => (
            <Pressable
              key={x.name}
              onPress={() => setSelected(x)}
              style={s.guest}
            >
              <Image source={{ uri: x.avatar }} style={s.avatar} />
              <View style={s.guestCopy}>
                <Text style={s.guestName}>{x.name}</Text>
                <Text style={s.ticketType}>{x.ticket}</Text>
              </View>
              <View style={[s.status, x.status === "Pending" && s.pending]}>
                <Ionicons
                  name={
                    x.status === "Pending"
                      ? "ellipse-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color={x.status === "Pending" ? "#8193aa" : "#08b657"}
                />
                <Text
                  style={[
                    s.statusText,
                    x.status === "Pending" && s.pendingText,
                  ]}
                >
                  {x.status}
                </Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={21} color="#29965a" />
            </Pressable>
          ))}
          {!shown.length && (
            <Text style={s.empty}>No matching guests found.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
      <TicketPurchaseDetailsSheet
        visible={!!selected}
        ticket={selected}
        onClose={() => setSelected(null)}
      />
      <AppAlertModal
        visible={!!notice}
        title={notice ?? ""}
        message={
          notice === "Ticket Scanner"
            ? "The camera ticket scanner will open here."
            : "Guest ticket actions will be available here."
        }
        onClose={() => setNotice(null)}
      />
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, paddingBottom: 50 },
  hero: {
    height: 245,
    justifyContent: "flex-end",
    marginTop: 20,
    overflow: "hidden",
    padding: 20,
  },
  heroImage: { borderRadius: 38 },
  shade: {
    backgroundColor: "rgba(0,0,0,.38)",
    borderRadius: 38,
    ...StyleSheet.absoluteFillObject,
  },
  live: {
    alignSelf: "flex-start",
    backgroundColor: "#08b657",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  liveText: { color: "#fff", fontFamily: fonts.bold, fontSize: 12 },
  heroTitle: {
    color: "#fff",
    fontFamily: fonts.extraBold,
    fontSize: 27,
    lineHeight: 34,
    marginTop: 10,
  },
  location: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  locationText: { color: "#29965a", fontFamily: fonts.medium, fontSize: 15 },
  description: {
    color: "#304039",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  scanner: {
    alignItems: "center",
    backgroundColor: "#0abb58",
    borderRadius: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 34,
    padding: 24,
  },
  scannerLabel: { color: "#d5f6e3", fontFamily: fonts.medium, fontSize: 17 },
  scannerTitle: {
    color: "#fff",
    fontFamily: fonts.extraBold,
    fontSize: 28,
    marginTop: 5,
  },
  qr: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.2)",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  stats: { flexDirection: "row", gap: 14, marginTop: 34 },
  stat: { backgroundColor: "#fff", flex: 1, minHeight: 118, padding: 16 },
  statLabel: {
    color: "#29965a",
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  statValue: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    marginTop: 10,
  },
  green: { color: "#08b657" },
  ticketHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 38,
  },
  ticketTitle: { fontFamily: fonts.extraBold, fontSize: 22 },
  tools: { flexDirection: "row", gap: 10 },
  tool: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 27,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  toolOn: { backgroundColor: "#dcf8e8" },
  search: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    flexDirection: "row",
    marginTop: 15,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    height: 50,
    marginLeft: 10,
  },
  guest: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 34,
    flexDirection: "row",
    marginTop: 16,
    minHeight: 104,
    padding: 16,
  },
  avatar: { borderRadius: 28, height: 56, marginRight: 14, width: 56 },
  guestCopy: { flex: 1 },
  guestName: { fontFamily: fonts.medium, fontSize: 17 },
  ticketType: {
    color: "#29965a",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 4,
  },
  status: {
    alignItems: "center",
    backgroundColor: "#e3f8ec",
    borderRadius: 22,
    flexDirection: "row",
    gap: 5,
    marginRight: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  pending: { backgroundColor: "#f0f4fa" },
  statusText: { color: "#08a94e", fontFamily: fonts.medium, fontSize: 12 },
  pendingText: { color: "#718198" },
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    marginTop: 40,
    textAlign: "center",
  },
});
