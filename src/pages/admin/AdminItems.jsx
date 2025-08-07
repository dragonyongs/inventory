import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Search, Edit, Trash2, Package, AlertTriangle, Calendar, DollarSign, Filter } from 'lucide-react'
import { format, isAfter, differenceInDays } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

export default function AdminItems() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, expired, expiring, low_stock, high_value
    const [selectedItem, setSelectedItem] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('inventory_items')
                .select(`
          *,
          category:inventory_categories!category_id(name, is_public, owner:inventory_users!owner_id(name)),
          added_by_user:inventory_users!added_by(name, username)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching items:', error)
            toast.error('아이템 목록을 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const deleteItem = async (itemId) => {
        if (window.confirm('정말로 이 아이템을 삭제하시겠습니까?')) {
            try {
                const { error } = await supabase
                    .from('inventory_items')
                    .delete()
                    .eq('id', itemId)

                if (error) throw error

                toast.success('아이템이 삭제되었습니다.')
                fetchItems()
            } catch (error) {
                console.error('Error deleting item:', error)
                toast.error('아이템 삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const getItemStatus = (item) => {
        if (!item.expiry_date) return null

        const today = new Date()
        const expiryDate = new Date(item.expiry_date)
        const daysToExpiry = differenceInDays(expiryDate, today)

        if (daysToExpiry < 0) {
            return { status: 'expired', message: '만료됨', color: 'text-red-600 bg-red-100' }
        } else if (daysToExpiry <= 7) {
            return { status: 'expiring', message: `${daysToExpiry}일 후 만료`, color: 'text-yellow-600 bg-yellow-100' }
        } else if (daysToExpiry <= 30) {
            return { status: 'caution', message: `${daysToExpiry}일 후 만료`, color: 'text-blue-600 bg-blue-100' }
        }
        return { status: 'normal', message: '정상', color: 'text-green-600 bg-green-100' }
    }

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        switch (filterType) {
            case 'expired':
                return item.expiry_date && isAfter(new Date(), new Date(item.expiry_date))
            case 'expiring':
                if (!item.expiry_date) return false
                const daysToExpiry = differenceInDays(new Date(item.expiry_date), new Date())
                return daysToExpiry >= 0 && daysToExpiry <= 7
            case 'low_stock':
                return item.quantity <= 5
            case 'high_value':
                return item.price && item.price * item.quantity >= 100000
            default:
                return true
        }
    })

    const stats = {
        total: items.length,
        expired: items.filter(item => {
            if (!item.expiry_date) return false
            return isAfter(new Date(), new Date(item.expiry_date))
        }).length,
        expiring: items.filter(item => {
            if (!item.expiry_date) return false
            const daysToExpiry = differenceInDays(new Date(item.expiry_date), new Date())
            return daysToExpiry >= 0 && daysToExpiry <= 7
        }).length,
        lowStock: items.filter(item => item.quantity <= 5).length,
        totalValue: items.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/admin"
                        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">아이템 관리</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            전체 {filteredItems.length}개의 아이템
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchItems}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                    새로고침
                </button>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 검색 및 필터 */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            placeholder="아이템명, 카테고리, 소유자로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="block px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
                        >
                            <option value="all">전체</option>
                            <option value="expired">만료됨</option>
                            <option value="expiring">곧 만료</option>
                            <option value="low_stock">저재고</option>
                            <option value="high_value">고가품</option>
                        </select>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Shield className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">총 아이템</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                </div>
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">만료됨</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Calendar className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">곧 만료</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Package className="h-6 w-6 text-orange-500" />
                                </div>
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">저재고</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
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
                                <div className="ml-5">
                                    <p className="text-sm font-medium text-gray-500">총 가치</p>
                                    <p className="text-lg font-bold text-gray-900">₩{stats.totalValue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 아이템 테이블 */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            아이템
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            카테고리 / 소유자
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            수량
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            가격
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
                                    {filteredItems.map((item) => {
                                        const status = getItemStatus(item)
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                        {item.notes && (
                                                            <div className="text-sm text-gray-500 truncate max-w-xs">{item.notes}</div>
                                                        )}
                                                        {item.added_by_user && (
                                                            <div className="text-xs text-gray-400">등록: {item.added_by_user.name}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.category?.name}</div>
                                                        <div className="text-sm text-gray-500">소유자: {item.category?.owner?.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm ${item.quantity <= 5 ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                                                        {item.quantity}개
                                                    </span>
                                                </td>
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
                                                    {status ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                            {status.message}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Link
                                                            to={`/category/${item.category_id}`}
                                                            className="p-2 rounded-md text-blue-600 hover:text-blue-900"
                                                            title="카테고리 보기"
                                                        >
                                                            <Package className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="p-2 rounded-md text-red-600 hover:text-red-900"
                                                            title="아이템 삭제"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="text-center py-12">
                                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm || filterType !== 'all' ? '검색 결과가 없습니다' : '아이템이 없습니다'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterType !== 'all' ? '다른 검색어나 필터를 사용해보세요.' : '아직 등록된 아이템이 없습니다.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
