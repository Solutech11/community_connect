import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../../types/navigation";
import {
  RoommateShell,
  RoommateButton,
  RoommateHero,
  roommateStyles,
} from "../../components/ui/roommate-ui";
import { colors, fonts } from "../../styles/theme";

export default function RoommateIntro({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateIntro">) {
  return (
    <RoommateShell
      title="Find your roomie"
      subtitle="A shared home starts with the right person."
    >
      <RoommateHero />
      <View style={roommateStyles.card}>
        <Text style={roommateStyles.heading}>Same home. Shared rhythm.</Text>
        {(
          [
            [
              "options-outline",
              "Match on how you live",
              "Your area, rent share, move-in plans, and everyday habits.",
            ],
            [
              "chatbubbles-outline",
              "Connect before you commit",
              "Mutual likes unlock a chat. Get to know each other at your pace.",
            ],
            [
              "lock-closed-outline",
              "Your details, your choice",
              "Contacts need separate consent. Pairing makes both profiles private.",
            ],
          ] as const
        ).map(([icon, title, copy]) => (
          <View key={title} style={styles.feature}>
            <View style={styles.icon}>
              <Ionicons name={icon} size={20} color={colors.forest} />
            </View>
            <View style={roommateStyles.flex}>
              <Text style={styles.label}>{title}</Text>
              <Text style={roommateStyles.body}>{copy}</Text>
            </View>
          </View>
        ))}
      </View>
      <RoommateButton
        label="Let's find your fit"
        icon="arrow-forward"
        onPress={() => navigation.replace("RoommateSetup")}
      />
      <RoommateButton
        label="Maybe later"
        secondary
        onPress={() => navigation.goBack()}
      />
      <Text style={[roommateStyles.body, roommateStyles.center]}>
        Optional, and for people who declare they are 18 or older.
      </Text>
    </RoommateShell>
  );
}
const styles = StyleSheet.create({
  feature: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  icon: { backgroundColor: colors.paleGreen, borderRadius: 14, padding: 11 },
  label: {
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 13,
    marginBottom: 4,
  },
});
