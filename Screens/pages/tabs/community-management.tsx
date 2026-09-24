import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppAlertModal from "../../components/ui/app-alert-modal";
import ProfilePageHeader from "../../components/ui/profile-page-header";
import { ApiError } from "../../services/api/client";
import { communitiesApi } from "../../services/api/communities.api";
import { colors, fonts } from "../../styles/theme";
import type {
  GetCommunitiesIdAnnouncementsResponse,
  GetCommunitiesIdPostsResponse,
  GetCommunitiesIdRulesResponse,
  PatchCommunitiesIdSettingsBody,
} from "../../types/api.generated";
import type { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CommunityManagement">;
type Tab = "People" | "Settings" | "Content";
type Role = "owner" | "moderator" | "member";
type JoinPolicy = NonNullable<PatchCommunitiesIdSettingsBody["joinPolicy"]>;
type MessagePermission = NonNullable<
  PatchCommunitiesIdSettingsBody["messagePermission"]
>;
type Settings = {
  joinPolicy: JoinPolicy;
  messagePermission: MessagePermission;
  accessCode: string;
  membersCanCreatePosts: boolean;
  membersCanInvite: boolean;
  showMemberList: boolean;
};
const JOIN_POLICIES = [
  "open",
  "approval",
  "invite_only",
  "access_code",
] as const satisfies readonly JoinPolicy[];
const MESSAGE_PERMISSIONS = ["everyone", "moderators"] as const satisfies readonly MessagePermission[];

function parseJoinPolicy(value: string): JoinPolicy {
  return JOIN_POLICIES.find((policy) => policy === value) ?? "open";
}

function parseMessagePermission(value: string): MessagePermission {
  return MESSAGE_PERMISSIONS.find((permission) => permission === value) ?? "everyone";
}
type Rule = GetCommunitiesIdRulesResponse["data"]["rules"]["rules"][number];
type Post = GetCommunitiesIdPostsResponse["data"]["posts"][number];
type Announcement =
  GetCommunitiesIdAnnouncementsResponse["data"]["announcements"][number] & {
    pinnedAt?: string | null;
  };
type ContentKind = "post" | "announcement";
type ManagedMember = {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    state: string;
    lga: string;
  };
  communityRole: Role;
  status: string;
  joinedAt: string;
};
type JoinRequest = {
  _id: string;
  requesterId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  message?: string;
  status: string;
  createdAt: string;
};
type RuleDraft = { key: string; title: string; description: string };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapMember(value: unknown): ManagedMember | null {
  const item = record(value);
  const user = record(item?.user) ?? item;
  const id = stringValue(user?._id);
  if (!item || !user || !id) return null;
  const role = stringValue(item.communityRole, "member");
  return {
    user: {
      _id: id,
      firstName: stringValue(user.firstName),
      lastName: stringValue(user.lastName),
      avatarUrl: stringValue(user.avatarUrl),
      state: stringValue(user.state),
      lga: stringValue(user.lga),
    },
    communityRole: role === "owner" || role === "moderator" ? role : "member",
    status: stringValue(item.status, "active"),
    joinedAt: stringValue(item.joinedAt),
  };
}

function mapJoinRequest(value: unknown): JoinRequest | null {
  const item = record(value);
  const requester = record(item?.requesterId);
  const id = stringValue(item?._id);
  const requesterId = stringValue(requester?._id);
  if (!item || !requester || !id || !requesterId) return null;
  return {
    _id: id,
    requesterId: {
      _id: requesterId,
      firstName: stringValue(requester.firstName),
      lastName: stringValue(requester.lastName),
      avatarUrl: stringValue(requester.avatarUrl),
    },
    message: stringValue(item.message),
    status: stringValue(item.status),
    createdAt: stringValue(item.createdAt),
  };
}

function displayName(member: ManagedMember) {
  return (
    `${member.user.firstName} ${member.user.lastName}`.trim() ||
    "Community member"
  );
}

export default function CommunityManagementScreen({
  navigation,
  route,
}: Props) {
  const communityId = route.params.communityId;
  const [tab, setTab] = useState<Tab>("People");
  const [viewerRole, setViewerRole] = useState<Role | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [members, setMembers] = useState<ManagedMember[]>([]);
  const [bannedMembers, setBannedMembers] = useState<ManagedMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [rulesIntro, setRulesIntro] = useState("");
  const [ruleDrafts, setRuleDrafts] = useState<RuleDraft[]>([]);
  const [consequences, setConsequences] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contentKind, setContentKind] = useState<ContentKind>("post");
  const [contentText, setContentText] = useState("");
  const [contentImageUrl, setContentImageUrl] = useState("");
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("Community policy violation");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const mine = await communitiesApi.myCommunities({ page: 1, limit: 50 });
        const role = mine.data.communities.find(
          (item) => item._id === communityId,
        )?.viewerMembership?.role;
        if (role !== "owner" && role !== "moderator") {
          setViewerRole(null);
          setNotice({
            title: "Management unavailable",
            message:
              "Only a community owner or moderator can manage this community.",
          });
          return;
        }
        setViewerRole(role);
        const [
          settingsResponse,
          rulesResponse,
          membersResponse,
          bannedResponse,
          requestsResponse,
          postsResponse,
          announcementsResponse,
        ] = await Promise.all([
          communitiesApi.settings(communityId),
          communitiesApi.rules(communityId),
          communitiesApi.members(communityId, {
            page: 1,
            limit: 100,
            status: "active",
          }),
          communitiesApi.members(communityId, {
            page: 1,
            limit: 100,
            status: "banned",
          }),
          communitiesApi.joinRequests(communityId, {
            page: 1,
            limit: 100,
            status: "pending",
          }),
          communitiesApi.posts(communityId, { page: 1, limit: 100 }),
          communitiesApi.announcements(communityId, { page: 1, limit: 100 }),
        ]);
        setSettings({
          ...settingsResponse.data.settings,
          joinPolicy: parseJoinPolicy(settingsResponse.data.settings.joinPolicy),
          messagePermission: parseMessagePermission(
            settingsResponse.data.settings.messagePermission,
          ),
          accessCode: "",
        });
        const ruleDocument = rulesResponse.data.rules;
        setRulesIntro(ruleDocument.introduction);
        setRuleDrafts(
          ruleDocument.rules.map((item: Rule, index: number) => ({
            key: item._id || `rule-${index}`,
            title: item.title,
            description: item.description,
          })),
        );
        setConsequences(ruleDocument.consequences.join("\n"));
        setMembers(
          (membersResponse.data.members as unknown[])
            .map(mapMember)
            .filter((item): item is ManagedMember => item !== null),
        );
        setBannedMembers(
          (bannedResponse.data.members as unknown[])
            .map(mapMember)
            .filter((item): item is ManagedMember => item !== null),
        );
        setJoinRequests(
          (requestsResponse.data.joinRequests as unknown[])
            .map(mapJoinRequest)
            .filter((item): item is JoinRequest => item !== null),
        );
        setPosts(postsResponse.data.posts);
        setAnnouncements(
          announcementsResponse.data.announcements as Announcement[],
        );
      } catch (error) {
        setNotice({
          title: "Management unavailable",
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to load community management.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    if (busyKey) return;
    setBusyKey(key);
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
      setBusyKey(null);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    await run(
      "settings",
      () =>
        communitiesApi.updateSettings(communityId, {
          joinPolicy: settings.joinPolicy,
          ...(settings.joinPolicy === "access_code" && settings.accessCode.trim()
            ? { accessCode: settings.accessCode.trim() }
            : {}),
          messagePermission: settings.messagePermission,
          membersCanCreatePosts: settings.membersCanCreatePosts,
          membersCanInvite: settings.membersCanInvite,
          showMemberList: settings.showMemberList,
        }),
      "Community settings saved.",
    );
  };

  const saveRules = async () => {
    const cleanedRules = ruleDrafts.map((item, index) => ({
      title: item.title.trim(),
      description: item.description.trim(),
      order: index,
    }));
    if (
      !rulesIntro.trim() ||
      cleanedRules.some(
        (item) => item.title.length < 2 || item.description.length < 2,
      )
    ) {
      setNotice({
        title: "Check community rules",
        message:
          "Add an introduction and complete every rule title and description.",
      });
      return;
    }
    await run(
      "rules",
      () =>
        communitiesApi.updateRules(communityId, {
          introduction: rulesIntro.trim(),
          rules: cleanedRules,
          consequences: consequences
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      "Community rules saved.",
    );
  };

  const createInvite = async () => {
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    if (busyKey) return;
    setBusyKey("invite");
    try {
      const response = await communitiesApi.createInvite(communityId, {
        expiresAt,
        maxUses: 1,
      });
      setNotice({
        title: "Invite created",
        message: `Share this one-use invite token:\n\n${response.data.invite.token}\n\nExpires ${new Date(response.data.invite.expiresAt).toLocaleString("en-NG")}.`,
      });
    } catch (error) {
      setNotice({
        title: "Invite failed",
        message:
          error instanceof ApiError ? error.message : "Please try again.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const saveContent = async () => {
    const text = contentText.trim();
    const imageUrl = contentImageUrl.trim();
    if (!text) {
      setNotice({
        title: "Add content",
        message: "Enter text before publishing.",
      });
      return;
    }
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
      setNotice({
        title: "Invalid image link",
        message: "Use a complete HTTPS image URL.",
      });
      return;
    }
    const body = { text, ...(imageUrl ? { imageUrl } : {}) };
    const action = editingContentId
      ? contentKind === "post"
        ? () => communitiesApi.updatePost(communityId, editingContentId, body)
        : () =>
            communitiesApi.updateAnnouncement(
              communityId,
              editingContentId,
              body,
            )
      : contentKind === "post"
        ? () => communitiesApi.createPost(communityId, body)
        : () => communitiesApi.createAnnouncement(communityId, body);
    await run(
      "content",
      action,
      editingContentId ? "Content updated." : "Content published.",
    );
    setContentText("");
    setContentImageUrl("");
    setEditingContentId(null);
  };

  const editContent = (item: Post | Announcement, kind: ContentKind) => {
    setContentKind(kind);
    setEditingContentId(item._id);
    setContentText(item.text);
    setContentImageUrl(item.imageUrl || "");
  };

  const removeContent = (item: Post | Announcement, kind: ContentKind) => {
    setConfirm({
      title: `Delete ${kind}?`,
      message: "This content will be removed from the community.",
      action: async () => {
        await run(
          `delete-${item._id}`,
          () =>
            kind === "post"
              ? communitiesApi.deletePost(communityId, item._id)
              : communitiesApi.deleteAnnouncement(communityId, item._id),
          "Content deleted.",
        );
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#08b657" size="large" />
          <Text style={styles.muted}>Loading management tools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView edges={[]} style={styles.safe}>
        <ProfilePageHeader
          onBack={navigation.goBack}
          title="Manage Community"
        />
        {!viewerRole ? (
          <View style={styles.center}>
            <Ionicons color="#a34b4b" name="lock-closed-outline" size={42} />
            <Text style={styles.heading}>Moderator access required</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void load(true);
                }}
              />
            }
          >
            <View style={styles.tabs}>
              {(["People", "Settings", "Content"] as Tab[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setTab(item)}
                  style={[styles.tab, tab === item && styles.tabActive]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === item && styles.tabTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === "People" ? (
              <>
                <Section title="Pending requests">
                  {joinRequests.map((request) => (
                    <View key={request._id} style={styles.row}>
                      <View style={styles.copy}>
                        <Text style={styles.name}>
                          {request.requesterId.firstName}{" "}
                          {request.requesterId.lastName}
                        </Text>
                        <Text style={styles.meta}>
                          {request.message || "No request message"}
                        </Text>
                      </View>
                      <Action
                        icon="checkmark"
                        onPress={() => {
                          void run(
                            `approve-${request._id}`,
                            () =>
                              communitiesApi.reviewJoinRequest(
                                communityId,
                                request._id,
                                { status: "approved" },
                              ),
                            "Join request approved.",
                          );
                        }}
                      />
                      <Action
                        danger
                        icon="close"
                        onPress={() => {
                          void run(
                            `reject-${request._id}`,
                            () =>
                              communitiesApi.reviewJoinRequest(
                                communityId,
                                request._id,
                                { status: "rejected" },
                              ),
                            "Join request rejected.",
                          );
                        }}
                      />
                    </View>
                  ))}
                  {!joinRequests.length ? (
                    <Text style={styles.muted}>No pending requests.</Text>
                  ) : null}
                  <Pressable
                    disabled={Boolean(busyKey)}
                    onPress={() => {
                      void createInvite();
                    }}
                    style={styles.secondary}
                  >
                    <Text style={styles.secondaryText}>
                      Create 7-day invite
                    </Text>
                  </Pressable>
                </Section>

                <Section title="Active members">
                  <TextInput
                    onChangeText={setBanReason}
                    placeholder="Reason used when banning a member"
                    placeholderTextColor="#718078"
                    style={styles.input}
                    value={banReason}
                  />
                  {members.map((member) => (
                    <View key={member.user._id} style={styles.memberCard}>
                      <View style={styles.copy}>
                        <Text style={styles.name}>{displayName(member)}</Text>
                        <Text style={styles.meta}>
                          {member.communityRole.toUpperCase()} ·{" "}
                          {[member.user.lga, member.user.state]
                            .filter(Boolean)
                            .join(", ") || "Location unavailable"}
                        </Text>
                      </View>
                      {member.communityRole !== "owner" ? (
                        <>
                          {viewerRole === "owner" ? (
                            <Action
                              icon={
                                member.communityRole === "moderator"
                                  ? "person-outline"
                                  : "shield-outline"
                              }
                              onPress={() => {
                                void run(
                                  `role-${member.user._id}`,
                                  () =>
                                    communitiesApi.updateMember(
                                      communityId,
                                      member.user._id,
                                      {
                                        role:
                                          member.communityRole === "moderator"
                                            ? "member"
                                            : "moderator",
                                      },
                                    ),
                                  "Member role updated.",
                                );
                              }}
                            />
                          ) : null}
                          <Action
                            danger
                            icon="person-remove-outline"
                            onPress={() =>
                              setConfirm({
                                title: "Remove member?",
                                message: `${displayName(member)} will lose community access.`,
                                action: async () => {
                                  await run(
                                    `remove-${member.user._id}`,
                                    () =>
                                      communitiesApi.removeMember(
                                        communityId,
                                        member.user._id,
                                      ),
                                    "Member removed.",
                                  );
                                },
                              })
                            }
                          />
                          <Action
                            danger
                            icon="ban-outline"
                            onPress={() => {
                              void run(
                                `ban-${member.user._id}`,
                                () =>
                                  communitiesApi.banMember(
                                    communityId,
                                    member.user._id,
                                    {
                                      reason:
                                        banReason.trim() ||
                                        "Community policy violation",
                                    },
                                  ),
                                "Member banned.",
                              );
                            }}
                          />
                        </>
                      ) : null}
                    </View>
                  ))}
                </Section>

                {bannedMembers.length ? (
                  <Section title="Banned members">
                    {bannedMembers.map((member) => (
                      <View key={member.user._id} style={styles.row}>
                        <View style={styles.copy}>
                          <Text style={styles.name}>{displayName(member)}</Text>
                          <Text style={styles.meta}>BANNED</Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            void run(
                              `unban-${member.user._id}`,
                              () =>
                                communitiesApi.unbanMember(
                                  communityId,
                                  member.user._id,
                                ),
                              "Member unbanned.",
                            );
                          }}
                          style={styles.secondarySmall}
                        >
                          <Text style={styles.secondaryText}>Unban</Text>
                        </Pressable>
                      </View>
                    ))}
                  </Section>
                ) : null}

                {viewerRole === "owner" ? (
                  <Section title="Transfer ownership">
                    <TextInput
                      autoCapitalize="none"
                      onChangeText={setNewOwnerId}
                      placeholder="New owner user ID"
                      placeholderTextColor="#718078"
                      style={styles.input}
                      value={newOwnerId}
                    />
                    <TextInput
                      onChangeText={setCurrentPassword}
                      placeholder="Current password (optional)"
                      placeholderTextColor="#718078"
                      secureTextEntry
                      style={styles.input}
                      value={currentPassword}
                    />
                    <Pressable
                      disabled={!newOwnerId.trim() || Boolean(busyKey)}
                      onPress={() =>
                        setConfirm({
                          title: "Transfer ownership?",
                          message:
                            "The selected active member will become the owner and you will become a moderator.",
                          action: async () => {
                            await run(
                              "transfer",
                              () =>
                                communitiesApi.transferOwnership(communityId, {
                                  newOwnerId: newOwnerId.trim(),
                                  ...(currentPassword
                                    ? { currentPassword }
                                    : {}),
                                }),
                              "Ownership transferred.",
                            );
                            navigation.goBack();
                          },
                        })
                      }
                      style={styles.dangerButton}
                    >
                      <Text style={styles.dangerText}>Transfer ownership</Text>
                    </Pressable>
                  </Section>
                ) : null}
              </>
            ) : null}

            {tab === "Settings" && settings ? (
              <>
                <Section title="Joining">
                  <ChoiceRow
                    values={[...JOIN_POLICIES]}
                    value={settings.joinPolicy}
                    onChange={(joinPolicy) =>
                      setSettings({
                        ...settings,
                        joinPolicy: parseJoinPolicy(joinPolicy),
                      })
                    }
                  />
                  {settings.joinPolicy === "access_code" ? (
                    <>
                      <TextInput
                        autoCapitalize="characters"
                        onChangeText={(accessCode) =>
                          setSettings({ ...settings, accessCode })
                        }
                        placeholder="Set or replace access code"
                        placeholderTextColor="#718078"
                        style={styles.input}
                        value={settings.accessCode}
                      />
                      <Text style={styles.meta}>
                        Leave blank to keep the current code.
                      </Text>
                    </>
                  ) : null}
                </Section>
                <Section title="Message permissions">
                  <ChoiceRow
                    values={[...MESSAGE_PERMISSIONS]}
                    value={settings.messagePermission}
                    onChange={(messagePermission) =>
                      setSettings({
                        ...settings,
                        messagePermission:
                          parseMessagePermission(messagePermission),
                      })
                    }
                  />
                </Section>
                <Section title="Member permissions">
                  <Toggle
                    label="Members can create posts"
                    value={settings.membersCanCreatePosts}
                    onChange={(membersCanCreatePosts) =>
                      setSettings({ ...settings, membersCanCreatePosts })
                    }
                  />
                  <Toggle
                    label="Members can invite"
                    value={settings.membersCanInvite}
                    onChange={(membersCanInvite) =>
                      setSettings({ ...settings, membersCanInvite })
                    }
                  />
                  <Toggle
                    label="Show member list"
                    value={settings.showMemberList}
                    onChange={(showMemberList) =>
                      setSettings({ ...settings, showMemberList })
                    }
                  />
                  <Pressable
                    disabled={Boolean(busyKey)}
                    onPress={() => {
                      void saveSettings();
                    }}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>Save settings</Text>
                  </Pressable>
                </Section>
                <Section title="Community rules">
                  <TextInput
                    multiline
                    onChangeText={setRulesIntro}
                    placeholder="Rules introduction"
                    placeholderTextColor="#718078"
                    style={[styles.input, styles.multiline]}
                    value={rulesIntro}
                  />
                  {ruleDrafts.map((rule, index) => (
                    <View key={rule.key} style={styles.ruleEditor}>
                      <TextInput
                        onChangeText={(title) =>
                          setRuleDrafts((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, title } : item,
                            ),
                          )
                        }
                        placeholder="Rule title"
                        placeholderTextColor="#718078"
                        style={styles.input}
                        value={rule.title}
                      />
                      <TextInput
                        multiline
                        onChangeText={(description) =>
                          setRuleDrafts((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, description }
                                : item,
                            ),
                          )
                        }
                        placeholder="Rule description"
                        placeholderTextColor="#718078"
                        style={[styles.input, styles.multiline]}
                        value={rule.description}
                      />
                      <Pressable
                        onPress={() =>
                          setRuleDrafts((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      >
                        <Text style={styles.removeText}>Remove rule</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    onPress={() =>
                      setRuleDrafts((current) => [
                        ...current,
                        {
                          key: `new-${Date.now()}`,
                          title: "",
                          description: "",
                        },
                      ])
                    }
                    style={styles.secondary}
                  >
                    <Text style={styles.secondaryText}>Add rule</Text>
                  </Pressable>
                  <TextInput
                    multiline
                    onChangeText={setConsequences}
                    placeholder="Consequences, one per line"
                    placeholderTextColor="#718078"
                    style={[styles.input, styles.multiline]}
                    value={consequences}
                  />
                  <Pressable
                    disabled={Boolean(busyKey)}
                    onPress={() => {
                      void saveRules();
                    }}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>Save rules</Text>
                  </Pressable>
                </Section>
              </>
            ) : null}

            {tab === "Content" ? (
              <>
                <Section
                  title={editingContentId ? "Edit content" : "Publish content"}
                >
                  <ChoiceRow
                    values={["post", "announcement"]}
                    value={contentKind}
                    onChange={(value) => {
                      setContentKind(value as ContentKind);
                      setEditingContentId(null);
                      setContentText("");
                      setContentImageUrl("");
                    }}
                  />
                  <TextInput
                    multiline
                    onChangeText={setContentText}
                    placeholder="Write an update for your community"
                    placeholderTextColor="#718078"
                    style={[styles.input, styles.multiline]}
                    value={contentText}
                  />
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setContentImageUrl}
                    placeholder="HTTPS image URL (optional)"
                    placeholderTextColor="#718078"
                    style={styles.input}
                    value={contentImageUrl}
                  />
                  <Pressable
                    disabled={Boolean(busyKey)}
                    onPress={() => {
                      void saveContent();
                    }}
                    style={styles.primary}
                  >
                    <Text style={styles.primaryText}>
                      {editingContentId ? "Save changes" : "Publish"}
                    </Text>
                  </Pressable>
                  {editingContentId ? (
                    <Pressable
                      onPress={() => {
                        setEditingContentId(null);
                        setContentText("");
                        setContentImageUrl("");
                      }}
                      style={styles.secondary}
                    >
                      <Text style={styles.secondaryText}>Cancel edit</Text>
                    </Pressable>
                  ) : null}
                </Section>
                <Section title="Posts">
                  {posts.map((item) => (
                    <ContentRow
                      key={item._id}
                      item={item}
                      onDelete={() => removeContent(item, "post")}
                      onEdit={() => editContent(item, "post")}
                    />
                  ))}
                  {!posts.length ? (
                    <Text style={styles.muted}>No posts yet.</Text>
                  ) : null}
                </Section>
                <Section title="Announcements">
                  {announcements.map((item) => (
                    <ContentRow
                      key={item._id}
                      item={item}
                      onDelete={() => removeContent(item, "announcement")}
                      onEdit={() => editContent(item, "announcement")}
                      onPin={() => {
                        void run(
                          `pin-${item._id}`,
                          () =>
                            communitiesApi.updateAnnouncement(
                              communityId,
                              item._id,
                              { pinned: !Boolean(item.pinnedAt) },
                            ),
                          item.pinnedAt
                            ? "Announcement unpinned."
                            : "Announcement pinned.",
                        );
                      }}
                    />
                  ))}
                  {!announcements.length ? (
                    <Text style={styles.muted}>No announcements yet.</Text>
                  ) : null}
                </Section>
              </>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
      <AppAlertModal
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
        title={notice?.title ?? ""}
        visible={Boolean(notice)}
      />
      <AppAlertModal
        cancelText="Cancel"
        confirmText="Continue"
        message={confirm?.message ?? ""}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm?.action;
          setConfirm(null);
          if (action) void action();
        }}
        title={confirm?.title ?? ""}
        visible={Boolean(confirm)}
      />
    </>
  );
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Action({
  danger = false,
  icon,
  onPress,
}: {
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconAction, danger && styles.iconDanger]}
    >
      <Ionicons color={danger ? "#a33f3f" : "#078d45"} name={icon} size={18} />
    </Pressable>
  );
}

function ChoiceRow({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {values.map((item) => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={[styles.choice, value === item && styles.choiceActive]}
        >
          <Text style={styles.choiceText}>{item.replace(/_/g, " ")}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.name}>{label}</Text>
      <Switch
        onValueChange={onChange}
        trackColor={{ false: "#d7e1dc", true: "#7ee9a9" }}
        thumbColor={value ? "#08b657" : "#f7fbf9"}
        value={value}
      />
    </View>
  );
}

function ContentRow({
  item,
  onDelete,
  onEdit,
  onPin,
}: {
  item: Post | Announcement;
  onDelete: () => void;
  onEdit: () => void;
  onPin?: () => void;
}) {
  return (
    <View style={styles.contentRow}>
      <View style={styles.copy}>
        <Text numberOfLines={3} style={styles.contentText}>
          {item.text}
        </Text>
        <Text style={styles.meta}>
          {new Date(item.createdAt).toLocaleString("en-NG")}
        </Text>
      </View>
      {onPin ? <Action icon="pin-outline" onPress={onPin} /> : null}
      <Action icon="create-outline" onPress={onEdit} />
      <Action danger icon="trash-outline" onPress={onDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 20, paddingBottom: 80 },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  tabs: {
    backgroundColor: colors.white,
    borderRadius: 22,
    flexDirection: "row",
    marginBottom: 15,
    padding: 5,
  },
  tab: { alignItems: "center", borderRadius: 18, flex: 1, paddingVertical: 11 },
  tabActive: { backgroundColor: colors.lime },
  tabText: { color: "#65766d", fontFamily: fonts.bold, fontSize: 11 },
  tabTextActive: { color: colors.ink },
  section: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginBottom: 14,
    padding: 16,
  },
  heading: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    marginBottom: 11,
  },
  muted: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 11,
  },
  memberCard: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 12,
  },
  copy: { flex: 1, marginRight: 8 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  meta: {
    color: "#718078",
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  iconAction: {
    alignItems: "center",
    backgroundColor: "#e9f8f0",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    marginLeft: 6,
    width: 34,
  },
  iconDanger: { backgroundColor: "#faeeee" },
  input: {
    backgroundColor: "#f1f7f4",
    borderRadius: 16,
    color: colors.ink,
    fontFamily: fonts.medium,
    marginTop: 9,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  multiline: { minHeight: 84, textAlignVertical: "top" },
  primary: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 20,
    marginTop: 12,
    padding: 13,
  },
  primaryText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  secondary: {
    alignItems: "center",
    borderColor: "#08b657",
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 10,
    padding: 11,
  },
  secondarySmall: {
    borderColor: "#08b657",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  secondaryText: { color: "#078d45", fontFamily: fonts.bold, fontSize: 10 },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#faeeee",
    borderRadius: 20,
    marginTop: 12,
    padding: 13,
  },
  dangerText: { color: "#a33f3f", fontFamily: fonts.bold, fontSize: 11 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: {
    backgroundColor: "#eef4f1",
    borderColor: "transparent",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceActive: { backgroundColor: "#e1f8eb", borderColor: "#08b657" },
  choiceText: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 9,
    textTransform: "capitalize",
  },
  toggle: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  ruleEditor: {
    borderBottomColor: "#e4ece8",
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  removeText: {
    color: "#a33f3f",
    fontFamily: fonts.bold,
    fontSize: 10,
    marginTop: 8,
  },
  contentRow: {
    alignItems: "center",
    borderBottomColor: "#e7eeea",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: 11,
  },
  contentText: {
    color: colors.ink,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
});
