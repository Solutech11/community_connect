import type {
  GetCommunitiesQuery,
  PatchCommunitiesIdBody,
  PostCommunitiesBody,
} from '../../types/api.generated';
import { apiClient, createIdempotencyKey } from './client';

export const communitiesApi = {
  list: (query: GetCommunitiesQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__communities', { query, signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiClient.request('get__communities_id_', { pathParams: { id }, signal }),
  create: (body: PostCommunitiesBody, signal?: AbortSignal) =>
    apiClient.request('post__communities', { body, signal }),
  update: (id: string, body: PatchCommunitiesIdBody, signal?: AbortSignal) =>
    apiClient.request('patch__communities_id_', { pathParams: { id }, body, signal }),
  join: (id: string, signal?: AbortSignal) =>
    apiClient.request('post__communities_id_members', { pathParams: { id }, signal }),
  members: (id: string, signal?: AbortSignal) =>
    apiClient.request('get__communities_id_members', { pathParams: { id }, signal }),
  createMembershipOrder: (
    id: string,
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) => apiClient.request('post__communities_id_membership_orders', {
    pathParams: { id }, headers: { 'Idempotency-Key': idempotencyKey }, signal,
  }),
  verifyMembershipOrder: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.request('get__communities_membership_orders_orderNumber_verify', {
      pathParams: { orderNumber }, signal,
    }),
  leave: (id: string, signal?: AbortSignal) =>
    apiClient.request('delete__communities_id_members_me', { pathParams: { id }, signal }),
};

