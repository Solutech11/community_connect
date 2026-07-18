import type { PostUploadsImagesResponse } from '../../types/api.generated';
import type { ImageUpload } from '../../types/api';
import { apiClient } from './client';

export type UploadFolder = 'avatars' | 'events' | 'communities' | 'disputes' | 'chat' | 'uploads';

export const uploadsApi = {
  async image(image: ImageUpload, folder: UploadFolder = 'uploads', signal?: AbortSignal) {
    const formData = new FormData();
    formData.append('image', image as unknown as Blob);
    formData.append('folder', folder);
    return apiClient.upload<PostUploadsImagesResponse>('/uploads/images', formData, signal);
  },
};

