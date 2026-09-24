import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import AiValidationModal from "../../components/ui/ai-validation-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import {
  EVENT_STATUS_VALUES,
  parseEventStatus,
  type EventStatus,
  type ParsedEventStatus,
} from "../../types/events";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MyCreatedEvents">;
type IconName = ComponentProps<typeof Ionicons>["name"];
const EVENT_STATUSES = EVENT_STATUS_VALUES;
type DisplayStatus = ParsedEventStatus;
type StatusFilter = "all" | EventStatus;

type CreatedCard = {
  id: string;
  title: string;
  meta: string;
  image: string;
  status: DisplayStatus;
};
const images = {
  garden:
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=85",
  run: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=85",
};

type StatusMeta = {
  label: string;
  description: string;
  icon: IconName;
  color: string;
  background: string;
  border: string;
};

const STATUS_META: Record<DisplayStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    description: "Finish the details before submitting it for review.",
    icon: "create-outline",
    color: "#9a5b00",
    background: "#fff6df",
    border: "#f4dca0",
  },
  pending_approval: {
    label: "Pending approval",
    description: "Your event is waiting for a community review.",
    icon: "time-outline",
    color: "#7353aa",
    background: "#f3edff",
    border: "#dacbfa",
  },
  published: {
    label: "Published",
    description: "Visible to your community and ready for attendees.",
    icon: "checkmark-circle-outline",
    color: "#087a43",
    background: "#e9faef",
    border: "#b9ebcc",
  },
  rejected: {
    label: "Needs changes",
    description: "Review the feedback, update the event, and resubmit it.",
    icon: "alert-circle-outline",
    color: "#bd4c24",
    background: "#fff0e9",
    border: "#ffc9b7",
  },
  deactivated: {
    label: "Deactivated",
    description: "Hidden from the community until it is activated again.",
    icon: "eye-off-outline",
    color: "#607083",
    background: "#eef2f5",
    border: "#d7e0e7",
  },
  cancelled: {
    label: "Cancelled",
    description: "This event has been marked as cancelled.",
    icon: "close-circle-outline",
    color: "#b53649",
    background: "#fff0f2",
    border: "#ffcbd2",
  },
  completed: {
    label: "Completed",
    description: "This event has finished and is now part of your history.",
    icon: "ribbon-outline",
    color: "#1f6d87",
    background: "#e9f7fb",
    border: "#bce3ed",
  },
  unknown: {
    label: "Status update",
    description: "The event status is being updated.",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#64748b",
    background: "#f1f5f9",
    border: "#dbe4ec",
  },
};

const STATUS_FILTERS: StatusFilter[] = ["all", ...EVENT_STATUSES];

const formatEventDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be confirmed";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getAction = (status: DisplayStatus) => {
  switch (status) {
    case "draft":
      return {
        label: "Continue editing",
        icon: "arrow-forward-outline" as IconName,
      };
    case "rejected":
      return { label: "Fix & resubmit", icon: "create-outline" as IconName };
    case "completed":
      return { label: "View summary", icon: "bar-chart-outline" as IconName };
    case "cancelled":
      return { label: "View details", icon: "eye-outline" as IconName };
    default:
      return { label: "Manage event", icon: "settings-outline" as IconName };
  }
};

export default function MyCreatedEventsScreen({ navigation, route }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    route.params?.initialStatus ?? "all",
  );
  const [q, setQ] = useState("");
  const [createdEvents, setCreatedEvents] = useState<CreatedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  useEffect(() => {
    if (!route.params?.initialStatus) return;
    setStatusFilter(route.params.initialStatus);
    setQ("");
    navigation.setParams({ initialStatus: undefined });
  }, [navigation, route.params?.initialStatus]);

  const loadCreatedEvents = useCallback(
    async (signal?: AbortSignal, showError = true) => {
      setLoading(true);
      try {
        const response = await eventsApi.createdByMe(signal);
        setCreatedEvents(
          response.data.events.map((event, index) => ({
            id: event._id,
            title: event.title,
            meta:
              parseEventStatus(event.status) === "draft"
                ? `Draft saved on ${new Date(event.createdAt).toLocaleDateString()}`
                : formatEventDate(event.startsAt),
            image:
              event.coverImageUrl || (index % 2 ? images.run : images.garden),
            status: parseEventStatus(event.status),
          })),
        );
      } catch (error: unknown) {
        if (error instanceof ApiError && error.code === "REQUEST_CANCELLED")
          return;
        if (showError) {
          setNotice({
            title: "Events unavailable",
            message:
              error instanceof ApiError
                ? error.message
                : "Unable to load your created events.",
          });
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void loadCreatedEvents(controller.signal);
      return () => controller.abort();
    }, [loadCreatedEvents]),
  );
  const shown = useMemo(
    () =>
      createdEvents.filter(
        (x) =>
          (statusFilter === "all" || x.status === statusFilter) &&
          x.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [statusFilter, q, createdEvents],
  );
  const statusCounts = useMemo(() => {
    const counts: Record<DisplayStatus, number> = {
      draft: 0,
      pending_approval: 0,
      published: 0,
      rejected: 0,
      deactivated: 0,
      cancelled: 0,
      completed: 0,
      unknown: 0,
    };

    createdEvents.forEach((event) => {
      counts[event.status] += 1;
    });

    return counts;
  }, [createdEvents]);
  const selectedStatusMeta =
    statusFilter === "all" ? undefined : STATUS_META[statusFilter];

  const publishEventForReview = async (eventId: string) => {
    if (publishingEventId) return;
    setPublishingEventId(eventId);
    try {
      const response = await eventsApi.publish(eventId);
      const status = parseEventStatus(response.data.event.status);
      setCreatedEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                meta:
                  status === "draft"
                    ? event.meta
                    : formatEventDate(response.data.event.startsAt),
                status,
              }
            : event,
        ),
      );
      await loadCreatedEvents(undefined, false);
      setNotice({
        title:
          status === "published"
            ? "Event published"
            : status === "rejected"
              ? "AI review needs attention"
              : "Event review updated",
        message: response.message,
      });
    } catch (error) {
      const reason =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "The publish check could not be completed.";
      const aiReviewFailed =
        error instanceof ApiError &&
        /\b(ai|moderation|moderate|flagged|content policy|safety review)\b/i.test(
          `${error.code} ${error.message}`,
        );

      await loadCreatedEvents(undefined, false);
      const reviewAlreadyRunning =
        error instanceof ApiError && error.code === "EVENT_NOT_SUBMITTABLE";
      setNotice({
        title: reviewAlreadyRunning
          ? "AI review already in progress"
          : aiReviewFailed
            ? "AI review needs attention"
            : "Unable to publish",
        message: reviewAlreadyRunning
          ? "This event is already being reviewed or its status changed. Refresh the event list and try again if it is still pending."
          : aiReviewFailed
            ? `Our AI review flagged this event: ${reason}. Update the draft and try again.`
            : `We couldn't submit this event for approval. Reason: ${reason}. Review its status in My Created Events.`,
      });
    } finally {
      setPublishingEventId(null);
    }
  };

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
          <View style={s.summary}>
            <View style={s.summaryCopy}>
              <Text style={s.eyebrow}>EVENT WORKSPACE</Text>
              <Text style={s.summaryTitle}>Every event, one clear status.</Text>
            </View>
            <View style={s.totalBadge}>
              <Text style={s.totalValue}>{createdEvents.length}</Text>
              <Text style={s.totalLabel}>TOTAL</Text>
            </View>
          </View>
          <View style={s.filterHeading}>
            <Text style={s.sectionLabel}>FILTER BY STATUS</Text>
            <Text style={s.resultLabel}>{shown.length} shown</Text>
          </View>
          <ScrollView
            contentContainerStyle={s.filterContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {STATUS_FILTERS.map((filter) => {
              const selected = statusFilter === filter;
              const meta = filter === "all" ? undefined : STATUS_META[filter];
              const label = meta?.label ?? "All events";

              return (
                <Pressable
                  key={filter}
                  onPress={() => setStatusFilter(filter)}
                  style={[
                    s.filterChip,
                    selected && s.filterChipSelected,
                    selected && meta
                      ? { backgroundColor: meta.color, borderColor: meta.color }
                      : null,
                  ]}
                >
                  {meta ? (
                    <View
                      style={[
                        s.filterDot,
                        { backgroundColor: selected ? "#fff" : meta.color },
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[s.filterText, selected && s.filterTextSelected]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[s.filterCount, selected && s.filterCountSelected]}
                  >
                    {filter === "all"
                      ? createdEvents.length
                      : statusCounts[filter]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {shown.map((x) => {
            const status = STATUS_META[x.status];
            const action = getAction(x.status);

            return (
              <View key={x.id} style={s.card}>
                <ImageBackground
                  source={{ uri: x.image }}
                  style={s.image}
                  imageStyle={s.imageRadius}
                >
                  <View style={s.imageShade} />
                  <View style={s.imageHeader}>
                    <View style={[s.badge, { backgroundColor: status.color }]}>
                      <Ionicons name={status.icon} size={15} color="#fff" />
                      <Text style={s.badgeText}>{status.label}</Text>
                    </View>
                  </View>
                </ImageBackground>
                <View style={s.body}>
                  <Text style={s.cardTitle} numberOfLines={2}>
                    {x.title}
                  </Text>
                  <View style={s.meta}>
                    <Ionicons
                      name={
                        x.status === "draft"
                          ? "create-outline"
                          : "calendar-outline"
                      }
                      size={19}
                      color="#29965a"
                    />
                    <Text style={s.metaText}>{x.meta}</Text>
                  </View>
                  <View
                    style={[
                      s.statusPanel,
                      {
                        backgroundColor: status.background,
                        borderColor: status.border,
                      },
                    ]}
                  >
                    <View
                      style={[s.statusIcon, { backgroundColor: status.color }]}
                    >
                      <Ionicons name={status.icon} size={18} color="#fff" />
                    </View>
                    <View style={s.statusCopy}>
                      <Text style={[s.statusLabel, { color: status.color }]}>
                        {status.label}
                      </Text>
                      <Text style={s.statusDescription}>
                        {status.description}
                      </Text>
                    </View>
                  </View>
                  {x.status === "draft" || x.status === "pending_approval" ? (
                    <View style={s.draftActions}>
                      <Pressable
                        accessibilityLabel={
                          x.status === "draft"
                            ? `Submit ${x.title} for approval`
                            : `Validate and publish ${x.title}`
                        }
                        disabled={publishingEventId !== null}
                        onPress={() => void publishEventForReview(x.id)}
                        style={[
                          s.publishDraft,
                          publishingEventId !== null && s.disabledAction,
                        ]}
                      >
                        {publishingEventId === x.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Ionicons
                            name={
                              x.status === "draft"
                                ? "cloud-upload-outline"
                                : "sparkles"
                            }
                            size={18}
                            color="#fff"
                          />
                        )}
                        <Text style={s.publishDraftText}>
                          {publishingEventId === x.id
                            ? x.status === "pending_approval"
                              ? "Validating..."
                              : "Submitting..."
                            : x.status === "draft"
                              ? "Submit for approval"
                              : "Validate & publish"}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`${action.label} for ${x.title}`}
                        onPress={() =>
                          navigation.navigate("ManageCreatedEvent", {
                            eventId: x.id,
                          })
                        }
                        style={[s.manage, s.manageSecondary]}
                      >
                        <Text style={s.manageText}>{action.label}</Text>
                        <Ionicons
                          name={action.icon}
                          size={19}
                          color={colors.ink}
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityLabel={`${action.label} for ${x.title}`}
                      onPress={() =>
                        navigation.navigate("ManageCreatedEvent", {
                          eventId: x.id,
                        })
                      }
                      style={s.manage}
                    >
                      <Text style={s.manageText}>{action.label}</Text>
                      <Ionicons
                        name={action.icon}
                        size={19}
                        color={colors.ink}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
          {loading ? (
            <View style={s.loadingState}>
              <ActivityIndicator color="#08b657" />
              <Text style={s.empty}>Loading your events...</Text>
            </View>
          ) : null}
          {!loading && !shown.length ? (
            <View style={s.emptyState}>
              <View style={s.emptyIcon}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={25}
                  color="#08b657"
                />
              </View>
              <Text style={s.emptyTitle}>
                {statusFilter === "all"
                  ? "No events found"
                  : `No ${selectedStatusMeta?.label.toLowerCase()} events`}
              </Text>
              <Text style={s.empty}>
                {q
                  ? "Try a different search term."
                  : "Create an event to start building your community calendar."}
              </Text>
            </View>
          ) : null}
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
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
      <AiValidationModal visible={publishingEventId !== null} />
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
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  summaryCopy: { flex: 1, paddingRight: 12 },
  eyebrow: {
    color: "#699080",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  summaryTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 5,
  },
  totalBadge: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  totalValue: {
    color: colors.lime,
    fontFamily: fonts.extraBold,
    fontSize: 20,
  },
  totalLabel: {
    color: "#b8cabc",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 1,
  },
  filterHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 27,
  },
  sectionLabel: {
    color: "#779487",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  resultLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  filterContent: { gap: 8, paddingRight: 24, paddingVertical: 12 },
  filterChip: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#e5ece8",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  filterChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterDot: { borderRadius: 4, height: 8, width: 8 },
  filterText: { color: "#527461", fontFamily: fonts.semiBold, fontSize: 12 },
  filterTextSelected: { color: "#fff" },
  filterCount: { color: "#8ba095", fontFamily: fonts.bold, fontSize: 11 },
  filterCountSelected: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    marginTop: 18,
    overflow: "hidden",
    shadowColor: "#123326",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  image: { height: 205, padding: 16 },
  imageRadius: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  imageShade: {
    backgroundColor: "rgba(7, 19, 13, 0.2)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  imageHeader: { alignItems: "flex-start" },
  badge: {
    alignItems: "center",
    borderRadius: 17,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: { color: "#fff", fontFamily: fonts.bold, fontSize: 12 },
  body: { padding: 18 },
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 26,
  },
  meta: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 9 },
  metaText: { color: "#29965a", fontFamily: fonts.medium, fontSize: 14 },
  statusPanel: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    padding: 11,
  },
  statusIcon: {
    alignItems: "center",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  statusCopy: { flex: 1 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 13 },
  statusDescription: {
    color: "#5c6c63",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  draftActions: { gap: 8, marginTop: 14 },
  publishDraft: {
    alignItems: "center",
    backgroundColor: "#0d4933",
    borderRadius: 18,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  publishDraftText: {
    color: "#fff",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  manage: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  manageSecondary: {
    backgroundColor: "#f3faf6",
    borderColor: "#dcece3",
    borderWidth: 1,
    marginTop: 0,
  },
  disabledAction: { opacity: 0.55 },
  manageText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14 },
  loadingState: { alignItems: "center", marginTop: 42 },
  emptyState: { alignItems: "center", marginTop: 52, paddingHorizontal: 20 },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginTop: 14,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
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
});
