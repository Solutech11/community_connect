import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { lightTap } from "../../hooks/haptics";
import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Friends">;
type FriendsTab = "My Friends" | "Requests";

type Person = {
  id: string;
  name: string;
  subtitle: string;
  image?: string;
  initials?: string;
};

const friends: Person[] = [
  {
    id: "alex",
    name: "Alex Rivera",
    subtitle: "12 Mutual Connections",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=180&q=85",
  },
  {
    id: "jordan",
    name: "Jordan Smith",
    subtitle: "5 Mutual Connections",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=85",
  },
  {
    id: "taylor",
    name: "Taylor Chen",
    subtitle: "8 Mutual Connections",
    initials: "TC",
  },
];

const requests: Person[] = [
  {
    id: "mia",
    name: "Mia Wong",
    subtitle: "Met at 'Urban Runners'",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&q=85",
  },
  {
    id: "noah",
    name: "Noah Williams",
    subtitle: "6 Mutual Connections",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=180&q=85",
  },
  {
    id: "ava",
    name: "Ava Thompson",
    subtitle: "Community Garden Club",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=180&q=85",
  },
];

const suggestions: Person[] = [
  {
    id: "sam",
    name: "Sam Davies",
    subtitle: "Photography Club",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&q=85",
  },
  {
    id: "emma",
    name: "Emma Wilson",
    subtitle: "15 Mutuals",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=180&q=85",
  },
];

function Avatar({ person, size = 48 }: { person: Person; size?: number }) {
  if (person.image) {
    return (
      <Image
        source={{ uri: person.image }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }

  return (
    <View
      style={[
        styles.initialAvatar,
        { borderRadius: size / 2, height: size, width: size },
      ]}
    >
      <Text style={styles.initialText}>{person.initials}</Text>
    </View>
  );
}

export default function FriendsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<FriendsTab>("My Friends");
  const [query, setQuery] = useState("");
  const [pendingRequests, setPendingRequests] = useState(requests);
  const [addedSuggestions, setAddedSuggestions] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const tabProgress = useRef(new Animated.Value(0)).current;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) =>
        [friend.name, friend.subtitle]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const filteredRequests = useMemo(
    () =>
      pendingRequests.filter((request) =>
        [request.name, request.subtitle]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery, pendingRequests],
  );

  const changeTab = (tab: FriendsTab) => {
    lightTap();
    setActiveTab(tab);

    Animated.spring(tabProgress, {
      damping: 18,
      mass: 0.8,
      stiffness: 190,
      toValue: tab === "My Friends" ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handleRequest = (person: Person, accepted: boolean) => {
    lightTap();
    setPendingRequests((current) =>
      current.filter((request) => request.id !== person.id),
    );
    setNotice(
      accepted
        ? `${person.name} is now your friend`
        : `${person.name}'s request was declined`,
    );
  };

  const toggleSuggestion = (person: Person) => {
    lightTap();
    setAddedSuggestions((current) =>
      current.includes(person.id)
        ? current.filter((id) => id !== person.id)
        : [...current, person.id],
    );
  };

  const requestCount = pendingRequests.length;
  const visiblePeople =
    activeTab === "My Friends" ? filteredFriends : filteredRequests;

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safeArea}>
        <ProfilePageHeader
          onBack={navigation.goBack}
          onRightPress={() => changeTab("Requests")}
          rightAccessibilityLabel="View friend requests"
          rightIcon="checkmark-done"
          title="Friends"
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.search}>
            <Ionicons color="#3b9c65" name="search" size={22} />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search friends or find new people"
              placeholderTextColor="#253129"
              style={styles.searchInput}
              value={query}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons color="#6d8077" name="close-circle" size={20} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.tabs}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [
                    {
                      translateX: Animated.multiply(tabProgress, 126),
                    },
                  ],
                },
              ]}
            />

            <Pressable
              onPress={() => changeTab("My Friends")}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "My Friends" && styles.tabTextActive,
                ]}
              >
                My Friends
              </Text>
            </Pressable>

            <Pressable onPress={() => changeTab("Requests")} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Requests" && styles.tabTextActive,
                ]}
              >
                Requests
              </Text>
              {requestCount ? (
                <View style={styles.requestCount}>
                  <Text style={styles.requestCountText}>{requestCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <Text style={styles.heading}>
            {activeTab === "My Friends" ? "My Friends" : "Friend Requests"}
          </Text>

          <View style={styles.peopleList}>
            {visiblePeople.map((person) => (
              <View key={person.id} style={styles.friendCard}>
                <Avatar person={person} />

                <View style={styles.personCopy}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personSubtitle}>{person.subtitle}</Text>
                </View>

                {activeTab === "My Friends" ? (
                  <Pressable
                    accessibilityLabel={`Message ${person.name}`}
                    onPress={() =>
                      navigation.navigate("ChatThread", {
                        conversationId: person.id,
                        image:
                          person.image ??
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=220&q=85",
                        name: person.name,
                        online: true,
                      })
                    }
                    style={styles.messageButton}
                  >
                    <Ionicons color="#08b657" name="chatbox" size={22} />
                  </Pressable>
                ) : (
                  <View style={styles.compactActions}>
                    <Pressable
                      onPress={() => handleRequest(person, true)}
                      style={styles.compactAccept}
                    >
                      <Ionicons color="#fff" name="checkmark" size={19} />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRequest(person, false)}
                      style={styles.compactDecline}
                    >
                      <Ionicons color="#718078" name="close" size={19} />
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>

          {activeTab === "My Friends" && pendingRequests.length ? (
            <>
              <View style={styles.sectionHeading}>
                <Text style={styles.heading}>Recent Requests</Text>
                <Pressable onPress={() => changeTab("Requests")}>
                  <Text style={styles.viewAll}>View All</Text>
                </Pressable>
              </View>

              <View style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <Avatar person={pendingRequests[0]} />

                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>
                      {pendingRequests[0].name}
                    </Text>
                    <Text style={styles.personSubtitle}>
                      {pendingRequests[0].subtitle}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => handleRequest(pendingRequests[0], true)}
                    style={styles.acceptButton}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRequest(pendingRequests[0], false)}
                    style={styles.declineButton}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}

          {activeTab === "My Friends" ? (
            <>
              <Text style={[styles.heading, styles.suggestedHeading]}>
                Suggested for you
              </Text>

              <View style={styles.suggestions}>
                {suggestions.map((person) => {
                  const added = addedSuggestions.includes(person.id);

                  return (
                    <View key={person.id} style={styles.suggestionCard}>
                      <Avatar person={person} size={60} />
                      <Text style={styles.suggestionName}>{person.name}</Text>
                      <Text style={styles.suggestionSubtitle}>
                        {person.subtitle}
                      </Text>

                      <Pressable
                        onPress={() => toggleSuggestion(person)}
                        style={[
                          styles.addButton,
                          added && styles.addButtonActive,
                        ]}
                      >
                        <Ionicons
                          color={added ? "#fff" : "#08b657"}
                          name={added ? "checkmark" : "person-add-outline"}
                          size={16}
                        />
                        <Text
                          style={[
                            styles.addText,
                            added && styles.addTextActive,
                          ]}
                        >
                          {added ? "Added" : "Add"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}

          {!visiblePeople.length ? (
            <Text style={styles.empty}>
              {query
                ? "No matching people found."
                : "You have no pending requests."}
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <AppAlertModal
        message={
          notice?.includes("now your friend")
            ? "Connection accepted. You can now start a conversation from Friends or Chat."
            : "The friend request has been updated."
        }
        onClose={() => setNotice(null)}
        title={notice ?? ""}
        visible={Boolean(notice)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 32,
    flexDirection: "row",
    height: 56,
    marginTop: 20,
    paddingHorizontal: 18,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 11,
  },
  tabs: {
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    flexDirection: "row",
    height: 42,
    marginTop: 30,
    padding: 4,
    position: "relative",
    width: 260,
  },
  tabIndicator: {
    backgroundColor: "#08b657",
    borderRadius: 20,
    bottom: 4,
    left: 4,
    position: "absolute",
    top: 4,
    width: 126,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    color: "#3c9862",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  tabTextActive: {
    color: colors.white,
  },
  requestCount: {
    alignItems: "center",
    backgroundColor: "#173025",
    borderRadius: 10,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: 5,
  },
  requestCountText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  heading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    marginTop: 34,
  },
  peopleList: {
    gap: 14,
    marginTop: 16,
  },
  friendCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: "row",
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  initialAvatar: {
    alignItems: "center",
    backgroundColor: "#e3f8ec",
    justifyContent: "center",
  },
  initialText: {
    color: "#08b657",
    fontFamily: fonts.extraBold,
    fontSize: 18,
  },
  personCopy: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  personSubtitle: {
    color: "#3c9862",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  messageButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#edf1ef",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  compactActions: {
    flexDirection: "row",
    gap: 8,
  },
  compactAccept: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  compactDecline: {
    alignItems: "center",
    backgroundColor: "#f0f4f2",
    borderRadius: 20,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  sectionHeading: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewAll: {
    color: "#08b657",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    marginTop: 16,
    padding: 14,
  },
  requestTop: {
    alignItems: "center",
    flexDirection: "row",
  },
  requestActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },
  acceptButton: {
    alignItems: "center",
    backgroundColor: "#08b657",
    borderRadius: 22,
    flex: 1,
    paddingVertical: 9,
  },
  acceptText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  declineButton: {
    alignItems: "center",
    backgroundColor: "#f7faf8",
    borderColor: "#e4ebe7",
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 9,
  },
  declineText: {
    color: "#3c9862",
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  suggestedHeading: {
    marginTop: 34,
  },
  suggestions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  suggestionCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 26,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  suggestionName: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: 11,
  },
  suggestionSubtitle: {
    color: "#3c9862",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
  },
  addButton: {
    alignItems: "center",
    borderColor: "#b8e7cc",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 8,
    width: "100%",
  },
  addButtonActive: {
    backgroundColor: "#08b657",
    borderColor: "#08b657",
  },
  addText: {
    color: "#08b657",
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
  addTextActive: {
    color: colors.white,
  },
  empty: {
    color: colors.muted,
    fontFamily: fonts.medium,
    marginTop: 40,
    textAlign: "center",
  },
});
