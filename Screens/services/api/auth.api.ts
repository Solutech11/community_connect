import type {
  PostAuthForgotPasswordBody,
  PostAuthLoginBody,
  PostAuthRegisterBody,
  PostAuthResendVerificationBody,
  PostAuthResetPasswordBody,
  PostAuthVerifyEmailBody,
} from '../../types/api.generated';
import { authTokenStorage } from '../storage/auth-token.storage';
import { apiClient } from './client';

async function persistSession(session: { accessToken: string; refreshToken: string }) {
  await authTokenStorage.setRefreshToken(session.refreshToken);
  apiClient.setAccessToken(session.accessToken);
}

export const authApi = {
  register: (body: PostAuthRegisterBody, signal?: AbortSignal) =>
    apiClient.request('post__auth_register', { body, signal }),

  async verifyEmail(body: PostAuthVerifyEmailBody, signal?: AbortSignal) {
    const response = await apiClient.request('post__auth_verify_email', { body, signal });
    await persistSession(response.data.session);
    return response;
  },

  resendVerification: (body: PostAuthResendVerificationBody, signal?: AbortSignal) =>
    apiClient.request('post__auth_resend_verification', { body, signal }),

  async login(body: PostAuthLoginBody, signal?: AbortSignal) {
    const response = await apiClient.request('post__auth_login', { body, signal });
    await persistSession(response.data.session);
    return response;
  },

  forgotPassword: (body: PostAuthForgotPasswordBody, signal?: AbortSignal) =>
    apiClient.request('post__auth_forgot_password', { body, signal }),

  resetPassword: (body: PostAuthResetPasswordBody, signal?: AbortSignal) =>
    apiClient.request('post__auth_reset_password', { body, signal }),

  restoreSession: () => apiClient.restoreSession(),

  async logout() {
    const refreshToken = await authTokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.request('post__auth_logout', { body: { refreshToken } });
      }
    } finally {
      apiClient.setAccessToken(null);
      await authTokenStorage.clearRefreshToken();
    }
  },

  async clearLocalSession() {
    apiClient.setAccessToken(null);
    await authTokenStorage.clearRefreshToken();
  },
};

