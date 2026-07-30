import type {
  DeleteUsersMeBody,
  PatchUsersMeAvatarResponse,
  PatchUsersMeBody,
  PatchUsersMePasswordBody,
} from '../../types/api.generated';
import type { ImageUpload } from '../../types/api';
import { apiClient } from './client';

export const usersApi = {
  me: (signal?: AbortSignal) => apiClient.request('get__users_me', { signal }),
  updateMe: (body: PatchUsersMeBody, signal?: AbortSignal) =>
    apiClient.request('patch__users_me', { body, signal }),
  updateAvatar: async (image: ImageUpload, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append('image', image as unknown as Blob);
    return apiClient.upload<PatchUsersMeAvatarResponse>(
      '/users/me/avatar',
      formData,
      signal,
      'PATCH',
    );
  },
  deleteMe: (body: DeleteUsersMeBody, signal?: AbortSignal) =>
    apiClient.request('delete__users_me', { body, signal }),
  changePassword: (body: PatchUsersMePasswordBody, signal?: AbortSignal) =>
    apiClient.request('patch__users_me_password', { body, signal }),
  registerPushToken: (token: string, signal?: AbortSignal) =>
    apiClient.request('post__users_me_push_tokens', { body: { token }, signal }),
  removePushToken: (token: string, signal?: AbortSignal) =>
    apiClient.request('delete__users_me_push_tokens', { body: { token }, signal }),
};
