import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppState, Text, View } from "react-native";
import {
  RoommateShell,
  RoommateButton,
  RoommateDetails,
  RoommatePerson,
  roommateStyles as styles,
} from "../../components/ui/roommate-ui";
import AppAlertModal from "../../components/ui/app-alert-modal";
import AppReportSheet from "../../components/ui/app-report-sheet";
import {
  communityReportReasons,
  toCommunityReportReason,
} from "../../data/report-options";
import { roommatesApi } from "../../services/api/roommates.api";
import { friendsApi } from "../../services/api/friends.api";
import { usersApi } from "../../services/api/users.api";
import { ApiError } from "../../services/api/client";
import { useAuth } from "../../hooks/use-auth";
import { useRoommateTask } from "../../hooks/use-roommate-task";
import { chatSocket } from "../../services/socket/chat-socket";
import type { RootStackParamList } from "../../types/navigation";
import type { RoommateConnection } from "../../types/roommates";

export default function RoommateConnectionScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "RoommateConnection">) {
  const id = route.params.connectionId;
  const { user } = useAuth();
  const [connection, setConnection] = useState<RoommateConnection | null>(null);
  const [contacts, setContacts] = useState<{
    phone?: string;
    email?: string;
  } | null>(null);
  const [fields, setFields] = useState<Array<"phone" | "email">>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [reporting, setReporting] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => Promise<unknown>;
  } | null>(null);
  const { busy, run } = useRoommateTask();
  const contactEpoch = useRef(0);
  const focusedSignal = useRef<AbortSignal | undefined>(undefined);
  const load = useCallback(
    async (signal?: AbortSignal, showLoading = true) => {
      // Contacts remain transient and are discarded on refresh, blur, and background.
      setContacts(null);
      contactEpoch.current += 1;
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const response = await roommatesApi.connection(id, signal);
        if (signal?.aborted) return;
        setConnection(response.data.connection);
        if (showLoading) setFields(response.data.connection.myContactFields);
      } catch (err) {
        if (!signal?.aborted) {
          setConnection(null);
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load this connect. Check your connection.",
          );
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id],
  );
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      focusedSignal.current = controller.signal;
      void load(controller.signal);
      const interval = setInterval(
        () => void load(controller.signal, false),
        15000,
      );
      const appState = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          setContacts(null);
          contactEpoch.current += 1;
        } else void load(controller.signal, false);
      });
      const socket = chatSocket.current();
      const refresh = () => {
        setContacts(null);
        void load(controller.signal, false);
      };
      socket?.on("roommates:changed", refresh);
      socket?.on("social:access-changed", refresh);
      return () => {
        controller.abort();
        focusedSignal.current = undefined;
        clearInterval(interval);
        appState.remove();
        socket?.off("roommates:changed", refresh);
        socket?.off("social:access-changed", refresh);
        contactEpoch.current += 1;
        setContacts(null);
        setConnection(null);
      };
    }, [load, retry]),
  );
  const act = (operation: () => Promise<unknown>) =>
    void run(async () => {
      setContacts(null);
      await operation();
      if (focusedSignal.current && !focusedSignal.current.aborted)
        await load(focusedSignal.current);
    });
  const ask = (
    title: string,
    message: string,
    action: () => Promise<unknown>,
  ) => setConfirm({ title, message, action });
  const pending =
    connection?.pairingRequest?.status === "pending"
      ? connection.pairingRequest
      : null;
  const isRecipient = pending?.recipientId === user?._id;
  const ended = connection?.status === "closed";

  return (
    <RoommateShell
      title="Your connect"
      loading={loading}
      error={error}
      retry={() => setRetry((value) => value + 1)}
    >
      {connection ? (
        <>
          <View style={styles.card}>
            <RoommatePerson
              {...connection.user}
              subtitle={
                connection.status === "paired"
                  ? "Your roommate / profiles private"
                  : ended
                    ? "This connect has ended"
                    : "You both liked each other"
              }
            />
            {connection.conversationId && !ended ? (
              <RoommateButton
                icon="chatbubble-outline"
                label="Start a conversation"
                disabled={busy}
                onPress={() =>
                  navigation.navigate("ChatThread", {
                    conversationId: connection.conversationId!,
                    name: `${connection.user.firstName} ${connection.user.lastName}`,
                    image: connection.user.avatarUrl || "",
                    online: false,
                  })
                }
              />
            ) : null}
            {!ended && connection.friendship?.status !== "accepted" ? (
              <>
                {connection.friendship?.status === "pending" ? (
                  connection.friendship.addresseeId === user?._id ? (
                    <RoommateButton
                      label="Accept friend request"
                      disabled={busy}
                      secondary
                      onPress={() =>
                        act(() =>
                          friendsApi.respondToRequest(
                            connection.friendship!._id,
                            { action: "accept" },
                          ),
                        )
                      }
                    />
                  ) : (
                    <Text style={styles.body}>Friend request sent</Text>
                  )
                ) : (
                  <RoommateButton
                    label="Add friend"
                    disabled={busy}
                    secondary
                    onPress={() =>
                      act(() => friendsApi.sendRequest(connection.user._id))
                    }
                  />
                )}
              </>
            ) : connection.friendship?.status === "accepted" ? (
              <Text style={styles.body}>You're friends</Text>
            ) : null}
          </View>
          {connection.profile ? (
            <RoommateDetails profile={connection.profile} />
          ) : null}
          {!ended ? (
            <View style={styles.card}>
              <Text style={styles.heading}>Share contacts</Text>
              <Text style={styles.body}>
                Choose what you want to share with this person. Contacts unlock
                after you both consent. You can revoke sharing, but details
                already seen cannot be recalled.
              </Text>
              <View style={styles.row}>
                {(["phone", "email"] as const).map((field) => (
                  <RoommateButton
                    key={field}
                    label={`${fields.includes(field) ? "Selected: " : ""}${field}`}
                    secondary={!fields.includes(field)}
                    disabled={busy}
                    onPress={() =>
                      setFields((current) =>
                        current.includes(field)
                          ? current.filter((value) => value !== field)
                          : [...current, field],
                      )
                    }
                  />
                ))}
              </View>
              <RoommateButton
                label="Consent to sharing selected contacts"
                disabled={busy || !fields.length}
                onPress={() => act(() => roommatesApi.consent(id, fields))}
              />
              {connection.myContactFields.length ? (
                <RoommateButton
                  label="Revoke my sharing consent"
                  secondary
                  disabled={busy}
                  onPress={() => act(() => roommatesApi.revoke(id))}
                />
              ) : null}
              <Text style={styles.body}>
                {connection.otherHasConsented
                  ? "Your connect has given contact consent."
                  : "Your connect has not given contact consent."}
              </Text>
              <RoommateButton
                label="View shared contacts"
                secondary
                disabled={
                  busy ||
                  !connection.myContactFields.length ||
                  !connection.otherHasConsented
                }
                onPress={() =>
                  void run(async () => {
                    setContacts(null);
                    const epoch = ++contactEpoch.current;
                    const signal = focusedSignal.current;
                    const response = await roommatesApi.contacts(id, signal);
                    if (!signal?.aborted && epoch === contactEpoch.current)
                      setContacts(response.data.contacts);
                  })
                }
              />
              {contacts ? (
                <View>
                  <Text selectable style={styles.body}>
                    {contacts.phone || ""}
                  </Text>
                  <Text selectable style={styles.body}>
                    {contacts.email || ""}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {!ended ? (
            <View style={styles.card}>
              <Text style={styles.heading}>Become roommates</Text>
              <Text style={styles.body}>
                Choose this person when you're both ready. Acceptance records
                your agreement and makes both roommate profiles private.
              </Text>
              {connection.status === "paired" ? (
                <RoommateButton
                  label="End roommate pairing"
                  secondary
                  disabled={busy}
                  onPress={() =>
                    ask(
                      "End pairing?",
                      "Both profiles will stay paused until each person resumes searching.",
                      async () => {
                        await roommatesApi.endPairing(id);
                        navigation.replace("RoommateDiscover");
                      },
                    )
                  }
                />
              ) : pending ? (
                <>
                  <Text style={styles.body}>
                    {isRecipient
                      ? "This person has asked to become your roommate."
                      : "Waiting for your connect to accept your request."}
                  </Text>
                  {isRecipient ? (
                    <>
                      <RoommateButton
                        label="Accept as my roommate"
                        disabled={busy}
                        onPress={() =>
                          ask(
                            "Choose this roommate?",
                            "Both profiles will become private and other pending roommate requests will close.",
                            () =>
                              roommatesApi.respond(id, pending._id, "accept"),
                          )
                        }
                      />
                      <RoommateButton
                        label="Decline request"
                        secondary
                        disabled={busy}
                        onPress={() =>
                          act(() =>
                            roommatesApi.respond(id, pending._id, "decline"),
                          )
                        }
                      />
                    </>
                  ) : (
                    <RoommateButton
                      label="Cancel my request"
                      secondary
                      disabled={busy}
                      onPress={() =>
                        act(() =>
                          roommatesApi.respond(id, pending._id, "cancel"),
                        )
                      }
                    />
                  )}
                </>
              ) : (
                <RoommateButton
                  label="Request to become roommates"
                  disabled={busy}
                  onPress={() => act(() => roommatesApi.requestPairing(id))}
                />
              )}
            </View>
          ) : null}
          {connection.status === "active" ? (
            <RoommateButton
              label="Ignore this connect"
              secondary
              disabled={busy}
              onPress={() =>
                ask(
                  "Ignore this connect?",
                  "This ends the roommate connection and revokes contact sharing.",
                  async () => {
                    await roommatesApi.end(id);
                    navigation.goBack();
                  },
                )
              }
            />
          ) : null}
          <RoommateButton
            label="Block this person"
            secondary
            disabled={busy}
            onPress={() =>
              ask(
                "Block this person?",
                "They will be excluded from matching and direct chat. Any roommate pairing between you will end.",
                async () => {
                  await roommatesApi.block(connection.user._id);
                  navigation.goBack();
                },
              )
            }
          />
          <RoommateButton
            label="Report this person"
            secondary
            disabled={busy}
            onPress={() => setReporting(true)}
          />
          <AppReportSheet
            visible={reporting}
            title="Report person"
            reasons={communityReportReasons}
            description="Tell us what happened so the moderation team can review it."
            onClose={() => setReporting(false)}
            onSubmit={(reason, details) =>
              run(() =>
                usersApi.report(connection.user._id, {
                  reason: toCommunityReportReason(reason),
                  ...(details ? { details } : {}),
                }),
              ).then(() => undefined)
            }
          />
        </>
      ) : null}
      <AppAlertModal
        visible={Boolean(confirm)}
        title={confirm?.title || "Confirm"}
        message={confirm?.message || ""}
        confirmText="Confirm"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const operation = confirm?.action;
          setConfirm(null);
          if (operation) act(operation);
        }}
      />
    </RoommateShell>
  );
}
