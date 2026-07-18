import type {
  GetDisputesQuery,
  PatchDisputesIdStatusBody,
  PostDisputesBody,
  PostDisputesIdMessagesBody,
} from '../../types/api.generated';
import { apiClient } from './client';

export const disputesApi = {
  create: (body: PostDisputesBody, signal?: AbortSignal) =>
    apiClient.request('post__disputes', { body, signal }),
  list: (query: GetDisputesQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__disputes', { query, signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiClient.request('get__disputes_id_', { pathParams: { id }, signal }),
  reply: (id: string, body: PostDisputesIdMessagesBody, signal?: AbortSignal) =>
    apiClient.request('post__disputes_id_messages', { pathParams: { id }, body, signal }),
  updateStatus: (id: string, body: PatchDisputesIdStatusBody, signal?: AbortSignal) =>
    apiClient.request('patch__disputes_id_status', { pathParams: { id }, body, signal }),
};

