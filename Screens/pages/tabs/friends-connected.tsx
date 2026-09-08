import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import AppReportSheet from "../../components/ui/app-report-sheet";
import {
  toGeneralReportReason,
  type ReportReason,
} from "../../data/report-options";
import { useAuth } from "../../hooks/use-auth";
import { chatApi } from "../../services/api/chat.api";
import { ApiError } from "../../services/api/client";
import { friendsApi } from "../../services/api/friends.api";
import { usersApi } from "../../services/api/users.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetFriendsRequestsResponse,
  GetFriendsResponse,
  GetFriendsSuggestionsResponse,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Friends">;
type Friendship = GetFriendsResponse["data"]["friendships"][number];
type Request = GetFriendsRequestsResponse["data"]["requests"][number];
type Suggestion = GetFriendsSuggestionsResponse["data"]["users"][number];
type Tab = "Friends" | "Requests" | "Discover";

const AVATAR =
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80";

function shortMember(id: string) {
  return `Member ${id.slice(-6).toUpperCase()}`;
}

export default function FriendsConnectedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Friends");
  const [query, setQuery] = useState("");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [friendsResponse, requestsResponse, suggestionsResponse] =
        await Promise.all([
          friendsApi.list(),
          friendsApi.requests(),
          friendsApi.suggestions(),
        ]);
      setFriendships(friendsResponse.data.friendships);
      setRequests(requestsResponse.data.requests);
      setSuggestions(suggestionsResponse.data.users);
    } catch (error) {
      setNotice({
        title: "Friends unavailable",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to load your connections.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const normalized = query.trim().toLowerCase();
  const visibleSuggestions = useMemo(
    () =>
      suggestions.filter((item) =>
        `${item.firstName} ${item.lastName} ${item.state} ${item.interests.join(" ")}`
          .toLowerCase()
          .includes(normalized),
      ),
    [normalized, suggestions],
  );

  const perform = async (
    id: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await action();
      setNotice({ title: "Done", message: success });
      await load(true);
    } catch (error) {
      setNotice({
        title: "Action failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  };

  const openChat = async (friendship: Friendship) => {
    const participantId =
      friendship.requesterId === user?._id
        ? friendship.addresseeId
        : friendship.requesterId;
    setPendingId(friendship._id);
    try {
      const response = await chatApi.createConversation({
        type: "direct",
        participantIds: [participantId],
      });
      navigation.navigate("ChatThread", {
        conversationId: response.data.conversation._id,
        image: AVATAR,
        name: shortMember(participantId),
        online: false,
      });
    } catch (error) {
      setNotice({
        title: "Chat unavailable",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to open this conversation.",
      });
    } finally {
      setPendingId(null);
    }
  };

  const submitUserReport = async (reason: ReportReason, details: string) => {
    if (!reportTarget) return;
    try {
      const response = await usersApi.report(reportTarget.id, {
        reason: toGeneralReportReason(reason),
        ...(details ? { details } : {}),
      });
      setNotice({ title: "Report submitted", message: response.message });
    } catch (error) {
      setNotice({
        title: "Unable to report",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={navigation.goBack} style={styles.back}>
            <Ionicons color={colors.ink} name="chevron-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Friends</Text>
          <View style={styles.back} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.search}>
            <Ionicons color="#32965d" name="search" size={20} />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search people"
              placeholderTextColor="#718078"
              style={styles.searchInput}
              value={query}
            />
          </View>
          <View style={styles.tabs}>
            {(["Friends", "Requests", "Discover"] as Tab[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={[styles.tab, tab === item && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, tab === item && styles.tabTextActive]}
                >
                  {item}
                </Text>
                {item === "Requests" && requests.length ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{requests.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color="#08ad54" />
            </View>
          ) : null}

          {!loading && tab === "Friends" ? (
            friendships.length ? (
              friendships.map((friendship) => {
                const participantId =
                  friendship.requesterId === user?._id
                    ? friendship.addresseeId
                    : friendship.requesterId;
                return (
                  <View key={friendship._id} style={styles.person}>
                    <Image source={{ uri: AVATAR }} style={styles.avatar} />
                    <View style={styles.personCopy}>
                      <Text style={styles.name}>
                        {shortMember(participantId)}
                      </Text>
                      <Text style={styles.meta}>Connected member</Text>
                    </View>
                    <Pressable
                      disabled={Boolean(pendingId)}
                      onPress={() => void openChat(friendship)}
                      style={styles.iconAction}
                    >
                      {pendingId === friendship._id ? (
                        <ActivityIndicator color="#078d45" />
                      ) : (
                        <Ionicons
                          color="#078d45"
                          name="chatbubble-outline"
                          size={20}
                        />
                      )}
                    </Pressable>
                    <Pressable
                      disabled={Boolean(pendingId)}
                      onPress={() =>
                        void perform(
                          friendship._id,
                          () => friendsApi.remove(friendship._id),
                          "Friend removed.",
                        )
                      }
                      style={styles.iconAction}
                    >
                      <Ionicons
                        color="#9d4b4b"
                        name="person-remove-outline"
                        size={20}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setReportTarget({
                          id: participantId,
                          name: shortMember(participantId),
                        })
                      }
                      style={styles.iconAction}
                    >
                      <Ionicons color="#9d4b4b" name="flag-outline" size={19} />
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <Empty
                icon="people-outline"
                title="No friends yet"
                copy="Discover members with shared interests."
              />
            )
          ) : null}

          {!loading && tab === "Requests" ? (
            requests.length ? (
              requests.map((request) => {
                const memberId =
                  request.requesterId === user?._id
                    ? request.addresseeId
                    : request.requesterId;
                const incoming = request.addresseeId === user?._id;
                return (
                  <View key={request._id} style={styles.person}>
                    <Image source={{ uri: AVATAR }} style={styles.avatar} />
                    <View style={styles.personCopy}>
                      <Text style={styles.name}>{shortMember(memberId)}</Text>
                      <Text style={styles.meta}>
                        {incoming ? "Sent you a request" : "Request sent"}
                      </Text>
                    </View>
                    {incoming ? (
                      <>
                        <Pressable
                          disabled={Boolean(pendingId)}
                          onPress={() =>
                            void perform(
                              request._id,
                              () =>
                                friendsApi.respondToRequest(request._id, {
                                  action: "accept",
                                }),
                              "Friend request accepted.",
                            )
                          }
                          style={styles.accept}
                        >
                          <Ionicons
                            color={colors.ink}
                            name="checkmark"
                            size={20}
                          />
                        </Pressable>
                        <Pressable
                          disabled={Boolean(pendingId)}
                          onPress={() =>
                            void perform(
                              request._id,
                              () =>
                                friendsApi.respondToRequest(request._id, {
                                  action: "reject",
                                }),
                              "Friend request rejected.",
                            )
                          }
                          style={styles.iconAction}
                        >
                          <Ionicons color="#9d4b4b" name="close" size={20} />
                        </Pressable>
                      </>
                    ) : null}
                    <Pressable
                      onPress={() =>
                        setReportTarget({
                          id: memberId,
                          name: shortMember(memberId),
                        })
                      }
                      style={styles.iconAction}
                    >
                      <Ionicons color="#9d4b4b" name="flag-outline" size={19} />
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <Empty
                icon="mail-open-outline"
                title="No pending requests"
                copy="New friend requests will appear here."
              />
            )
          ) : null}

          {!loading && tab === "Discover" ? (
            visibleSuggestions.length ? (
              visibleSuggestions.map((suggestion) => (
                <View key={suggestion._id} style={styles.person}>
                  <Image source={{ uri: AVATAR }} style={styles.avatar} />
                  <View style={styles.personCopy}>
                    <Text style={styles.name}>
                      {suggestion.firstName} {suggestion.lastName}
                    </Text>
                    <Text numberOfLines={1} style={styles.meta}>
                      {[
                        suggestion.lga,
                        suggestion.state,
                        ...suggestion.interests,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </Text>
                  </View>
                  <Pressable
                    disabled={Boolean(pendingId)}
                    onPress={() =>
                      void perform(
                        suggestion._id,
                        () => friendsApi.sendRequest(suggestion._id),
                        "Friend request sent.",
                      )
                    }
                    style={styles.add}
                  >
                    {pendingId === suggestion._id ? (
                      <ActivityIndicator color={colors.ink} />
                    ) : (
                      <Ionicons
                        color={colors.ink}
                        name="person-add-outline"
                        size={20}
                      />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setReportTarget({
                        id: suggestion._id,
                        name: `${suggestion.firstName} ${suggestion.lastName}`.trim(),
                      })
                    }
                    style={styles.iconAction}
                  >
                    <Ionicons color="#9d4b4b" name="flag-outline" size={19} />
                  </Pressable>
                </View>
              ))
            ) : (
              <Empty
                icon="search-outline"
                title="No suggestions found"
                copy="Try a different search."
              />
            )
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <AppReportSheet
        description={`Tell us why ${reportTarget?.name || "this member"} should be reviewed. Your report is confidential.`}
        minimumDetailsLength={10}
        onClose={() => setReportTarget(null)}
        onSubmit={submitUserReport}
        title="Report Member"
        visible={Boolean(reportTarget)}
      />
      <AppAlertModal
        visible={Boolean(notice)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

function Empty({
  icon,
  title,
  copy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.state}>
      <Ionicons color="#70a888" name={icon} size={38} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.meta}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
  },
  back: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  title: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 22 },
  content: { padding: 20, paddingBottom: 100 },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fonts.medium,
    height: 48,
  },
  tabs: {
    backgroundColor: "#e7f1ec",
    borderRadius: 20,
    flexDirection: "row",
    marginVertical: 18,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 17,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { color: "#658075", fontFamily: fonts.bold, fontSize: 11 },
  tabTextActive: { color: colors.ink },
  badge: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
  },
  badgeText: { color: colors.ink, fontFamily: fonts.extraBold, fontSize: 9 },
  person: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: 10,
    padding: 12,
  },
  avatar: { borderRadius: 24, height: 48, width: 48 },
  personCopy: { flex: 1, marginLeft: 11 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 13 },
  meta: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 4,
  },
  iconAction: {
    alignItems: "center",
    backgroundColor: "#eef6f2",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginLeft: 6,
    width: 36,
  },
  accept: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    marginLeft: 6,
    width: 36,
  },
  add: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  state: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 28,
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    marginTop: 10,
  },
});
