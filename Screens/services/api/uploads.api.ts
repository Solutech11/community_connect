import type { PostUploadsFilesResponse, PostUploadsImagesResponse } from '../../types/api.generated';
import type { ImageUpload } from '../../types/api';
import { apiClient } from './client';
import { appendUploadFile } from './upload-form-data';

export type UploadFolder = 'avatars' | 'events' | 'communities' | 'disputes' | 'chat' | 'uploads';

export const uploadsApi = {
  async image(image: ImageUpload, folder: UploadFolder = 'uploads', signal?: AbortSignal) {
    const formData = new FormData();
    appendUploadFile(formData, 'image', image);
    formData.append('folder', folder);
    return apiClient.upload<PostUploadsImagesResponse>('/uploads/images', formData, signal);
  },
  async communityFile(file: ImageUpload, signal?: AbortSignal) {
    const formData = new FormData();
    appendUploadFile(formData, 'file', file);
    formData.append('folder', 'community-chat');
    return apiClient.upload<PostUploadsFilesResponse>('/uploads/files', formData, signal);
  },
};
