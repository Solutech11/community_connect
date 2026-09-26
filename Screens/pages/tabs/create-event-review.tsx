import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AppAlertModal from "../../components/ui/app-alert-modal";
import EventSubmissionAnimationModal from "../../components/ui/event-submission-animation-modal";
import EventLocationMap, {
  type MapCoordinate,
} from "../../components/ui/event-location-map";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { uploadsApi } from "../../services/api/uploads.api";
import { createEventDraftStorage } from "../../services/storage/create-event-draft.storage";
import {
  CreateEventHeader,
  InfoCard,
  StepProgress,
} from "../../components/ui/create-event-ui";
import { defaultProfileAvatarUrl } from "../../data/profile";
import { useAuth } from "../../hooks/use-auth";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEventReview">;

const MONTH_INDEX: Record<string, number> = {
  Apr: 3,
  Aug: 7,
  Dec: 11,
  Feb: 1,
  Jan: 0,
  Jul: 6,
  Jun: 5,
  Mar: 2,
  May: 4,
  Nov: 10,
  Oct: 9,
  Sep: 8,
};

function createLocalDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  return date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
    ? date
    : undefined;
}

function parseEventDate(value: string) {
  const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    return createLocalDate(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3]),
    );
  }

  const legacyMatch = value.match(
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s([A-Z][a-z]{2})\s(\d{1,2}),\s(\d{4})$/,
  );
  const month = legacyMatch ? MONTH_INDEX[legacyMatch[1]] : undefined;
  return legacyMatch && month !== undefined
    ? createLocalDate(Number(legacyMatch[3]), month, Number(legacyMatch[2]))
    : undefined;
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const date = parseEventDate(dateValue);
  const match = timeValue.match(/^(1[0-2]|[1-9]):([0-5][0-9]) (AM|PM)$/);
  if (!date || !match) throw new Error("Invalid event date or time.");
  const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
  date.setHours(hour, Number(match[2]), 0, 0);
  return date.toISOString();
}

function formatEventDate(value: string) {
  const date = parseEventDate(value);
  return date
    ? new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        weekday: "short",
        year: "numeric",
      }).format(date)
    : value;
}

function formatTicketPrice(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

function parseMapCoordinate(latitude: string, longitude: string) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (
    !latitude.trim() ||
    !longitude.trim() ||
    !Number.isFinite(parsedLatitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    !Number.isFinite(parsedLongitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }
  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
  } satisfies MapCoordinate;
}

export default function CreateEventReviewScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    success?: boolean;
    viewDrafts?: boolean;
  } | null>(null);
  const hostName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Community Member";
  const hostEmail = user?.email || "Email unavailable";
  const mapCoordinate = parseMapCoordinate(draft.latitude, draft.longitude);

  const publish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      let coverImageUrl = draft.coverImage;
      if (!/^https:\/\//i.test(coverImageUrl)) {
        const upload = await uploadsApi.image(
          {
            uri: coverImageUrl,
            name: "event-cover-" + Date.now() + ".jpg",
            type: "image/jpeg",
          },
          "events",
        );
        coverImageUrl = upload.data.url;
      }

      const created = await eventsApi.createDraft({
        title: draft.title.trim(),
        description: draft.description.trim(),
        coverImageUrl,
        activityType: draft.activityType,
        targetAudience: draft.audience || undefined,
        setting: draft.setting,
        country: draft.country || "Nigeria",
        state: draft.state,
        lga: draft.lga,
        venueName: draft.venueName,
        address: draft.address,
        coordinates: {
          type: "Point",
          coordinates: [Number(draft.longitude), Number(draft.latitude)],
        },
        startsAt: combineDateAndTime(draft.startDate, draft.startTime),
        endsAt: combineDateAndTime(draft.endDate, draft.endTime),
        timezone: "Africa/Lagos",
        contactPhone: draft.phone || undefined,
        maxCapacity: Number.parseInt(draft.capacity, 10),
        tags: [draft.activityType, draft.audience, draft.setting].filter(
          Boolean,
        ),
      });

      for (const ticket of draft.tickets) {
        const capacity =
          ticket.capacity === "Unlimited"
            ? undefined
            : Number.parseInt(ticket.capacity, 10);
        await eventsApi.addTicketType(created.data.event._id, {
          title: ticket.title,
          priceKobo: Math.round(Number(ticket.price) * 100),
          ...(capacity ? { capacity } : {}),
        });
      }
      // Publish only after the event and all ticket tiers have been created.
      try {
        await eventsApi.publish(created.data.event._id);
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

        setAlert({
          title: aiReviewFailed
            ? "AI review needs attention"
            : "Saved to Drafts",
          message: aiReviewFailed
            ? `We couldn't verify this event for publishing because our AI review flagged an issue: ${reason}. Your event remains saved under My Created Events > Drafts.`
            : `We couldn't verify this event for publishing. Reason: ${reason}. Your event remains saved under My Created Events > Drafts.`,
          viewDrafts: true,
        });
        return;
      }
      await createEventDraftStorage.clear();
      setAlert({
        title: "Event submitted",
        message:
          "Your event was sent for approval. It will appear publicly after it is approved.",
        success: true,
      });
    } catch (error) {
      setAlert({
        title: "Unable to submit",
        message:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Your event could not be submitted for approval.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const closeAlert = () => {
    const succeeded = alert?.success;
    const viewDrafts = alert?.viewDrafts;
    setAlert(null);
    if (succeeded) navigation.popTo("MyCreatedEvents");
    else if (viewDrafts)
      navigation.navigate("MyCreatedEvents", { initialStatus: "draft" });
  };

  return (
    <View style={styles.safe}>
      <CreateEventHeader onBack={navigation.goBack} title="CommunityConnect" />
      <StepProgress label="Review & Submit" step={4} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eventCard}>
          <ImageBackground
            imageStyle={styles.coverImage}
            source={{ uri: draft.coverImage }}
            style={styles.cover}
          >
            <View style={styles.coverBottom}>
              <Text style={styles.category}>
                {draft.activityType.toUpperCase()}
              </Text>
              <Text numberOfLines={2} style={styles.eventTitle}>
                {draft.title}
              </Text>
            </View>
          </ImageBackground>
          <Text style={styles.description}>{draft.description}</Text>
        </View>

        <InfoCard icon="calendar-outline" title="When & Where">
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons color="#08ad54" name="time-outline" size={18} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailPrimary}>
                {formatEventDate(draft.startDate) || "Date not selected"}
              </Text>
              <Text style={styles.detailSecondary}>
                {draft.startTime} - {draft.endTime}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons color="#08ad54" name="location-outline" size={18} />
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailPrimary}>
                {draft.venueName}, {draft.lga}, {draft.state}
              </Text>
              <Text style={styles.detailSecondary}>{draft.country}</Text>
            </View>
          </View>
          <View style={styles.map}>
            <EventLocationMap
              coordinate={mapCoordinate}
              country={draft.country}
              interactive={false}
              onCoordinateChange={() => undefined}
            />
          </View>
        </InfoCard>

        <InfoCard icon="ticket-outline" title="Ticket Tiers">
          <View style={styles.tickets}>
            {draft.tickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticket}>
                <View style={styles.ticketBody}>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <Text style={styles.ticketCapacity}>
                    {ticket.capacity === "Unlimited"
                      ? "UNLIMITED AVAILABILITY"
                      : ticket.capacity + " AVAILABLE"}
                  </Text>
                </View>
                <Text style={styles.ticketPrice}>
                  {formatTicketPrice(ticket.price)}
                </Text>
              </View>
            ))}
          </View>
        </InfoCard>

        <InfoCard icon="id-card-outline" title="Host Details">
          <View style={styles.host}>
            <Image
              accessibilityLabel="Your profile photo"
              source={{ uri: user?.avatarUrl || defaultProfileAvatarUrl }}
              style={styles.hostImage}
            />
            <View>
              <Text style={styles.hostName}>{hostName}</Text>
              <Text style={styles.hostEmail}>{hostEmail}</Text>
            </View>
          </View>
          <View style={styles.tags}>
            {[draft.setting, draft.activityType, draft.audience].map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag.toUpperCase()}
              </Text>
            ))}
          </View>
        </InfoCard>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          disabled={publishing}
          onPress={publish}
          style={[styles.publish, publishing && { opacity: 0.6 }]}
        >
          <Text style={styles.publishText}>
            {publishing ? "Submitting..." : "Submit for Approval"}
          </Text>
          <Ionicons color={colors.ink} name="rocket-outline" size={22} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("CreateEventDetails", { draft })}
          style={styles.edit}
        >
          <Text style={styles.editText}>Back to Edits</Text>
        </Pressable>
      </View>

      <EventSubmissionAnimationModal visible={publishing} />
      <AppAlertModal
        confirmOnly={Boolean(alert?.viewDrafts)}
        confirmText={
          alert?.viewDrafts
            ? "View Drafts"
            : alert?.success
              ? "View My Created Events"
              : "Okay"
        }
        message={alert?.message ?? ""}
        onClose={closeAlert}
        onConfirm={alert?.viewDrafts ? closeAlert : undefined}
        title={alert?.title ?? ""}
        tone={alert?.viewDrafts ? "warning" : undefined}
        visible={Boolean(alert)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { gap: 20, padding: 24, paddingBottom: 162 },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: "hidden",
  },
  cover: { height: 244, justifyContent: "flex-end" },
  coverImage: { borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  coverBottom: {
    backgroundColor: "rgba(4, 16, 10, 0.32)",
    padding: 22,
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: "#08e873",
    borderRadius: 14,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 10,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  eventTitle: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    marginTop: 9,
  },
  description: {
    color: "#278e54",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    padding: 22,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  detailIcon: {
    alignItems: "center",
    backgroundColor: "#e4f8ed",
    borderRadius: 22,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  detailBody: { flex: 1 },
  detailPrimary: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  detailSecondary: {
    color: "#2f9660",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  map: {
    backgroundColor: "#eff8f2",
    borderRadius: 24,
    height: 150,
    marginTop: 20,
    overflow: "hidden",
  },
  tickets: { gap: 10, marginTop: 18 },
  ticket: {
    alignItems: "center",
    backgroundColor: "#f8fcfa",
    borderColor: "#e1f0e8",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 58,
    paddingHorizontal: 14,
  },
  ticketBody: { flex: 1 },
  ticketTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  ticketCapacity: {
    color: "#3b9b67",
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  ticketPrice: {
    color: "#08ad54",
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  host: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
    marginTop: 18,
  },
  hostImage: {
    borderColor: "#08bd58",
    borderRadius: 24,
    borderWidth: 2,
    height: 48,
    width: 48,
  },
  hostName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  hostEmail: {
    color: "#2f9660",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
  tag: {
    backgroundColor: "#f0faf5",
    borderColor: "#ccebd9",
    borderRadius: 14,
    borderWidth: 1,
    color: "#2f9660",
    fontFamily: fonts.medium,
    fontSize: 9,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    bottom: 0,
    gap: 12,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  publish: {
    alignItems: "center",
    backgroundColor: "#08e873",
    borderRadius: 28,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 58,
  },
  publishText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  edit: {
    alignItems: "center",
    borderColor: "#08b957",
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: "center",
    minHeight: 56,
  },
  editText: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
