import type {
  GetAiSessionsQuery,
  PostAiChatBody,
  PostAiEventCopyBody,
  PostAiEventRecommendationsBody,
} from '../../types/api.generated';
import { apiClient } from './client';

export const aiApi = {
  chat: (body: PostAiChatBody, signal?: AbortSignal) =>
    apiClient.request('post__ai_chat', { body, signal }),
  eventCopy: (body: PostAiEventCopyBody, signal?: AbortSignal) =>
    apiClient.request('post__ai_event_copy', { body, signal }),
  eventRecommendations: (body: PostAiEventRecommendationsBody, signal?: AbortSignal) =>
    apiClient.request('post__ai_event_recommendations', { body, signal }),
  summarizeConversation: (id: string, signal?: AbortSignal) =>
    apiClient.request('post__ai_conversations_id_summary', { pathParams: { id }, signal }),
  sessions: (query: GetAiSessionsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__ai_sessions', { query, signal }),
  removeSession: (id: string, signal?: AbortSignal) =>
    apiClient.request('delete__ai_sessions_id_', { pathParams: { id }, signal }),
};

