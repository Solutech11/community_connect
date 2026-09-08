import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import { useAuth } from "../../hooks/use-auth";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { ticketsApi } from "../../services/api/tickets.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetEventsResponse,
  GetTicketsResponse,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type EventItem = GetEventsResponse["data"]["events"][number];
type TicketOrder = GetTicketsResponse["data"]["tickets"][number];
type Category = "All" | "Technology" | "Fitness" | "Arts" | "Community";
const eventImages = [
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=86",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=86",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=86",
];

function EventCard({
  event,
  imageIndex = 0,
  onPress,
}: {
  event: EventItem;
  imageIndex?: number;
  onPress: () => void;
}) {
  const date = new Date(event.startsAt);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={{
          uri:
            event.coverImageUrl || eventImages[imageIndex % eventImages.length],
        }}
        style={styles.cardImage}
      />
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>
          {date.toLocaleString("en", { month: "short" }).toUpperCase()}
        </Text>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" color="#399760" size={17} />
          <Text style={styles.metaText} numberOfLines={1}>
            {event.venueName}, {event.state}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" color="#399760" size={17} />
          <Text style={styles.metaText}>{date.toLocaleString()}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Community member";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [tickets, setTickets] = useState<TicketOrder[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const normalizedQuery = query.trim();
        const eventRequest =
          normalizedQuery || category !== "All"
            ? eventsApi.list({
                page: 1,
                limit: 30,
                ...(normalizedQuery ? { search: normalizedQuery } : {}),
                ...(category !== "All" ? { activityType: category } : {}),
              })
            : eventsApi.recommended({ limit: 30 });
        const [eventResponse, ticketResponse] = await Promise.all([
          eventRequest,
          ticketsApi.list(),
        ]);
        setEvents(eventResponse.data.events);
        setTickets(ticketResponse.data.tickets);
      } catch (error) {
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Unable to load Community Connect.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, query],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      load();
    }, 350);
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Notifications")}
            style={styles.notification}
          >
            <Ionicons
              name="notifications-outline"
              size={23}
              color={colors.ink}
            />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.lime}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.search}>
            <Ionicons name="search" size={23} color="#279d61" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Find events near you..."
              placeholderTextColor="#7bb694"
              style={styles.searchInput}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {(
              [
                "All",
                "Technology",
                "Fitness",
                "Arts",
                "Community",
              ] as Category[]
            ).map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, item === category && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    item === category && styles.chipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => navigation.navigate("AIChat")}
            style={styles.aiCard}
          >
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={21} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiLabel}>AI FOR YOU</Text>
              <Text style={styles.aiTitle}>
                Find the right event for your plans
              </Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.lime} size={21} />
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Tickets</Text>
            <Pressable onPress={() => navigation.navigate("MyEvents")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {tickets.slice(0, 5).map((ticket, index) => (
              <View key={ticket._id} style={{ width: 310 }}>
                <EventCard
                  event={ticket.eventId}
                  imageIndex={index}
                  onPress={() =>
                    navigation.navigate("MyEventDetails", {
                      orderNumber: ticket.orderNumber,
                      eventId: ticket.eventId._id,
                    })
                  }
                />
              </View>
            ))}
            {!loading && tickets.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Purchased tickets will appear here.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
            Upcoming Events
          </Text>
          <View style={styles.list}>
            {loading ? (
              <Text style={styles.stateText}>Loading nearby events...</Text>
            ) : null}
            {!loading && events.length === 0 ? (
              <Text style={styles.stateText}>
                No events match your filters.
              </Text>
            ) : null}
            {events.map((event, index) => (
              <EventCard
                key={event._id}
                event={event}
                imageIndex={index}
                onPress={() =>
                  navigation.navigate("EventDetails", { eventId: event._id })
                }
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(errorMessage)}
        title="Unable to refresh"
        message={errorMessage ?? ""}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 26,
    paddingVertical: 16,
  },
  greeting: { color: "#129a56", fontFamily: fonts.medium, fontSize: 15 },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    marginTop: 3,
  },
  notification: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  content: { paddingBottom: 120, paddingHorizontal: 24 },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: "row",
    gap: 12,
    height: 60,
    paddingHorizontal: 20,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  categories: { gap: 10, paddingVertical: 18 },
  chip: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  chipActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { color: "#18854e", fontFamily: fonts.bold, fontSize: 13 },
  chipTextActive: { color: colors.ink },
  aiCard: {
    alignItems: "center",
    backgroundColor: "#0b3527",
    borderRadius: 25,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  aiIcon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  aiLabel: { color: colors.lime, fontFamily: fonts.extraBold, fontSize: 9 },
  aiTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 4,
  },
  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
  },
  seeAll: { color: "#08b657", fontFamily: fonts.bold, fontSize: 14 },
  horizontalList: { gap: 16, paddingVertical: 18 },
  list: { gap: 20, marginTop: 18 },
  card: { backgroundColor: colors.white, borderRadius: 28, overflow: "hidden" },
  cardImage: { height: 180, width: "100%" },
  dateBadge: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    left: 14,
    padding: 9,
    position: "absolute",
    top: 14,
  },
  dateMonth: { color: "#08b657", fontFamily: fonts.extraBold, fontSize: 11 },
  dateDay: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
  cardBody: { padding: 18 },
  cardTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 19 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 8 },
  metaText: {
    color: "#399760",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    justifyContent: "center",
    minHeight: 150,
    padding: 20,
    width: 300,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  stateText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    paddingVertical: 30,
    textAlign: "center",
  },
});
