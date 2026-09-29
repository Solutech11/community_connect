import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppLoader from "../../components/ui/app-loader";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import EventAttendeeDetailsSheet from "../../components/ui/event-attendee-details-sheet";
import AppSelectSheet from "../../components/ui/app-select-sheet";
import KeyboardAwareScrollView from "../../components/ui/keyboard-aware-scroll-view";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { EVENT_AUDIENCES } from "../../data/event-locations";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { uploadsApi } from "../../services/api/uploads.api";
import { colors, fonts } from "../../styles/theme";
import type { ImageUpload } from "../../types/api";
import type {
  GetEventsIdAttendeesResponse,
  GetEventsIdResponse,
} from "../../types/api.generated";
import {
  EVENT_SETTING_VALUES,
  isEventSetting,
  normalizeEventSetting,
  type EventSetting,
} from "../../types/events";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ManageCreatedEvent">;
type ModerationCheck = { acceptable?: boolean; reasons?: unknown[] };
type EventModeration = {
  verdict?: string;
  reviewedAt?: string;
  reasons?: unknown[];
  checks?: Partial<
    Record<
      "content" | "image" | "pricing" | "communityGuidelines",
      ModerationCheck
    >
  >;
};
type Event = Omit<GetEventsIdResponse["data"]["event"], "moderation"> & {
  targetAudience?: string;
  moderation?: EventModeration;
};
type TicketType = GetEventsIdResponse["data"]["ticketTypes"][number];
type Attendee = GetEventsIdAttendeesResponse["data"]["attendees"][number];
type AttendeeSummary = GetEventsIdAttendeesResponse["data"]["summary"];

const EMPTY_ATTENDEE_SUMMARY: AttendeeSummary = {
  orders: 0,
  totalTickets: 0,
  checkedInTickets: 0,
  pendingTickets: 0,
};

const AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85";
const DEFAULT_EVENT_COVER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=88";
const STATUS_TONES: Record<
  string,
  { label: string; background: string; foreground: string }
> = {
  draft: { label: "Draft", background: "#eef2f0", foreground: "#53625a" },
  pending_approval: {
    label: "Pending review",
    background: "#fff3d7",
    foreground: "#986813",
  },
  published: {
    label: "Published",
    background: "#def6e8",
    foreground: "#087b3d",
  },
  rejected: {
    label: "Rejected",
    background: "#fde6e8",
    foreground: "#b42335",
  },
  deactivated: {
    label: "Deactivated",
    background: "#f3e8ea",
    foreground: "#8f3947",
  },
  cancelled: {
    label: "Cancelled",
    background: "#f3e8ea",
    foreground: "#8f3947",
  },
  completed: {
    label: "Completed",
    background: "#e6effb",
    foreground: "#315e99",
  },
};
const MODERATION_RULES = [
  ["content", "Event content"],
  ["image", "Cover image"],
  ["pricing", "Ticket pricing"],
  ["communityGuidelines", "Community guidelines"],
] as const;
const money = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    kobo / 100,
  );

export default function ManageCreatedEventConnectedScreen({
  navigation,
  route,
}: Props) {
  const eventId = route.params?.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [manageTab, setManageTab] = useState<"details" | "attendees">(
    "details",
  );
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeSummary, setAttendeeSummary] = useState<AttendeeSummary>(
    EMPTY_ATTENDEE_SUMMARY,
  );
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [setting, setSetting] = useState<EventSetting>("indoor");
  const [settingPickerOpen, setSettingPickerOpen] = useState(false);
  const [targetAudience, setTargetAudience] = useState("");
  const [audiencePickerOpen, setAudiencePickerOpen] = useState(false);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketCapacity, setTicketCapacity] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [publishCooldownUntil, setPublishCooldownUntil] = useState<
    number | null
  >(null);
  const [publishCooldownSeconds, setPublishCooldownSeconds] = useState(0);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!eventId) {
        setNotice({
          title: "No event selected",
          message: "Open management from one of your created events.",
        });
        setLoading(false);
        return;
      }
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const eventResponse = await eventsApi.getForManagement(eventId);
        const nextEvent: Event = eventResponse.data.event;
        const wasPublished =
          nextEvent.status === "published" || Boolean(nextEvent.publishedAt);
        const attendeeResponse = wasPublished
          ? await eventsApi.attendees(eventId)
          : null;
        setEvent(nextEvent);
        setTicketTypes(eventResponse.data.ticketTypes);
        setAttendees(attendeeResponse?.data.attendees ?? []);
        setAttendeeSummary(
          attendeeResponse?.data.summary ?? EMPTY_ATTENDEE_SUMMARY,
        );
        setTitle(nextEvent.title);
        setDescription(nextEvent.description);
        setStartsAt(nextEvent.startsAt);
        setEndsAt(nextEvent.endsAt);
        setCapacity(String(nextEvent.maxCapacity));
        setSetting(normalizeEventSetting(nextEvent.setting));
        setTargetAudience(nextEvent.targetAudience ?? "");
      } catch (error) {
        setNotice({
          title: "Management unavailable",
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to load this event.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (publishCooldownUntil === null) return;

    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((publishCooldownUntil - Date.now()) / 1000),
      );
      setPublishCooldownSeconds(remaining);
      if (remaining === 0) setPublishCooldownUntil(null);
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [publishCooldownUntil]);

  useEffect(() => {
    setPublishCooldownUntil(null);
    setPublishCooldownSeconds(0);
    setManageTab("details");
  }, [eventId]);

  const canEditEvent =
    event?.status === "draft" || event?.status === "rejected";
  const isRepublish = event?.status === "rejected";
  const publishActionLabel = isRepublish ? "Republish" : "Submit";
  const publishingProgressLabel = isRepublish
    ? "Republishing..."
    : "Submitting...";
  const publishCooldownLabel = isRepublish
    ? `Republish in ${publishCooldownSeconds}s`
    : `Submit again in ${publishCooldownSeconds}s`;

  const act = async (action: () => Promise<unknown>, success: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await action();
      setNotice({ title: "Event updated", message: success });
      await load(true);
    } catch (error) {
      setNotice({
        title: "Action failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to update this event.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitEvent = async () => {
    if (!eventId || submitting || publishing || publishCooldownSeconds > 0) {
      return;
    }
    setPublishCooldownUntil(Date.now() + 60_000);
    setPublishCooldownSeconds(60);
    setPublishing(true);
    try {
      const wasRejected = event?.status === "rejected";
      await act(
        () => eventsApi.publish(eventId),
        wasRejected
          ? "Event republished for moderation."
          : "Event submitted for approval.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const saveDetails = async () => {
    const maxCapacity = Number(capacity);
    const parsedStart = new Date(startsAt);
    const parsedEnd = new Date(endsAt);
    if (
      !eventId ||
      !title.trim() ||
      !description.trim() ||
      !Number.isInteger(maxCapacity) ||
      maxCapacity <= 0 ||
      Number.isNaN(parsedStart.getTime()) ||
      Number.isNaN(parsedEnd.getTime()) ||
      parsedEnd <= parsedStart
    ) {
      setNotice({
        title: "Check event details",
        message:
          "Enter a title, description, positive whole-number capacity, and valid ISO dates with the end after the start.",
      });
      return;
    }
    setSavingDetails(true);
    try {
      await act(
        () =>
          eventsApi.updateDraft(eventId, {
            title: title.trim(),
            description: description.trim(),
            startsAt: parsedStart.toISOString(),
            endsAt: parsedEnd.toISOString(),
            maxCapacity,
            setting,
            targetAudience: targetAudience.trim() || undefined,
          }),
        "Event details saved.",
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const changeCoverImage = async () => {
    if (!eventId || !canEditEvent || submitting || uploadingCover) return;
    setUploadingCover(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const image: ImageUpload = {
        uri: asset.uri,
        name: asset.fileName ?? `event-cover-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      };
      await act(async () => {
        const uploaded = await uploadsApi.image(image, "events");
        await eventsApi.updateDraft(eventId, {
          coverImageUrl: uploaded.data.url,
        });
      }, "Event cover image updated.");
    } catch (error) {
      setNotice({
        title: "Image update failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to choose an event cover image.",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const addTicket = () => {
    const price = Number(ticketPrice || 0);
    const nextCapacity = Number(ticketCapacity || 0);
    if (
      !eventId ||
      !ticketTitle.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(nextCapacity) ||
      nextCapacity <= 0
    ) {
      setNotice({
        title: "Check ticket tier",
        message:
          "Enter a title, non-negative price, and positive whole-number capacity.",
      });
      return;
    }
    void act(async () => {
      await eventsApi.addTicketType(eventId, {
        title: ticketTitle.trim(),
        priceKobo: Math.round(price * 100),
        capacity: nextCapacity,
      });
      setTicketTitle("");
      setTicketPrice("");
      setTicketCapacity("");
    }, "Ticket tier added.");
  };

  const visibleAttendees = useMemo(
    () =>
      attendees.filter((order) =>
        `${order.buyerId.firstName} ${order.buyerId.lastName} ${order.buyerId.email}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [attendees, query],
  );
  const totalGuests = attendeeSummary.totalTickets;
  const totalEarningsKobo = useMemo(
    () =>
      attendees.reduce(
        (total, order) => total + order.organizerProceedsKobo,
        0,
      ),
    [attendees],
  );
  const canViewAttendees =
    event?.status === "published" || Boolean(event?.publishedAt);
  const activeTab = canViewAttendees ? manageTab : "details";

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Manage Event" onBack={navigation.goBack} />
        {canViewAttendees ? (
          <View style={styles.manageTabs}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "details" }}
              onPress={() => setManageTab("details")}
              style={[
                styles.manageTab,
                activeTab === "details" && styles.manageTabActive,
              ]}
            >
              <Ionicons
                color={activeTab === "details" ? colors.white : "#638071"}
                name="information-circle-outline"
                size={17}
              />
              <Text
                style={[
                  styles.manageTabText,
                  activeTab === "details" && styles.manageTabTextActive,
                ]}
              >
                Details
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "attendees" }}
              onPress={() => setManageTab("attendees")}
              style={[
                styles.manageTab,
                activeTab === "attendees" && styles.manageTabActive,
              ]}
            >
              <Ionicons
                color={activeTab === "attendees" ? colors.white : "#638071"}
                name="people-outline"
                size={17}
              />
              <Text
                style={[
                  styles.manageTabText,
                  activeTab === "attendees" && styles.manageTabTextActive,
                ]}
              >
                Attendees
              </Text>
              <View
                style={[
                  styles.manageTabCount,
                  activeTab === "attendees" && styles.manageTabCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.manageTabCountText,
                    activeTab === "attendees" &&
                      styles.manageTabCountTextActive,
                  ]}
                >
                  {attendeeSummary.orders}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}
        <KeyboardAwareScrollView
          key={`${eventId ?? "missing"}-${activeTab}`}
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
            />
          }
        >
          {loading ? (
            <View style={styles.state}>
              <AppLoader color="#08b657" />
              <Text style={styles.meta}>Loading event...</Text>
            </View>
          ) : null}
          {event ? (
            <>
              <ImageBackground
                accessibilityLabel={`${event.title} cover image`}
                imageStyle={styles.heroImage}
                source={{ uri: event.coverImageUrl || DEFAULT_EVENT_COVER }}
                style={styles.hero}
              >
                <View style={styles.heroShade} />
                {canEditEvent ? (
                  <Pressable
                    accessibilityLabel="Edit event image"
                    accessibilityRole="button"
                    accessibilityState={{
                      busy: uploadingCover,
                      disabled: submitting || uploadingCover,
                    }}
                    android_ripple={{ color: "#d6f0df" }}
                    disabled={submitting || uploadingCover}
                    onPress={() => void changeCoverImage()}
                    style={({ pressed }) => [
                      styles.coverEdit,
                      pressed && !uploadingCover && styles.actionPressed,
                      (submitting || uploadingCover) && styles.actionDisabled,
                    ]}
                  >
                    {uploadingCover ? (
                      <AppLoader color="#087b3d" size="small" />
                    ) : (
                      <Ionicons
                        color="#087b3d"
                        name="camera-outline"
                        size={16}
                      />
                    )}
                    <Text style={styles.coverEditText}>
                      {uploadingCover ? "Saving image..." : "Edit image"}
                    </Text>
                  </Pressable>
                ) : null}
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        STATUS_TONES[event.status]?.background ?? "#eef2f0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          STATUS_TONES[event.status]?.foreground ?? "#53625a",
                      },
                    ]}
                  >
                    {STATUS_TONES[event.status]?.label ??
                      event.status.replace(/_/g, " ")}
                  </Text>
                </View>
                <Text numberOfLines={2} style={styles.heroTitle}>
                  {event.title}
                </Text>
                <Text numberOfLines={2} style={styles.heroMeta}>
                  {event.venueName}, {event.address}
                </Text>
              </ImageBackground>
              {event.moderation?.verdict ? (
                <ModerationVerdictCard moderation={event.moderation} />
              ) : event.status === "pending_approval" ? (
                <View style={[styles.verdictCard, styles.verdictPending]}>
                  <Ionicons color="#986813" name="time-outline" size={22} />
                  <View style={styles.verdictCopy}>
                    <Text style={[styles.verdictTitle, styles.pendingTitle]}>
                      Review pending
                    </Text>
                    <Text
                      style={[styles.verdictMessage, styles.pendingMessage]}
                    >
                      This event is waiting for moderation. The current API does
                      not allow changes while review is in progress.
                    </Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.stats}>
                <Stat label="Guests" value={String(totalGuests)} />
                <Stat label="Capacity" value={String(event.maxCapacity)} />
                <Stat label="Ticket tiers" value={String(ticketTypes.length)} />
              </View>
              <View style={styles.earningsCard}>
                <View style={styles.earningsIcon}>
                  <Ionicons
                    color={colors.lime}
                    name="wallet-outline"
                    size={21}
                  />
                </View>
                <View style={styles.earningsCopy}>
                  <Text style={styles.earningsLabel}>Total earnings</Text>
                  <Text style={styles.earningsValue}>
                    {money(totalEarningsKobo)}
                  </Text>
                  <Text style={styles.earningsMeta}>
                    Organizer proceeds from paid ticket orders
                  </Text>
                </View>
                <View style={styles.paidOnlyBadge}>
                  <View style={styles.paidOnlyDot} />
                  <Text style={styles.paidOnlyText}>PAID</Text>
                </View>
              </View>
              {activeTab === "attendees" ? (
                <Section title="Attendees">
                  <View style={styles.attendeeSummaryGrid}>
                    <AttendeeStat
                      label="Orders"
                      value={attendeeSummary.orders}
                    />
                    <AttendeeStat
                      label="Ticket units"
                      value={attendeeSummary.totalTickets}
                    />
                    <AttendeeStat
                      label="Checked in"
                      value={attendeeSummary.checkedInTickets}
                    />
                    <AttendeeStat
                      label="Not checked in"
                      value={attendeeSummary.pendingTickets}
                    />
                  </View>
                  {attendees.length ? (
                    <TextInput
                      accessibilityLabel="Search attendees"
                      onChangeText={setQuery}
                      placeholder="Search attendees"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={query}
                    />
                  ) : null}
                  {visibleAttendees.map((order) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`View ${order.buyerId.firstName} ${order.buyerId.lastName} attendee details`}
                      key={order._id}
                      onPress={() => setSelectedAttendee(order)}
                      style={styles.attendee}
                    >
                      <Image
                        source={{ uri: order.buyerId.avatarUrl || AVATAR }}
                        style={styles.avatar}
                      />
                      <View style={styles.ticketCopy}>
                        <Text style={styles.name}>
                          {order.buyerId.firstName} {order.buyerId.lastName}
                        </Text>
                        <Text style={styles.meta}>{order.buyerId.email}</Text>
                        <Text style={styles.meta}>
                          {order.ticketTypeId.title} x{order.quantity} ·{" "}
                          {order.status}
                        </Text>
                      </View>
                      <Ionicons
                        color="#7b8a82"
                        name="chevron-forward"
                        size={19}
                      />
                    </Pressable>
                  ))}
                  {!visibleAttendees.length ? (
                    <Text style={styles.empty}>
                      {attendees.length
                        ? "No attendees match your search."
                        : "Paid attendees will appear here after ticket orders are completed."}
                    </Text>
                  ) : null}
                </Section>
              ) : (
                <>
                  <View style={styles.actions}>
                    {event.status === "published" ? (
                      <Pressable
                        accessibilityLabel="Scan event tickets"
                        accessibilityRole="button"
                        android_ripple={{ color: "#cdebd8" }}
                        onPress={() =>
                          navigation.navigate("TicketScanner", { eventId })
                        }
                        style={({ pressed }) => [
                          styles.action,
                          styles.scanAction,
                          pressed && styles.actionPressed,
                        ]}
                      >
                        <Ionicons
                          color="#078d45"
                          name="qr-code-outline"
                          size={20}
                        />
                        <Text
                          style={[styles.actionText, styles.scanActionText]}
                        >
                          Scan tickets
                        </Text>
                        <Ionicons
                          color="#078d45"
                          name="chevron-forward"
                          size={16}
                        />
                      </Pressable>
                    ) : null}
                    {event.status === "draft" || event.status === "rejected" ? (
                      <Pressable
                        accessibilityLabel={
                          publishing
                            ? isRepublish
                              ? "Republishing event"
                              : "Submitting event"
                            : isRepublish
                              ? "Republish event"
                              : "Submit event for review"
                        }
                        accessibilityRole="button"
                        accessibilityState={{
                          busy: publishing,
                          disabled:
                            submitting ||
                            publishing ||
                            publishCooldownSeconds > 0,
                        }}
                        android_ripple={{ color: "#9cdfb5" }}
                        disabled={
                          submitting || publishing || publishCooldownSeconds > 0
                        }
                        onPress={() => void submitEvent()}
                        style={({ pressed }) => [
                          styles.action,
                          styles.submitAction,
                          pressed && !publishing && styles.actionPressed,
                          submitting && styles.actionDisabled,
                          publishing && styles.actionDisabled,
                          publishCooldownSeconds > 0 && styles.actionDisabled,
                        ]}
                      >
                        {publishing ? (
                          <AppLoader color={colors.ink} size="small" />
                        ) : (
                          <Ionicons
                            color={colors.ink}
                            name="cloud-upload-outline"
                            size={20}
                          />
                        )}
                        <Text
                          style={[styles.actionText, styles.submitActionText]}
                        >
                          {publishing
                            ? publishingProgressLabel
                            : publishCooldownSeconds > 0
                              ? publishCooldownLabel
                              : publishActionLabel}
                        </Text>
                        {!publishing && publishCooldownSeconds === 0 ? (
                          <Ionicons
                            color={colors.ink}
                            name="arrow-forward"
                            size={16}
                          />
                        ) : null}
                      </Pressable>
                    ) : null}
                    {event.status === "published" ? (
                      <Pressable
                        onPress={() =>
                          setConfirm({
                            title: "Cancel event?",
                            message:
                              "This changes the event status and may affect attendees.",
                            action: async () => {
                              await act(
                                () => eventsApi.cancel(eventId!),
                                "Event cancelled.",
                              );
                            },
                          })
                        }
                        style={styles.action}
                      >
                        <Ionicons
                          color="#a34b4b"
                          name="close-circle-outline"
                          size={22}
                        />
                        <Text style={styles.actionText}>Cancel</Text>
                      </Pressable>
                    ) : null}
                    {event.status === "draft" ? (
                      <Pressable
                        onPress={() =>
                          setConfirm({
                            title: "Delete draft?",
                            message:
                              "This permanently removes this draft event.",
                            action: async () => {
                              await eventsApi.remove(eventId!);
                              navigation.goBack();
                            },
                          })
                        }
                        style={styles.action}
                      >
                        <Ionicons
                          color="#a34b4b"
                          name="trash-outline"
                          size={22}
                        />
                        <Text style={styles.actionText}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Section title="Event details">
                    <TextInput
                      editable={canEditEvent}
                      onChangeText={setTitle}
                      placeholder="Title"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={title}
                    />
                    <TextInput
                      editable={canEditEvent}
                      multiline
                      onChangeText={setDescription}
                      placeholder="Description"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, styles.multiline]}
                      value={description}
                    />
                    <TextInput
                      autoCapitalize="none"
                      editable={canEditEvent}
                      onChangeText={setStartsAt}
                      placeholder="Start time (ISO 8601)"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={startsAt}
                    />
                    <TextInput
                      autoCapitalize="none"
                      editable={canEditEvent}
                      onChangeText={setEndsAt}
                      placeholder="End time (ISO 8601)"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={endsAt}
                    />
                    <TextInput
                      editable={canEditEvent}
                      keyboardType="number-pad"
                      onChangeText={setCapacity}
                      placeholder="Capacity"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={capacity}
                    />
                    <Text style={styles.fieldLabel}>Setting</Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!canEditEvent}
                      onPress={() => setSettingPickerOpen(true)}
                      style={[
                        styles.settingPicker,
                        !canEditEvent && styles.readOnly,
                      ]}
                    >
                      <Text style={styles.settingValue}>{setting}</Text>
                      {canEditEvent ? (
                        <Ionicons
                          color="#668071"
                          name="chevron-down"
                          size={18}
                        />
                      ) : null}
                    </Pressable>
                    <Text style={styles.fieldLabel}>Target audience / age</Text>
                    <Pressable
                      accessibilityLabel="Choose target audience and age group"
                      accessibilityRole="button"
                      disabled={!canEditEvent}
                      onPress={() => setAudiencePickerOpen(true)}
                      style={[
                        styles.settingPicker,
                        !canEditEvent && styles.readOnly,
                      ]}
                    >
                      <Text
                        style={[
                          styles.settingValue,
                          !targetAudience && styles.placeholderValue,
                        ]}
                      >
                        {targetAudience || "Choose who can attend"}
                      </Text>
                      {canEditEvent ? (
                        <Ionicons
                          color="#668071"
                          name="chevron-down"
                          size={18}
                        />
                      ) : null}
                    </Pressable>
                    {canEditEvent ? (
                      <Pressable
                        accessibilityLabel="Save event details"
                        accessibilityRole="button"
                        accessibilityState={{
                          busy: savingDetails,
                          disabled: submitting || savingDetails,
                        }}
                        disabled={submitting || savingDetails}
                        onPress={() => void saveDetails()}
                        style={[
                          styles.primary,
                          (submitting || savingDetails) &&
                            styles.actionDisabled,
                        ]}
                      >
                        {savingDetails ? (
                          <AppLoader color={colors.ink} size="small" />
                        ) : (
                          <Text style={styles.primaryText}>Save details</Text>
                        )}
                      </Pressable>
                    ) : (
                      <Text style={styles.meta}>
                        {event.status === "pending_approval"
                          ? "Events cannot be edited while moderation is in progress."
                          : "Only draft or rejected events can be edited."}
                      </Text>
                    )}
                  </Section>

                  <Section title="Ticket tiers">
                    {!canEditEvent ? (
                      <Text style={styles.meta}>
                        {event.status === "pending_approval"
                          ? "Ticket tiers cannot be changed while moderation is in progress."
                          : "Ticket tiers can only be changed on draft or rejected events."}
                      </Text>
                    ) : null}
                    {ticketTypes.map((ticket) => (
                      <View key={ticket._id} style={styles.ticket}>
                        <View style={styles.ticketCopy}>
                          <Text style={styles.name}>{ticket.title}</Text>
                          <Text style={styles.meta}>
                            {money(ticket.priceKobo)} - {ticket.sold}/
                            {ticket.capacity} sold
                          </Text>
                        </View>
                        <Pressable
                          accessibilityState={{
                            disabled: !canEditEvent,
                          }}
                          disabled={!canEditEvent}
                          onPress={() =>
                            navigation.navigate("EditTicketType", {
                              eventId: eventId!,
                              ticketTypeId: ticket._id,
                            })
                          }
                          style={[
                            styles.editTicket,
                            !canEditEvent && styles.disabledAction,
                          ]}
                        >
                          <Ionicons
                            color="#078d45"
                            name="create-outline"
                            size={19}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityState={{
                            disabled: !canEditEvent,
                          }}
                          disabled={!canEditEvent}
                          onPress={() =>
                            setConfirm({
                              title: "Remove ticket tier?",
                              message:
                                "The backend will reject removal if this tier can no longer be safely deleted.",
                              action: async () => {
                                await act(
                                  () =>
                                    eventsApi.removeTicketType(
                                      eventId!,
                                      ticket._id,
                                    ),
                                  "Ticket tier removed.",
                                );
                              },
                            })
                          }
                          style={[
                            styles.delete,
                            !canEditEvent && styles.disabledAction,
                          ]}
                        >
                          <Ionicons
                            color="#a34b4b"
                            name="trash-outline"
                            size={19}
                          />
                        </Pressable>
                      </View>
                    ))}
                    <TextInput
                      editable={canEditEvent}
                      onChangeText={setTicketTitle}
                      placeholder="Ticket title"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      value={ticketTitle}
                    />
                    <View style={styles.row}>
                      <TextInput
                        editable={canEditEvent}
                        keyboardType="decimal-pad"
                        onChangeText={setTicketPrice}
                        placeholder="Price NGN"
                        placeholderTextColor={colors.muted}
                        style={[styles.input, styles.flex]}
                        value={ticketPrice}
                      />
                      <TextInput
                        editable={canEditEvent}
                        keyboardType="number-pad"
                        onChangeText={setTicketCapacity}
                        placeholder="Capacity"
                        placeholderTextColor={colors.muted}
                        style={[styles.input, styles.flex]}
                        value={ticketCapacity}
                      />
                    </View>
                    <Pressable
                      disabled={submitting || !canEditEvent}
                      onPress={addTicket}
                      style={[
                        styles.secondary,
                        !canEditEvent && styles.disabledAction,
                      ]}
                    >
                      <Text style={styles.secondaryText}>Add ticket tier</Text>
                    </Pressable>
                  </Section>
                </>
              )}
            </>
          ) : null}
        </KeyboardAwareScrollView>
      </SafeAreaView>
      <AppAlertModal
        visible={Boolean(notice)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
      <EventAttendeeDetailsSheet
        attendee={selectedAttendee}
        summary={attendeeSummary}
        visible={Boolean(selectedAttendee)}
        onClose={() => setSelectedAttendee(null)}
      />
      <AppAlertModal
        visible={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmText="Continue"
        cancelText="Keep event"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm?.action;
          setConfirm(null);
          if (action) void action();
        }}
      />
      <AppSelectSheet
        onClose={() => setSettingPickerOpen(false)}
        onSelect={(value) => {
          if (isEventSetting(value)) setSetting(value);
        }}
        options={[...EVENT_SETTING_VALUES]}
        title="Event setting"
        value={setting}
        visible={settingPickerOpen}
      />
      <AppSelectSheet
        onClose={() => setAudiencePickerOpen(false)}
        onSelect={setTargetAudience}
        options={[...EVENT_AUDIENCES]}
        title="Target audience / age"
        value={targetAudience}
        visible={audiencePickerOpen}
      />
    </>
  );
}

function ModerationVerdictCard({
  moderation,
}: {
  moderation: EventModeration;
}) {
  const rejected = moderation.verdict === "rejected";
  const failedRules = MODERATION_RULES.flatMap(([key, label]) => {
    const check = moderation.checks?.[key];
    if (check?.acceptable !== false) return [];
    return [{ label, reasons: moderationReasons(check.reasons) }];
  });
  const failedReasonSet = new Set(
    failedRules.flatMap((rule) =>
      rule.reasons.map((reason) => reason.toLowerCase()),
    ),
  );
  const overallReasons = moderationReasons(moderation.reasons).filter(
    (reason) => !failedReasonSet.has(reason.toLowerCase()),
  );

  if (rejected) {
    return (
      <View style={[styles.verdictCard, styles.verdictRejected]}>
        <Ionicons color="#b42335" name="alert-circle" size={22} />
        <View style={styles.verdictCopy}>
          <Text style={[styles.verdictTitle, styles.rejectedTitle]}>
            Moderation rejected this event
          </Text>
          <Text style={[styles.verdictMessage, styles.rejectedMessage]}>
            Review the failed rules and update the event before submitting it
            again.
          </Text>
          {failedRules.length ? (
            <View style={styles.ruleList}>
              <Text style={[styles.ruleHeading, styles.rejectedTitle]}>
                Rules to fix
              </Text>
              {failedRules.map((rule) => (
                <View key={rule.label} style={styles.ruleItem}>
                  <Text style={[styles.ruleName, styles.rejectedTitle]}>
                    {rule.label}
                  </Text>
                  {rule.reasons.length ? (
                    rule.reasons.map((reason, index) => (
                      <Text
                        key={`${rule.label}-${index}`}
                        style={[styles.ruleReason, styles.rejectedMessage]}
                      >
                        {reason}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.ruleReason, styles.rejectedMessage]}>
                      The reviewer did not provide a specific reason.
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}
          {overallReasons.length ? (
            <View style={styles.ruleList}>
              <Text style={[styles.ruleHeading, styles.rejectedTitle]}>
                {failedRules.length
                  ? "Additional reviewer notes"
                  : "Review reasons"}
              </Text>
              {overallReasons.map((reason, index) => (
                <Text
                  key={`overall-${index}`}
                  style={[styles.ruleReason, styles.rejectedMessage]}
                >
                  {reason}
                </Text>
              ))}
            </View>
          ) : null}
          {!failedRules.length && !overallReasons.length ? (
            <Text style={[styles.ruleReason, styles.rejectedMessage]}>
              The moderation service did not return rule details.
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (moderation.verdict === "approved") {
    return (
      <View style={[styles.verdictCard, styles.verdictApproved]}>
        <Ionicons color="#087b3d" name="checkmark-circle" size={22} />
        <View style={styles.verdictCopy}>
          <Text style={[styles.verdictTitle, styles.approvedTitle]}>
            Moderation passed
          </Text>
          <Text style={[styles.verdictMessage, styles.approvedMessage]}>
            This event passed the moderation checks.
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

function moderationReasons(reasons?: unknown[]) {
  if (!reasons) return [];
  return reasons.flatMap((reason) =>
    typeof reason === "string" && reason.trim() ? [reason.trim()] : [],
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

function AttendeeStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.attendeeSummaryStat}>
      <Text style={styles.attendeeSummaryValue}>{value}</Text>
      <Text style={styles.attendeeSummaryLabel}>{label}</Text>
    </View>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 22, paddingBottom: 70 },
  state: { alignItems: "center", padding: 40 },
  hero: {
    backgroundColor: "#083120",
    borderRadius: 30,
    height: 230,
    justifyContent: "flex-end",
    marginTop: 15,
    padding: 22,
    overflow: "hidden",
  },
  heroImage: { borderRadius: 30 },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.42)",
  },
  coverEdit: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 1,
    elevation: 2,
  },
  coverEditText: {
    color: "#087b3d",
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: "capitalize",
  },
  heroTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 16,
  },
  heroMeta: {
    color: "#b8d2c4",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 7,
  },
  verdictCard: {
    alignItems: "flex-start",
    borderRadius: 22,
    flexDirection: "row",
    gap: 11,
    marginTop: 14,
    padding: 16,
  },
  verdictRejected: {
    backgroundColor: "#fff0f1",
    borderColor: "#f2c4ca",
    borderWidth: 1,
  },
  verdictApproved: {
    backgroundColor: "#e8f8ee",
    borderColor: "#bfe8ce",
    borderWidth: 1,
  },
  verdictPending: {
    backgroundColor: "#fff7e7",
    borderColor: "#f1ddb3",
    borderWidth: 1,
  },
  verdictCopy: { flex: 1 },
  verdictTitle: { fontFamily: fonts.extraBold, fontSize: 14 },
  rejectedTitle: { color: "#a62132" },
  approvedTitle: { color: "#087b3d" },
  pendingTitle: { color: "#875d13" },
  verdictMessage: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  rejectedMessage: { color: "#803b44" },
  approvedMessage: { color: "#356b4c" },
  pendingMessage: { color: "#7b6744" },
  ruleList: { gap: 8, marginTop: 13 },
  ruleHeading: { fontFamily: fonts.bold, fontSize: 11 },
  ruleItem: { gap: 3 },
  ruleName: { fontFamily: fonts.bold, fontSize: 11 },
  ruleReason: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
  manageTabs: {
    backgroundColor: "#e9f2ed",
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 18,
    marginTop: 4,
    padding: 5,
  },
  manageTab: {
    alignItems: "center",
    borderRadius: 15,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 10,
  },
  manageTabActive: { backgroundColor: colors.forest },
  manageTabText: { color: "#557264", fontFamily: fonts.bold, fontSize: 12 },
  manageTabTextActive: { color: colors.white },
  manageTabCount: {
    alignItems: "center",
    backgroundColor: "#d8e9df",
    borderRadius: 10,
    height: 20,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 5,
  },
  manageTabCountActive: { backgroundColor: "#315845" },
  manageTabCountText: {
    color: "#47705a",
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  manageTabCountTextActive: { color: colors.white },
  stats: { flexDirection: "row", gap: 10, marginTop: 12 },
  stat: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    flex: 1,
    padding: 15,
  },
  statValue: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 18 },
  earningsCard: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderRadius: 22,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    padding: 16,
  },
  earningsIcon: {
    alignItems: "center",
    backgroundColor: "rgba(20, 232, 111, 0.14)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  earningsCopy: { flex: 1 },
  earningsLabel: { color: "#afd0bc", fontFamily: fonts.bold, fontSize: 10 },
  earningsValue: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginTop: 3,
  },
  earningsMeta: {
    color: "#b9d3c3",
    fontFamily: fonts.medium,
    fontSize: 9,
    marginTop: 3,
  },
  paidOnlyBadge: {
    alignItems: "center",
    backgroundColor: "#194333",
    borderRadius: 13,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  paidOnlyDot: {
    backgroundColor: colors.lime,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  paidOnlyText: {
    color: "#cef1dc",
    fontFamily: fonts.extraBold,
    fontSize: 8,
    letterSpacing: 0.4,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  action: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  actionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 10 },
  scanAction: {
    backgroundColor: "#eaf8ef",
    borderColor: "#bfe7cd",
    borderWidth: 1,
    minHeight: 48,
  },
  scanActionText: { color: "#087b3d", fontSize: 11 },
  submitAction: {
    backgroundColor: colors.lime,
    borderColor: "#9edfb5",
    borderWidth: 1,
    elevation: 2,
    minHeight: 48,
  },
  submitActionText: { fontSize: 11 },
  actionPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  actionDisabled: { opacity: 0.65 },
  section: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginTop: 17,
    padding: 16,
  },
  heading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f1f7f4",
    borderRadius: 16,
    color: colors.ink,
    fontFamily: fonts.medium,
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fieldLabel: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginTop: 11,
  },
  settingPicker: {
    alignItems: "center",
    backgroundColor: "#f1f7f4",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  settingValue: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
    textTransform: "capitalize",
  },
  placeholderValue: { color: colors.muted },
  readOnly: { opacity: 0.65 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  primary: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 19,
    marginTop: 12,
    padding: 12,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
  secondary: {
    alignItems: "center",
    borderColor: "#08b657",
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 11,
    padding: 11,
  },
  secondaryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 11 },
  ticket: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 12,
  },
  ticketCopy: { flex: 1 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  meta: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 4,
  },
  editTicket: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    marginRight: 7,
    width: 34,
  },
  delete: {
    alignItems: "center",
    backgroundColor: "#f9eeee",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  disabledAction: { opacity: 0.45 },
  attendee: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 11,
  },
  avatar: { borderRadius: 21, height: 42, marginRight: 10, width: 42 },
  attendeeSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  attendeeSummaryStat: {
    backgroundColor: "#eef8f2",
    borderRadius: 17,
    flexBasis: "48%",
    flexGrow: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  attendeeSummaryValue: {
    color: "#087b3d",
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  attendeeSummaryLabel: {
    color: "#67776e",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 3,
  },
  empty: {
    color: "#718078",
    fontFamily: fonts.medium,
    marginTop: 15,
    textAlign: "center",
  },
});
