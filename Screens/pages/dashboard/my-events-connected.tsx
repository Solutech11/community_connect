import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppLoader from "../../components/ui/app-loader";
import TicketStatusBadge from "../../components/ui/ticket-status-badge";
import { ApiError } from "../../services/api/client";
import { ticketsApi } from "../../services/api/tickets.api";
import { colors, fonts } from "../../styles/theme";
import type { GetTicketsResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";
import { getTicketOrderStatusPresentation } from "../../types/tickets";

type Props = NativeStackScreenProps<RootStackParamList, "MyEvents">;
type Ticket = GetTicketsResponse["data"]["tickets"][number] & {
  checkedInAt?: string;
  reservationExpiresAt?: string;
};
type TicketTab = "All" | "Upcoming" | "Past";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=86",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=86",
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=86",
];

function formatMoney(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";
}

function formatTime(value: string) {
  const date = parseDate(value);
  return date
    ? date.toLocaleTimeString("en-NG", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time unavailable";
}

function formatDateTime(value: string) {
  const date = parseDate(value);
  return date
    ? date.toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Date unavailable";
}

function isPastEvent(ticket: Ticket) {
  const endsAt = parseDate(ticket.eventId.endsAt);
  return endsAt ? endsAt.getTime() < Date.now() : false;
}

function OverviewStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.overviewStat}>
      <Text style={styles.overviewStatValue}>{value}</Text>
      <Text style={styles.overviewStatLabel}>{label}</Text>
    </View>
  );
}

export default function MyEventsConnectedScreen({ navigation }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<TicketTab>("Upcoming");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false, signal?: AbortSignal) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await ticketsApi.list({}, signal);
      if (!signal?.aborted) setTickets(response.data.tickets);
    } catch (requestError) {
      if (
        signal?.aborted ||
        (requestError instanceof ApiError &&
          requestError.code === "REQUEST_CANCELLED")
      ) {
        return;
      }
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load your tickets.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(false, controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  const paidCount = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          getTicketOrderStatusPresentation(ticket.status).status === "paid",
      ).length,
    [tickets],
  );
  const pendingCount = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          getTicketOrderStatusPresentation(ticket.status).status === "pending",
      ).length,
    [tickets],
  );
  const closedCount = useMemo(
    () =>
      tickets.filter((ticket) => {
        const status = getTicketOrderStatusPresentation(ticket.status).status;
        return status === "cancelled" || status === "refunded";
      }).length,
    [tickets],
  );

  const visibleTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const past = isPastEvent(ticket);
      const matchesTab = tab === "All" || (tab === "Past" ? past : !past);
      if (!matchesTab) return false;
      if (!normalizedQuery) return true;

      return [
        ticket.eventId.title,
        ticket.eventId.venueName,
        ticket.eventId.address,
        ticket.eventId.lga,
        ticket.eventId.state,
        ticket.orderNumber,
        ticket.ticketTypeId.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [query, tab, tickets]);

  const tabCounts = useMemo(
    () => ({
      All: tickets.length,
      Upcoming: tickets.filter((ticket) => !isPastEvent(ticket)).length,
      Past: tickets.filter(isPastEvent).length,
    }),
    [tickets],
  );

  const tabOptions: TicketTab[] = ["All", "Upcoming", "Past"];

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
          style={styles.backButton}
        >
          <Ionicons color={colors.ink} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <Text style={styles.headerSubtitle}>
            Your event bookings and payment details
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.lime}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {tickets.length > 0 ? (
          <View style={styles.overview}>
            <View style={styles.overviewHeading}>
              <View style={styles.overviewIcon}>
                <Ionicons color={colors.lime} name="ticket-outline" size={21} />
              </View>
              <View>
                <Text style={styles.overviewEyebrow}>YOUR ORDERS</Text>
                <Text style={styles.overviewTitle}>
                  {tickets.length} {tickets.length === 1 ? "order" : "orders"}
                </Text>
              </View>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewStats}>
              <OverviewStat label="Paid" value={paidCount} />
              <View style={styles.statDivider} />
              <OverviewStat label="Awaiting payment" value={pendingCount} />
              <View style={styles.statDivider} />
              <OverviewStat label="Closed" value={closedCount} />
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Your bookings</Text>
            <Text style={styles.sectionSubtitle}>
              Find an order by event, venue or order number
            </Text>
          </View>
          {loading && tickets.length > 0 ? (
            <AppLoader color="#08b657" size="small" />
          ) : null}
        </View>

        <View style={styles.search}>
          <Ionicons color="#619177" name="search-outline" size={19} />
          <TextInput
            accessibilityLabel="Search tickets"
            onChangeText={setQuery}
            placeholder="Search your tickets"
            placeholderTextColor="#80958a"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
            >
              <Ionicons color="#80958a" name="close-circle" size={19} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {tabOptions.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, tab === item && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, tab === item && styles.tabTextActive]}
              >
                {item}
              </Text>
              <Text
                style={[styles.tabCount, tab === item && styles.tabCountActive]}
              >
                {tabCounts[item]}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && tickets.length === 0 ? (
          <View style={styles.stateCard}>
            <AppLoader color="#08b657" size="large" />
            <Text style={styles.stateTitle}>Loading your tickets</Text>
            <Text style={styles.stateCopy}>
              Your latest event orders will appear here.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons color="#b42318" name="cloud-offline-outline" size={23} />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Could not refresh tickets</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <Pressable onPress={() => void load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && tickets.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons color="#54a476" name="ticket-outline" size={29} />
            </View>
            <Text style={styles.stateTitle}>No tickets yet</Text>
            <Text style={styles.stateCopy}>
              Tickets and pending orders will show up here after checkout.
            </Text>
          </View>
        ) : null}

        {!loading && tickets.length > 0 && visibleTickets.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons color="#54a476" name="search-outline" size={27} />
            </View>
            <Text style={styles.stateTitle}>
              {query
                ? "No matching tickets"
                : `No ${tab.toLowerCase()} tickets`}
            </Text>
            <Text style={styles.stateCopy}>
              {query
                ? "Try another event name, venue or order number."
                : "Your orders will appear here when they match this filter."}
            </Text>
          </View>
        ) : null}

        {visibleTickets.map((ticket, index) => {
          const status = getTicketOrderStatusPresentation(ticket.status);
          const location = [
            ticket.eventId.address,
            [ticket.eventId.lga, ticket.eventId.state]
              .filter(Boolean)
              .join(", "),
          ]
            .filter(Boolean)
            .join(" · ");
          const orderTotalLabel =
            status.status === "paid"
              ? "Amount paid"
              : status.status === "pending"
                ? "Amount due"
                : "Order total";
          const eventImage =
            ticket.eventId.coverImageUrl ||
            FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

          return (
            <Pressable
              accessibilityRole="button"
              key={ticket._id}
              onPress={() =>
                navigation.navigate("MyEventDetails", {
                  orderNumber: ticket.orderNumber,
                  eventId: ticket.eventId._id,
                })
              }
              style={({ pressed }) => [
                styles.ticketCard,
                pressed && styles.ticketCardPressed,
              ]}
            >
              <ImageBackground
                imageStyle={styles.coverImageRadius}
                source={{ uri: eventImage }}
                style={styles.coverImage}
              >
                <View style={styles.coverShade} />
                <View style={styles.dateBadge}>
                  <Text style={styles.dateMonth}>
                    {parseDate(ticket.eventId.startsAt)
                      ?.toLocaleString("en-NG", { month: "short" })
                      .toUpperCase() ?? "DATE"}
                  </Text>
                  <Text style={styles.dateDay}>
                    {parseDate(ticket.eventId.startsAt)?.getDate() ?? "--"}
                  </Text>
                </View>
                <View style={styles.coverStatus}>
                  <TicketStatusBadge compact status={ticket.status} />
                </View>
                <View style={styles.coverEventDate}>
                  <Ionicons
                    color={colors.white}
                    name="calendar-outline"
                    size={14}
                  />
                  <Text numberOfLines={1} style={styles.coverEventDateText}>
                    {formatDate(ticket.eventId.startsAt)}
                  </Text>
                </View>
              </ImageBackground>

              <View style={styles.ticketBody}>
                <View style={styles.eventHeading}>
                  <Text numberOfLines={2} style={styles.eventTitle}>
                    {ticket.eventId.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.orderNumber}>
                    ORDER #{ticket.orderNumber}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons color="#159653" name="time-outline" size={17} />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailPrimary}>
                      {formatDate(ticket.eventId.startsAt)}
                    </Text>
                    <Text style={styles.detailSecondary}>
                      {formatTime(ticket.eventId.startsAt)} -{" "}
                      {formatTime(ticket.eventId.endsAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      color="#159653"
                      name="location-outline"
                      size={17}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text numberOfLines={1} style={styles.detailPrimary}>
                      {ticket.eventId.venueName}
                    </Text>
                    {location ? (
                      <Text numberOfLines={2} style={styles.detailSecondary}>
                        {location}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.dashedDivider} />

                <View style={styles.ticketTypeRow}>
                  <View style={styles.ticketTypeIcon}>
                    <Ionicons color="#149651" name="ticket-outline" size={18} />
                  </View>
                  <View style={styles.ticketTypeCopy}>
                    <Text style={styles.sectionEyebrow}>TICKET TYPE</Text>
                    <Text numberOfLines={1} style={styles.ticketTypeTitle}>
                      {ticket.ticketTypeId.title}
                    </Text>
                  </View>
                  <View style={styles.quantityPill}>
                    <Text style={styles.quantityText}>x{ticket.quantity}</Text>
                  </View>
                </View>
                <Text style={styles.unitPrice}>
                  {ticket.ticketTypeId.priceKobo === 0
                    ? "Free ticket"
                    : `${formatMoney(ticket.ticketTypeId.priceKobo)} each`}
                </Text>

                <View style={styles.costBreakdown}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Ticket subtotal</Text>
                    <Text style={styles.costValue}>
                      {formatMoney(ticket.ticketSubtotalKobo)}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Platform fee</Text>
                    <Text style={styles.costValue}>
                      {formatMoney(ticket.platformFeeKobo)}
                    </Text>
                  </View>
                  <View style={[styles.costRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>{orderTotalLabel}</Text>
                    <Text style={styles.totalValue}>
                      {formatMoney(ticket.totalKobo)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMeta}>
                  <View style={styles.orderMetaRow}>
                    <Ionicons
                      color="#789187"
                      name="receipt-outline"
                      size={14}
                    />
                    <Text style={styles.orderMetaText}>
                      Ordered {formatDateTime(ticket.createdAt)}
                    </Text>
                  </View>
                  {status.status === "pending" &&
                  ticket.reservationExpiresAt ? (
                    <View style={styles.orderMetaRow}>
                      <Ionicons
                        color="#9a680a"
                        name="hourglass-outline"
                        size={14}
                      />
                      <Text style={styles.expiryText}>
                        Reservation expires{" "}
                        {formatDateTime(ticket.reservationExpiresAt)}
                      </Text>
                    </View>
                  ) : null}
                  {ticket.checkedInAt ? (
                    <View style={styles.checkedInRow}>
                      <Ionicons
                        color="#078447"
                        name="checkmark-circle-outline"
                        size={15}
                      />
                      <Text style={styles.checkedInText}>
                        Checked in {formatDateTime(ticket.checkedInAt)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardAction}>
                  <Text style={styles.cardActionText}>
                    {status.isPaid
                      ? "View ticket details"
                      : "View order details"}
                  </Text>
                  <Ionicons color={colors.ink} name="arrow-forward" size={17} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { paddingBottom: 48, paddingHorizontal: 20 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 19,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 22 },
  headerSubtitle: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  headerSpacer: { width: 40 },
  overview: {
    backgroundColor: colors.forest,
    borderRadius: 26,
    marginBottom: 26,
    marginTop: 7,
    padding: 18,
  },
  overviewHeading: { alignItems: "center", flexDirection: "row", gap: 11 },
  overviewIcon: {
    alignItems: "center",
    backgroundColor: "rgba(20,232,111,0.13)",
    borderRadius: 17,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  overviewEyebrow: {
    color: "#a3d7b8",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  overviewTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 2,
  },
  overviewDivider: {
    backgroundColor: "rgba(255,255,255,0.15)",
    height: 1,
    marginVertical: 16,
  },
  overviewStats: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewStat: { flex: 1 },
  overviewStatValue: {
    color: colors.lime,
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  overviewStatLabel: {
    color: "#d0e6d9",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 3,
  },
  statDivider: {
    backgroundColor: "rgba(255,255,255,0.18)",
    height: 31,
    marginHorizontal: 9,
    width: 1,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    marginBottom: 13,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    minHeight: 48,
  },
  tabs: {
    backgroundColor: "#eaf2ed",
    borderRadius: 18,
    flexDirection: "row",
    gap: 4,
    marginBottom: 19,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabActive: { backgroundColor: colors.forest },
  tabText: { color: "#5f7b6d", fontFamily: fonts.bold, fontSize: 11 },
  tabTextActive: { color: colors.white },
  tabCount: {
    color: "#5f7b6d",
    fontFamily: fonts.bold,
    fontSize: 9,
    minWidth: 12,
    textAlign: "center",
  },
  tabCountActive: { color: colors.lime },
  ticketCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },
  ticketCardPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  coverImage: { height: 164, justifyContent: "flex-end", padding: 14 },
  coverImageRadius: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 25, 14, 0.22)",
  },
  dateBadge: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 15,
    left: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: "absolute",
    top: 13,
  },
  dateMonth: {
    color: "#078447",
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  dateDay: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    lineHeight: 22,
  },
  coverStatus: { position: "absolute", right: 12, top: 12 },
  coverEventDate: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(4, 27, 16, 0.75)",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    maxWidth: "78%",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  coverEventDateText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  ticketBody: { padding: 17 },
  eventHeading: { marginBottom: 12 },
  eventTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    lineHeight: 24,
  },
  orderNumber: {
    color: "#6b8577",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    marginTop: 5,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 9,
  },
  detailIcon: {
    alignItems: "center",
    backgroundColor: "#e9f8ef",
    borderRadius: 13,
    height: 31,
    justifyContent: "center",
    width: 31,
  },
  detailCopy: { flex: 1 },
  detailPrimary: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
  detailSecondary: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  dashedDivider: {
    borderColor: "#dce8e0",
    borderStyle: "dashed",
    borderTopWidth: 1,
    marginVertical: 15,
  },
  ticketTypeRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  ticketTypeIcon: {
    alignItems: "center",
    backgroundColor: "#e9f8ef",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  ticketTypeCopy: { flex: 1 },
  sectionEyebrow: {
    color: "#759083",
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  ticketTypeTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 2,
  },
  quantityPill: {
    backgroundColor: "#eef8f1",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quantityText: { color: "#16874b", fontFamily: fonts.extraBold, fontSize: 10 },
  unitPrice: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginLeft: 46,
    marginTop: 4,
  },
  costBreakdown: {
    backgroundColor: "#f7faf8",
    borderRadius: 16,
    marginTop: 15,
    padding: 13,
  },
  costRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  costLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 10 },
  costValue: { color: colors.ink, fontFamily: fonts.semiBold, fontSize: 10 },
  totalRow: {
    borderTopColor: "#e1ebe5",
    borderTopWidth: 1,
    marginTop: 5,
    paddingTop: 10,
  },
  totalLabel: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
  totalValue: { color: "#078447", fontFamily: fonts.extraBold, fontSize: 14 },
  orderMeta: { gap: 7, marginTop: 13 },
  orderMetaRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  orderMetaText: { color: "#789187", fontFamily: fonts.medium, fontSize: 9 },
  expiryText: {
    color: "#9a680a",
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 9,
  },
  checkedInRow: {
    alignItems: "center",
    backgroundColor: "#e8f8ee",
    borderRadius: 11,
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  checkedInText: { color: "#078447", fontFamily: fonts.bold, fontSize: 9 },
  cardAction: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardActionText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 11,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 24,
    paddingVertical: 34,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#e9f8ef",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  stateTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    marginTop: 12,
  },
  stateCopy: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    textAlign: "center",
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#fff1f0",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    padding: 13,
  },
  errorCopy: { flex: 1 },
  errorTitle: { color: "#9f201a", fontFamily: fonts.bold, fontSize: 10 },
  errorText: {
    color: "#8a514e",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retryText: { color: "#9f201a", fontFamily: fonts.bold, fontSize: 9 },
});
