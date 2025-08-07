import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useSystemStore } from '../store/systemStore'
import { toast } from 'react-hot-toast'

export default function CategoryModal({ isOpen, onClose }) {
    const { user } = useAuthStore()
    const { createCategory } = useInventoryStore()
    const { getSetting, loadSettings } = useSystemStore()
    const { handleSubmit, register, reset, formState: { isSubmitting } } = useForm()

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const isPublicCategoriesEnabled = getSetting('general', 'enablePublicCategories')
    const maxCategoriesPerUser = getSetting('limits', 'maxCategoriesPerUser') || 50

    const onSubmit = async (data) => {
        // 공개 카테고리가 비활성화된 경우 체크
        if (data.is_public && !isPublicCategoriesEnabled) {
            toast.error('공개 카테고리 기능이 현재 비활성화되어 있습니다.')
            return
        }

        const result = await createCategory({
            ...data,
            owner_id: user.id,
            shared_token: Math.random().toString(36).substring(2, 15),
            is_public: data.is_public && isPublicCategoriesEnabled // 설정에 따라 강제 조정
        })

        if (result.success) {
            toast.success('카테고리가 생성되었습니다!')
            reset()
            onClose()
        } else {
            toast.error(result.error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 !mt-0">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">새 카테고리 만들기</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            카테고리 이름
                        </label>
                        <input
                            {...register('name', { required: '카테고리 이름을 입력해주세요' })}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="예: 1층 창고, 주방 팬트리"
                        />
                    </div>

                    {/* 공개 카테고리 설정이 활성화된 경우에만 표시 */}
                    {isPublicCategoriesEnabled && (
                        <div>
                            <label className="flex items-center">
                                <input
                                    {...register('is_public')}
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                />
                                <span className="ml-2 text-sm text-gray-700">공개 카테고리로 설정</span>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '생성 중...' : '생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
