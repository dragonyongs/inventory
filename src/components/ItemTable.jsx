// src/components/ItemTable.jsx
import React from 'react'
import { Edit, Trash2, Package } from 'lucide-react'
import { format } from 'date-fns'
import { getExpiryStatus } from '../lib/itemUtils'

export default function ItemTable({
    items = [],
    userPermission = 'view',
    onEdit,
    onDelete,
    emptyMessage = '아이템이 없습니다',
    onAdd,
    onUse,
}) {
    if (!items.length) {
        return (
            <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
                {onAdd && (
                    <div className="mt-6">
                        <button
                            onClick={onAdd}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            아이템 추가
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이템명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구매일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유통기한</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map(item => {
                        const expiryStatus = getExpiryStatus(item.expiry_date)
                        return (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                        {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}개</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.price ? `₩${item.price.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.purchase_date ? format(new Date(item.purchase_date), 'yyyy-MM-dd') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.expiry_date ? format(new Date(item.expiry_date), 'yyyy-MM-dd') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {expiryStatus ? (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                                            {expiryStatus.message}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">정상</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        {(userPermission === 'edit' || userPermission === 'admin') && (
                                            <>
                                                <button onClick={() => onEdit?.(item)} className="text-blue-600 hover:text-blue-900">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => onDelete?.(item.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {userPermission === 'view' && (
                                            <span className="text-gray-400 text-xs">조회 전용</span>
                                        )}
                                        {onUse && (
                                            <button onClick={() => onUse(item)} className="btn btn-warning btn-xs">
                                                차감
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
