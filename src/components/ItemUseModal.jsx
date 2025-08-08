import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { toast } from 'react-hot-toast'

export default function ItemUseModal({ isOpen, onClose, item, categoryId }) {
    const { user } = useAuthStore()
    const { inventoryUseItem } = useInventoryStore() // 새로운 action
    const [quantity, setQuantity] = useState(1)
    const [note, setNote] = useState("")

    const handleUse = async () => {
        if (!quantity || quantity < 1) {
            toast.error('1개 이상 입력하세요.')
            return
        }
        if (quantity > item.quantity) {
            toast.error('잔여 수량보다 많이 사용할 수 없습니다.')
            return
        }
        const result = await inventoryUseItem({
            category_id: categoryId,
            item_id: item.id,
            user_id: user.id,
            used_quantity: quantity,
            note
        })
        if (result.success) {
            toast.success('재고가 차감되었습니다.')
            onClose()
        } else {
            toast.error(result.error || '차감 오류')
        }
    }

    if (!isOpen || !item) return null
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="p-6 bg-white rounded shadow-xl w-96">
                <h2 className="text-lg font-bold mb-4">{item.name} 사용/차감</h2>
                <div className="mb-3">
                    <label className="block text-sm mb-1">사용 수량</label>
                    <input
                        type="number"
                        value={quantity}
                        min={1}
                        max={item.quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        className="w-full border px-2 py-1 rounded"
                    />
                    <span className="text-xs text-gray-500">최대 {item.quantity}개</span>
                </div>
                <div className="mb-3">
                    <label className="block text-sm mb-1">메모(선택)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="w-full border px-2 py-1 rounded"
                    />
                </div>
                <div className="flex gap-2 justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700">취소</button>
                    <button onClick={handleUse} className="px-4 py-2 rounded bg-blue-600 text-white">차감</button>
                </div>
            </div>
        </div>
    )
}
