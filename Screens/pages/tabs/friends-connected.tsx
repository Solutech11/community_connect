import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import AppLoader from "../../components/ui/app-loader";
import AppReportSheet from "../../components/ui/app-report-sheet";
import PersonCard from "../../components/ui/person-card";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import {
  toGeneralReportReason,
  type ReportReason,
} from "../../data/report-options";
import { useAuth } from "../../hooks/use-auth";
import { useFriends, type FriendsTab } from "../../hooks/use-friends";
import { matchesFriendSearch } from "../../services/api/friends.mapper";
import { colors, fonts } from "../../styles/theme";
import type { FriendConnection, FriendPerson } from "../../types/friends";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Friends">;
const tabs: FriendsTab[] = ["Friends", "Requests", "Discover"];

export default function FriendsConnectedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const connections = useFriends(user?._id ?? "");
  const [tab, setTab] = useState<FriendsTab>("Friends");
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<FriendConnection | null>(
    null,
  );
  const [reportTarget, setReportTarget] = useState<FriendPerson | null>(null);
  const disabled = Boolean(connections.pendingId);
  const error = connections.errors[tab];

  const friends = useMemo(
    () =>
      connections.friends.filter((item) =>
        matchesFriendSearch(item.person, query),
      ),
    [connections.friends, query],
  );
  const requests = useMemo(
    () =>
      connections.requests.filter((item) =>
        matchesFriendSearch(item.person, query),
      ),
    [connections.requests, query],
  );
  const discover = useMemo(
    () =>
      connections.discover.filter((person) =>
        matchesFriendSearch(person, query),
      ),
    [connections.discover, query],
  );
  const count =
    tab === "Friends"
      ? friends.length
      : tab === "Requests"
        ? requests.length
        : discover.length;
  const total = {
    Friends: connections.friends.length,
    Requests: connections.requests.length,
    Discover: connections.discover.length,
  };

  const findPeople = () => {
    setTab("Discover");
    setQuery("");
  };
  const openChat = async (person: FriendPerson) => {
    const conversation = await connections.startChat(person);
    if (!conversation) return;
    navigation.navigate("ChatThread", {
      conversationId: conversation._id,
      name: person.name,
      image: person.avatarUrl,
      online: false,
    });
  };

  const submitReport = async (reason: ReportReason, details: string) => {
    if (!reportTarget) return;
    await connections.report(reportTarget, {
      reason: toGeneralReportReason(reason),
      ...(details.trim() ? { details: details.trim() } : {}),
    });
  };

  const reportAction = (person: FriendPerson) => ({
    label: "Report member",
    icon: "flag-outline" as const,
    onPress: () => setReportTarget(person),
  });

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={styles.safe}>
        <ProfilePageHeader
          title="Friends"
          onBack={() => navigation.goBack()}
          onRightPress={findPeople}
          rightIcon="person-add-outline"
          rightAccessibilityLabel="Find new friends"
        />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={connections.refreshing}
              onRefresh={() => void connections.refresh()}
              tintColor={colors.moss}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>YOUR PEOPLE</Text>
                <Text style={styles.heroTitle}>Better with friends.</Text>
                <Text style={styles.heroText}>
                  Grow your circle. Keep the good conversations going.
                </Text>
              </View>
              <View style={styles.heroIcon}>
                <Ionicons name="people" size={29} color={colors.moss} />
              </View>
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>
                  {connections.loaded ? total.Friends : "..."}
                </Text>
                <Text style={styles.statLabel}>
                  {total.Friends === 1 ? "friend" : "friends"}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <Pressable
                accessibilityLabel="View incoming requests"
                onPress={() => setTab("Requests")}
                style={styles.stat}
              >
                <Text style={styles.statNumber}>
                  {connections.loaded ? total.Requests : "..."}
                </Text>
                <Text style={styles.statLabel}>
                  {total.Requests === 1 ? "request" : "requests"}
                </Text>
                <Ionicons name="arrow-forward" size={13} color={colors.moss} />
              </Pressable>
            </View>
          </View>

          <View style={styles.search}>
            <Ionicons name="search-outline" size={19} color="#658372" />
            <TextInput
              accessibilityLabel={
                tab === "Discover"
                  ? "Search available suggestions"
                  : "Search " + tab.toLowerCase()
              }
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder={
                tab === "Discover"
                  ? "Search these suggestions"
                  : "Search by name or interest"
              }
              placeholderTextColor="#84958c"
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setQuery("")}
                style={styles.clearSearch}
              >
                <Ionicons name="close-circle" size={18} color="#8d9e94" />
              </Pressable>
            ) : null}
          </View>

          <View accessibilityRole="tablist" style={styles.tabs}>
            {tabs.map((item) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item }}
                key={item}
                onPress={() => setTab(item)}
                style={[styles.tab, tab === item && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, tab === item && styles.tabTextActive]}
                >
                  {item}
                </Text>
                {item === "Requests" && total.Requests > 0 ? (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{total.Requests}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              {tab === "Friends"
                ? "Your circle"
                : tab === "Requests"
                  ? "Waiting to connect"
                  : "Meet someone new"}
            </Text>
            {connections.loaded ? (
              <Text style={styles.sectionCount}>{count}</Text>
            ) : null}
          </View>
          <Text style={styles.sectionCopy}>
            {tab === "Friends"
              ? "A familiar face is just a message away."
              : tab === "Requests"
                ? "People who would like to be your friend."
                : "A few Community Connect members to get to know."}
          </Text>

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons
                name="cloud-offline-outline"
                size={24}
                color="#8b6244"
              />
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>People need a moment</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <Pressable
                accessibilityLabel="Retry loading people"
                disabled={connections.refreshing || disabled}
                onPress={() => void connections.refresh()}
                style={styles.retry}
              >
                <Text style={styles.retryText}>
                  {connections.refreshing ? "Loading" : "Retry"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {connections.loading ? (
            <View style={styles.loading}>
              <AppLoader color={colors.moss} />
              <Text style={styles.loadingText}>Finding your people...</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {tab === "Friends"
                ? friends.map((connection) => (
                    <PersonCard
                      key={connection.relationshipId}
                      name={connection.person.name}
                      avatarUrl={connection.person.avatarUrl}
                      location={connection.person.location}
                      interests={connection.person.interests}
                      caption="Connected with you"
                      disabled={disabled}
                      actions={[
                        {
                          label: "Message",
                          icon: "chatbubble-outline",
                          primary: true,
                          busy:
                            connections.pendingId ===
                              connection.relationshipId ||
                            connections.pendingId === connection.person.userId,
                          onPress: () => void openChat(connection.person),
                        },
                      ]}
                      menuActions={[
                        {
                          label: "Remove friend",
                          icon: "person-remove-outline",
                          destructive: true,
                          onPress: () => setRemoveTarget(connection),
                        },
                        reportAction(connection.person),
                      ]}
                    />
                  ))
                : null}
              {tab === "Requests"
                ? requests.map((connection) => (
                    <PersonCard
                      key={connection.relationshipId}
                      name={connection.person.name}
                      avatarUrl={connection.person.avatarUrl}
                      location={connection.person.location}
                      interests={connection.person.interests}
                      caption="Sent you a friend request"
                      disabled={disabled}
                      actions={[
                        {
                          label: "Accept",
                          icon: "checkmark",
                          primary: true,
                          busy:
                            connections.pendingId === connection.relationshipId,
                          onPress: () =>
                            void connections.respond(connection, "accept"),
                        },
                        {
                          label: "Decline",
                          onPress: () =>
                            void connections.respond(connection, "decline"),
                        },
                      ]}
                      menuActions={[reportAction(connection.person)]}
                    />
                  ))
                : null}
              {tab === "Discover"
                ? discover.map((person) => (
                    <PersonCard
                      key={person.userId}
                      name={person.name}
                      avatarUrl={person.avatarUrl}
                      location={person.location}
                      interests={person.interests}
                      caption="Community Connect member"
                      disabled={disabled}
                      actions={[
                        {
                          label: "Add friend",
                          icon: "person-add-outline",
                          primary: true,
                          busy: connections.pendingId === person.userId,
                          onPress: () => void connections.sendRequest(person),
                        },
                      ]}
                      menuActions={[reportAction(person)]}
                    />
                  ))
                : null}

              {count === 0 && !error ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name={
                        query.trim()
                          ? "search-outline"
                          : tab === "Friends"
                            ? "people-outline"
                            : tab === "Requests"
                              ? "mail-open-outline"
                              : "compass-outline"
                      }
                      size={29}
                      color={colors.moss}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {query.trim()
                      ? "No matches here"
                      : tab === "Friends"
                        ? "Your circle starts here"
                        : tab === "Requests"
                          ? "You're all caught up"
                          : "More connections will come"}
                  </Text>
                  <Text style={styles.emptyCopy}>
                    {query.trim()
                      ? "Try another name or interest."
                      : tab === "Friends"
                        ? "Find a familiar interest and turn it into a friendship."
                        : tab === "Requests"
                          ? "New incoming friend requests will appear here."
                          : "Refresh to check for available suggestions."}
                  </Text>
                  {tab === "Friends" && !query.trim() ? (
                    <Pressable onPress={findPeople} style={styles.emptyAction}>
                      <Text style={styles.emptyActionText}>Find people</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={colors.ink}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AppAlertModal
        visible={Boolean(removeTarget)}
        title="Remove this friend?"
        message={
          "Remove " +
          (removeTarget?.person.name || "this person") +
          " from your friends? You can send a new request later."
        }
        confirmText="Remove friend"
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (target) void connections.remove(target);
        }}
      />
      <AppReportSheet
        description={
          "Tell us why " +
          (reportTarget?.name || "this member") +
          " should be reviewed. Your report is confidential."
        }
        minimumDetailsLength={10}
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
        title="Report Member"
        visible={Boolean(reportTarget)}
      />
      <AppAlertModal
        visible={Boolean(connections.notice)}
        title={connections.notice?.title ?? ""}
        message={connections.notice?.message ?? ""}
        onClose={connections.clearNotice}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  hero: {
    backgroundColor: "#e8f7ed",
    borderColor: "#daeddf",
    borderRadius: 24,
    borderWidth: 1,
    padding: 19,
  },
  heroTop: { alignItems: "center", flexDirection: "row", gap: 14 },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#487a57",
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 7,
  },
  heroText: {
    color: "#698071",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#d6eddf",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  stats: {
    alignItems: "center",
    borderTopColor: "#d4e8db",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 17,
    marginTop: 16,
    paddingTop: 13,
  },
  stat: { alignItems: "center", flexDirection: "row", gap: 6 },
  statNumber: { color: colors.moss, fontFamily: fonts.extraBold, fontSize: 17 },
  statLabel: { color: "#68816f", fontFamily: fonts.medium, fontSize: 11 },
  statDivider: { backgroundColor: "#c8ded0", height: 15, width: 1 },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#e2ece5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 19,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    height: 48,
  },
  clearSearch: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 24,
  },
  tabs: {
    backgroundColor: "#eaf1ed",
    borderRadius: 18,
    flexDirection: "row",
    marginTop: 14,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 42,
  },
  tabActive: { backgroundColor: colors.forest },
  tabText: { color: "#708178", fontFamily: fonts.bold, fontSize: 11 },
  tabTextActive: { color: colors.white },
  tabCount: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 17,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabCountText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 8 },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 25,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
  },
  sectionCount: { color: "#6a8271", fontFamily: fonts.bold, fontSize: 12 },
  sectionCopy: {
    color: "#819087",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 17,
    marginBottom: 16,
    marginTop: 4,
  },
  list: { gap: 12 },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#fcf5e9",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    padding: 14,
  },
  errorCopy: { flex: 1 },
  errorTitle: { color: "#745738", fontFamily: fonts.bold, fontSize: 12 },
  errorText: {
    color: "#8d775c",
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },
  retry: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 5,
  },
  retryText: { color: colors.moss, fontFamily: fonts.bold, fontSize: 11 },
  loading: { alignItems: "center", gap: 12, paddingVertical: 56 },
  loadingText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12 },
  empty: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 36 },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginTop: 16,
    textAlign: "center",
  },
  emptyCopy: {
    color: "#86968c",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  emptyAction: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 20,
  },
  emptyActionText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
});
