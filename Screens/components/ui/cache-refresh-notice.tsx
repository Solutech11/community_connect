import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../styles/theme";

export default function CacheRefreshNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.notice} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={18} color={colors.forest} />
      <Text style={styles.message}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8}>
        <Text style={styles.retry}>Retry</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.paleGreen,
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },
  message: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  retry: { fontFamily: fonts.bold, fontSize: 12, color: colors.forest },
});
