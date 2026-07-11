import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  communityCategories,
  discoverCommunities,
  myCommunities,
  type CommunityCategory,
  type CommunityItem,
  type JoinedCommunity,
} from "../../data/community";
import { lightTap as tapFeedback } from "../../hooks/haptics";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.filterChip,
        selected ? styles.filterChipActive : styles.filterChipIdle,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          selected ? styles.filterChipTextActive : styles.filterChipTextIdle,
        ]}
      >
        {label === "For You" ? label : `#${label}`}
      </Text>
    </Pressable>
  );
}

function MyCommunityBubble({ item }: { item: JoinedCommunity }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        navigation.navigate("CommunityRoom", { communityId: item.id })
      }
      style={({ pressed }) => [
        styles.myCommunityItem,
        pressed && styles.pressed,
      ]}
    >
      <View>
        <Image source={{ uri: item.image }} style={styles.myCommunityImage} />
        {item.online ? <View style={styles.onlineDot} /> : null}
      </View>
      <Text style={styles.myCommunityName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );
}

function DiscoverCard({ item }: { item: CommunityItem }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const buttonLabel =
    item.accessType === "paid"
      ? `Pay ${item.accessFee} to Join`
      : item.accessType === "access_key"
        ? "Join with Access Key"
        : "Join Group";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        navigation.navigate("CommunityJoin", { communityId: item.id })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.cardImage}
        imageStyle={styles.cardImageRadius}
      >
        <View style={styles.cardShade} />
        <Text style={styles.cardTag}>{item.handle}</Text>
      </ImageBackground>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.memberPill}>
            <Ionicons name="people" size={14} color="#5cb67d" />
            <Text style={styles.memberPillText}>{item.membersLabel}</Text>
          </View>
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate("CommunityJoin", { communityId: item.id })
          }
          style={({ pressed }) => [
            styles.joinButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.joinButtonText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CommunityCategory>("For You");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCommunities = useMemo(() => {
    return discoverCommunities.filter((item) => {
      const matchesCategory =
        selectedCategory === "For You" || item.category === selectedCategory;
      const searchable = [
        item.name,
        item.description,
        item.handle,
        item.category,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [normalizedQuery, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Communities</Text>
          <Pressable
            accessibilityLabel="Community notifications"
            onPress={() => {
              tapFeedback();
              navigation.navigate("Notifications");
            }}
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.ink}
            />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("CreateCommunity")}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.createIconWrap}>
            <Ionicons name="add" size={20} color={colors.white} />
          </View>
          <Text style={styles.createButtonText}>Create Community</Text>
        </Pressable>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color="#41a56b" />
          <TextInput
            accessibilityLabel="Search for groups"
            onChangeText={setQuery}
            placeholder="Search for groups..."
            placeholderTextColor="#7aa892"
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={20} color="#6a9f84" />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Communities</Text>
          <Pressable onPress={tapFeedback} hitSlop={10}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myCommunitiesRow}
        >
          {myCommunities.map((item) => (
            <MyCommunityBubble key={item.id} item={item} />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {communityCategories.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={item === selectedCategory}
              onPress={() => setSelectedCategory(item)}
            />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Discover Communities</Text>

        <View style={styles.cardList}>
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map((item) => (
              <DiscoverCard key={item.id} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No communities found</Text>
              <Text style={styles.emptyStateBody}>
                Try another search term or switch to a different category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const android = Platform.OS === "android";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerShell: {
    backgroundColor: colors.paper,
    paddingBottom: 8,
    paddingTop: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 26,
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    shadowColor: "#d7e5dd",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: android ? 3 : 0,
    width: 48,
  },
  notificationDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    right: 12,
    top: 10,
    width: 12,
  },
  content: {
    paddingBottom: 124,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  createButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.lime,
    borderRadius: 30,
    flexDirection: "row",
    height: 60,
    justifyContent: "center",
    shadowColor: "#83f3ad",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: android ? 3 : 0,
  },
  createIconWrap: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    marginRight: 12,
    width: 28,
  },
  createButtonText: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: "row",
    gap: 10,
    height: 58,
    marginTop: 16,
    paddingHorizontal: 18,
    shadowColor: "#e4ece7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: android ? 4 : 0,
  },
  searchInput: {
    color: "#348b5a",
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  viewAllText: {
    color: colors.lime,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  myCommunitiesRow: {
    gap: 18,
    paddingTop: 18,
  },
  myCommunityItem: {
    alignItems: "center",
    width: 82,
  },
  myCommunityImage: {
    borderColor: colors.lime,
    borderRadius: 35,
    borderWidth: 2,
    height: 70,
    width: 70,
  },
  onlineDot: {
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 8,
    borderWidth: 2,
    bottom: 2,
    height: 16,
    position: "absolute",
    right: 2,
    width: 16,
  },
  myCommunityName: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  filterRow: {
    gap: 12,
    paddingTop: 22,
  },
  filterChip: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: "#11182f",
    borderColor: "#11182f",
  },
  filterChipIdle: {
    backgroundColor: colors.white,
    borderColor: "#e2ece6",
  },
  filterChipText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterChipTextIdle: {
    color: "#4da66e",
  },
  cardList: {
    gap: 22,
    marginTop: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#dce9e1",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: android ? 3 : 0,
  },
  cardImage: {
    height: 162,
    justifyContent: "flex-end",
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  cardImageRadius: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 19, 13, 0.18)",
  },
  cardTag: {
    color: colors.lime,
    fontFamily: fonts.extraBold,
    fontSize: 14,
    zIndex: 1,
  },
  cardBody: {
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  cardTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 19,
    paddingRight: 12,
  },
  memberPill: {
    alignItems: "center",
    backgroundColor: "#f1f6f3",
    borderRadius: 14,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  memberPillText: {
    color: "#4da66e",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  cardDescription: {
    color: "#4a9e69",
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  joinButton: {
    alignItems: "center",
    backgroundColor: "#121b33",
    borderRadius: 24,
    height: 50,
    justifyContent: "center",
    marginTop: 18,
    paddingHorizontal: 14,
  },
  joinButtonText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 34,
  },
  emptyStateTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  emptyStateBody: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
