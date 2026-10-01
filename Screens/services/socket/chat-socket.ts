import { io, type Socket } from "socket.io-client";

import type { PostChatConversationsIdMessagesResponse } from "../../types/api.generated";
import { socketBaseUrl } from "../api/config";
import { socketLog, socketErrorReason } from "./logger";

export type RealtimeMessage =
  PostChatConversationsIdMessagesResponse["data"]["message"];
export type CommunityRealtimePayload = Record<string, unknown>;
export type CommunityTypingPayload = {
  communityId: string;
  userId: string;
  firstName: string;
  typing: boolean;
};
export type CommunityCallPayload = CommunityRealtimePayload & {
  _id?: string;
  communityId?: string;
  type?: string;
  status?: string;
  participantCount?: number;
  startedBy?: string;
  startedAt?: string;
  endedAt?: string | null;
};

export type CommunitySocketAck = {
  success: boolean;
  communityId?: string;
  code?: string;
  message?: string;
};

type ServerToClientEvents = {
  "roommates:changed": (payload: Record<string, never>) => void;
  "social:access-changed": (payload: Record<string, never>) => void;
  "socket:ready": (payload: { userId: string }) => void;
  "message:new": (payload: RealtimeMessage) => void;
  "conversation:read": (payload: {
    conversationId: string;
    userId: string;
    readAt: string;
  }) => void;
  typing: (payload: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  "typing:start": (payload: { conversationId: string; userId: string }) => void;
  "typing:stop": (payload: { conversationId: string; userId: string }) => void;
  "community:message:new": (payload: CommunityRealtimePayload) => void;
  "community:message:updated": (payload: CommunityRealtimePayload) => void;
  "community:message:deleted": (payload: {
    communityId: string;
    messageId: string;
  }) => void;
  "community:post:new": (payload: CommunityRealtimePayload) => void;
  "community:announcement:new": (payload: CommunityRealtimePayload) => void;
  "community:member:updated": (payload: CommunityRealtimePayload) => void;
  "community:typing": (payload: CommunityTypingPayload) => void;
  "community:call:started": (payload: CommunityCallPayload) => void;
  "community:call:updated": (payload: CommunityCallPayload) => void;
  "community:call:ended": (payload: CommunityCallPayload) => void;
};

type ClientToServerEvents = {
  "join-chat": (conversationId: string) => void;
  "conversation:join": (
    conversationId: string,
    acknowledgement: (success: boolean) => void,
  ) => void;
  "leave-chat": (conversationId: string) => void;
  "conversation:leave": (conversationId: string) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  "typing:start": (conversationId: string) => void;
  "typing:stop": (conversationId: string) => void;
  "community:join": (
    payload: { communityId: string },
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) => void;
  "community:leave": (
    payload: { communityId: string },
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) => void;
  "community:typing": (payload: {
    communityId: string;
    typing: boolean;
  }) => void;
};

type CommunityServerEvent =
  | "community:message:new"
  | "community:message:updated"
  | "community:message:deleted"
  | "community:post:new"
  | "community:announcement:new"
  | "community:member:updated"
  | "community:typing"
  | "community:call:started"
  | "community:call:updated"
  | "community:call:ended";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let connectedAccessToken: string | null = null;

function ensureSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    // Keep a stable instance for listeners even when authentication finishes later.
    // Creating the client does not connect it before a token is supplied.
    socket = io(socketBaseUrl + "/chat", {
      // Start with HTTP so live delivery remains available when WebSocket is blocked.
      transports: ["polling", "websocket"],
      tryAllTransports: true,
      autoConnect: false,
      reconnection: true,
      timeout: 10_000,
    });
    const client = socket;
    let endpoint = "invalid_socket_url";
    try {
      endpoint = new URL(socketBaseUrl).origin + "/chat";
    } catch {}
    socketLog("client:created", { endpoint });
    client.io.on("open", () => {
      const engine = client.io.engine;
      engine.on("upgrade", (transport) =>
        socketLog("transport:upgraded", {
          transport: transport.name,
        }),
      );
      engine.on("upgradeError", () =>
        socketLog(
          "transport:upgrade:failed",
          {
            transport: engine.transport.name,
            reason: "continuing_on_current_transport",
          },
          true,
        ),
      );
    });
    client.on("connect", () =>
      socketLog("connect", {
        socketId: client.id,
        transport: client.io.engine?.transport.name,
      }),
    );
    client.on("socket:ready", () =>
      socketLog("socket:ready", { socketId: client.id }),
    );
    client.on("connect_error", (error) =>
      socketLog(
        "connect_error",
        {
          reason: socketErrorReason(error),
          connected: client.connected,
        },
        true,
      ),
    );
    client.on("disconnect", (reason) =>
      socketLog("disconnect", { reason }, true),
    );
    client.io.on("reconnect_attempt", (attempt) =>
      socketLog("reconnect_attempt", { attempt }),
    );
    client.io.on("reconnect", (attempt) => socketLog("reconnect", { attempt }));
    client.io.on("reconnect_error", (error) => {
      console.log(error?.name, error?.message, error?.stack);
      socketLog(
        "reconnect_error",
        {
          reason: socketErrorReason(error),
        },
        true,
      );
    });
    client.io.on("reconnect_failed", () =>
      socketLog("reconnect_failed", {}, true),
    );
    client.on("message:new", (message) =>
      socketLog("message:new", {
        conversationId: message.conversationId,
        messageId: message._id,
      }),
    );
  }
  return socket;
}

function unavailableAck(message: string): CommunitySocketAck {
  return { success: false, code: "COMMUNITY_SOCKET_UNAVAILABLE", message };
}

function listenCommunity<Event extends CommunityServerEvent>(
  event: Event,
  listener: ServerToClientEvents[Event],
) {
  socket?.on(event, listener as never);
  return () => {
    socket?.off(event, listener as never);
  };
}

function emitCommunityWithAck(
  event: "community:join" | "community:leave",
  communityId: string,
  acknowledgement?: (response: CommunitySocketAck) => void,
) {
  if (!socket) {
    acknowledgement?.(unavailableAck("Realtime connection is unavailable."));
    return;
  }
  socket.emit(event, { communityId }, acknowledgement);
}

export const chatSocket = {
  connect(accessToken: string) {
    const client = ensureSocket();
    socketLog("connect:requested", { connected: client.connected });
    if (connectedAccessToken === accessToken) {
      if (!client.connected && !client.active) client.connect();
      return client;
    }
    connectedAccessToken = accessToken;
    client.auth = { token: accessToken };
    client.disconnect().connect();
    return client;
  },

  current() {
    return ensureSocket();
  },

  isConnected() {
    return socket?.connected ?? false;
  },

  disconnect() {
    socketLog("disconnect:requested", { connected: socket?.connected });
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    connectedAccessToken = null;
  },

  async join(conversationId: string): Promise<void> {
    const client = ensureSocket();
    socketLog("conversation:join:requested", {
      conversationId,
      connected: client.connected,
    });
    if (!client.connected) {
      socketLog(
        "conversation:join:failed",
        { conversationId, reason: "disconnected" },
        true,
      );
      throw new Error("Live updates are disconnected.");
    }
    await new Promise<void>((resolve, reject) => {
      client
        .timeout(10_000)
        .emit(
          "conversation:join",
          conversationId,
          (error: Error | null, joined: boolean) => {
            socketLog(
              "conversation:join:ack",
              {
                conversationId,
                accepted: !error && joined === true,
                reason: error ? "ack_timeout" : joined ? "joined" : "denied",
              },
              Boolean(error) || !joined,
            );
            if (error)
              reject(
                new Error(
                  "Live updates could not be confirmed. Try reconnecting.",
                ),
              );
            else if (!joined)
              reject(
                new Error(
                  "This conversation could not be joined for live updates.",
                ),
              );
            else resolve();
          },
        );
    });
  },

  leave(conversationId: string) {
    socketLog("conversation:leave", {
      conversationId,
      connected: socket?.connected,
    });
    socket?.emit("conversation:leave", conversationId);
  },

  startTyping(conversationId: string) {
    socket?.emit("typing:start", conversationId);
  },

  stopTyping(conversationId: string) {
    socket?.emit("typing:stop", conversationId);
  },

  joinCommunity(
    communityId: string,
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) {
    emitCommunityWithAck("community:join", communityId, acknowledgement);
  },

  leaveCommunity(
    communityId: string,
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) {
    emitCommunityWithAck("community:leave", communityId, acknowledgement);
  },

  setCommunityTyping(communityId: string, typing: boolean) {
    socket?.emit("community:typing", { communityId, typing });
  },

  onReady(listener: (payload: { userId: string }) => void) {
    socket?.on("socket:ready", listener);
    return () => {
      socket?.off("socket:ready", listener);
    };
  },

  onConnect(listener: () => void) {
    socket?.on("connect", listener);
    return () => {
      socket?.off("connect", listener);
    };
  },

  onConnectError(listener: (error: Error) => void) {
    socket?.on("connect_error", listener);
    return () => {
      socket?.off("connect_error", listener);
    };
  },

  onCommunityMessage(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity("community:message:new", listener);
  },

  onCommunityMessageUpdated(
    listener: (payload: CommunityRealtimePayload) => void,
  ) {
    return listenCommunity("community:message:updated", listener);
  },

  onCommunityMessageDeleted(
    listener: (payload: { communityId: string; messageId: string }) => void,
  ) {
    return listenCommunity("community:message:deleted", listener);
  },

  onCommunityPost(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity("community:post:new", listener);
  },

  onCommunityAnnouncement(
    listener: (payload: CommunityRealtimePayload) => void,
  ) {
    return listenCommunity("community:announcement:new", listener);
  },

  onCommunityMemberUpdated(
    listener: (payload: CommunityRealtimePayload) => void,
  ) {
    return listenCommunity("community:member:updated", listener);
  },

  onCommunityTyping(listener: (payload: CommunityTypingPayload) => void) {
    return listenCommunity("community:typing", listener);
  },

  onCommunityCallStarted(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity("community:call:started", listener);
  },

  onCommunityCallUpdated(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity("community:call:updated", listener);
  },

  onCommunityCallEnded(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity("community:call:ended", listener);
  },
};
