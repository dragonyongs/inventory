import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Search, Edit, Trash2, Package, AlertTriangle, Calendar, DollarSign, Filter } from 'lucide-react'
import { format, isAfter, differenceInDays } from 'date-fns'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import SearchInput from '../../components/SearchInput'
import ItemTable from '../../components/ItemTable'

import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

export default function AdminItems() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, expired, expiring, low_stock, high_value

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
            <PageHeader
                title="아이템 관리"
                description={`전체 ${filteredItems.length}개의 아이템`}
                icon={
                    <Link to="/dashboard" className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                }
                rightSection={(
                    <button
                        onClick={fetchItems}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        새로고침
                    </button>
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 검색 및 필터 */}
                <SearchInput
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="아이템명, 카테고리, 소유자로 검색..."
                    variant="red"
                    filterComponent={
                        <>
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="block px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 rounded-md"
                            >
                                <option value="all">전체</option>
                                <option value="expired">만료됨</option>
                                <option value="expiring">곧 만료</option>
                                <option value="low_stock">저재고</option>
                                <option value="high_value">고가품</option>
                            </select>
                        </>
                    }
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                    <StatCard
                        icon={<Shield className="h-6 w-6 text-blue-500" />}
                        label="총 아이템"
                        value={stats.total}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
                        label="만료됨"
                        value={stats.expired}
                        valueClassName="text-2xl font-bold text-red-600"
                    />
                    <StatCard
                        icon={<Calendar className="h-6 w-6 text-yellow-500" />}
                        label="곧 만료"
                        value={stats.expiring}
                        valueClassName="text-2xl font-bold text-yellow-600"
                    />
                    <StatCard
                        icon={<Package className="h-6 w-6 text-orange-500" />}
                        label="저재고"
                        value={stats.lowStock}
                        valueClassName="text-2xl font-bold text-orange-600"
                    />
                    <StatCard
                        icon={<DollarSign className="h-6 w-6 text-green-500" />}
                        label="총 가치"
                        value={`₩${stats.totalValue.toLocaleString()}`}
                        valueClassName="text-lg font-bold text-gray-900"
                    />
                </div>


                {/* 아이템 테이블 */}
                <ItemTable
                    items={filteredItems}
                    userPermission='admin' // 관리자 권한 always
                    showCategory
                    showOwner
                    showAddedBy
                    onDelete={deleteItem}
                />
            </div>
        </div>
    )
}
