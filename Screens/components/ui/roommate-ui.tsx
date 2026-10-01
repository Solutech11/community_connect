import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { roomieHomeImage } from "../../data/roommate-design";
import { colors, fonts } from "../../styles/theme";
import type { RoommateCandidate, RoommateProfile } from "../../types/roommates";
import { optionLabel, rentLabel } from "../../types/roommates";

type IconName = keyof typeof Ionicons.glyphMap;

export function RoommateButton({
  label,
  onPress,
  disabled,
  secondary = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        roommateStyles.button,
        secondary && roommateStyles.secondary,
        (disabled || pressed) && { opacity: disabled ? 0.45 : 0.75 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.forest} /> : null}
      <Text style={roommateStyles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function RoommateShell({
  title,
  subtitle,
  children,
  loading,
  error,
  retry,
  headerContent,
  footer,
  contentKey,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
  headerContent?: ReactNode;
  footer?: ReactNode;
  contentKey?: string | number;
}) {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={roommateStyles.shell} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={roommateStyles.shell}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={roommateStyles.header}>
          <View style={roommateStyles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={roommateStyles.backButton}
            >
              <Ionicons name="arrow-back" size={21} color={colors.forest} />
            </Pressable>
            <View style={roommateStyles.brand}>
              <Ionicons name="home-outline" size={15} color={colors.forest} />
              <Text style={roommateStyles.eyebrow}>ROOMIE</Text>
            </View>
          </View>
          <Text style={roommateStyles.title}>{title}</Text>
          {subtitle ? (
            <Text style={roommateStyles.body}>{subtitle}</Text>
          ) : null}
          {headerContent}
        </View>
        <ScrollView
          key={contentKey}
          contentContainerStyle={roommateStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={roommateStyles.loading}>
              <ActivityIndicator
                color={colors.forest}
                accessibilityLabel="Loading roommates"
              />
              <Text style={roommateStyles.body}>Getting things ready...</Text>
            </View>
          ) : null}
          {error ? (
            <RoommateState
              icon="cloud-offline-outline"
              title="Let's try that again"
              description={error}
            >
              {retry ? (
                <RoommateButton
                  label="Try again"
                  onPress={retry}
                  secondary
                  icon="refresh-outline"
                />
              ) : null}
            </RoommateState>
          ) : null}
          {children}
        </ScrollView>
        {footer ? <View style={roommateStyles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function RoommateState({
  icon,
  title,
  description,
  children,
}: {
  icon: IconName;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <View style={roommateStyles.state}>
      <View style={roommateStyles.stateIcon}>
        <Ionicons name={icon} size={28} color={colors.forest} />
      </View>
      <Text style={[roommateStyles.heading, roommateStyles.center]}>
        {title}
      </Text>
      <Text style={[roommateStyles.body, roommateStyles.center]}>
        {description}
      </Text>
      {children}
    </View>
  );
}

export function RoommateHero() {
  return (
    <View style={roommateStyles.hero}>
      <Image
        source={{ uri: roomieHomeImage }}
        style={StyleSheet.absoluteFill}
        accessibilityLabel="A welcoming shared living room with green sofas"
      />
      <LinearGradient
        colors={["transparent", "rgba(7,31,23,0.9)"]}
        style={roommateStyles.heroShade}
      >
        <View style={roommateStyles.heroBadge}>
          <Ionicons name="home-outline" size={14} color={colors.forest} />
          <Text style={roommateStyles.smallLabel}>A SPACE TO BELONG</Text>
        </View>
        <Text style={roommateStyles.heroTitle}>
          Good people.{"\n"}Better living.
        </Text>
        <Text style={roommateStyles.heroCopy}>
          Find someone who feels like home.
        </Text>
      </LinearGradient>
    </View>
  );
}

export function RoommateChatEntry({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Find your roomie"
      onPress={onPress}
      style={({ pressed }) => [
        roommateStyles.chatEntry,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Image
        source={{ uri: roomieHomeImage }}
        style={roommateStyles.chatImage}
      />
      <View style={roommateStyles.flex}>
        <Text style={roommateStyles.smallLabel}>ROOMIE</Text>
        <Text style={roommateStyles.chatTitle}>
          Your next chapter, together.
        </Text>
        <Text style={roommateStyles.chatCopy}>
          Find a roomie. Make a connection.
        </Text>
      </View>
      <View style={roommateStyles.chatArrow}>
        <Ionicons name="arrow-forward" size={18} color={colors.forest} />
      </View>
    </Pressable>
  );
}

export function RoommatePerson({
  firstName,
  lastName,
  avatarUrl,
  subtitle,
}: {
  firstName: string;
  lastName?: string;
  avatarUrl?: string | null;
  subtitle: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={roommateStyles.person}>
      {avatarUrl && !failed ? (
        <Image
          source={{ uri: avatarUrl }}
          style={roommateStyles.avatar}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[roommateStyles.avatar, roommateStyles.placeholder]}>
          <Text style={roommateStyles.heading}>
            {firstName[0]}
            {lastName?.[0]}
          </Text>
        </View>
      )}
      <View style={roommateStyles.flex}>
        <Text style={roommateStyles.heading}>
          {firstName} {lastName}
        </Text>
        <Text style={roommateStyles.body}>{subtitle}</Text>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={roommateStyles.detailRow}>
      <View style={roommateStyles.detailIcon}>
        <Ionicons name={icon} size={18} color={colors.forest} />
      </View>
      <View style={roommateStyles.flex}>
        <Text style={roommateStyles.fieldLabel}>{label}</Text>
        <Text style={roommateStyles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function dateLabel(value?: string) {
  if (!value) return "Not added";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function RoommateDetails({ profile }: { profile: RoommateProfile }) {
  const habits = [
    profile.cleanliness && `${optionLabel(profile.cleanliness)} cleanliness`,
    profile.sleepSchedule && `${optionLabel(profile.sleepSchedule)} sleeper`,
    profile.guests && `Guests: ${optionLabel(profile.guests)}`,
    profile.socialPreference &&
      `${optionLabel(profile.socialPreference)} social life`,
    profile.smokes ? "Smokes" : "Doesn't smoke",
    profile.hasPets ? "Has pets" : "No pets",
  ].filter((value): value is string => Boolean(value));
  return (
    <>
      <View style={roommateStyles.card}>
        <Text style={roommateStyles.heading}>The living plan</Text>
        <DetailRow
          icon="home-outline"
          label="Housing"
          value={
            profile.housingMode === "hosting"
              ? "Has a place to share"
              : "Looking for a place together"
          }
        />
        <DetailRow
          icon="location-outline"
          label="Preferred area"
          value={
            [profile.lgas?.join(", "), profile.state]
              .filter(Boolean)
              .join(", ") || "Not added"
          }
        />
        <DetailRow
          icon="wallet-outline"
          label="Annual rent per person"
          value={`${rentLabel(profile.minAnnualRentKobo)} - ${rentLabel(profile.maxAnnualRentKobo)}`}
        />
        <DetailRow
          icon="calendar-outline"
          label="Move-in window"
          value={`${dateLabel(profile.moveInFrom)} - ${dateLabel(profile.moveInTo)}`}
        />
      </View>
      <View style={roommateStyles.card}>
        <Text style={roommateStyles.heading}>Life at home</Text>
        {profile.description ? (
          <Text style={roommateStyles.body}>{profile.description}</Text>
        ) : null}
        <View style={roommateStyles.row}>
          {habits.map((habit) => (
            <View key={habit} style={roommateStyles.tag}>
              <Text style={roommateStyles.tagText}>{habit}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

export function RoommateCard({
  candidate,
  onDetails,
}: {
  candidate: RoommateCandidate;
  onDetails?: () => void;
}) {
  const { user, profile } = candidate;
  const [failed, setFailed] = useState(false);
  return (
    <View style={roommateStyles.profileCard}>
      <View style={roommateStyles.portrait}>
        {user.avatarUrl && !failed ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={StyleSheet.absoluteFill}
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={roommateStyles.initialPortrait}>
            <Ionicons name="person-outline" size={54} color={colors.forest} />
            <Text style={roommateStyles.initialName}>
              {user.firstName[0]}
              {user.lastName?.[0]}
            </Text>
          </View>
        )}
        <View style={roommateStyles.compatibility}>
          <Ionicons name="sparkles" color={colors.forest} size={14} />
          <Text style={roommateStyles.match}>
            {candidate.score}% match estimate
          </Text>
        </View>
        <LinearGradient
          colors={["transparent", "rgba(7,31,23,0.9)"]}
          style={roommateStyles.portraitShade}
        >
          <Text style={roommateStyles.profileName}>
            {user.firstName} {user.lastName}
          </Text>
          <View style={roommateStyles.locationLine}>
            <Ionicons name="location-outline" color={colors.white} size={15} />
            <Text style={roommateStyles.profileLocation}>
              {[profile.lgas?.join(", "), profile.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
        </LinearGradient>
      </View>
      <View style={roommateStyles.profileBody}>
        <View style={roommateStyles.locationLine}>
          <Ionicons name="home-outline" size={16} color={colors.forest} />
          <Text style={roommateStyles.fieldLabel}>
            {profile.housingMode === "hosting"
              ? "Has a place to share"
              : "Looking for a place together"}
          </Text>
        </View>
        <Text style={roommateStyles.rent}>
          {rentLabel(profile.minAnnualRentKobo)} -{" "}
          {rentLabel(profile.maxAnnualRentKobo)}
          <Text style={roommateStyles.rentPeriod}> / year</Text>
        </Text>
        {candidate.reasons.length ? (
          <View style={roommateStyles.row}>
            {candidate.reasons.map((reason, index) => (
              <View key={`${reason}-${index}`} style={roommateStyles.tag}>
                <Text style={roommateStyles.tagText}>{reason}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {onDetails ? (
          <RoommateButton
            label="Get to know them"
            onPress={onDetails}
            secondary
            icon="arrow-forward"
          />
        ) : null}
      </View>
    </View>
  );
}

export const roommateStyles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18, gap: 8 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  eyebrow: {
    fontFamily: fonts.extraBold,
    color: colors.forest,
    fontSize: 11,
    letterSpacing: 2.4,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 110,
    gap: 18,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  title: {
    fontFamily: fonts.extraBold,
    color: colors.ink,
    fontSize: 30,
    letterSpacing: -1,
    lineHeight: 38,
  },
  heading: {
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: fonts.medium,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 21,
  },
  link: { fontFamily: fonts.bold, color: colors.forest, paddingVertical: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    gap: 15,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    backgroundColor: colors.lime,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: colors.forest,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "center",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 14,
    padding: 13,
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: { backgroundColor: colors.paleGreen, borderColor: colors.forest },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paleGreen,
  },
  match: { fontFamily: fonts.bold, color: colors.forest, fontSize: 11 },
  flex: { flex: 1, minWidth: 0 },
  loading: { padding: 30, alignItems: "center", gap: 12 },
  state: {
    padding: 26,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  stateIcon: {
    alignSelf: "center",
    backgroundColor: colors.paleGreen,
    height: 64,
    width: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  center: { textAlign: "center" },
  hero: {
    height: 280,
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: colors.forest,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 22,
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  smallLabel: {
    fontFamily: fonts.extraBold,
    color: colors.forest,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    color: colors.white,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1,
  },
  heroCopy: {
    fontFamily: fonts.medium,
    color: colors.softWhite,
    fontSize: 12,
    lineHeight: 19,
  },
  chatEntry: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    padding: 12,
    gap: 12,
    marginBottom: 20,
  },
  chatImage: {
    height: 66,
    width: 60,
    borderRadius: 14,
    backgroundColor: colors.forest,
  },
  chatTitle: {
    fontFamily: fonts.bold,
    color: colors.forest,
    fontSize: 14,
    marginTop: 4,
  },
  chatCopy: {
    fontFamily: fonts.medium,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  chatArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  person: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    height: 58,
    width: 58,
    borderRadius: 29,
    backgroundColor: colors.paleGreen,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIcon: {
    height: 38,
    width: 38,
    borderRadius: 12,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 18,
    flexShrink: 1,
  },
  detailValue: {
    fontFamily: fonts.semiBold,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 21,
  },
  tag: {
    borderRadius: 12,
    backgroundColor: colors.paleGreen,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: "100%",
  },
  tagText: {
    fontFamily: fonts.medium,
    color: colors.forest,
    fontSize: 11,
    lineHeight: 17,
  },
  profileCard: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  portrait: { height: 300, backgroundColor: colors.paleGreen },
  initialPortrait: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  initialName: {
    fontFamily: fonts.extraBold,
    fontSize: 36,
    color: colors.forest,
  },
  compatibility: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  portraitShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 65,
    gap: 6,
  },
  profileName: {
    fontFamily: fonts.extraBold,
    color: colors.white,
    fontSize: 26,
    letterSpacing: -0.7,
  },
  locationLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  profileLocation: {
    flex: 1,
    fontFamily: fonts.medium,
    color: colors.softWhite,
    fontSize: 12,
    lineHeight: 18,
  },
  profileBody: { padding: 18, gap: 12 },
  rent: {
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  rentPeriod: { fontFamily: fonts.medium, color: colors.muted, fontSize: 11 },
});
