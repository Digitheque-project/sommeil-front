import { getSommeilApiUrl } from "./consultation-config";
import { getAuthToken, handleResponse } from "./http";

export type UploadResult = { url: string };

export const uploadsApi = {
  // Multipart : pas de Content-Type manuel, le navigateur pose lui-même la
  // boundary — contrairement à sommeilApi() qui force du JSON.
  uploadPhoto: async (file: File): Promise<UploadResult> => {
    const token = getAuthToken();
    const form = new FormData();
    form.append("file", file, file.name);

    const res = await fetch(getSommeilApiUrl("/uploads"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    return handleResponse<UploadResult>(res);
  },
};
