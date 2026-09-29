import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppLoader from "./app-loader";
import type { PostEventsEventIdCheckInsVerifyResponse } from "../../types/api.generated";
import { colors, fonts } from "../../styles/theme";

export type TicketScanPhase =
  | "verifying"
  | "verified"
  | "checking-in"
  | "checked-in"
  | "verification-error"
  | "check-in-error";

type CheckInPreview = PostEventsEventIdCheckInsVerifyResponse["data"];

type Props = {
  errorMessage: string | null;
  onCheckIn: () => void;
  onClose: () => void;
  onRetry: () => void;
  onScanNext: () => void;
  phase: TicketScanPhase;
  preview: CheckInPreview | null;
  visible: boolean;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString();
}

function getStatus(phase: TicketScanPhase, preview: CheckInPreview | null) {
  if (phase === "checked-in") {
    return {
      label: "CHECK-IN COMPLETE",
      tone: "green" as const,
      icon: "checkmark-circle" as const,
    };
  }
  if (phase === "verifying") {
    return {
      label: "VERIFYING TICKET",
      tone: "neutral" as const,
      icon: "scan-outline" as const,
    };
  }
  if (phase === "checking-in") {
    return {
      label: "CHECKING IN",
      tone: "neutral" as const,
      icon: "log-in-outline" as const,
    };
  }
  if (phase === "check-in-error") {
    return {
      label: "CHECK-IN NEEDS REVIEW",
      tone: "red" as const,
      icon: "alert-circle-outline" as const,
    };
  }
  if (phase === "verification-error") {
    return {
      label: "NOT VERIFIED",
      tone: "red" as const,
      icon: "close-circle" as const,
    };
  }
  if (preview?.checkedInAt) {
    return {
      label: "ALREADY CHECKED IN",
      tone: "amber" as const,
      icon: "time-outline" as const,
    };
  }
  if (preview?.canCheckIn) {
    return {
      label: "READY FOR CHECK-IN",
      tone: "green" as const,
      icon: "shield-checkmark" as const,
    };
  }
  if (preview) {
    return {
      label: "TICKET VERIFIED",
      tone: "amber" as const,
      icon: "time-outline" as const,
    };
  }
  return {
    label: "TICKET SCANNED",
    tone: "neutral" as const,
    icon: "qr-code-outline" as const,
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ScannedTicketDetailsSheet({
  errorMessage,
  onCheckIn,
  onClose,
  onRetry,
  onScanNext,
  phase,
  preview,
  visible,
}: Props) {
  const status = getStatus(phase, preview);
  const isBusy = phase === "verifying" || phase === "checking-in";
  const canCheckIn = phase === "verified" && preview?.canCheckIn === true;
  const retryVerification =
    phase === "verification-error" || phase === "check-in-error";

  let primaryLabel = "Scan another ticket";
  let primaryAction = onScanNext;
  if (phase === "verifying") primaryLabel = "Verifying ticket…";
  else if (phase === "checking-in") primaryLabel = "Checking in…";
  else if (canCheckIn) {
    primaryLabel = "Confirm check-in";
    primaryAction = onCheckIn;
  } else if (retryVerification) {
    primaryLabel =
      phase === "check-in-error"
        ? "Refresh ticket status"
        : "Try verification again";
    primaryAction = onRetry;
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close ticket details"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.statusPill, styles[`${status.tone}Pill`]]}>
              <Ionicons
                color={styles[`${status.tone}Text`].color}
                name={status.icon}
                size={16}
              />
              <Text style={[styles.statusText, styles[`${status.tone}Text`]]}>
                {status.label}
              </Text>
            </View>

            {phase === "verifying" ? (
              <View style={styles.loadingCard}>
                <AppLoader color={colors.lime} size="large" />
                <Text style={styles.loadingTitle}>Verifying this ticket</Text>
                <Text style={styles.loadingCopy}>
                  Checking event access and matching the ticket to its attendee.
                </Text>
              </View>
            ) : phase === "verification-error" ? (
              <View style={styles.errorCard}>
                <View style={styles.errorIcon}>
                  <Ionicons name="qr-code-outline" size={27} color="#b42332" />
                </View>
                <Text style={styles.sectionHeading}>
                  Couldn’t verify ticket
                </Text>
                <Text style={styles.errorCopy}>
                  {errorMessage ??
                    "We couldn’t find a paid ticket for this event. Check the QR code and try again."}
                </Text>
              </View>
            ) : preview ? (
              <>
                <View style={styles.attendeeCard}>
                  {preview.attendee.avatarUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: preview.attendee.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitials}>
                        {initials(preview.attendee.name) || "?"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.attendeeCopy}>
                    <Text style={styles.attendeeName}>
                      {preview.attendee.name}
                    </Text>
                    <Text selectable style={styles.attendeeEmail}>
                      {preview.attendee.email}
                    </Text>
                  </View>
                  <Ionicons color="#16a05b" name="checkmark-circle" size={22} />
                </View>

                <View style={styles.eventCard}>
                  <View style={styles.eventIcon}>
                    <Ionicons
                      color={colors.forest}
                      name="calendar-outline"
                      size={19}
                    />
                  </View>
                  <View style={styles.eventCopy}>
                    <Text style={styles.eyebrow}>EVENT</Text>
                    <Text style={styles.eventTitle}>{preview.event.title}</Text>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Ticket details</Text>
                <View style={styles.detailsCard}>
                  <DetailRow
                    label="Ticket type"
                    value={preview.ticket.ticketType}
                  />
                  <DetailRow
                    label="Order number"
                    value={preview.ticket.orderNumber}
                  />
                  <DetailRow
                    label="Quantity"
                    value={`${preview.ticket.quantity} ${preview.ticket.quantity === 1 ? "ticket" : "tickets"}`}
                  />
                  <DetailRow
                    label="Payment"
                    value={preview.ticket.paymentStatus.replaceAll("_", " ")}
                  />
                </View>

                {phase === "checked-in" ? (
                  <View style={[styles.messageCard, styles.successCard]}>
                    <Ionicons
                      color="#11834a"
                      name="checkmark-circle"
                      size={21}
                    />
                    <View style={styles.messageCopy}>
                      <Text style={styles.successTitle}>Guest checked in</Text>
                      <Text style={styles.successCopy}>
                        This ticket has been admitted successfully.
                      </Text>
                    </View>
                  </View>
                ) : phase === "checking-in" ? (
                  <View style={[styles.messageCard, styles.progressCard]}>
                    <AppLoader color={colors.forest} size="small" />
                    <View style={styles.messageCopy}>
                      <Text style={styles.progressTitle}>
                        Check-in in progress
                      </Text>
                      <Text style={styles.progressCopy}>
                        Saving this attendee’s entry to the event.
                      </Text>
                    </View>
                  </View>
                ) : phase === "check-in-error" ? (
                  <View style={[styles.messageCard, styles.warningCard]}>
                    <Ionicons
                      color="#986400"
                      name="refresh-circle-outline"
                      size={21}
                    />
                    <View style={styles.messageCopy}>
                      <Text style={styles.warningTitle}>
                        Check-in needs confirmation
                      </Text>
                      <Text style={styles.warningCopy}>
                        Refresh the ticket status before taking another action.
                      </Text>
                    </View>
                  </View>
                ) : preview.checkedInAt ? (
                  <View style={[styles.messageCard, styles.warningCard]}>
                    <Ionicons color="#986400" name="time-outline" size={21} />
                    <View style={styles.messageCopy}>
                      <Text style={styles.warningTitle}>
                        Already checked in
                      </Text>
                      <Text style={styles.warningCopy}>
                        Checked in {formatDateTime(preview.checkedInAt)}
                      </Text>
                    </View>
                  </View>
                ) : preview.canCheckIn && phase === "verified" ? (
                  <View style={[styles.messageCard, styles.successCard]}>
                    <Ionicons
                      color="#11834a"
                      name="shield-checkmark"
                      size={21}
                    />
                    <View style={styles.messageCopy}>
                      <Text style={styles.successTitle}>Ticket verified</Text>
                      <Text style={styles.successCopy}>
                        Confirm below to check in this attendee.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.messageCard, styles.warningCard]}>
                    <Ionicons color="#986400" name="time-outline" size={21} />
                    <View style={styles.messageCopy}>
                      <Text style={styles.warningTitle}>
                        Check-in unavailable
                      </Text>
                      <Text style={styles.warningCopy}>
                        Check-in opens two hours before the event and closes
                        when it ends.
                      </Text>
                    </View>
                  </View>
                )}

                {phase === "check-in-error" && errorMessage ? (
                  <View style={[styles.messageCard, styles.errorInline]}>
                    <Ionicons
                      color="#b42332"
                      name="alert-circle-outline"
                      size={20}
                    />
                    <Text style={styles.errorInlineText}>{errorMessage}</Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={primaryAction}
              style={({ pressed }) => [
                styles.primaryButton,
                isBusy && styles.disabledButton,
                pressed && !isBusy && styles.pressedButton,
              ]}
            >
              {isBusy ? (
                <AppLoader color={colors.forest} size="small" />
              ) : (
                <Ionicons
                  color={colors.forest}
                  name={
                    canCheckIn
                      ? "log-in-outline"
                      : retryVerification
                        ? "refresh"
                        : "scan-outline"
                  }
                  size={19}
                />
              )}
              <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(7, 19, 13, 0.56)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "92%",
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#cbd5d1",
    borderRadius: 3,
    height: 5,
    marginBottom: 18,
    width: 44,
  },
  content: { paddingBottom: 18 },
  statusPill: {
    alignSelf: "center",
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 7,
    marginBottom: 17,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  statusText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  greenPill: { backgroundColor: "#ddf8e9" },
  greenText: { color: "#12834a" },
  amberPill: { backgroundColor: "#fff2d8" },
  amberText: { color: "#986400" },
  redPill: { backgroundColor: "#ffe5e7" },
  redText: { color: "#b42332" },
  neutralPill: { backgroundColor: "#e9eef0" },
  neutralText: { color: "#52645c" },
  loadingCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  loadingTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 18,
  },
  loadingCopy: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    textAlign: "center",
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 26,
  },
  errorIcon: {
    alignItems: "center",
    backgroundColor: "#ffe5e7",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  sectionHeading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    marginBottom: 10,
    marginTop: 20,
  },
  errorCopy: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  attendeeCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    flexDirection: "row",
    padding: 15,
  },
  avatar: { borderRadius: 28, height: 56, width: 56 },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.forest,
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  attendeeCopy: { flex: 1, marginLeft: 13, marginRight: 8 },
  attendeeName: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  attendeeEmail: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 4,
  },
  eventCard: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 19,
    flexDirection: "row",
    marginTop: 13,
    padding: 14,
  },
  eventIcon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  eventCopy: { flex: 1, marginLeft: 11 },
  eyebrow: {
    color: "#28804d",
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  eventTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 3,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  detailRow: {
    alignItems: "center",
    borderBottomColor: "#edf1ef",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 45,
    paddingVertical: 8,
  },
  detailLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  detailValue: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
    marginLeft: 16,
    textAlign: "right",
    textTransform: "capitalize",
  },
  messageCard: {
    alignItems: "flex-start",
    borderRadius: 17,
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    padding: 14,
  },
  successCard: { backgroundColor: "#e8f8ef" },
  warningCard: { backgroundColor: "#fff4df" },
  progressCard: { backgroundColor: "#edf4f0" },
  messageCopy: { flex: 1 },
  successTitle: { color: "#17693e", fontFamily: fonts.bold, fontSize: 12 },
  successCopy: {
    color: "#47725a",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  progressTitle: { color: colors.forest, fontFamily: fonts.bold, fontSize: 12 },
  progressCopy: {
    color: "#52645c",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  warningTitle: { color: "#805514", fontFamily: fonts.bold, fontSize: 12 },
  warningCopy: {
    color: "#805f2b",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  errorInline: { backgroundColor: "#fff0f1" },
  errorInlineText: {
    color: "#a51f2c",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  actions: { paddingBottom: 8, paddingTop: 10 },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 28,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 54,
  },
  disabledButton: { opacity: 0.72 },
  pressedButton: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  primaryButtonText: {
    color: colors.forest,
    fontFamily: fonts.extraBold,
    fontSize: 13,
  },
  closeButton: { alignItems: "center", paddingVertical: 13 },
  closeButtonText: {
    color: colors.muted,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
});
