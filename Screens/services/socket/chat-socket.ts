import { io, type Socket } from 'socket.io-client';

import type { PostChatConversationsIdMessagesResponse } from '../../types/api.generated';
import { socketBaseUrl } from '../api/config';

export type RealtimeMessage = PostChatConversationsIdMessagesResponse['data']['message'];

type ServerToClientEvents = {
  'socket:ready': (payload: { userId: string }) => void;
  'message:new': (payload: RealtimeMessage) => void;
  'conversation:read': (payload: { conversationId: string; userId: string; readAt: string }) => void;
  typing: (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'typing:start': (payload: { conversationId: string; userId: string }) => void;
  'typing:stop': (payload: { conversationId: string; userId: string }) => void;
};

type ClientToServerEvents = {
  'join-chat': (conversationId: string) => void;
  'conversation:join': (conversationId: string) => void;
  'leave-chat': (conversationId: string) => void;
  'conversation:leave': (conversationId: string) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  'typing:start': (conversationId: string) => void;
  'typing:stop': (conversationId: string) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const chatSocket = {
  connect(accessToken: string) {
    if (socket) {
      socket.auth = { token: accessToken };
      socket.disconnect().connect();
      return socket;
    }
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

  disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
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
};

