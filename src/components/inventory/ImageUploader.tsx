// src/components/inventory/ImageUploader.tsx
import React, { useCallback, useRef, useState } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { dropboxService } from "@/services/dropboxService";
import { useImageStore } from "@/stores/imageStore";
import {
  resizeImage,
  validateFileSize,
  validateImageType,
} from "@/utils/imageOptimization";
import type { ItemImage } from "@/types/image";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface ImageUploaderProps {
  itemId: string;
  onImageUploaded: (image: ItemImage) => void;
  maxImages?: number;
  currentImagesCount?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = React.memo(
  ({ itemId, onImageUploaded, maxImages = 5, currentImagesCount = 0 }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useIsMobile();
    const { addToUploadQueue, setIsUploading } = useImageStore();

    // 파일 업로드 처리
    const handleFileUpload = useCallback(
      async (file: File) => {
        setError(null);

        // 유효성 검증
        if (!validateImageType(file)) {
          setError("지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 가능)");
          return;
        }

        if (!validateFileSize(file, 10)) {
          setError("파일 크기는 10MB 이하여야 합니다.");
          return;
        }

        if (currentImagesCount >= maxImages) {
          setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
          return;
        }

        try {
          setUploading(true);
          setIsUploading(true);

          // 이미지 리사이징
          const resizedFile = await resizeImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
          });

          // Dropbox 업로드
          const uploadedImage = await dropboxService.uploadFile(
            resizedFile,
            itemId,
            setProgress
          );

          // 상위 컴포넌트에 알림
          onImageUploaded(uploadedImage);

          // 초기화
          setProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (cameraInputRef.current) cameraInputRef.current.value = "";
        } catch (err) {
          console.error("이미지 업로드 실패:", err);
          setError(
            err instanceof Error
              ? err.message
              : "업로드 중 오류가 발생했습니다."
          );
        } finally {
          setUploading(false);
          setIsUploading(false);
        }
      },
      [
        itemId,
        onImageUploaded,
        currentImagesCount,
        maxImages,
        addToUploadQueue,
        setIsUploading,
      ]
    );

    // 파일 선택 이벤트
    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          handleFileUpload(files[0]);
        }
      },
      [handleFileUpload]
    );

    return (
      <div className="space-y-3">
        {/* 업로드 버튼 그룹 */}
        <div className="flex gap-2">
          {/* 카메라 촬영 버튼 */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading || currentImagesCount >= maxImages}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>{!isMobile && "사진 "}촬영</span>
          </button>

          {/* 파일 선택 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || currentImagesCount >= maxImages}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>갤러리{!isMobile && "에서 선택"}</span>
          </button>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 숨겨진 카메라 입력 */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 업로드 진행률 */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>업로드 중... {progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-sm text-red-600">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 이미지 개수 안내 */}
        <p className="text-xs text-gray-500 text-center">
          {currentImagesCount}/{maxImages}개 이미지 업로드됨
        </p>
      </div>
    );
  }
);

ImageUploader.displayName = "ImageUploader";
