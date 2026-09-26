import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import ScannedTicketDetailsSheet, {
  type TicketScanPhase,
} from "../../components/ui/scanned-ticket-details-sheet";
import { ApiError } from "../../services/api/client";
import { eventsApi } from "../../services/api/events.api";
import { colors, fonts } from "../../styles/theme";
import type { PostEventsEventIdCheckInsVerifyResponse } from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "TicketScanner">;
type CheckInPreview = PostEventsEventIdCheckInsVerifyResponse["data"];

function getApiErrorMessage(error: unknown, isVerification: boolean) {
  if (error instanceof ApiError) {
    if (isVerification && error.code === "INVALID_TICKET") {
      return "We couldn’t find a paid ticket for this event. Check the QR code and try again.";
    }
    return error.message;
  }

  return isVerification
    ? "We couldn’t verify this ticket. Check your connection and try again."
    : "We couldn’t check in this attendee. Refresh the ticket status before trying again.";
}

export default function TicketScannerScreen({ navigation, route }: Props) {
  const eventId = route.params?.eventId;
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<BarcodeScanningResult | null>(null);
  const [phase, setPhase] = useState<TicketScanPhase | null>(null);
  const [preview, setPreview] = useState<CheckInPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const scanLockedRef = useRef(false);
  const checkInLockedRef = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      activeRequestRef.current?.abort();
    },
    [],
  );

  const verifyTicket = async (qrToken: string) => {
    if (!eventId) {
      setPreview(null);
      setErrorMessage(
        "Open the scanner from a managed event to verify tickets.",
      );
      setPhase("verification-error");
      return;
    }

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setPhase("verifying");
    setPreview(null);
    setErrorMessage(null);

    try {
      const response = await eventsApi.verifyCheckIn(
        eventId,
        qrToken,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setPreview(response.data);
      setPhase("verified");
    } catch (error) {
      if (controller.signal.aborted) return;
      setPreview(null);
      setErrorMessage(getApiErrorMessage(error, true));
      setPhase("verification-error");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  };

  const handleBarcodeScanned = (scanResult: BarcodeScanningResult) => {
    if (scanLockedRef.current) return;
    scanLockedRef.current = true;
    setResult(scanResult);
    setDetailsVisible(true);
    void verifyTicket(scanResult.data);
  };

  const handleScanNext = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    scanLockedRef.current = false;
    checkInLockedRef.current = false;
    setDetailsVisible(false);
    setResult(null);
    setPhase(null);
    setPreview(null);
    setErrorMessage(null);
  };

  const handleCheckIn = async () => {
    if (
      !eventId ||
      !result ||
      !preview?.canCheckIn ||
      phase !== "verified" ||
      checkInLockedRef.current
    ) {
      return;
    }

    checkInLockedRef.current = true;
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setPhase("checking-in");
    setErrorMessage(null);

    try {
      await eventsApi.checkIn(eventId, result.data, controller.signal);
      if (controller.signal.aborted) return;
      setPhase("checked-in");
      setErrorMessage(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrorMessage(getApiErrorMessage(error, false));
      setPhase("check-in-error");
    } finally {
      checkInLockedRef.current = false;
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  };

  const handleRetry = () => {
    if (result) void verifyTicket(result.data);
  };

  if (!permission) return <View style={styles.safe} />;

  const resultTitle =
    phase === "verifying"
      ? "Verifying ticket"
      : phase === "verified"
        ? preview?.canCheckIn
          ? "Attendee verified"
          : preview?.checkedInAt
            ? "Already checked in"
            : "Check-in unavailable"
        : phase === "checking-in"
          ? "Checking in attendee"
          : phase === "checked-in"
            ? "Check-in complete"
            : phase === "check-in-error"
              ? "Check-in needs review"
              : "Ticket not verified";

  const resultSubtitle =
    preview?.attendee.name ??
    (phase === "verifying"
      ? "Matching this ticket to its attendee…"
      : "Review the verification details before check-in.");

  const resultTone =
    phase === "verification-error"
      ? "red"
      : phase === "check-in-error"
        ? "red"
        : phase === "verified" && preview && !preview.canCheckIn
          ? "amber"
          : "green";

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader title="Scan Ticket" onBack={navigation.goBack} />
        {!permission.granted ? (
          <View style={styles.permission}>
            <View style={styles.permissionIcon}>
              <Ionicons name="camera-outline" size={38} color="#08b657" />
            </View>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              Allow camera access to scan guest ticket QR codes securely.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={requestPermission}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>Allow Camera</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.cameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={result ? undefined : handleBarcodeScanned}
              />
              <View style={styles.dim} />
              <View style={styles.frame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.guide}>
                {result
                  ? "Ticket detected"
                  : "Align the QR code inside the frame"}
              </Text>
            </View>

            {result ? (
              <View style={styles.resultCard}>
                <View
                  style={[
                    styles.resultIcon,
                    resultTone === "red"
                      ? styles.resultIconError
                      : resultTone === "amber"
                        ? styles.resultIconWarning
                        : styles.resultIconSuccess,
                  ]}
                >
                  <Ionicons
                    color={
                      resultTone === "red"
                        ? "#b42332"
                        : resultTone === "amber"
                          ? "#986400"
                          : "#12834a"
                    }
                    name={
                      phase === "checked-in"
                        ? "checkmark-circle"
                        : phase === "verification-error" ||
                            phase === "check-in-error"
                          ? "close-circle"
                          : "shield-checkmark"
                    }
                    size={26}
                  />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={styles.resultTitle}>{resultTitle}</Text>
                  <Text numberOfLines={1} style={styles.resultSubtitle}>
                    {resultSubtitle}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDetailsVisible(true)}
                  style={styles.reviewButton}
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.hint}>
                <Ionicons
                  color="#29965a"
                  name="shield-checkmark-outline"
                  size={20}
                />
                <Text style={styles.hintText}>
                  Scan a ticket to view attendee details before confirming
                  check-in.
                </Text>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
      <ScannedTicketDetailsSheet
        errorMessage={errorMessage}
        onCheckIn={handleCheckIn}
        onClose={() => setDetailsVisible(false)}
        onRetry={handleRetry}
        onScanNext={handleScanNext}
        phase={phase ?? "verifying"}
        preview={preview}
        visible={detailsVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  body: { flex: 1, padding: 24 },
  permission: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },
  permissionIcon: {
    alignItems: "center",
    backgroundColor: "#e4f8ec",
    borderRadius: 38,
    height: 76,
    justifyContent: "center",
    width: 76,
  },
  permissionTitle: { fontFamily: fonts.extraBold, fontSize: 22, marginTop: 20 },
  permissionText: {
    color: "#6b7f75",
    fontFamily: fonts.medium,
    lineHeight: 22,
    marginTop: 9,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: colors.lime,
    borderRadius: 28,
    marginTop: 26,
    paddingHorizontal: 32,
    paddingVertical: 15,
  },
  permissionButtonText: { color: colors.forest, fontFamily: fonts.extraBold },
  cameraWrap: {
    borderRadius: 38,
    height: 440,
    overflow: "hidden",
  },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.18)" },
  frame: { alignSelf: "center", height: 230, marginTop: 82, width: 230 },
  corner: {
    borderColor: colors.lime,
    height: 42,
    position: "absolute",
    width: 42,
  },
  topLeft: { borderLeftWidth: 5, borderTopWidth: 5, left: 0, top: 0 },
  topRight: { borderRightWidth: 5, borderTopWidth: 5, right: 0, top: 0 },
  bottomLeft: { borderBottomWidth: 5, borderLeftWidth: 5, bottom: 0, left: 0 },
  bottomRight: {
    borderBottomWidth: 5,
    borderRightWidth: 5,
    bottom: 0,
    right: 0,
  },
  guide: {
    alignSelf: "center",
    backgroundColor: "rgba(7,31,23,.82)",
    borderRadius: 18,
    bottom: 26,
    color: colors.white,
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    position: "absolute",
  },
  hint: {
    alignItems: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 22,
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    padding: 15,
  },
  hintText: {
    color: "#29965a",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  resultCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    flexDirection: "row",
    marginTop: 20,
    padding: 14,
  },
  resultIcon: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  resultIconSuccess: { backgroundColor: "#e5f8ed" },
  resultIconWarning: { backgroundColor: "#fff2d8" },
  resultIconError: { backgroundColor: "#ffe5e7" },
  resultCopy: { flex: 1, marginHorizontal: 11 },
  resultTitle: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 13 },
  resultSubtitle: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 4,
  },
  reviewButton: {
    backgroundColor: "#e6f8ee",
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  reviewButtonText: {
    color: "#14924b",
    fontFamily: fonts.extraBold,
    fontSize: 11,
  },
});
