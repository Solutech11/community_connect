import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

type ProfilePageHeaderProps = {
  title: string;
  onBack: () => void;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
};

export default function ProfilePageHeader({
  title,
  onBack,
  onRightPress,
  rightAccessibilityLabel,
  rightIcon,
}: ProfilePageHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeHeader}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={onBack}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={25} color={colors.ink} />
        </Pressable>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        {rightIcon && onRightPress ? (
          <Pressable
            accessibilityLabel={rightAccessibilityLabel}
            hitSlop={10}
            onPress={onRightPress}
            style={styles.headerButton}
          >
            <Ionicons name={rightIcon} size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.trailingSpace} />
        )}
      </View>
    </SafeAreaView>
  );
}

const ios = Platform.OS === "ios";

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: colors.paper,
  },
  header: {
    alignItems: "center",
    borderBottomColor: "#e8f0eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: ios ? 52 : 56,
    paddingHorizontal: 18,
  },
  headerButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: ios ? 18 : 19,
    marginLeft: 6,
  },
  trailingSpace: {
    width: 40,
  },
});
