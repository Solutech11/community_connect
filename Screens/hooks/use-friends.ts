import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";

import { chatApi } from "../services/api/chat.api";
import { ApiError } from "../services/api/client";
import { friendsApi } from "../services/api/friends.api";
import {
  mapFriendConnection,
  mapFriendPerson,
} from "../services/api/friends.mapper";
import { usersApi } from "../services/api/users.api";
import type { PostUsersIdReportsBody } from "../types/api.generated";
import type { FriendConnection, FriendPerson } from "../types/friends";

export type FriendsTab = "Friends" | "Requests" | "Discover";
type Snapshot = {
  ownerId: string;
  loaded: boolean;
  friends: FriendConnection[];
  requests: FriendConnection[];
  discover: FriendPerson[];
  errors: Record<FriendsTab, string | null>;
};

const emptySnapshot = (ownerId: string): Snapshot => ({
  ownerId,
  loaded: false,
  friends: [],
  requests: [],
  discover: [],
  errors: { Friends: null, Requests: null, Discover: null },
});

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load people. Please try again.";
}

export function useFriends(currentUserId: string) {
  const [snapshot, setSnapshot] = useState(() => emptySnapshot(currentUserId));
  const snapshotRef = useRef(snapshot);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const loadController = useRef<AbortController | null>(null);
  const actionController = useRef<AbortController | null>(null);
  const loadVersion = useRef(0);
  const actionLock = useRef(false);
  const focused = useRef(false);
  const mounted = useRef(true);
  const sentUserIds = useRef(new Set<string>());

  const update = useCallback((change: (previous: Snapshot) => Snapshot) => {
    const next = change(snapshotRef.current);
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const load = useCallback(async () => {
    if (!currentUserId || !focused.current) return;
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    const version = ++loadVersion.current;
    if (snapshotRef.current.ownerId !== currentUserId) {
      sentUserIds.current.clear();
      update(() => emptySnapshot(currentUserId));
    }
    const initial = !snapshotRef.current.loaded;
    setLoading(initial);
    setRefreshing(!initial);

    // One failed endpoint must not hide successful friends or requests.
    const [friendResult, requestResult, discoverResult] =
      await Promise.allSettled([
        friendsApi.list({}, controller.signal),
        friendsApi.requests({}, controller.signal),
        friendsApi.suggestions({}, controller.signal),
      ]);
    if (
      controller.signal.aborted ||
      !mounted.current ||
      !focused.current ||
      version !== loadVersion.current
    )
      return;

    update((previous) => {
      const next = {
        ...previous,
        loaded: true,
        errors: { ...previous.errors },
      };
      if (friendResult.status === "fulfilled") {
        const records = friendResult.value.data.friendships.filter(
          (item) => item.status === "accepted",
        );
        next.friends = records
          .map((item) => mapFriendConnection(item, currentUserId))
          .filter((item): item is FriendConnection => item !== null);
        next.errors.Friends =
          next.friends.length === records.length
            ? null
            : "Some friend profiles are unavailable. Refresh to try again.";
      } else next.errors.Friends = errorMessage(friendResult.reason);

      if (requestResult.status === "fulfilled") {
        const records = requestResult.value.data.requests.filter(
          (item) =>
            item.status === "pending" && item.addresseeId === currentUserId,
        );
        next.requests = records
          .map((item) => mapFriendConnection(item, currentUserId))
          .filter((item): item is FriendConnection => item !== null);
        next.errors.Requests =
          next.requests.length === records.length
            ? null
            : "Some request profiles are unavailable. Refresh to try again.";
      } else next.errors.Requests = errorMessage(requestResult.reason);

      if (discoverResult.status === "fulfilled") {
        const excluded = new Set([
          currentUserId,
          ...sentUserIds.current,
          ...next.friends.map((item) => item.person.userId),
          ...next.requests.map((item) => item.person.userId),
        ]);
        const unique = new Set<string>();
        next.discover = discoverResult.value.data.users
          .map(mapFriendPerson)
          .filter((item): item is FriendPerson => {
            if (!item || excluded.has(item.userId) || unique.has(item.userId))
              return false;
            unique.add(item.userId);
            return true;
          });
        next.errors.Discover = null;
      } else next.errors.Discover = errorMessage(discoverResult.reason);
      return next;
    });
    setLoading(false);
    setRefreshing(false);
  }, [currentUserId, update]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void load();
      return () => {
        focused.current = false;
        loadController.current?.abort();
        loadVersion.current += 1;
      };
    }, [load]),
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadController.current?.abort();
      actionController.current?.abort();
    };
  }, []);

  async function perform<T>(
    id: string,
    request: (signal: AbortSignal) => Promise<T>,
    commit?: (result: T) => void,
    success?: string | ((result: T) => string),
  ): Promise<T | undefined> {
    // The ref closes the gap between two taps and React's next render.
    if (actionLock.current || !currentUserId || !focused.current)
      return undefined;
    actionLock.current = true;
    setPendingId(id);
    loadController.current?.abort();
    loadVersion.current += 1;
    setLoading(false);
    setRefreshing(false);
    const controller = new AbortController();
    actionController.current = controller;
    try {
      const result = await request(controller.signal);
      if (
        !mounted.current ||
        !focused.current ||
        snapshotRef.current.ownerId !== currentUserId
      )
        return undefined;
      commit?.(result);
      if (success)
        setNotice({
          title: "Connection updated",
          message: typeof success === "function" ? success(result) : success,
        });
      if (commit) await load();
      return result;
    } catch (error) {
      if (mounted.current && focused.current && !controller.signal.aborted) {
        setNotice({
          title: "Action unavailable",
          message: errorMessage(error),
        });
      }
      return undefined;
    } finally {
      actionLock.current = false;
      actionController.current = null;
      if (mounted.current) setPendingId(null);
    }
  }

  const respond = (
    connection: FriendConnection,
    action: "accept" | "decline",
  ) =>
    perform(
      connection.relationshipId,
      (signal) =>
        friendsApi.respondToRequest(
          connection.relationshipId,
          { action },
          signal,
        ),
      (result) =>
        update((previous) => {
          const confirmed = mapFriendConnection(
            result.data.friendship,
            currentUserId,
          );
          return {
            ...previous,
            requests: previous.requests.filter(
              (item) => item.relationshipId !== connection.relationshipId,
            ),
            friends:
              confirmed?.status === "accepted"
                ? [
                    confirmed,
                    ...previous.friends.filter(
                      (item) =>
                        item.relationshipId !== confirmed.relationshipId,
                    ),
                  ]
                : previous.friends,
          };
        }),
      action === "accept"
        ? "Friend request accepted."
        : "Friend request declined.",
    );

  const sendRequest = (person: FriendPerson) =>
    perform(
      person.userId,
      (signal) => friendsApi.sendRequest(person.userId, signal),
      (result) => {
        sentUserIds.current.add(person.userId);
        update((previous) => {
          const confirmed = mapFriendConnection(
            result.data.friendship,
            currentUserId,
          );
          return {
            ...previous,
            discover: previous.discover.filter(
              (item) => item.userId !== person.userId,
            ),
            friends:
              confirmed?.status === "accepted"
                ? [
                    confirmed,
                    ...previous.friends.filter(
                      (item) =>
                        item.relationshipId !== confirmed.relationshipId,
                    ),
                  ]
                : previous.friends,
          };
        });
      },
      (result) =>
        result.data.friendship.status === "accepted"
          ? "You are already friends. You can message them from your circle."
          : result.data.friendship.requesterId === currentUserId
            ? "Your friend request has been sent."
            : "This person has already sent you a request. Check your Requests tab.",
    );

  const remove = (connection: FriendConnection) =>
    perform(
      connection.relationshipId,
      (signal) => friendsApi.remove(connection.relationshipId, signal),
      () => {
        sentUserIds.current.delete(connection.person.userId);
        update((previous) => ({
          ...previous,
          friends: previous.friends.filter(
            (item) => item.relationshipId !== connection.relationshipId,
          ),
        }));
      },
      "Friend removed.",
    );

  const startChat = (person: FriendPerson) =>
    perform(person.userId, async (signal) => {
      const result = await chatApi.createConversation(
        { type: "direct", participantIds: [person.userId] },
        signal,
      );
      const conversation = result.data.conversation;
      if (
        !conversation.participantIds.includes(person.userId) ||
        !conversation.participantIds.includes(currentUserId)
      ) {
        throw new ApiError({
          code: "INVALID_RESPONSE",
          message:
            "Unable to match this conversation to your friend. Please refresh and try again.",
        });
      }
      return conversation;
    });

  const report = (person: FriendPerson, body: PostUsersIdReportsBody) =>
    perform(
      person.userId,
      (signal) => usersApi.report(person.userId, body, signal),
      undefined,
      "Your report has been submitted.",
    );

  // Do not render a previous account's connections while the session changes.
  const visible =
    snapshot.ownerId === currentUserId
      ? snapshot
      : emptySnapshot(currentUserId);
  return {
    ...visible,
    loading,
    refreshing,
    pendingId,
    notice,
    clearNotice: () => setNotice(null),
    refresh: load,
    respond,
    sendRequest,
    remove,
    startChat,
    report,
  };
}
