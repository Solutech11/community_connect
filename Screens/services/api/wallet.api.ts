import type {
  GetWalletTransactionsQuery,
  PostWalletBankAccountsBody,
  PostWalletTransfersBody,
  PostWalletWithdrawalsBody,
} from '../../types/api.generated';
import { apiClient, createIdempotencyKey } from './client';

export const walletApi = {
  get: (signal?: AbortSignal) => apiClient.request('get__wallet', { signal }),
  transactions: (query: GetWalletTransactionsQuery = {}, signal?: AbortSignal) =>
    apiClient.request('get__wallet_transactions', { query, signal }),
  transaction: (id: string, signal?: AbortSignal) =>
    apiClient.request('get__wallet_transactions_id_', { pathParams: { id }, signal }),
  initializeTopUp: (
    amountKobo: number,
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) => apiClient.request('post__wallet_topups', {
    body: { amountKobo }, headers: { 'Idempotency-Key': idempotencyKey }, signal,
  }),
  verifyTopUp: (reference: string, signal?: AbortSignal) =>
    apiClient.request('get__wallet_topups_reference_verify', { pathParams: { reference }, signal }),
  banks: (signal?: AbortSignal) => apiClient.request('get__wallet_banks', { signal }),
  bankAccounts: (signal?: AbortSignal) => apiClient.request('get__wallet_bank_accounts', { signal }),
  saveBankAccount: (body: PostWalletBankAccountsBody, signal?: AbortSignal) =>
    apiClient.request('post__wallet_bank_accounts', { body, signal }),
  removeBankAccount: (id: string, signal?: AbortSignal) =>
    apiClient.request('delete__wallet_bank_accounts_id_', { pathParams: { id }, signal }),
  transfer: (
    body: PostWalletTransfersBody,
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) => apiClient.request('post__wallet_transfers', {
    body, headers: { 'Idempotency-Key': idempotencyKey }, signal,
  }),
  withdraw: (
    body: PostWalletWithdrawalsBody,
    idempotencyKey = createIdempotencyKey(),
    signal?: AbortSignal,
  ) => apiClient.request('post__wallet_withdrawals', {
    body, headers: { 'Idempotency-Key': idempotencyKey }, signal,
  }),
  finalizeWithdrawal: (reference: string, otp: string, signal?: AbortSignal) =>
    apiClient.request('post__wallet_withdrawals_reference_finalize', {
      pathParams: { reference }, body: { otp }, signal,
    }),
};

