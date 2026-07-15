import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "CreateEventIntroduction"
>;

const HERO =
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=88";

const expectations = [
  {
    title: "Event Details",
    copy: "Tell us what your event is all about with a title, category, and description.",
  },
  {
    title: "Location & Time",
    copy: "Set the scene. Choose your venue or meeting point and schedule your time.",
  },
  {
    title: "Tickets & Pricing",
    copy: "Manage your guest list size and set ticket prices or keep it free for everyone.",
  },
  {
    title: "Review & Publish",
    copy: "Do a final check to make sure everything is perfect before sharing it with the world.",
  },
];

export default function CreateEventIntroductionScreen({ navigation }: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={navigation.goBack}>
          <Ionicons color={colors.ink} name="arrow-back" size={30} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Event</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          imageStyle={styles.heroImage}
          source={{ uri: HERO }}
          style={styles.hero}
        >
          <View style={styles.tag}>
            <Text style={styles.tagText}>INTRODUCTION</Text>
          </View>
        </ImageBackground>

        <Text style={styles.title}>Host an Unforgettable Event</Text>
        <Text style={styles.copy}>
          Connect with your local community and bring people together. Whether
          it&apos;s a neighborhood BBQ, a tech talk, or a morning run,
          we&apos;ve made the process simple and rewarding. Let&apos;s build
          something great together.
        </Text>

        <Text style={styles.sectionTitle}>What to expect</Text>
        {expectations.map((item, index) => (
          <View key={item.title} style={styles.expectation}>
            <View style={styles.numberCircle}>
              <Text style={styles.number}>{index + 1}</Text>
            </View>
            <View style={styles.expectationBody}>
              <Text style={styles.expectationTitle}>{item.title}</Text>
              <Text style={styles.expectationCopy}>{item.copy}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable
          onPress={() => navigation.navigate("CreateEventDetails")}
          style={styles.continueButton}
        >
          <Text style={styles.continueText}>Continue to Step 1</Text>
          <Ionicons color={colors.white} name="chevron-forward" size={23} />
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  header: {
    alignItems: "center",
    backgroundColor: colors.white,
    flexDirection: "row",
    gap: 28,
    minHeight: 70,
    paddingHorizontal: 28,
  },
  headerTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 25,
  },
  content: { padding: 24, paddingBottom: 28 },
  hero: {
    height: 285,
    justifyContent: "flex-end",
    marginTop: 4,
    padding: 26,
  },
  heroImage: { borderRadius: 34 },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#08bd58",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 27,
    lineHeight: 34,
    marginTop: 38,
  },
  copy: {
    color: "#2f9b61",
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 13,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 21,
    marginBottom: 22,
    marginTop: 42,
  },
  expectation: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
    marginBottom: 32,
  },
  numberCircle: {
    alignItems: "center",
    backgroundColor: "#ddf6e8",
    borderRadius: 28,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  number: {
    color: "#08b957",
    fontFamily: fonts.extraBold,
    fontSize: 26,
  },
  expectationBody: { flex: 1 },
  expectationTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 19,
  },
  expectationCopy: {
    color: "#2f9b61",
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 6,
  },
  footer: { backgroundColor: colors.paper, paddingHorizontal: 24 },
  continueButton: {
    alignItems: "center",
    backgroundColor: "#08bd58",
    borderRadius: 32,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 62,
  },
  continueText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
});
