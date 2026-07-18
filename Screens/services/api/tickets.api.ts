import type { GetTicketsQuery } from '../../types/api.generated';
import { apiClient } from './client';

export const ticketsApi = {
  list: (query: GetTicketsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__tickets', { query, signal }),
  get: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.request('get__tickets_orderNumber_', { pathParams: { orderNumber }, signal }),
  verifyPayment: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.request('get__tickets_orderNumber_verify', { pathParams: { orderNumber }, signal }),
};

