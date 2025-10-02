// src/stores/imageStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UploadTask } from "@/types/image";

interface ImageState {
  uploadQueue: UploadTask[];
  uploadProgress: Record<string, number>;
  imageCache: Record<string, string>; // dropboxPath -> directUrl 캐시
  isUploading: boolean;
}

interface ImageActions {
  // 업로드 큐 관리
  addToUploadQueue: (task: UploadTask) => void;
  removeFromUploadQueue: (taskId: string) => void;
  updateUploadProgress: (taskId: string, progress: number) => void;
  setUploadStatus: (
    taskId: string,
    status: UploadTask["status"],
    error?: string
  ) => void;

  // 이미지 캐시 관리
  cacheImageUrl: (dropboxPath: string, directUrl: string) => void;
  getCachedUrl: (dropboxPath: string) => string | undefined;

  // 전역 업로드 상태
  setIsUploading: (isUploading: boolean) => void;

  // 초기화
  clearQueue: () => void;
  clearCache: () => void;
}

type ImageStore = ImageState & ImageActions;

export const useImageStore = create<ImageStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      uploadQueue: [],
      uploadProgress: {},
      imageCache: {},
      isUploading: false,

      // 업로드 큐에 추가
      addToUploadQueue: (task) => {
        set((state) => ({
          uploadQueue: [...state.uploadQueue, task],
          uploadProgress: { ...state.uploadProgress, [task.id]: 0 },
        }));
      },

      // 업로드 큐에서 제거
      removeFromUploadQueue: (taskId) => {
        set((state) => {
          const newProgress = { ...state.uploadProgress };
          delete newProgress[taskId];

          return {
            uploadQueue: state.uploadQueue.filter((task) => task.id !== taskId),
            uploadProgress: newProgress,
          };
        });
      },

      // 업로드 진행률 업데이트
      updateUploadProgress: (taskId, progress) => {
        set((state) => ({
          uploadProgress: { ...state.uploadProgress, [taskId]: progress },
        }));
      },

      // 업로드 상태 변경
      setUploadStatus: (taskId, status, error) => {
        set((state) => ({
          uploadQueue: state.uploadQueue.map((task) =>
            task.id === taskId ? { ...task, status, error } : task
          ),
        }));
      },

      // URL 캐시 저장
      cacheImageUrl: (dropboxPath, directUrl) => {
        set((state) => ({
          imageCache: { ...state.imageCache, [dropboxPath]: directUrl },
        }));
      },

      // 캐시된 URL 가져오기
      getCachedUrl: (dropboxPath) => {
        return get().imageCache[dropboxPath];
      },

      // 전역 업로드 상태 설정
      setIsUploading: (isUploading) => {
        set({ isUploading });
      },

      // 큐 초기화
      clearQueue: () => {
        set({ uploadQueue: [], uploadProgress: {}, isUploading: false });
      },

      // 캐시 초기화
      clearCache: () => {
        set({ imageCache: {} });
      },
    }),
    {
      name: "inventory-image-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        imageCache: state.imageCache, // 캐시만 영구 저장
      }),
    }
  )
);
