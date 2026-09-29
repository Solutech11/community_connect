import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AppLoader from "./app-loader";
import { reportReasons, type ReportReason } from "../../data/report-options";
import { lightTap as tapFeedback } from "../../hooks/haptics";
import { colors, fonts } from "../../styles/theme";

type AppReportSheetProps = {
  visible: boolean;
  title?: string;
  description?: string;
  minimumDetailsLength?: number;
  reasons?: readonly ReportReason[];
  onClose: () => void;
  onSubmit?: (reason: ReportReason, details: string) => void | Promise<void>;
};

export default function AppReportSheet({
  visible,
  title = "Report Event",
  description = "Please select a reason for reporting this event. Your report is anonymous and helps keep our community safe.",
  minimumDetailsLength = 0,
  reasons = reportReasons,
  onClose,
  onSubmit,
}: AppReportSheetProps) {
  const [selectedReason, setSelectedReason] =
    useState<ReportReason>("Spam or Misleading");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;
    const cleanedDetails = details.trim();
    if (cleanedDetails && cleanedDetails.length < minimumDetailsLength) {
      setDetailsError(
        `Additional details must be at least ${minimumDetailsLength} characters or left blank.`,
      );
      return;
    }
    tapFeedback();
    setSubmitting(true);
    try {
      await onSubmit?.(selectedReason, cleanedDetails);
    } finally {
      setSubmitting(false);
      onClose();
      setDetails("");
      setDetailsError("");
      setSelectedReason("Spam or Misleading");
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={() => {
                tapFeedback();
                onClose();
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#718198" />
            </Pressable>
          </View>
          <View style={styles.headerDivider} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.description}>{description}</Text>

            <View style={styles.reasonsWrap}>
              {reasons.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <Pressable
                    key={reason}
                    onPress={() => {
                      tapFeedback();
                      setSelectedReason(reason);
                    }}
                    style={[
                      styles.reasonCard,
                      active && styles.reasonCardActive,
                    ]}
                  >
                    <Text style={styles.reasonText}>{reason}</Text>
                    <View
                      style={[
                        styles.radioOuter,
                        active && styles.radioOuterActive,
                      ]}
                    >
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>
              Additional Details{" "}
              <Text style={styles.inputOptional}>(Optional)</Text>
            </Text>
            <TextInput
              multiline
              numberOfLines={4}
              onChangeText={(value) => {
                setDetails(value);
                setDetailsError("");
              }}
              placeholder="Please provide more specific details about the issue..."
              placeholderTextColor="#a3b1c4"
              style={[
                styles.textarea,
                Boolean(detailsError) && styles.textareaError,
              ]}
              textAlignVertical="top"
              value={details}
            />
            {detailsError ? (
              <Text style={styles.errorText}>{detailsError}</Text>
            ) : null}
          </ScrollView>

          <Pressable
            disabled={submitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={[styles.submitButton, submitting && styles.disabled]}
          >
            {submitting ? (
              <AppLoader color={colors.white} />
            ) : (
              <Ionicons name="flag" size={20} color={colors.white} />
            )}
            <Text style={styles.submitText}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tapFeedback();
              onClose();
            }}
            style={styles.cancelWrap}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(5, 10, 8, 0.28)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: "82%",
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#d7dde5",
    borderRadius: 999,
    height: 8,
    width: 86,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  title: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 25,
  },
  closeButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerDivider: {
    backgroundColor: "#edf1f4",
    height: 1,
    marginHorizontal: -22,
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  description: {
    color: "#465975",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 18,
  },
  reasonsWrap: {
    gap: 12,
    marginTop: 22,
  },
  reasonCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e2e7ee",
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 72,
    paddingHorizontal: 18,
  },
  reasonCardActive: {
    borderColor: "#ff1c17",
  },
  reasonText: {
    color: "#0f1734",
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  radioOuter: {
    alignItems: "center",
    borderColor: "#d0d7e1",
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  radioOuterActive: {
    borderColor: "#ff1c17",
  },
  radioInner: {
    backgroundColor: "#ff1c17",
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  inputLabel: {
    color: "#0f1734",
    fontFamily: fonts.extraBold,
    fontSize: 16,
    marginTop: 24,
  },
  inputOptional: {
    color: "#9aa9bf",
    fontFamily: fonts.medium,
  },
  textarea: {
    backgroundColor: colors.white,
    borderColor: "#e2e7ee",
    borderRadius: 18,
    borderWidth: 1.5,
    color: "#0f1734",
    fontFamily: fonts.medium,
    fontSize: 15,
    height: 118,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  textareaError: { borderColor: "#d94444" },
  errorText: {
    color: "#b63838",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 7,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#ff1612",
    borderRadius: 22,
    flexDirection: "row",
    height: 68,
    justifyContent: "center",
    marginTop: 10,
  },
  submitText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginLeft: 12,
  },
  disabled: { opacity: 0.6 },
  cancelWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
    paddingTop: 14,
  },
  cancelText: {
    color: "#718198",
    fontFamily: fonts.medium,
    fontSize: 16,
  },
});
