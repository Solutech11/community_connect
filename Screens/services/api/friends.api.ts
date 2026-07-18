import type {
  GetFriendsQuery,
  GetFriendsRequestsQuery,
  GetFriendsSuggestionsQuery,
  PatchFriendsRequestsIdBody,
} from '../../types/api.generated';
import { apiClient } from './client';

export const friendsApi = {
  list: (query: GetFriendsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__friends', { query, signal }),
  requests: (query: GetFriendsRequestsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__friends_requests', { query, signal }),
  suggestions: (query: GetFriendsSuggestionsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__friends_suggestions', { query, signal }),
  sendRequest: (userId: string, signal?: AbortSignal) =>
    apiClient.request('post__friends_requests_userId_', { pathParams: { userId }, signal }),
  respondToRequest: (id: string, body: PatchFriendsRequestsIdBody, signal?: AbortSignal) =>
    apiClient.request('patch__friends_requests_id_', { pathParams: { id }, body, signal }),
  remove: (id: string, signal?: AbortSignal) =>
    apiClient.request('delete__friends_id_', { pathParams: { id }, signal }),
};

