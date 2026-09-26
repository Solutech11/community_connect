import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { defaultProfileAvatarUrl } from "../../data/profile";
import { useAuth } from "../../hooks/use-auth";
import { colors, fonts } from "../../styles/theme";

type HeaderProps = {
  title?: string;
  onBack: () => void;
  closeIcon?: boolean;
  rightText?: string;
};

export function CreateEventHeader({
  title = "Create Event",
  onBack,
  closeIcon = false,
  rightText,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <SafeAreaView edges={["top"]} style={styles.headerSafe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={closeIcon ? "Close event creation" : "Go back"}
          hitSlop={12}
          onPress={onBack}
          style={styles.iconButton}
        >
          <Ionicons
            color={closeIcon ? colors.ink : "#08ad54"}
            name={closeIcon ? "close" : "arrow-back"}
            size={27}
          />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        {rightText ? (
          <Text style={styles.rightText}>{rightText}</Text>
        ) : (
          <Image
            accessibilityLabel="Your profile photo"
            source={{ uri: user?.avatarUrl || defaultProfileAvatarUrl }}
            style={styles.avatar}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export function StepProgress({ step, label }: { step: number; label: string }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabels}>
        <Text style={styles.stepText}>STEP {step} OF 4</Text>
        <Text style={styles.progressLabel}>{label}</Text>
      </View>
      <View style={styles.progressTrack}>
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            style={[
              styles.progressSegment,
              item <= step && styles.progressSegmentOn,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EventField({ label, icon, style, ...props }: FieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldShell}>
        {icon ? <Ionicons color="#32965d" name={icon} size={19} /> : null}
        <TextInput
          placeholderTextColor="#6c7688"
          style={[styles.fieldInput, style]}
          {...props}
        />
      </View>
    </View>
  );
}

export function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.miniLabel}>{label.toUpperCase()}</Text>
      <Pressable onPress={onPress} style={styles.fieldShell}>
        <Text style={styles.selectText}>{value}</Text>
        <Ionicons color="#677185" name="chevron-down" size={18} />
      </Pressable>
    </View>
  );
}

export function BottomActions({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = "Next Step",
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <View style={styles.actionsSafe}>
      <View style={styles.actions}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons color="#08ad54" name="arrow-back" size={22} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={nextDisabled}
          onPress={onNext}
          style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]}
        >
          <Text style={styles.nextText}>{nextLabel}</Text>
          <Ionicons color={colors.ink} name="arrow-forward" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

export function InfoCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoTitleRow}>
        <Ionicons color="#08ad54" name={icon} size={23} />
        <Text style={styles.infoTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerSafe: { backgroundColor: colors.white },
  header: {
    alignItems: "center",
    borderBottomColor: "#e9efec",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 68,
    paddingHorizontal: 20,
  },
  iconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    marginLeft: 4,
  },
  avatar: {
    borderColor: "#ccefdc",
    borderRadius: 24,
    borderWidth: 3,
    height: 48,
    width: 48,
  },
  rightText: {
    color: "#238c50",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  progressWrap: { paddingHorizontal: 24, paddingTop: 26 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepText: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  progressLabel: {
    color: "#318f59",
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  progressSegment: {
    backgroundColor: "#dce8ef",
    borderRadius: 4,
    flex: 1,
    height: 7,
  },
  progressSegmentOn: { backgroundColor: "#08b957" },
  fieldBlock: { gap: 9 },
  fieldLabel: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  miniLabel: {
    color: "#32965d",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginLeft: 7,
  },
  fieldShell: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e8f2ed",
    borderRadius: 27,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 18,
  },
  fieldInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  selectText: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  actionsSafe: {
    backgroundColor: colors.white,
    borderTopColor: "#e7efeb",
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  backButton: {
    alignItems: "center",
    borderColor: "#08b957",
    borderRadius: 30,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 24,
  },
  backText: {
    color: "#08ad54",
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: "#08bd58",
    borderRadius: 30,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 24,
    shadowColor: "#08bd58",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  nextButtonDisabled: { opacity: 0.45 },
  nextText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderColor: "#d9efe2",
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  infoTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  infoTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
});
