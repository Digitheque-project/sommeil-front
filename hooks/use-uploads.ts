"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadsApi } from "@/lib/api/uploads";

export function useUploadPhoto() {
  return useMutation({
    mutationFn: (file: File) => uploadsApi.uploadPhoto(file),
  });
}
