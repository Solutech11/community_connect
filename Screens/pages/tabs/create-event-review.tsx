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
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { uploadsApi } from "../../services/api/uploads.api";
import {
  CreateEventHeader,
  InfoCard,
  StepProgress,
} from "../../components/ui/create-event-ui";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEventReview">;

const MAP_IMAGE =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=82";
const HOST_IMAGE =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=180&q=85";

function combineDateAndTime(dateValue: string, timeValue: string) {
  const date = new Date(dateValue);
  const match = timeValue.match(/^(1[0-2]|[1-9]):([0-5][0-9]) (AM|PM)$/);
  if (Number.isNaN(date.getTime()) || !match) throw new Error("Invalid event date or time.");
  const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
  date.setHours(hour, Number(match[2]), 0, 0);
  return date.toISOString();
}

export default function CreateEventReviewScreen({ navigation, route }: Props) {
  const { draft } = route.params;
  const [publishing, setPublishing] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; success?: boolean } | null>(null);

  const publish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      let coverImageUrl = draft.coverImage;
      if (!/^https:\/\//i.test(coverImageUrl)) {
        const upload = await uploadsApi.image({
          uri: coverImageUrl,
          name: "event-cover-" + Date.now() + ".jpg",
          type: "image/jpeg",
        }, "events");
        coverImageUrl = upload.data.url;
      }

      const created = await eventsApi.createDraft({
        title: draft.title.trim(),
        description: draft.description.trim(),
        coverImageUrl,
        activityType: draft.activityType,
        targetAudience: draft.audience || undefined,
        setting: draft.setting.toLowerCase(),
        country: draft.country || "Nigeria",
        state: draft.state,
        lga: draft.lga,
        venueName: draft.venueName,
        address: draft.address,
        startsAt: combineDateAndTime(draft.startDate, draft.startTime),
        endsAt: combineDateAndTime(draft.endDate, draft.endTime),
        timezone: "Africa/Lagos",
        contactPhone: draft.phone || undefined,
        maxCapacity: Number.parseInt(draft.capacity, 10),
        tags: [draft.activityType, draft.audience, draft.setting].filter(Boolean),
      });

      for (const ticket of draft.tickets) {
        const capacity = ticket.capacity === "Unlimited" ? undefined : Number.parseInt(ticket.capacity, 10);
        await eventsApi.addTicketType(created.data.event._id, {
          title: ticket.title,
          priceKobo: Math.round(Number(ticket.price) * 100),
          ...(capacity ? { capacity } : {}),
        });
      }
      await eventsApi.publish(created.data.event._id);
      setAlert({ title: "Event published!", message: "Your event is now live and ready for the community.", success: true });
    } catch (error) {
      setAlert({
        title: "Unable to publish",
        message: error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Your event could not be published.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const closeAlert = () => {
    const succeeded = alert?.success;
    setAlert(null);
    if (succeeded) navigation.navigate("MyCreatedEvents");
  };

  return (
    <View style={styles.safe}>
      <CreateEventHeader onBack={navigation.goBack} title="CommunityConnect" />
      <StepProgress label="Review & Publish" step={4} />
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
                {draft.startDate || "Date not selected"}
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
          <ImageBackground
            imageStyle={styles.mapImage}
            source={{ uri: MAP_IMAGE }}
            style={styles.map}
          >
            <View style={styles.pin}>
              <Ionicons color={colors.white} name="location" size={16} />
            </View>
          </ImageBackground>
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
                <Text style={styles.ticketPrice}>{"$" + ticket.price}</Text>
              </View>
            ))}
          </View>
        </InfoCard>

        <InfoCard icon="id-card-outline" title="Host Details">
          <View style={styles.host}>
            <Image source={{ uri: HOST_IMAGE }} style={styles.hostImage} />
            <View>
              <Text style={styles.hostName}>Active Urbanite</Text>
              <Text style={styles.hostPhone}>{draft.phone}</Text>
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

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable disabled={publishing} onPress={publish} style={[styles.publish, publishing && { opacity: 0.6 }]}>
          <Text style={styles.publishText}>{publishing ? "Publishing..." : "Publish Event"}</Text>
          <Ionicons color={colors.ink} name="rocket-outline" size={22} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate("CreateEventDetails", { draft })}
          style={styles.edit}
        >
          <Text style={styles.editText}>Back to Edits</Text>
        </Pressable>
      </SafeAreaView>

      <AppAlertModal
        confirmText={alert?.success ? "View My Created Events" : "Okay"}
        message={alert?.message ?? ""}
        onClose={closeAlert}
        title={alert?.title ?? ""}
        visible={Boolean(alert)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { gap: 20, padding: 24, paddingBottom: 38 },
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
    alignItems: "center",
    height: 150,
    justifyContent: "center",
    marginTop: 20,
  },
  mapImage: { borderRadius: 24 },
  pin: {
    alignItems: "center",
    backgroundColor: "#78bb62",
    borderRadius: 18,
    height: 34,
    justifyContent: "center",
    width: 34,
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
  hostPhone: {
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
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 18,
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
