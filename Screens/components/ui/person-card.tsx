import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";
import AppLoader from "./app-loader";
import PersonAvatar from "./person-avatar";

type Action = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
  busy?: boolean;
  destructive?: boolean;
};

type Props = {
  name: string;
  avatarUrl: string;
  location: string;
  caption: string;
  interests: string[];
  actions: Action[];
  menuActions?: Action[];
  disabled?: boolean;
};

export default function PersonCard({
  name,
  avatarUrl,
  location,
  caption,
  interests,
  actions,
  menuActions = [],
  disabled,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <PersonAvatar name={name} uri={avatarUrl} />
        <View style={styles.copy}>
          <Text numberOfLines={2} style={styles.name}>
            {name}
          </Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                color={colors.muted}
                size={12}
              />
              <Text numberOfLines={1} style={styles.location}>
                {location}
              </Text>
            </View>
          ) : null}
          <Text style={styles.caption}>{caption}</Text>
        </View>
        {menuActions.length ? (
          <Pressable
            accessibilityLabel={"More actions for " + name}
            accessibilityRole="button"
            accessibilityState={{ expanded: menuOpen, disabled }}
            disabled={disabled}
            onPress={() => setMenuOpen(!menuOpen)}
            style={styles.more}
          >
            <Ionicons
              name={menuOpen ? "close" : "ellipsis-horizontal"}
              color="#6a7c70"
              size={20}
            />
          </Pressable>
        ) : null}
      </View>

      {interests.length ? (
        <View style={styles.interests}>
          {interests.slice(0, 3).map((interest, index) => (
            <View key={interest + index} style={styles.interest}>
              <Text numberOfLines={1} style={styles.interestText}>
                {interest}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.label + " " + name}
            accessibilityRole="button"
            accessibilityState={{ disabled, busy: action.busy }}
            disabled={disabled}
            key={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              action.primary && styles.primary,
              (pressed || disabled) && styles.dimmed,
            ]}
          >
            {action.busy ? (
              <AppLoader color={colors.ink} />
            ) : action.icon ? (
              <Ionicons name={action.icon} color={colors.ink} size={16} />
            ) : null}
            <Text style={styles.actionText}>
              {action.busy ? "Please wait" : action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {menuOpen ? (
        <View style={styles.menu}>
          {menuActions.map((action) => (
            <Pressable
              accessibilityLabel={action.label + " " + name}
              accessibilityRole="button"
              disabled={disabled}
              key={action.label}
              onPress={() => {
                setMenuOpen(false);
                action.onPress();
              }}
              style={styles.menuAction}
            >
              {action.icon ? (
                <Ionicons
                  name={action.icon}
                  color={action.destructive ? "#a64646" : colors.muted}
                  size={16}
                />
              ) : null}
              <Text
                style={[
                  styles.menuText,
                  action.destructive && styles.destructive,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: "#e4ede7",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  identity: { alignItems: "center", flexDirection: "row", gap: 12 },
  copy: { flex: 1 },
  name: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    lineHeight: 21,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  location: {
    color: colors.muted,
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  caption: {
    color: "#398654",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 5,
  },
  more: {
    alignItems: "center",
    alignSelf: "flex-start",
    height: 36,
    justifyContent: "center",
    width: 32,
  },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 13 },
  interest: {
    backgroundColor: "#f1f6f3",
    borderRadius: 10,
    maxWidth: "45%",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  interestText: { color: "#597364", fontFamily: fonts.medium, fontSize: 9 },
  actions: { flexDirection: "row", gap: 9, marginTop: 14 },
  action: {
    alignItems: "center",
    backgroundColor: "#f0f5f2",
    borderRadius: 22,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  primary: { backgroundColor: colors.lime },
  actionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 11 },
  dimmed: { opacity: 0.55 },
  menu: {
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 13,
    paddingTop: 8,
  },
  menuAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
  },
  menuText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 11 },
  destructive: { color: "#a64646" },
});
