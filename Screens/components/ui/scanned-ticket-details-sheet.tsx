import { Ionicons } from "@expo/vector-icons";
import type { BarcodeScanningResult } from "expo-camera";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fonts } from "../../styles/theme";

type ScannedTicketDetailsSheetProps = {
  checkedIn: boolean;
  onCheckIn: () => void;
  onClose: () => void;
  result: BarcodeScanningResult | null;
  visible: boolean;
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

export default function ScannedTicketDetailsSheet({
  checkedIn,
  onCheckIn,
  onClose,
  result,
  visible,
}: ScannedTicketDetailsSheetProps) {
  if (!result) {
    return null;
  }

  const scannedAt = new Date().toLocaleString();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[styles.resultIcon, checkedIn && styles.resultIconChecked]}
            >
              <Ionicons
                color="#08b657"
                name={checkedIn ? "checkmark-circle" : "shield-checkmark"}
                size={36}
              />
            </View>

            <Text style={styles.title}>
              {checkedIn ? "Ticket Checked In" : "Valid Ticket Found"}
            </Text>
            <Text style={styles.subtitle}>
              Full ticket and scan verification information
            </Text>

            <View style={styles.holderCard}>
              <View style={styles.initials}>
                <Text style={styles.initialsText}>ER</Text>
              </View>

              <View style={styles.holderCopy}>
                <Text style={styles.holderName}>Elena Rodriguez</Text>
                <Text style={styles.holderEmail}>
                  elena.rodriguez@example.com
                </Text>
              </View>

              <View style={styles.validBadge}>
                <Text style={styles.validBadgeText}>VALID</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>TICKET INFORMATION</Text>
            <View style={styles.detailsCard}>
              <DetailRow
                label="Event"
                value="Urban Echo: Neon Garden Festival"
              />
              <DetailRow label="Ticket type" value="VIP Access" />
              <DetailRow label="Ticket ID" value="CC-ER-84920" />
              <DetailRow label="Order number" value="#CC-2023-18492" />
              <DetailRow label="Quantity" value="1 Ticket" />
              <DetailRow label="Amount paid" value="$75.00" />
              <DetailRow label="Purchased" value="Oct 20, 2023 at 10:15 AM" />
              <DetailRow label="Entry access" value="VIP Gate • All Areas" />
            </View>

            <Text style={styles.sectionTitle}>SCAN INFORMATION</Text>
            <View style={styles.detailsCard}>
              <DetailRow label="QR format" value={result.type.toUpperCase()} />
              <DetailRow label="Scanned at" value={scannedAt} />
              <DetailRow label="Check-in terminal" value="Main Entrance #01" />
              <DetailRow
                label="Previous scans"
                value={checkedIn ? "1 successful scan" : "No previous scans"}
              />
              <DetailRow label="Raw QR data" value={result.data} />
            </View>

            <View
              style={[styles.statusCard, checkedIn && styles.statusCardChecked]}
            >
              <Ionicons
                color={checkedIn ? "#08b657" : "#d48a12"}
                name={checkedIn ? "checkmark-circle" : "information-circle"}
                size={22}
              />
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>
                  {checkedIn ? "Check-in successful" : "Ready for check-in"}
                </Text>
                <Text style={styles.statusMessage}>
                  {checkedIn
                    ? "This ticket has been admitted and cannot be checked in again."
                    : "Ticket ownership and event access have been verified."}
                </Text>
              </View>
            </View>
          </ScrollView>

          {!checkedIn ? (
            <Pressable onPress={onCheckIn} style={styles.primaryButton}>
              <Ionicons color="#fff" name="log-in-outline" size={21} />
              <Text style={styles.primaryButtonText}>Check In Guest</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onClose} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(3, 14, 9, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    maxHeight: "92%",
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#d6e0db",
    borderRadius: 8,
    height: 6,
    width: 72,
  },
  content: {
    paddingBottom: 16,
  },
  resultIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#e8f8ef",
    borderRadius: 36,
    height: 68,
    justifyContent: "center",
    marginTop: 20,
    width: 68,
  },
  resultIconChecked: {
    backgroundColor: "#dcf8e7",
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#6a8075",
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
  holderCard: {
    alignItems: "center",
    backgroundColor: "#f4faf7",
    borderRadius: 26,
    flexDirection: "row",
    marginTop: 22,
    padding: 15,
  },
  initials: {
    alignItems: "center",
    backgroundColor: "#083120",
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  initialsText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  holderCopy: {
    flex: 1,
    marginLeft: 13,
  },
  holderName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  holderEmail: {
    color: "#6a8075",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 3,
  },
  validBadge: {
    backgroundColor: "#dcf8e7",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  validBadgeText: {
    color: "#08a64f",
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  sectionTitle: {
    color: "#3d9863",
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.7,
    marginBottom: 9,
    marginTop: 22,
  },
  detailsCard: {
    backgroundColor: "#f7faf8",
    borderRadius: 24,
    paddingHorizontal: 17,
  },
  detailRow: {
    alignItems: "center",
    borderBottomColor: "#e3ece7",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 50,
    paddingVertical: 8,
  },
  detailLabel: {
    color: "#71847b",
    flex: 0.42,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  detailValue: {
    color: colors.ink,
    flex: 0.58,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "right",
  },
  statusCard: {
    alignItems: "flex-start",
    backgroundColor: "#fff7e8",
    borderRadius: 22,
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    padding: 15,
  },
  statusCardChecked: {
    backgroundColor: "#e7f9ef",
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  statusMessage: {
    color: "#687b72",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 28,
    flexDirection: "row",
    gap: 9,
    height: 56,
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
});
