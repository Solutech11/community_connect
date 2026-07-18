import type { GetNotificationsQuery } from '../../types/api.generated';
import { apiClient } from './client';

export const notificationsApi = {
  list: (query: GetNotificationsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__notifications', { query, signal }),
  markAllRead: (signal?: AbortSignal) =>
    apiClient.request('patch__notifications_read_all', { signal }),
  markRead: (id: string, signal?: AbortSignal) =>
    apiClient.request('patch__notifications_id_read', { pathParams: { id }, signal }),
};

