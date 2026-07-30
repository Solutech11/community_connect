import { io, type Socket } from 'socket.io-client';

import type { PostChatConversationsIdMessagesResponse } from '../../types/api.generated';
import { socketBaseUrl } from '../api/config';

export type RealtimeMessage = PostChatConversationsIdMessagesResponse['data']['message'];
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
  'socket:ready': (payload: { userId: string }) => void;
  'message:new': (payload: RealtimeMessage) => void;
  'conversation:read': (payload: { conversationId: string; userId: string; readAt: string }) => void;
  typing: (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'typing:start': (payload: { conversationId: string; userId: string }) => void;
  'typing:stop': (payload: { conversationId: string; userId: string }) => void;
  'community:message:new': (payload: CommunityRealtimePayload) => void;
  'community:message:updated': (payload: CommunityRealtimePayload) => void;
  'community:message:deleted': (payload: { communityId: string; messageId: string }) => void;
  'community:post:new': (payload: CommunityRealtimePayload) => void;
  'community:announcement:new': (payload: CommunityRealtimePayload) => void;
  'community:member:updated': (payload: CommunityRealtimePayload) => void;
  'community:typing': (payload: CommunityTypingPayload) => void;
  'community:call:started': (payload: CommunityCallPayload) => void;
  'community:call:updated': (payload: CommunityCallPayload) => void;
  'community:call:ended': (payload: CommunityCallPayload) => void;
};

type ClientToServerEvents = {
  'join-chat': (conversationId: string) => void;
  'conversation:join': (conversationId: string) => void;
  'leave-chat': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
  'community:join': (
    payload: { communityId: string },
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) => void;
  'community:leave': (
    payload: { communityId: string },
    acknowledgement?: (response: CommunitySocketAck) => void,
  ) => void;
  'community:typing': (payload: { communityId: string; typing: boolean }) => void;
};

type CommunityServerEvent =
  | 'community:message:new'
  | 'community:message:updated'
  | 'community:message:deleted'
  | 'community:post:new'
  | 'community:announcement:new'
  | 'community:member:updated'
  | 'community:typing'
  | 'community:call:started'
  | 'community:call:updated'
  | 'community:call:ended';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let connectedAccessToken: string | null = null;

function unavailableAck(message: string): CommunitySocketAck {
  return { success: false, code: 'COMMUNITY_SOCKET_UNAVAILABLE', message };
}

function listenCommunity<Event extends CommunityServerEvent>(
  event: Event,
  listener: ServerToClientEvents[Event],
) {
  socket?.on(event, listener as never);
  return () => { socket?.off(event, listener as never); };
}

function emitCommunityWithAck(
  event: 'community:join' | 'community:leave',
  communityId: string,
  acknowledgement?: (response: CommunitySocketAck) => void,
) {
  if (!socket) {
    acknowledgement?.(unavailableAck('Realtime connection is unavailable.'));
    return;
  }
  socket.emit(event, { communityId }, acknowledgement);
}

export const chatSocket = {
  connect(accessToken: string) {
    if (socket) {
      if (connectedAccessToken === accessToken && socket.connected) return socket;
      connectedAccessToken = accessToken;
      socket.auth = { token: accessToken };
      socket.disconnect().connect();
      return socket;
    }

    connectedAccessToken = accessToken;
    socket = io(`${socketBaseUrl}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });
    return socket;
  },

  current() {
    return socket;
  },

  isConnected() {
    return socket?.connected ?? false;
  },

  disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    connectedAccessToken = null;
  },

  join(conversationId: string) {
    socket?.emit('conversation:join', conversationId);
  },

  leave(conversationId: string) {
    socket?.emit('conversation:leave', conversationId);
  },

  startTyping(conversationId: string) {
    socket?.emit('typing:start', conversationId);
  },

  stopTyping(conversationId: string) {
    socket?.emit('typing:stop', conversationId);
  },

  joinCommunity(communityId: string, acknowledgement?: (response: CommunitySocketAck) => void) {
    emitCommunityWithAck('community:join', communityId, acknowledgement);
  },

  leaveCommunity(communityId: string, acknowledgement?: (response: CommunitySocketAck) => void) {
    emitCommunityWithAck('community:leave', communityId, acknowledgement);
  },

  setCommunityTyping(communityId: string, typing: boolean) {
    socket?.emit('community:typing', { communityId, typing });
  },

  onReady(listener: (payload: { userId: string }) => void) {
    socket?.on('socket:ready', listener);
    return () => { socket?.off('socket:ready', listener); };
  },

  onConnect(listener: () => void) {
    socket?.on('connect', listener);
    return () => { socket?.off('connect', listener); };
  },

  onConnectError(listener: (error: Error) => void) {
    socket?.on('connect_error', listener);
    return () => { socket?.off('connect_error', listener); };
  },

  onCommunityMessage(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity('community:message:new', listener);
  },

  onCommunityMessageUpdated(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity('community:message:updated', listener);
  },

  onCommunityMessageDeleted(listener: (payload: { communityId: string; messageId: string }) => void) {
    return listenCommunity('community:message:deleted', listener);
  },

  onCommunityPost(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity('community:post:new', listener);
  },

  onCommunityAnnouncement(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity('community:announcement:new', listener);
  },

  onCommunityMemberUpdated(listener: (payload: CommunityRealtimePayload) => void) {
    return listenCommunity('community:member:updated', listener);
  },

  onCommunityTyping(listener: (payload: CommunityTypingPayload) => void) {
    return listenCommunity('community:typing', listener);
  },

  onCommunityCallStarted(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity('community:call:started', listener);
  },

  onCommunityCallUpdated(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity('community:call:updated', listener);
  },

  onCommunityCallEnded(listener: (payload: CommunityCallPayload) => void) {
    return listenCommunity('community:call:ended', listener);
  },
};
