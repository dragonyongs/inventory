import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'

export default function ItemModal({ isOpen, onClose, categoryId, editingItem }) {
    const { user } = useAuthStore()
    const { createItem, updateItem } = useInventoryStore()
    const { handleSubmit, register, reset, formState: { isSubmitting } } = useForm()

    useEffect(() => {
        if (editingItem) {
            reset({
                name: editingItem.name,
                quantity: editingItem.quantity,
                price: editingItem.price,
                purchase_date: editingItem.purchase_date,
                expiry_date: editingItem.expiry_date,
                notes: editingItem.notes
            })
        } else {
            reset({
                name: '',
                quantity: 1,
                price: '',
                purchase_date: '',
                expiry_date: '',
                notes: ''
            })
        }
    }, [editingItem, reset])

    const onSubmit = async (data) => {
        try {
            const itemData = {
                ...data,
                quantity: parseInt(data.quantity),
                price: data.price ? parseFloat(data.price) : null,
                purchase_date: data.purchase_date || null,
                expiry_date: data.expiry_date || null,
                category_id: categoryId,
                added_by: user.id
            }

            let result
            if (editingItem) {
                result = await updateItem(editingItem.id, itemData)
            } else {
                result = await createItem(itemData)
            }

            if (result.success) {
                toast.success(editingItem ? '아이템이 수정되었습니다!' : '아이템이 추가되었습니다!')
                reset()
                onClose()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('오류가 발생했습니다.')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 !mt-0">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        {editingItem ? '아이템 수정' : '새 아이템 추가'}
                    </h3>
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
                            아이템명 *
                        </label>
                        <input
                            {...register('name', { required: '아이템명을 입력해주세요' })}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="예: 쌀, A4 용지, 노트북"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                수량 *
                            </label>
                            <input
                                {...register('quantity', { required: '수량을 입력해주세요', min: 0 })}
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                가격
                            </label>
                            <input
                                {...register('price')}
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="10000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                구매일
                            </label>
                            <input
                                {...register('purchase_date')}
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                유통기한
                            </label>
                            <input
                                {...register('expiry_date')}
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            메모
                        </label>
                        <textarea
                            {...register('notes')}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="추가 정보나 메모를 입력하세요"
                        />
                    </div>

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
                            {isSubmitting ? '처리 중...' : editingItem ? '수정' : '추가'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
