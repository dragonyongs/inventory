// src/components/inventory/ImageGalleryModal.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import type { ItemImage } from "@/types/image";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ItemImage[];
  itemId: string;
  readOnly?: boolean;
  onImageUploaded?: (image: ItemImage) => void;
  onImageDeleted?: (imageId: string) => void;
  onSetPrimary?: (imageId: string) => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    images,
    itemId,
    readOnly = false,
    onImageUploaded,
    onImageDeleted,
    onSetPrimary,
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    // 이미지 변경 시 줌 초기화
    useEffect(() => {
      setIsZoomed(false);
    }, [currentIndex]);

    // 키보드 네비게이션
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") handlePrevious();
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "Escape") onClose();
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, images.length]);

    const handlePrevious = useCallback(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    const handleNext = useCallback(() => {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    const handleDelete = useCallback(() => {
      if (!images[currentIndex]) return;

      if (confirm("이 이미지를 삭제하시겠습니까?")) {
        onImageDeleted?.(images[currentIndex].id);

        // 삭제 후 인덱스 조정
        if (images.length === 1) {
          onClose();
        } else if (currentIndex >= images.length - 1) {
          setCurrentIndex(Math.max(0, images.length - 2));
        }
      }
    }, [images, currentIndex, onImageDeleted, onClose]);

    const handleSetPrimary = useCallback(() => {
      if (!images[currentIndex]) return;
      onSetPrimary?.(images[currentIndex].id);
    }, [images, currentIndex, onSetPrimary]);

    const handleDownload = useCallback(() => {
      if (!images[currentIndex]) return;
      const link = document.createElement("a");
      link.href = images[currentIndex].directUrl;
      link.download = images[currentIndex].fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, [images, currentIndex]);

    const currentImage = images[currentIndex];

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-98 z-50 flex flex-col"
        onClick={onClose}
      >
        {/* 상단 헤더 */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* 좌측: 닫기 + 카운터 */}
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all group"
                aria-label="닫기"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
              </button>

              {images.length > 0 && (
                <div className="flex items-center gap-2 text-white">
                  <span className="text-2xl font-bold">{currentIndex + 1}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-400">{images.length}</span>
                </div>
              )}
            </div>

            {/* 우측: 액션 버튼 */}
            <div className="flex items-center gap-2">
              {/* 줌 버튼 */}
              {currentImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label={isZoomed ? "축소" : "확대"}
                >
                  {isZoomed ? (
                    <ZoomOut className="w-5 h-5 text-white" />
                  ) : (
                    <ZoomIn className="w-5 h-5 text-white" />
                  )}
                </button>
              )}

              {/* 다운로드 */}
              {currentImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="다운로드"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              )}

              {/* 대표 이미지 설정 */}
              {!readOnly && currentImage && !currentImage.isPrimary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/90 hover:bg-yellow-500 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">대표</span>
                </button>
              )}

              {/* 삭제 */}
              {!readOnly && currentImage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">삭제</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역: 상단 헤더와 하단 썸네일 영역 사이 */}
        <div className="flex-1 flex flex-col pt-20 pb-48">
          {/* 이미지 뷰어 */}
          <div className="flex-1 flex items-center justify-center relative px-4">
            {images.length > 0 ? (
              <>
                {/* 좌우 네비게이션 */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm group"
                      aria-label="이전"
                    >
                      <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all backdrop-blur-sm group"
                      aria-label="다음"
                    >
                      <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                    </button>
                  </>
                )}

                {/* 이미지 */}
                <div
                  className={`relative transition-all duration-300 max-w-full max-h-full ${
                    isZoomed ? "scale-150" : ""
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={currentImage.directUrl}
                    alt={currentImage.fileName}
                    className={`max-w-full max-h-[calc(100vh-28rem)] object-contain rounded-lg shadow-2xl ${
                      isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                    }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                    loading="lazy"
                  />

                  {/* 대표 이미지 뱃지 */}
                  {currentImage.isPrimary && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow-500 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">대표</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-white text-lg mb-2">
                  등록된 이미지가 없습니다
                </p>
                {!readOnly && (
                  <p className="text-gray-400 text-sm">
                    아래에서 이미지를 추가하세요
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단: 썸네일 갤러리 + 업로더 (고정 높이) */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/98 to-black/80 pt-8 pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-7xl mx-auto px-6 space-y-4">
            {/* 이미지 업로더 */}
            {!readOnly && (
              <div>
                <ImageUploader
                  itemId={itemId}
                  onImageUploaded={(image) => {
                    onImageUploaded?.(image);
                    setCurrentIndex(images.length);
                  }}
                  currentImagesCount={images.length}
                  maxImages={10}
                />
              </div>
            )}

            {/* 썸네일 리스트 */}
            {images.length > 0 && (
              <div className="relative">
                {/* 좌우 페이드 효과 */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                {/* 썸네일 스크롤 영역 */}
                <div className="flex gap-4 overflow-x-auto py-3 px-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                        index === currentIndex
                          ? "ring-4 ring-blue-500 shadow-2xl scale-110"
                          : "ring-2 ring-gray-700 hover:ring-gray-500 hover:scale-105 opacity-70 hover:opacity-100"
                      }`}
                      style={{ width: "88px", height: "88px" }}
                    >
                      <img
                        src={image.thumbnailUrl || image.directUrl}
                        alt={`${image.fileName} 썸네일`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* 대표 이미지 뱃지 */}
                      {image.isPrimary && (
                        <div className="absolute top-1.5 right-1.5 bg-yellow-400 rounded-full p-1 shadow-lg">
                          <Star className="w-3.5 h-3.5 text-white fill-current" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 스와이프 힌트 (모바일) */}
        {images.length > 1 && (
          <div className="fixed bottom-48 left-1/2 -translate-x-1/2 text-gray-400 text-sm animate-bounce md:hidden pointer-events-none">
            ← 좌우로 스와이프 →
          </div>
        )}
      </div>
    );
  }
);

ImageGalleryModal.displayName = "ImageGalleryModal";
