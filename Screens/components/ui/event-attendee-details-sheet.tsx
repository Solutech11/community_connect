import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";
import type { GetEventsIdAttendeesResponse } from "../../types/api.generated";

type ApiAttendee = GetEventsIdAttendeesResponse["data"]["attendees"][number] & {
  organizerProceedsKobo?: number;
  paymentReference?: string;
  reservationExpiresAt?: string;
  updatedAt?: string;
  checkedInBy?: string;
};

type AttendeeSummary = GetEventsIdAttendeesResponse["data"]["summary"];

type Props = {
  attendee: ApiAttendee | null;
  summary: AttendeeSummary;
  visible: boolean;
  onClose: () => void;
};

const fallbackAvatar =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85";

function formatMoney(kobo?: number) {
  if (typeof kobo !== "number" || !Number.isFinite(kobo))
    return "Not available";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function idValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    const id = value._id;
    return typeof id === "string" ? id : "Not available";
  }
  return "Not available";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value || "Not available"}
      </Text>
    </View>
  );
}

function MoneyRow({ label, value }: { label: string; value?: number }) {
  return <DetailRow label={label} value={formatMoney(value)} />;
}

export default function EventAttendeeDetailsSheet({
  attendee,
  summary,
  visible,
  onClose,
}: Props) {
  if (!attendee) return null;

  const attendeeName =
    `${attendee.buyerId.firstName} ${attendee.buyerId.lastName}`.trim();
  const checkedIn = Boolean(attendee.checkedIn);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Close attendee details"
          onPress={onClose}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Attendee details</Text>
              <Text style={styles.subtitle}>
                Full ticket and check-in record
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileCard}>
              <Image
                source={{ uri: attendee.buyerId.avatarUrl || fallbackAvatar }}
                style={styles.avatar}
              />
              <View style={styles.profileCopy}>
                <Text style={styles.name}>{attendeeName || "Attendee"}</Text>
                <Text selectable style={styles.email}>
                  {attendee.buyerId.email}
                </Text>
              </View>
              <View
                style={[
                  styles.checkInPill,
                  checkedIn ? styles.checkedInPill : styles.notCheckedInPill,
                ]}
              >
                <Text
                  style={[
                    styles.checkInText,
                    checkedIn ? styles.checkedInText : styles.notCheckedInText,
                  ]}
                >
                  {checkedIn ? "Checked in" : "Not checked in"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ticket order</Text>
              <DetailRow label="Order number" value={attendee.orderNumber} />
              <DetailRow label="Order record ID" value={attendee._id} />
              <DetailRow label="Event ID" value={idValue(attendee.eventId)} />
              <DetailRow
                label="Ticket type"
                value={attendee.ticketTypeId.title}
              />
              <DetailRow
                label="Ticket type ID"
                value={attendee.ticketTypeId._id}
              />
              <DetailRow label="Quantity" value={String(attendee.quantity)} />
              <DetailRow label="Order status" value={attendee.status} />
              {attendee.paymentReference ? (
                <DetailRow
                  label="Payment reference"
                  value={attendee.paymentReference}
                />
              ) : null}
              {attendee.reservationExpiresAt ? (
                <DetailRow
                  label="Reservation expiry"
                  value={formatDateTime(attendee.reservationExpiresAt)}
                />
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment breakdown</Text>
              <MoneyRow
                label="Ticket subtotal"
                value={attendee.ticketSubtotalKobo}
              />
              <MoneyRow label="Platform fee" value={attendee.platformFeeKobo} />
              <MoneyRow label="Total paid" value={attendee.totalKobo} />
              {attendee.organizerProceedsKobo !== undefined ? (
                <MoneyRow
                  label="Organizer proceeds"
                  value={attendee.organizerProceedsKobo}
                />
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Attendee record</Text>
              <DetailRow label="Attendee ID" value={attendee.buyerId._id} />
              <DetailRow label="Email" value={attendee.buyerId.email} />
              <DetailRow
                label="First name"
                value={attendee.buyerId.firstName}
              />
              <DetailRow label="Last name" value={attendee.buyerId.lastName} />
              {attendee.buyerId.avatarUrl ? (
                <DetailRow
                  label="Avatar URL"
                  value={attendee.buyerId.avatarUrl}
                />
              ) : null}
              <DetailRow
                label="Purchased"
                value={formatDateTime(attendee.createdAt)}
              />
              {attendee.updatedAt ? (
                <DetailRow
                  label="Last updated"
                  value={formatDateTime(attendee.updatedAt)}
                />
              ) : null}
              <DetailRow
                label="Check-in time"
                value={
                  attendee.checkedInAt
                    ? formatDateTime(attendee.checkedInAt)
                    : "Not checked in"
                }
              />
              {attendee.checkedInBy ? (
                <DetailRow
                  label="Checked in by"
                  value={idValue(attendee.checkedInBy)}
                />
              ) : null}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Event attendance summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryValue label="Orders" value={summary.orders} />
                <SummaryValue label="Tickets" value={summary.totalTickets} />
                <SummaryValue
                  label="Checked in"
                  value={summary.checkedInTickets}
                />
                <SummaryValue
                  label="Not checked in"
                  value={summary.pendingTickets}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryValue}>
      <Text style={styles.summaryNumber}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5, 17, 11, 0.42)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "92%",
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#cbd5d0",
    borderRadius: 3,
    height: 5,
    marginBottom: 14,
    width: 48,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerCopy: { flex: 1 },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 20 },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: { gap: 12, paddingHorizontal: 16, paddingBottom: 22 },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    flexDirection: "row",
    gap: 11,
    padding: 14,
  },
  avatar: {
    backgroundColor: "#e5eee8",
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  profileCopy: { flex: 1 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14 },
  email: {
    color: "#728078",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  checkInPill: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  checkedInPill: { backgroundColor: "#def6e8" },
  notCheckedInPill: { backgroundColor: "#fff3d7" },
  checkInText: { fontFamily: fonts.bold, fontSize: 9 },
  checkedInText: { color: "#087b3d" },
  notCheckedInText: { color: "#986813" },
  section: { backgroundColor: colors.white, borderRadius: 22, padding: 15 },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 7,
  },
  detailRow: {
    borderTopColor: "#edf2ef",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  detailLabel: {
    color: "#728078",
    flex: 0.8,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  detailValue: {
    color: colors.ink,
    flex: 1.2,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    textAlign: "right",
  },
  summaryCard: { backgroundColor: "#eaf8ef", borderRadius: 22, padding: 15 },
  summaryTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 12,
  },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryValue: {
    backgroundColor: colors.white,
    borderRadius: 16,
    flexBasis: "48%",
    flexGrow: 1,
    padding: 11,
  },
  summaryNumber: {
    color: "#087b3d",
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  summaryLabel: {
    color: "#66766d",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
});
