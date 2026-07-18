import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "EditTicketType">;
type TicketType = GetEventsIdResponse["data"]["ticketTypes"][number];

export default function EditTicketTypeScreen({ navigation, route }: Props) {
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ title: string; message: string; success?: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    eventsApi.get(route.params.eventId, controller.signal)
      .then((response) => {
        const item = response.data.ticketTypes.find((candidate) => candidate._id === route.params.ticketTypeId);
        if (!item) {
          setNotice({ title: "Ticket tier not found", message: "This ticket tier is no longer attached to the event." });
          return;
        }
        setTicket(item);
        setTitle(item.title);
        setDescription(item.description);
        setPrice(String(item.priceKobo / 100));
        setCapacity(String(item.capacity));
      })
      .catch((error) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED") return;
        setNotice({ title: "Ticket unavailable", message: error instanceof ApiError ? error.message : "Unable to load this ticket tier." });
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [route.params.eventId, route.params.ticketTypeId]);

  const save = async () => {
    const priceNaira = Number(price);
    const nextCapacity = Number(capacity);
    if (!title.trim() || !Number.isFinite(priceNaira) || priceNaira < 0 || !Number.isInteger(nextCapacity) || nextCapacity <= 0) {
      setNotice({ title: "Check ticket details", message: "Enter a title, a non-negative price, and a positive whole-number capacity." });
      return;
    }
    if (ticket && nextCapacity < ticket.sold + ticket.reserved) {
      setNotice({ title: "Capacity too small", message: `Capacity cannot be below ${ticket.sold + ticket.reserved}, the number already sold or reserved.` });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await eventsApi.updateTicketType(route.params.eventId, route.params.ticketTypeId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priceKobo: Math.round(priceNaira * 100),
        capacity: nextCapacity,
      });
      setNotice({ title: "Ticket tier updated", message: "The ticket changes were saved.", success: true });
    } catch (error) {
      setNotice({ title: "Update failed", message: error instanceof ApiError ? error.message : "Unable to update this ticket tier." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Edit Ticket Tier" onBack={navigation.goBack} />
        {loading ? <View style={styles.loading}><ActivityIndicator color="#08b657" /></View> : null}
        {ticket ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.summary}>
              <View style={styles.icon}><Ionicons color={colors.ink} name="ticket-outline" size={24} /></View>
              <View style={styles.copy}><Text style={styles.name}>{ticket.title}</Text><Text style={styles.meta}>{ticket.sold} sold - {ticket.reserved} reserved</Text></View>
            </View>
            <Field label="Title" onChangeText={setTitle} value={title} />
            <Field label="Description" multiline onChangeText={setDescription} value={description} />
            <Field keyboardType="decimal-pad" label="Price (NGN)" onChangeText={setPrice} value={price} />
            <Field keyboardType="number-pad" label="Capacity" onChangeText={setCapacity} value={capacity} />
            <Pressable disabled={submitting} onPress={() => void save()} style={[styles.primary, submitting && styles.disabled]}>
              {submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.primaryText}>Save ticket tier</Text>}
            </Pressable>
          </ScrollView>
        ) : null}
      </SafeAreaView>
      <AppAlertModal
        message={notice?.message ?? ""}
        onClose={() => {
          const success = notice?.success;
          setNotice(null);
          if (success) navigation.goBack();
        }}
        title={notice?.title ?? ""}
        visible={Boolean(notice)}
      />
    </>
  );
}

function Field(props: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return <View><Text style={styles.label}>{props.label}</Text><TextInput {...props} placeholderTextColor="#718078" style={[styles.input, props.multiline && styles.multiline]} textAlignVertical={props.multiline ? "top" : "center"} /></View>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 }, loading: { alignItems: "center", flex: 1, justifyContent: "center" }, content: { padding: 22, paddingBottom: 70 }, summary: { alignItems: "center", backgroundColor: "#e9f8f0", borderRadius: 22, flexDirection: "row", padding: 15 }, icon: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 22, height: 44, justifyContent: "center", width: 44 }, copy: { flex: 1, marginLeft: 11 }, name: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 15 }, meta: { color: "#4e7861", fontFamily: fonts.medium, fontSize: 10, marginTop: 4 },
  label: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12, marginBottom: 7, marginTop: 17 }, input: { backgroundColor: colors.white, borderRadius: 19, color: colors.ink, fontFamily: fonts.medium, minHeight: 52, paddingHorizontal: 15, paddingVertical: 12 }, multiline: { minHeight: 100 }, primary: { alignItems: "center", backgroundColor: colors.lime, borderRadius: 24, height: 52, justifyContent: "center", marginTop: 25 }, primaryText: { color: colors.ink, fontFamily: fonts.bold }, disabled: { opacity: 0.55 },
});
