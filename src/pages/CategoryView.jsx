import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Calendar, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { format, isAfter, differenceInDays } from 'date-fns'
import { toast } from 'react-hot-toast'
import { useInventoryStore } from '../store/inventoryStore'
import { useAuthStore } from '../store/authStore'
import ItemModal from '../components/ItemModal'

export default function CategoryView() {
    const { categoryId } = useParams()
    const { user } = useAuthStore()
    const {
        items,
        categories,
        selectedCategory,
        loading,
        fetchItems,
        fetchCategories,
        deleteItem,
        setSelectedCategory
    } = useInventoryStore()

    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [userPermission, setUserPermission] = useState('admin') // 기본값 admin (소유자)

    useEffect(() => {
        if (selectedCategory) {
            // 카테고리에서 사용자 권한 확인
            if (selectedCategory.is_shared) {
                setUserPermission(selectedCategory.permission_level)
            } else {
                setUserPermission('admin') // 소유자는 관리자 권한
            }
        }
    }, [selectedCategory])

    useEffect(() => {
        if (user && categoryId) {
            fetchCategories(user.id)
            fetchItems(categoryId)
        }
    }, [user, categoryId, fetchCategories, fetchItems])

    useEffect(() => {
        const category = categories.find(cat => cat.id === categoryId)
        setSelectedCategory(category)
    }, [categories, categoryId, setSelectedCategory])

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('정말로 이 아이템을 삭제하시겠습니까?')) {
            const result = await deleteItem(itemId)
            if (result.success) {
                toast.success('아이템이 삭제되었습니다.')
            } else {
                toast.error('삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const handleEditItem = (item) => {
        setEditingItem(item)
        setIsItemModalOpen(true)
    }

    const handleAddItem = () => {
        setEditingItem(null)
        setIsItemModalOpen(true)
    }

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null

        const today = new Date()
        const expiry = new Date(expiryDate)
        const daysToExpiry = differenceInDays(expiry, today)

        if (daysToExpiry < 0) {
            return { status: 'expired', message: '만료됨', color: 'text-red-600 bg-red-100' }
        } else if (daysToExpiry <= 7) {
            return { status: 'warning', message: `${daysToExpiry}일 후 만료`, color: 'text-yellow-600 bg-yellow-100' }
        } else if (daysToExpiry <= 30) {
            return { status: 'caution', message: `${daysToExpiry}일 후 만료`, color: 'text-blue-600 bg-blue-100' }
        }
        return null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!selectedCategory) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">카테고리를 찾을 수 없습니다.</p>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-500">
                    대시보드로 돌아가기
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-4 py-6">
                    <Link
                        to="/dashboard"
                        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h1>
                            {/* 공유 상태 라벨 추가 */}
                            {selectedCategory.is_shared && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    공유받음 ({userPermission === 'view' ? '조회' : userPermission === 'edit' ? '편집' : '관리자'})
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            총 {items.length}개 아이템
                            {selectedCategory.is_shared && (
                                <span className="ml-2">• 소유자: {selectedCategory.owner?.name}</span>
                            )}
                            {selectedCategory.manager && !selectedCategory.is_shared && (
                                <span className="ml-2">• 담당자: {selectedCategory.manager.name}</span>
                            )}
                        </p>
                    </div>
                </div>
                {/* 편집 권한이 있을 때만 아이템 추가 버튼 표시 */}
                {(userPermission === 'edit' || userPermission === 'admin') && (
                    <button
                        onClick={handleAddItem}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        아이템 추가
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Package className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">총 아이템</dt>
                                        <dd className="text-lg font-medium text-gray-900">{items.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <DollarSign className="h-6 w-6 text-green-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">총 가치</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            ₩{items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0).toLocaleString()}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">곧 만료</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {items.filter(item => {
                                                if (!item.expiry_date) return false
                                                const daysToExpiry = differenceInDays(new Date(item.expiry_date), new Date())
                                                return daysToExpiry >= 0 && daysToExpiry <= 7
                                            }).length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-red-500" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">만료됨</dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {items.filter(item => {
                                                if (!item.expiry_date) return false
                                                return isAfter(new Date(), new Date(item.expiry_date))
                                            }).length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">아이템 목록</h3>

                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">아이템이 없습니다</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    첫 번째 아이템을 추가해보세요.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={handleAddItem}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        아이템 추가
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                아이템명
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                수량
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                가격
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                구매일
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                유통기한
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                상태
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                작업
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.map((item) => {
                                            const expiryStatus = getExpiryStatus(item.expiry_date)
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            {item.notes && (
                                                                <div className="text-sm text-gray-500">{item.notes}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.quantity}개
                                                    </td>
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
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                                                정상
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            {(userPermission === 'edit' || userPermission === 'admin') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleEditItem(item)}
                                                                        className="text-blue-600 hover:text-blue-900"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteItem(item.id)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {userPermission === 'view' && (
                                                                <span className="text-gray-400 text-xs">조회 전용</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Item Modal */}
            <ItemModal
                isOpen={isItemModalOpen}
                onClose={() => {
                    setIsItemModalOpen(false)
                    setEditingItem(null)
                }}
                categoryId={categoryId}
                editingItem={editingItem}
            />
        </div>
    )
}
