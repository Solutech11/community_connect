import type { GetWalletTransactionsQuery, PostWalletBankAccountsBody, PostWalletBankAccountsResolveBody } from '../../types/api.generated';
import { apiClient } from './client';

export const walletApi = {
  get: (signal?: AbortSignal) => apiClient.request('get__wallet', { signal }),
  transactions: (query: GetWalletTransactionsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__wallet_transactions', { query, signal }),
  transaction: (id: string, signal?: AbortSignal) =>
    apiClient.request('get__wallet_transactions_id_', { pathParams: { id }, signal }),
  banks: (signal?: AbortSignal) => apiClient.request('get__wallet_banks', { signal }),
  bankAccounts: (signal?: AbortSignal) => apiClient.request('get__wallet_bank_accounts', { signal }),
  resolveBankAccount: (body: PostWalletBankAccountsResolveBody, signal?: AbortSignal) =>
    apiClient.request('post__wallet_bank_accounts_resolve', { body, signal }),
  saveBankAccount: (body: PostWalletBankAccountsBody, signal?: AbortSignal) =>
    apiClient.request('post__wallet_bank_accounts', { body, signal }),
  removeBankAccount: (id: string, signal?: AbortSignal) =>
    apiClient.request('delete__wallet_bank_accounts_id_', { pathParams: { id }, signal }),
};
