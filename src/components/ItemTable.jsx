// src/components/ItemTable.jsx
import React from 'react'
import { Edit, Trash2, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { getExpiryStatus } from '../lib/itemUtils'

/**
 * items: 배열
 * userPermission: 'admin' | 'edit' | 'view'
 * showCategory: bool (관리자 화면에서 카테고리/소유자 컬럼 표시)
 * showAddedBy: bool (관리자 화면에서 등록자 표시)
 * onEdit: function(item)
 * onDelete: function(itemId)
 * onUse: function(item)
 * onNavigateCategory: function(categoryId) (없으면 Link로 호출됨)
 * emptyMessage: string
 * onAdd: function() (빈 목록시 "아이템 추가" 노출)
 */
export default function ItemTable({
    items = [],
    userPermission = 'view',
    showCategory = false,
    showOwner = false,
    showAddedBy = false,
    onEdit,
    onDelete,
    onUse,
    onNavigateCategory,
    emptyMessage = '아이템이 없습니다',
    onAdd,
}) {
    console.log("items", items);
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
                        {showCategory && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                        )}
                        {showOwner && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소유자</th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수량</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유통기한</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        {showAddedBy && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록자</th>
                        )}
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
                                {showCategory && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {onNavigateCategory ? (
                                                <button
                                                    className="text-blue-700 underline"
                                                    onClick={() => onNavigateCategory?.(item.category_id)}
                                                >
                                                    {item.category?.name}
                                                </button>
                                            ) : (
                                                <Link
                                                    className="text-blue-700 underline"
                                                    to={`/category/${item.category_id}`}
                                                >
                                                    {item.category?.name}
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {showOwner && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.category?.owner?.name || '-'}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}개</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.price ? (
                                        <div>
                                            <div>₩{item.price.toLocaleString()}</div>
                                            <div className="text-xs text-gray-500">
                                                총: ₩{(item.price * item.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    ) : '-'}
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
                                {showAddedBy && (
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {item.added_by_user?.name || '-'}
                                    </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        {(userPermission === 'edit' || userPermission === 'admin') && (
                                            <>
                                                {onEdit && (
                                                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {userPermission === 'view' && (
                                            <span className="text-gray-400 text-xs">조회 전용</span>
                                        )}
                                        {onUse && (
                                            <button onClick={() => onUse(item)} className="text-orange-500 hover:text-orange-900">
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
