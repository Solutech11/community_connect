import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MyCreatedEvents">;
type Tab = "Active" | "Draft" | "Past";
type CreatedCard = {
  id: string;
  tab: Tab;
  title: string;
  meta: string;
  image: string;
  foot?: string;
};
const images = {
  garden:
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85",
  run: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85",
};
const initialEvents: CreatedCard[] = [
  {
    id: "mock-garden",
    tab: "Active",
    title: "Urban Garden Workshop",
    meta: "Sat, Oct 24 â€¢ 10:00 AM",
    image: images.garden,
    foot: "24+",
  },
  {
    id: "mock-run",
    tab: "Active",
    title: "Morning Run Club",
    meta: "Daily â€¢ 06:30 AM",
    image: images.run,
    foot: "High Engagement",
  },
  {
    id: "mock-ai",
    tab: "Draft",
    title: "Tech Talk: Future AI",
    meta: "Last Edited: 2 hours ago",
    image: images.garden,
  },
  {
    id: "mock-community",
    tab: "Draft",
    title: "Community Garden Planning",
    meta: "Last Edited: Oct 20, 2023",
    image: images.run,
  },
  {
    id: "mock-leadership",
    tab: "Past",
    title: "Community Leadership Meetup",
    meta: "Ended Sep 18 â€¢ 48 attended",
    image: images.garden,
    foot: "Completed",
  },
];
export default function MyCreatedEventsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>("Active");
  const [q, setQ] = useState("");
  const [createdEvents, setCreatedEvents] = useState<CreatedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabsWidth, setTabsWidth] = useState(0);
  const tabProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(tabProgress, {
      toValue: (["Active", "Draft", "Past"] as Tab[]).indexOf(tab),
      damping: 18,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [tab, tabProgress]);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    eventsApi.createdByMe(controller.signal)
      .then((response) => {
        setCreatedEvents(response.data.events.map((event, index) => {
          const startsAt = new Date(event.startsAt);
          const ended = new Date(event.endsAt).getTime() < Date.now();
          const eventTab: Tab = event.status === "draft" ? "Draft" : ended || event.status === "cancelled" ? "Past" : "Active";
          return {
            id: event._id,
            tab: eventTab,
            title: event.title,
            meta: eventTab === "Draft" ? "Draft saved on " + new Date(event.createdAt).toLocaleDateString() : startsAt.toLocaleString(),
            image: index % 2 ? images.run : images.garden,
            foot: event.status,
          };
        }));
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED") return;
        setNotice(error instanceof ApiError ? error.message : "Unable to load your created events.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const shown = useMemo(
    () =>
      createdEvents.filter(
        (x) => x.tab === tab && x.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [tab, q, createdEvents],
  );
  return (
    <>
      <SafeAreaView edges={[]} style={s.safe}>
        <ProfilePageHeader
          title="My Created Events"
          onBack={navigation.goBack}
        />
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.search}>
            <Ionicons name="search" size={24} color="#3c9c67" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search your events..."
              placeholderTextColor="#667085"
              style={s.input}
            />
          </View>
          <View
            onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}
            style={s.tabs}
          >
            {tabsWidth > 0 && (
              <Animated.View
                style={[
                  s.tabIndicator,
                  {
                    width: (tabsWidth - 10) / 3,
                    transform: [
                      {
                        translateX: Animated.multiply(
                          tabProgress,
                          (tabsWidth - 10) / 3,
                        ),
                      },
                    ],
                  },
                ]}
              />
            )}
            {(["Active", "Draft", "Past"] as Tab[]).map((x) => (
              <Pressable key={x} onPress={() => setTab(x)} style={s.tab}>
                <Text style={[s.tabText, tab === x && s.tabTextOn]}>{x}</Text>
              </Pressable>
            ))}
          </View>
          {shown.map((x) => (
            <View key={x.id} style={s.card}>
              <ImageBackground
                source={{ uri: x.image }}
                style={s.image}
                imageStyle={s.imageRadius}
              >
                <View style={[s.badge, x.tab === "Draft" && s.draftBadge]}>
                  <Text style={s.badgeText}>{x.tab.toUpperCase()}</Text>
                </View>
              </ImageBackground>
              <View style={s.body}>
                <Text style={s.cardTitle}>{x.title}</Text>
                <View style={s.meta}>
                  <Ionicons
                    name={
                      x.tab === "Active" ? "calendar-outline" : "create-outline"
                    }
                    size={20}
                    color="#29965a"
                  />
                  <Text style={s.metaText}>{x.meta}</Text>
                </View>
                <View style={s.cardBottom}>
                  {x.foot ? <Text style={s.foot}>{x.foot}</Text> : <View />}
                  <Pressable
                    onPress={() =>
                      x.tab === "Active"
                        ? navigation.navigate("ManageCreatedEvent", { eventId: x.id })
                        : x.tab === "Draft"
                          ? navigation.navigate("CreateEventDetails")
                          : setNotice("View " + x.title)
                    }
                    style={s.manage}
                  >
                    <Text style={s.manageText}>
                      {x.tab === "Draft"
                        ? "Continue"
                        : x.tab === "Past"
                          ? "View Summary"
                          : "Manage"}
                    </Text>
                    <Ionicons
                      name={
                        x.tab === "Draft"
                          ? "chevron-forward"
                          : "settings-outline"
                      }
                      size={19}
                      color={colors.ink}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          {tab === "Active" && createdEvents.some((item) => item.tab === "Draft") && (
            <Pressable onPress={() => setTab("Draft")} style={s.drafts}>
              <View style={s.draftIcon}>
                <Ionicons name="create-outline" size={25} color="#08b657" />
              </View>
              <Text style={s.draftsTitle}>You have {createdEvents.filter((item) => item.tab === "Draft").length} drafts</Text>
              <Text style={s.draftsSub}>
                Continue planning your next big event.
              </Text>
              <Text style={s.viewDrafts}>View Drafts</Text>
            </Pressable>
          )}
          {loading ? <Text style={s.empty}>Loading your events...</Text> : null}
          {!loading && !shown.length && (
            <Text style={s.empty}>No {tab.toLowerCase()} events found.</Text>
          )}
        </ScrollView>
        <Pressable
          accessibilityLabel="Create a new event"
          onPress={() => navigation.navigate("CreateEventIntroduction")}
          style={s.fab}
        >
          <Ionicons name="add" size={36} color={colors.ink} />
        </Pressable>
      </SafeAreaView>
      <AppAlertModal
        visible={!!notice}
        title={notice ?? ""}
        message="This event action will be available here soon."
        onClose={() => setNotice(null)}
      />
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, paddingBottom: 110 },
  search: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 34,
    flexDirection: "row",
    height: 64,
    marginTop: 20,
    paddingHorizontal: 22,
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 16, marginLeft: 14 },
  tabs: {
    backgroundColor: "#fff",
    borderRadius: 27,
    flexDirection: "row",
    marginTop: 28,
    padding: 5,
  },
  tab: {
    alignItems: "center",
    borderRadius: 23,
    flex: 1,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabIndicator: {
    backgroundColor: "#08b657",
    borderRadius: 23,
    bottom: 5,
    left: 5,
    position: "absolute",
    top: 5,
  },
  tabText: { color: "#29965a", fontFamily: fonts.bold, fontSize: 14 },
  tabTextOn: { color: colors.ink },
  card: {
    backgroundColor: "#fff",
    borderRadius: 34,
    marginTop: 30,
    overflow: "hidden",
  },
  image: { height: 220, padding: 18 },
  imageRadius: { borderTopLeftRadius: 34, borderTopRightRadius: 34 },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#08b657",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  draftBadge: { backgroundColor: "rgba(7,31,23,.82)" },
  badgeText: { color: "#fff", fontFamily: fonts.medium, fontSize: 12 },
  body: { padding: 16 },
  cardTitle: { color: colors.ink, fontFamily: fonts.medium, fontSize: 20 },
  meta: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 9 },
  metaText: { color: "#29965a", fontFamily: fonts.medium, fontSize: 15 },
  cardBottom: {
    alignItems: "center",
    borderTopColor: "#edf2ef",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 12,
  },
  foot: { color: "#08b657", fontFamily: fonts.medium, fontSize: 14 },
  manage: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 26,
    flexDirection: "row",
    gap: 9,
    minWidth: 146,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  manageText: { fontFamily: fonts.medium, fontSize: 17 },
  drafts: {
    alignItems: "center",
    borderColor: "#bcebd0",
    borderRadius: 34,
    borderStyle: "dashed",
    borderWidth: 2,
    marginTop: 24,
    padding: 26,
  },
  draftIcon: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  draftsTitle: { fontFamily: fonts.medium, fontSize: 17, marginTop: 15 },
  draftsSub: {
    color: "#57a879",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 6,
  },
  viewDrafts: {
    borderBottomColor: "#08b657",
    borderBottomWidth: 1,
    color: "#08b657",
    fontFamily: fonts.medium,
    fontSize: 16,
    marginTop: 20,
  },
  fab: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 34,
    bottom: 24,
    height: 64,
    justifyContent: "center",
    position: "absolute",
    right: 24,
    width: 64,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    marginTop: 60,
    textAlign: "center",
  },
});
