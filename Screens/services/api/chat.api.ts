import type {
  GetChatConversationsIdMessagesQuery,
  GetChatConversationsQuery,
  PostChatConversationsBody,
  PostChatConversationsIdMessagesBody,
} from '../../types/api.generated';
import { apiClient } from './client';

export const chatApi = {
  conversations: (query: GetChatConversationsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__chat_conversations', { query, signal }),
  createConversation: (body: PostChatConversationsBody, signal?: AbortSignal) =>
    apiClient.request('post__chat_conversations', { body, signal }),
  messages: (id: string, query: GetChatConversationsIdMessagesQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__chat_conversations_id_messages', { pathParams: { id }, query, signal }),
  sendMessage: (id: string, body: PostChatConversationsIdMessagesBody, signal?: AbortSignal) =>
    apiClient.request('post__chat_conversations_id_messages', { pathParams: { id }, body, signal }),
  markRead: (id: string, signal?: AbortSignal) =>
    apiClient.request('post__chat_conversations_id_read', { pathParams: { id }, signal }),
};

