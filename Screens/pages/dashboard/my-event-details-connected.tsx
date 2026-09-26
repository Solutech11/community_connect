import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppReportSheet from "../../components/ui/app-report-sheet";
import AppShareSheet from "../../components/ui/app-share-sheet";
import PaystackCheckoutModal, {
  type PaystackVerificationResult,
} from "../../components/ui/paystack-checkout-modal";
import {
  toGeneralReportReason,
  type ReportReason,
} from "../../data/report-options";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { ticketsApi } from "../../services/api/tickets.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetEventsIdResponse,
  GetTicketsOrderNumberResponse,
} from "../../types/api.generated";
import type {
  MainTabParamList,
  RootStackParamList,
} from "../../types/navigation";
import {
  getTicketOrderStatusPresentation,
  type TicketOrderStatusTone,
} from "../../types/tickets";

type Props = NativeStackScreenProps<RootStackParamList, "MyEventDetails">;
type TicketDetails = Omit<GetTicketsOrderNumberResponse["data"], "qrToken"> & {
  qrToken?: string;
};
type EventDetails = GetEventsIdResponse["data"]["event"] & {
  targetAudience?: string;
};
type AlertContent = { title: string; message: string };

const fallbackImage =
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=88";

const statusColors: Record<
  TicketOrderStatusTone,
  { backgroundColor: string; textColor: string; dotColor: string }
> = {
  paid: {
    backgroundColor: "#e3faee",
    textColor: "#008944",
    dotColor: "#0ad06b",
  },
  pending: {
    backgroundColor: "#fff1d8",
    textColor: "#90600d",
    dotColor: "#e8a92c",
  },
  cancelled: {
    backgroundColor: "#fde9e8",
    textColor: "#b42318",
    dotColor: "#e34d42",
  },
  refunded: {
    backgroundColor: "#edf1f5",
    textColor: "#536273",
    dotColor: "#778a9c",
  },
  unknown: {
    backgroundColor: "#edf1f5",
    textColor: "#536273",
    dotColor: "#778a9c",
  },
};

const tabs: {
  name: keyof MainTabParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: "HomeTab", label: "Home", icon: "home-outline" },
  { name: "Community", label: "Community", icon: "people-outline" },
  { name: "Chat", label: "Chat", icon: "chatbox-outline" },
  { name: "Profile", label: "Profile", icon: "person-outline" },
];

function formatDate(value?: string, timezone?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "Date unavailable";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  }
}

function formatTime(value?: string, timezone?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "--:--";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...(timezone ? { timeZone: timezone } : {}),
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  }
}

function formatSchedule(start?: string, end?: string, timezone?: string) {
  if (!start) return "Date unavailable";
  const first = formatDate(start, timezone);
  if (!end) return first;
  const last = formatDate(end, timezone);
  return first === last ? first : `${first} – ${last}`;
}

function DetailTile({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.detailTile}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        {icon ? <Ionicons name={icon} size={15} color="#05bb5a" /> : null}
        <Text numberOfLines={2} style={styles.detailValue}>
          {value === undefined || value === ""
            ? "Not specified"
            : String(value)}
        </Text>
      </View>
    </View>
  );
}

export default function MyEventDetailsConnectedScreen({
  navigation,
  route,
}: Props) {
  const insets = useSafeAreaInsets();
  const orderNumber = route.params.orderNumber;
  const [details, setDetails] = useState<TicketDetails | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [resumingCheckout, setResumingCheckout] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertContent | null>(null);
  const [retryNoticeVisible, setRetryNoticeVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const paymentActionRef = useRef(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!orderNumber) {
      setLoadError("This ticket was opened without an order number.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    setDetails(null);
    setEventDetails(null);

    const load = async () => {
      try {
        const response = await ticketsApi.get(orderNumber, controller.signal);
        if (controller.signal.aborted) return;
        setDetails(response.data);
        setLoading(false);

        const eventId = response.data.order.eventId?._id;
        if (eventId) {
          try {
            const eventResponse = await eventsApi.getForManagement(
              eventId,
              controller.signal,
            );
            if (!controller.signal.aborted)
              setEventDetails(eventResponse.data.event as EventDetails);
          } catch {
            // Ticket access can outlive public access to a completed event.
          }
        }
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setLoadError(
          requestError instanceof ApiError
            ? requestError.message
            : "Unable to load this ticket.",
        );
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [orderNumber, reload]);

  if (loading || !details) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <StatusBar style="dark" backgroundColor={colors.paper} />
        {loading ? (
          <ActivityIndicator color="#08b657" size="large" />
        ) : (
          <View style={styles.errorState}>
            <Ionicons name="ticket-outline" size={38} color="#72877c" />
            <Text style={styles.errorText}>
              {loadError ?? "Ticket unavailable."}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => setReload((value) => value + 1)}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
            <Pressable onPress={navigation.goBack}>
              <Text style={styles.goBackText}>Go back</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const { order, qrToken } = details;
  const event = order.eventId;
  const status = getTicketOrderStatusPresentation(order.status);
  const statusColor = statusColors[status.tone];
  const canShowQr = status.isPaid && Boolean(qrToken);
  const coverImage =
    eventDetails?.coverImageUrl || event.coverImageUrl || fallbackImage;
  const title = eventDetails?.title || event.title;
  const startsAt = eventDetails?.startsAt || event.startsAt;
  const endsAt = eventDetails?.endsAt || event.endsAt;
  const timezone = eventDetails?.timezone || event.timezone;
  const venue = eventDetails?.venueName || event.venueName;
  const address = eventDetails?.address || event.address;
  const state = eventDetails?.state || event.state;
  const lga = eventDetails?.lga || event.lga;
  const locationLine = [venue, address].filter(Boolean).join(", ");
  const areaLine = [lga, state, eventDetails?.country || event.country]
    .filter(Boolean)
    .join(", ");
  const description = eventDetails?.description || event.description;
  const eventEndTime = endsAt ? Date.parse(endsAt) : Number.NaN;
  const eventStartTime = startsAt ? Date.parse(startsAt) : Number.NaN;
  const eventHasPassed =
    eventDetails?.status === "completed" ||
    event.status === "completed" ||
    (Number.isFinite(eventEndTime) && eventEndTime < Date.now()) ||
    (!Number.isFinite(eventEndTime) &&
      Number.isFinite(eventStartTime) &&
      eventStartTime < Date.now());
  const qrSource = qrToken
    ? {
        uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrToken)}`,
      }
    : null;

  const share = async () => {
    try {
      await Share.share({
        message: `Ticket ${order.orderNumber} for ${title}`,
      });
    } catch {
      setAlert({
        title: "Unable to share",
        message: "Please try again in a moment.",
      });
    }
  };

  const checkPayment = async () => {
    if (paymentActionRef.current || checkingPayment || resumingCheckout) return;
    paymentActionRef.current = true;
    setCheckingPayment(true);
    try {
      const response = await ticketsApi.verifyPayment(order.orderNumber);
      setDetails(response.data);
      setAlert({
        title: "Payment confirmed",
        message: response.message || "Your ticket is ready for check-in.",
      });
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.code === "PAYMENT_NOT_CONFIRMED"
      ) {
        setAlert({
          title: "Payment is still pending",
          message:
            "The payment provider has not confirmed this payment yet. Try again in a moment if you completed checkout.",
        });
      } else {
        setAlert({
          title: "Unable to check payment",
          message:
            requestError instanceof ApiError
              ? requestError.message
              : "Please try again in a moment.",
        });
      }
    } finally {
      paymentActionRef.current = false;
      setCheckingPayment(false);
    }
  };

  const resumeCheckout = async () => {
    if (paymentActionRef.current || checkingPayment || resumingCheckout) return;
    paymentActionRef.current = true;
    setResumingCheckout(true);
    try {
      const response = await ticketsApi.resumeCheckout(order.orderNumber);
      if (response.data.outcome === "already_paid") {
        setAlert({
          title: "Payment confirmed",
          message: "Your payment was already confirmed. Refreshing your ticket.",
        });
        setReload((current) => current + 1);
        return;
      }

      setCheckoutUrl(response.data.checkoutUrl);
      setCheckoutVisible(true);
    } catch (requestError) {
      const paymentStillProcessing =
        requestError instanceof ApiError &&
        requestError.code === "PAYMENT_STILL_PROCESSING";
      setAlert({
        title: paymentStillProcessing
          ? "Payment is still being checked"
          : "Unable to reopen checkout",
        message:
          paymentStillProcessing && requestError instanceof ApiError
            ? `${requestError.message} Please wait and check payment status before trying again.`
            : requestError instanceof ApiError
              ? requestError.message
              : "Please try again in a moment.",
      });
    } finally {
      paymentActionRef.current = false;
      setResumingCheckout(false);
    }
  };

  const verifyCheckoutPayment = async (): Promise<PaystackVerificationResult> => {
    try {
      const response = await ticketsApi.verifyPayment(order.orderNumber);
      setDetails(response.data);
      return response.data.order.status === "paid"
        ? { verified: true }
        : {
            verified: false,
            message: "Payment is not confirmed yet. Check again in a moment.",
          };
    } catch (requestError) {
      return {
        verified: false,
        message:
          requestError instanceof ApiError
            ? requestError.message
            : "Unable to verify this payment right now.",
      };
    }
  };

  const submitReport = async (reason: ReportReason, reportDetails: string) => {
    try {
      const response = await eventsApi.report(event._id, {
        reason: toGeneralReportReason(reason),
        ...(reportDetails ? { details: reportDetails } : {}),
      });
      setAlert({ title: "Report submitted", message: response.message });
    } catch (requestError) {
      setAlert({
        title: "Unable to report",
        message:
          requestError instanceof ApiError
            ? requestError.message
            : "Please try again.",
      });
    }
  };

  return (
    <View style={styles.page}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground
          source={{ uri: coverImage }}
          style={styles.hero}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.36)", "rgba(0,0,0,0)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.heroActions, { paddingTop: insets.top + 10 }]}>
            <Pressable
              accessibilityLabel="Go back"
              style={styles.circleButton}
              onPress={navigation.goBack}
            >
              <Ionicons name="arrow-back" color={colors.ink} size={24} />
            </Pressable>
            <View style={styles.heroRightActions}>
              <Pressable
                accessibilityLabel="Share ticket"
                style={styles.circleButton}
                onPress={() => setShareVisible(true)}
              >
                <Ionicons
                  name="share-social-outline"
                  color={colors.ink}
                  size={22}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="Report event"
                style={styles.circleButton}
                onPress={() => setReportVisible(true)}
              >
                <Ionicons name="flag-outline" color={colors.ink} size={22} />
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.ticketCard}>
          <View style={styles.ticketBody}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor.backgroundColor },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor.dotColor },
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: statusColor.textColor },
                ]}
              >
                {status.detailLabel.toUpperCase()}
              </Text>
            </View>
            {eventHasPassed ? (
              <View style={styles.eventPassedNotice}>
                <Ionicons name="time-outline" size={15} color="#9a4a30" />
                <Text style={styles.eventPassedText}>EVENT HAS PASSED</Text>
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.ticketNumber}>Ticket #{order.orderNumber}</Text>
            <Text style={styles.ticketType}>
              {order.ticketTypeId.title} · {order.quantity}{" "}
              {order.quantity === 1 ? "ticket" : "tickets"}
            </Text>
            {canShowQr && qrSource ? (
              <>
                <View style={styles.qrFrame}>
                  <Image
                    source={qrSource}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrHint}>
                  Scan this QR code at the entrance
                </Text>
              </>
            ) : (
              <View
                style={[
                  styles.statusPanel,
                  { backgroundColor: statusColor.backgroundColor },
                ]}
              >
                <Ionicons
                  name={
                    status.tone === "pending"
                      ? "time-outline"
                      : "information-circle-outline"
                  }
                  color={statusColor.textColor}
                  size={29}
                />
                <Text style={styles.statusPanelTitle}>
                  {status.detailLabel}
                </Text>
                <Text style={styles.statusPanelCopy}>
                  {status.isPaid
                    ? "Payment is confirmed, but the QR code is unavailable. Refresh this page to try again."
                    : eventHasPassed && status.tone === "pending"
                      ? "This event has passed. Check payment status to confirm any payment you made."
                      : status.detailMessage}
                </Text>
                {status.tone === "pending" ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={checkingPayment || resumingCheckout}
                      onPress={() => void checkPayment()}
                      style={[
                        styles.checkPaymentButton,
                        (checkingPayment || resumingCheckout) &&
                          styles.checkPaymentButtonDisabled,
                      ]}
                    >
                      {checkingPayment ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Ionicons
                          name="refresh-outline"
                          size={17}
                          color={colors.white}
                        />
                      )}
                      <Text style={styles.checkPaymentText}>
                        {checkingPayment
                          ? "Checking payment..."
                          : "Check payment status"}
                      </Text>
                    </Pressable>
                    {!eventHasPassed ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={checkingPayment || resumingCheckout}
                        onPress={() => setRetryNoticeVisible(true)}
                        style={[
                          styles.payAgainButton,
                          (checkingPayment || resumingCheckout) &&
                            styles.checkPaymentButtonDisabled,
                        ]}
                      >
                        {resumingCheckout ? (
                          <ActivityIndicator color={colors.ink} size="small" />
                        ) : (
                          <Ionicons
                            name="card-outline"
                            size={17}
                            color={colors.ink}
                          />
                        )}
                        <Text style={styles.payAgainText}>
                          {resumingCheckout
                            ? "Preparing checkout..."
                            : "Pay again"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
              </View>
            )}
          </View>
          <View style={styles.ticketDivider} />
          <View style={styles.ticketDateRow}>
            <View>
              <Text style={styles.ticketMetaLabel}>DATE</Text>
              <Text style={styles.ticketMetaValue}>
                {formatDate(startsAt, timezone)}
              </Text>
            </View>
            <View style={styles.ticketTime}>
              <Text style={styles.ticketMetaLabel}>TIME</Text>
              <Text style={styles.ticketMetaValue}>
                {formatTime(startsAt, timezone)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sections}>
          <Text style={styles.sectionTitle}>About Event</Text>
          <Text style={styles.description}>
            {description ||
              "An event description is unavailable for this ticket."}
          </Text>

          <Text style={[styles.sectionTitle, styles.detailsHeading]}>
            Event Details
          </Text>
          <View style={styles.locationCard}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={23} color="#05c75e" />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.detailLabel}>LOCATION</Text>
              <Text style={styles.locationName}>
                {locationLine || "Location unavailable"}
              </Text>
              {areaLine ? (
                <Text style={styles.locationArea}>{areaLine}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <DetailTile
              label="ACTIVITY TYPE"
              value={eventDetails?.activityType || event.activityType}
              icon="fitness-outline"
            />
            <DetailTile
              label="EVENT FOR"
              value={eventDetails?.targetAudience}
              icon="people-outline"
            />
            <DetailTile
              label="POSITION"
              value={eventDetails?.setting || event.setting}
              icon="trail-sign-outline"
            />
            <DetailTile
              label="MAX PEOPLE"
              value={eventDetails?.maxCapacity || event.maxCapacity}
              icon="people-outline"
            />
            <DetailTile label="LGA" value={lga} />
            <DetailTile label="STATE" value={state} />
          </View>

          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeading}>
              <View style={styles.scheduleIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={colors.ink}
                />
              </View>
              <View style={styles.scheduleHeadingText}>
                <Text style={styles.scheduleLabel}>SCHEDULE</Text>
                <Text style={styles.scheduleRange}>
                  {formatSchedule(startsAt, endsAt, timezone)}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleTimes}>
              <View>
                <Text style={styles.scheduleTimeLabel}>Start Time</Text>
                <Text style={styles.scheduleTimeValue}>
                  {formatTime(startsAt, timezone)}
                </Text>
              </View>
              <View style={styles.scheduleEnd}>
                <Text style={styles.scheduleTimeLabel}>End Time</Text>
                <Text style={styles.scheduleTimeValue}>
                  {formatTime(endsAt, timezone)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomNav}>
        <View style={styles.bottomNavRow}>
          {tabs.map((tab) => {
            const active = tab.name === "HomeTab";
            return (
              <Pressable
                key={tab.name}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                style={styles.navItem}
                onPress={() =>
                  navigation.navigate("Home", { screen: tab.name })
                }
              >
                <View style={[styles.navIcon, active && styles.navIconActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={24}
                    color={active ? "#05b454" : "#288154"}
                  />
                </View>
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      <AppShareSheet
        visible={shareVisible}
        description={`Share your ticket for ${title}`}
        onClose={() => setShareVisible(false)}
        onCopyLink={() =>
          setAlert({ title: "Ticket number", message: order.orderNumber })
        }
        onInvite={share}
        onShareTo={share}
      />
      <AppReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={submitReport}
      />
      <AppAlertModal
        visible={Boolean(alert)}
        title={alert?.title ?? "Ticket"}
        message={alert?.message ?? ""}
        onClose={() => setAlert(null)}
      />
      <AppAlertModal
        visible={retryNoticeVisible}
        title="Before you pay again"
        message="Only continue if you did not complete the earlier checkout. If you may have paid, check payment status first. We will verify your existing payment before reopening checkout to help prevent a duplicate charge."
        confirmText="Pay again"
        cancelText="Cancel"
        onConfirm={() => {
          setRetryNoticeVisible(false);
          void resumeCheckout();
        }}
        onClose={() => setRetryNoticeVisible(false)}
      />
      <PaystackCheckoutModal
        visible={checkoutVisible}
        url={checkoutUrl}
        title="Event Ticket Payment"
        onClose={() => {
          setCheckoutVisible(false);
          setCheckoutUrl(null);
        }}
        onVerify={verifyCheckoutPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fdfb" },
  loadingPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  errorState: { alignItems: "center", paddingHorizontal: 28, gap: 16 },
  errorText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.lime,
    borderRadius: 22,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryText: { color: colors.ink, fontFamily: fonts.bold },
  goBackText: { color: "#27895a", fontFamily: fonts.bold },
  scrollContent: { paddingBottom: 14 },
  hero: { height: 268, width: "100%" },
  heroActions: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 23,
  },
  heroRightActions: { flexDirection: "row", gap: 12 },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f6f3",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    marginHorizontal: 23,
    marginTop: -27,
    overflow: "hidden",
  },
  ticketBody: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 23,
    paddingBottom: 28,
  },
  statusBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontFamily: fonts.bold, fontSize: 10 },
  eventPassedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff0e9",
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  eventPassedText: { color: "#9a4a30", fontFamily: fonts.bold, fontSize: 9 },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    lineHeight: 32,
    marginTop: 18,
    textAlign: "center",
  },
  ticketNumber: {
    color: "#288656",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 3,
  },
  ticketType: {
    color: "#70827a",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 5,
  },
  qrFrame: {
    alignItems: "center",
    justifyContent: "center",
    width: 185,
    height: 185,
    borderRadius: 29,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#eff2f7",
    marginTop: 24,
    shadowColor: "#a2b1a9",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  qrImage: { width: 145, height: 145 },
  qrHint: {
    color: "#8394aa",
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: "center",
    marginTop: 23,
  },
  statusPanel: {
    alignItems: "center",
    borderRadius: 24,
    marginTop: 25,
    paddingHorizontal: 16,
    paddingVertical: 26,
    width: "100%",
    minHeight: 160,
    justifyContent: "center",
  },
  statusPanelTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginTop: 9,
  },
  statusPanelCopy: {
    color: "#64748b",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 5,
  },
  checkPaymentButton: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderRadius: 20,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 15,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  payAgainButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  payAgainText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  checkPaymentButtonDisabled: { opacity: 0.65 },
  checkPaymentText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  ticketDivider: {
    borderTopColor: "#dfe8f3",
    borderTopWidth: 2,
    borderStyle: "dashed",
    marginHorizontal: 12,
  },
  ticketDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 23,
    paddingTop: 18,
    paddingBottom: 20,
  },
  ticketTime: { alignItems: "flex-end" },
  ticketMetaLabel: { color: "#16804c", fontFamily: fonts.bold, fontSize: 9 },
  ticketMetaValue: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 3,
  },
  sections: { paddingHorizontal: 23, paddingTop: 32 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 17 },
  description: {
    color: "#48586b",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 12,
  },
  detailsHeading: { marginTop: 33, marginBottom: 17 },
  locationCard: {
    minHeight: 82,
    borderRadius: 43,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#edf2f0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e4fced",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationContent: { flex: 1 },
  detailLabel: { color: "#187b4b", fontFamily: fonts.bold, fontSize: 10 },
  locationName: {
    color: colors.ink,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: 2,
  },
  locationArea: {
    color: "#718095",
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 14,
  },
  detailTile: {
    width: "48%",
    minHeight: 69,
    borderRadius: 38,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#edf2f0",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  detailValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  detailValue: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    flexShrink: 1,
    textTransform: "capitalize",
  },
  scheduleCard: {
    backgroundColor: "#1a3026",
    borderRadius: 36,
    marginTop: 30,
    paddingHorizontal: 19,
    paddingVertical: 19,
  },
  scheduleHeading: { flexDirection: "row", alignItems: "center" },
  scheduleIcon: {
    width: 39,
    height: 39,
    backgroundColor: colors.lime,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  scheduleHeadingText: { flex: 1 },
  scheduleLabel: { color: "#22e67a", fontFamily: fonts.bold, fontSize: 11 },
  scheduleRange: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 4,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: "#3d4d44",
    marginTop: 16,
    marginBottom: 13,
  },
  scheduleTimes: { flexDirection: "row", justifyContent: "space-between" },
  scheduleEnd: { alignItems: "flex-end" },
  scheduleTimeLabel: {
    color: "#c8d3ce",
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  scheduleTimeValue: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 2,
  },
  bottomNav: {
    backgroundColor: colors.white,
    borderTopColor: "#f0f2f0",
    borderTopWidth: 1,
  },
  bottomNavRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    paddingBottom: 5,
  },
  navItem: { flex: 1, alignItems: "center", gap: 3 },
  navIcon: {
    width: 43,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  navIconActive: { backgroundColor: "#e6fff0" },
  navLabel: { color: "#288154", fontFamily: fonts.medium, fontSize: 10 },
  navLabelActive: { color: "#08a74e", fontFamily: fonts.bold },
});
