import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdAttendeesResponse, GetEventsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ManageCreatedEvent">;
type Event = GetEventsIdResponse["data"]["event"];
type TicketType = GetEventsIdResponse["data"]["ticketTypes"][number];
type Attendee = GetEventsIdAttendeesResponse["data"]["attendees"][number];

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85";
const money = (kobo: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);

export default function ManageCreatedEventConnectedScreen({ navigation, route }: Props) {
  const eventId = route.params?.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketCapacity, setTicketCapacity] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!eventId) { setNotice({ title: "No event selected", message: "Open management from one of your created events." }); setLoading(false); return; }
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [eventResponse, attendeeResponse] = await Promise.all([eventsApi.get(eventId), eventsApi.attendees(eventId)]);
      const nextEvent = eventResponse.data.event;
      setEvent(nextEvent);
      setTicketTypes(eventResponse.data.ticketTypes);
      setAttendees(attendeeResponse.data.attendees);
      setTitle(nextEvent.title);
      setDescription(nextEvent.description);
      setCapacity(String(nextEvent.maxCapacity));
    } catch (error) {
      setNotice({ title: "Management unavailable", message: error instanceof ApiError ? error.message : "Unable to load this event." });
    } finally { setLoading(false); setRefreshing(false); }
  }, [eventId]);
  useEffect(() => { void load(); }, [load]);

  const act = async (action: () => Promise<unknown>, success: string) => {
    if (submitting) return;
    setSubmitting(true);
    try { await action(); setNotice({ title: "Event updated", message: success }); await load(true); }
    catch (error) { setNotice({ title: "Action failed", message: error instanceof ApiError ? error.message : "Unable to update this event." }); }
    finally { setSubmitting(false); }
  };

  const saveDetails = () => {
    const maxCapacity = Number(capacity);
    if (!eventId || !title.trim() || !description.trim() || !Number.isInteger(maxCapacity) || maxCapacity <= 0) {
      setNotice({ title: "Check event details", message: "Title, description, and a positive whole-number capacity are required." }); return;
    }
    void act(() => eventsApi.updateDraft(eventId, { title: title.trim(), description: description.trim(), maxCapacity }), "Event details saved.");
  };

  const addTicket = () => {
    const price = Number(ticketPrice || 0);
    const nextCapacity = Number(ticketCapacity || 0);
    if (!eventId || !ticketTitle.trim() || !Number.isFinite(price) || price < 0 || !Number.isInteger(nextCapacity) || nextCapacity <= 0) {
      setNotice({ title: "Check ticket tier", message: "Enter a title, non-negative price, and positive whole-number capacity." }); return;
    }
    void act(async () => {
      await eventsApi.addTicketType(eventId, { title: ticketTitle.trim(), priceKobo: Math.round(price * 100), capacity: nextCapacity });
      setTicketTitle(""); setTicketPrice(""); setTicketCapacity("");
    }, "Ticket tier added.");
  };

  const visibleAttendees = useMemo(() => attendees.filter((order) => `${order.buyerId.firstName} ${order.buyerId.lastName} ${order.buyerId.email}`.toLowerCase().includes(query.trim().toLowerCase())), [attendees, query]);
  const totalGuests = attendees.reduce((sum, order) => sum + order.quantity, 0);

  return <>
    <SafeAreaView edges={[]} style={styles.safe}>
      <ProfilePageHeader title="Manage Event" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        {loading ? <View style={styles.state}><ActivityIndicator color="#08b657" /><Text style={styles.meta}>Loading event...</Text></View> : null}
        {event ? <>
          <View style={styles.hero}><Text style={styles.status}>{event.status}</Text><Text style={styles.heroTitle}>{event.title}</Text><Text style={styles.heroMeta}>{event.venueName}, {event.address}</Text></View>
          <View style={styles.stats}><Stat label="Guests" value={String(totalGuests)} /><Stat label="Capacity" value={String(event.maxCapacity)} /><Stat label="Ticket tiers" value={String(ticketTypes.length)} /></View>
          <View style={styles.actions}>
            <Pressable onPress={() => navigation.navigate("TicketScanner", { eventId })} style={styles.action}><Ionicons color={colors.ink} name="qr-code-outline" size={22} /><Text style={styles.actionText}>Scan</Text></Pressable>
            {event.status === "draft" ? <Pressable disabled={submitting} onPress={() => void act(() => eventsApi.publish(eventId!), "Event published.")} style={styles.action}><Ionicons color={colors.ink} name="cloud-upload-outline" size={22} /><Text style={styles.actionText}>Publish</Text></Pressable> : null}
            {event.status === "published" ? <Pressable onPress={() => setConfirm({ title: "Cancel event?", message: "This changes the event status and may affect attendees.", action: async () => { await act(() => eventsApi.cancel(eventId!), "Event cancelled."); } })} style={styles.action}><Ionicons color="#a34b4b" name="close-circle-outline" size={22} /><Text style={styles.actionText}>Cancel</Text></Pressable> : null}
            <Pressable onPress={() => setConfirm({ title: "Delete draft?", message: "This permanently removes the event if the backend permits deletion in its current state.", action: async () => { await eventsApi.remove(eventId!); navigation.goBack(); } })} style={styles.action}><Ionicons color="#a34b4b" name="trash-outline" size={22} /><Text style={styles.actionText}>Delete</Text></Pressable>
          </View>

          <Section title="Event details">
            <TextInput onChangeText={setTitle} placeholder="Title" style={styles.input} value={title} />
            <TextInput multiline onChangeText={setDescription} placeholder="Description" style={[styles.input, styles.multiline]} value={description} />
            <TextInput keyboardType="number-pad" onChangeText={setCapacity} placeholder="Capacity" style={styles.input} value={capacity} />
            <Pressable disabled={submitting} onPress={saveDetails} style={styles.primary}><Text style={styles.primaryText}>Save details</Text></Pressable>
          </Section>

          <Section title="Ticket tiers">
            {ticketTypes.map((ticket) => <View key={ticket._id} style={styles.ticket}><View style={styles.ticketCopy}><Text style={styles.name}>{ticket.title}</Text><Text style={styles.meta}>{money(ticket.priceKobo)} - {ticket.sold}/{ticket.capacity} sold</Text></View><Pressable onPress={() => navigation.navigate("EditTicketType", { eventId: eventId!, ticketTypeId: ticket._id })} style={styles.editTicket}><Ionicons color="#078d45" name="create-outline" size={19} /></Pressable><Pressable onPress={() => setConfirm({ title: "Remove ticket tier?", message: "The backend will reject removal if this tier can no longer be safely deleted.", action: async () => { await act(() => eventsApi.removeTicketType(eventId!, ticket._id), "Ticket tier removed."); } })} style={styles.delete}><Ionicons color="#a34b4b" name="trash-outline" size={19} /></Pressable></View>)}
            <TextInput onChangeText={setTicketTitle} placeholder="Ticket title" style={styles.input} value={ticketTitle} />
            <View style={styles.row}><TextInput keyboardType="decimal-pad" onChangeText={setTicketPrice} placeholder="Price NGN" style={[styles.input, styles.flex]} value={ticketPrice} /><TextInput keyboardType="number-pad" onChangeText={setTicketCapacity} placeholder="Capacity" style={[styles.input, styles.flex]} value={ticketCapacity} /></View>
            <Pressable disabled={submitting} onPress={addTicket} style={styles.secondary}><Text style={styles.secondaryText}>Add ticket tier</Text></Pressable>
          </Section>

          <Section title="Attendees">
            <TextInput onChangeText={setQuery} placeholder="Search attendees" style={styles.input} value={query} />
            {visibleAttendees.map((order) => <View key={order._id} style={styles.attendee}><Image source={{ uri: AVATAR }} style={styles.avatar} /><View style={styles.ticketCopy}><Text style={styles.name}>{order.buyerId.firstName} {order.buyerId.lastName}</Text><Text style={styles.meta}>{order.ticketTypeId.title} x{order.quantity} - {order.status}</Text></View></View>)}
            {!visibleAttendees.length ? <Text style={styles.empty}>No matching attendees.</Text> : null}
          </Section>
        </> : null}
      </ScrollView>
    </SafeAreaView>
    <AppAlertModal visible={Boolean(notice)} title={notice?.title ?? ""} message={notice?.message ?? ""} onClose={() => setNotice(null)} />
    <AppAlertModal visible={Boolean(confirm)} title={confirm?.title ?? ""} message={confirm?.message ?? ""} confirmText="Continue" cancelText="Keep event" onClose={() => setConfirm(null)} onConfirm={() => { const action = confirm?.action; setConfirm(null); if (action) void action(); }} />
  </>;
}

function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.meta}>{label}</Text></View>; }
function Section({ children, title }: { children: React.ReactNode; title: string }) { return <View style={styles.section}><Text style={styles.heading}>{title}</Text>{children}</View>; }

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, content: { padding: 22, paddingBottom: 70 }, state: { alignItems: "center", padding: 40 }, hero: { backgroundColor: "#083120", borderRadius: 30, marginTop: 15, padding: 22 }, status: { alignSelf: "flex-start", backgroundColor: colors.lime, borderRadius: 14, color: colors.ink, fontFamily: fonts.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, textTransform: "uppercase" }, heroTitle: { color: colors.white, fontFamily: fonts.extraBold, fontSize: 24, marginTop: 16 }, heroMeta: { color: "#b8d2c4", fontFamily: fonts.medium, fontSize: 11, marginTop: 7 },
  stats: { flexDirection: "row", gap: 10, marginTop: 12 }, stat: { alignItems: "center", backgroundColor: colors.white, borderRadius: 20, flex: 1, padding: 15 }, statValue: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 }, action: { alignItems: "center", backgroundColor: colors.white, borderRadius: 18, flexDirection: "row", gap: 6, paddingHorizontal: 13, paddingVertical: 11 }, actionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 10 },
  section: { backgroundColor: colors.white, borderRadius: 24, marginTop: 17, padding: 16 }, heading: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 17, marginBottom: 5 }, input: { backgroundColor: "#f1f7f4", borderRadius: 16, color: colors.ink, fontFamily: fonts.medium, marginTop: 10, minHeight: 48, paddingHorizontal: 14, paddingVertical: 11 }, multiline: { minHeight: 90, textAlignVertical: "top" }, row: { flexDirection: "row", gap: 8 }, flex: { flex: 1 },
  primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 19, marginTop: 12, padding: 12 }, primaryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 }, secondary: { alignItems: "center", borderColor: "#08b657", borderRadius: 19, borderWidth: 1, marginTop: 11, padding: 11 }, secondaryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  ticket: { alignItems: "center", borderBottomColor: "#e7eeea", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", paddingVertical: 12 }, ticketCopy: { flex: 1 }, name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 }, meta: { color: "#718078", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 }, editTicket: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 17, height: 34, justifyContent: "center", marginRight: 7, width: 34 }, delete: { alignItems: "center", backgroundColor: "#f9eeee", borderRadius: 17, height: 34, justifyContent: "center", width: 34 }, attendee: { alignItems: "center", borderBottomColor: "#e7eeea", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", paddingVertical: 11 }, avatar: { borderRadius: 21, height: 42, marginRight: 10, width: 42 }, empty: { color: "#718078", fontFamily: fonts.medium, marginTop: 15, textAlign: "center" },
});
