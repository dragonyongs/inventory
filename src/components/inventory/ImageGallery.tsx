// src/components/inventory/ImageGallery.tsx
import React, { useState, useCallback } from "react";
import { X, Star, Trash2 } from "lucide-react";
import type { ItemImage } from "@/types/image";

interface ImageGalleryProps {
  images: ItemImage[];
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  readOnly?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = React.memo(
  ({ images, onSetPrimary, onDelete, readOnly = false }) => {
    const [selectedImage, setSelectedImage] = useState<ItemImage | null>(null);

    const handleImageClick = useCallback((image: ItemImage) => {
      setSelectedImage(image);
    }, []);

    const closeModal = useCallback(() => {
      setSelectedImage(null);
    }, []);

    if (!images || images.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <p>등록된 이미지가 없습니다</p>
        </div>
      );
    }

    return (
      <>
        {/* 이미지 그리드 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => handleImageClick(image)}
            >
              {/* 이미지 */}
              <img
                src={image.thumbnailUrl || image.directUrl}
                alt={image.fileName}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* 대표 이미지 배지 */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-yellow-400 text-white p-1 rounded">
                  <Star className="w-3 h-3 fill-current" />
                </div>
              )}

              {/* 호버 오버레이 */}
              {!readOnly && (
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* 대표 이미지 설정 */}
                  {!image.isPrimary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetPrimary(image.id);
                      }}
                      className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-full"
                      title="대표 이미지로 설정"
                    >
                      <Star className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("이미지를 삭제하시겠습니까?")) {
                        onDelete(image.id);
                      }
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full"
                    title="이미지 삭제"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 이미지 확대 모달 */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={selectedImage.directUrl}
              alt={selectedImage.fileName}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }
);

ImageGallery.displayName = "ImageGallery";
