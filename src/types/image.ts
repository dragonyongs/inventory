// src/types/image.ts

export interface ItemImage {
  id: string;
  itemId: string;
  dropboxPath: string; // Dropbox 내부 경로
  directUrl: string; // dl.dropboxusercontent.com URL
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  isPrimary: boolean; // 대표 이미지 여부
  thumbnailUrl?: string; // 썸네일 URL (옵션)
}

export interface UploadTask {
  id: string;
  itemId: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
}
