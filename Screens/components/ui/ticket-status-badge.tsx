import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import {
  getTicketOrderStatusPresentation,
  type TicketOrderStatusTone,
} from "../../types/tickets";
import { fonts } from "../../styles/theme";

const TONE_STYLES: Record<
  TicketOrderStatusTone,
  {
    backgroundColor: string;
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  pending: {
    backgroundColor: "#fff3d8",
    color: "#8d5c00",
    icon: "time-outline",
  },
  paid: {
    backgroundColor: "#e7f9ef",
    color: "#078447",
    icon: "checkmark-circle-outline",
  },
  cancelled: {
    backgroundColor: "#fde9e8",
    color: "#b42318",
    icon: "close-circle-outline",
  },
  refunded: {
    backgroundColor: "#edf1f5",
    color: "#536273",
    icon: "return-down-back-outline",
  },
  unknown: {
    backgroundColor: "#edf1f5",
    color: "#536273",
    icon: "help-circle-outline",
  },
};

export default function TicketStatusBadge({
  status,
  label,
  compact = false,
}: {
  status: unknown;
  label?: string;
  compact?: boolean;
}) {
  const presentation = getTicketOrderStatusPresentation(status);
  const tone = TONE_STYLES[presentation.tone];

  return (
    <View
      accessibilityLabel={label ?? presentation.cardLabel}
      style={[
        styles.badge,
        compact && styles.compact,
        { backgroundColor: tone.backgroundColor },
      ]}
    >
      <Ionicons color={tone.color} name={tone.icon} size={compact ? 12 : 15} />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          compact && styles.compactLabel,
          { color: tone.color },
        ]}
      >
        {label ?? presentation.cardLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  compact: {
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    textTransform: "capitalize",
  },
  compactLabel: {
    fontSize: 9,
  },
});
