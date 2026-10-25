import { File } from "expo-file-system";
import type { ImageUpload } from "../../types/api";

export function appendUploadFile(
  formData: FormData,
  field: string,
  upload: ImageUpload,
) {
  // SDK 57 fetch reads file bytes instead of React Native URI descriptors.
  formData.append(field, new File(upload.uri), upload.name);
}
