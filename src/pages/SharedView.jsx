import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Package, Calendar, DollarSign, AlertTriangle, Eye, Lock } from 'lucide-react'
import { format, isAfter, differenceInDays } from 'date-fns'
import { supabase } from '../lib/supabase'

export default function SharedView() {
    const { token } = useParams()
    const [category, setCategory] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchSharedData()
    }, [token])

    const fetchSharedData = async () => {
        try {
            setLoading(true)

            console.log('Fetching shared data for token:', token) // 디버깅용

            // 공유 토큰으로 카테고리 조회 (테이블명 수정됨)
            const { data: categoryData, error: categoryError } = await supabase
                .from('inventory_categories') // 새 테이블명
                .select(`
          *,
          owner:inventory_users!owner_id(name, username),
          manager:inventory_users!manager_id(name)
        `)
                .eq('shared_token', token)
                .single()

            console.log('Category query result:', { categoryData, categoryError }) // 디버깅용

            if (categoryError) {
                console.error('Category error:', categoryError)
                throw new Error('공유된 카테고리를 찾을 수 없습니다.')
            }

            // 공개 카테고리가 아닌 경우에도 shared_token이 있으면 접근 허용
            // (개인 공유 링크의 경우)
            if (!categoryData.is_public && !categoryData.shared_token) {
                throw new Error('이 카테고리는 비공개 상태입니다.')
            }

            setCategory(categoryData)

            // 해당 카테고리의 아이템들 조회 (테이블명 수정됨)
            const { data: itemsData, error: itemsError } = await supabase
                .from('inventory_items') // 새 테이블명
                .select(`
          *,
          added_by_user:inventory_users!added_by(name)
        `)
                .eq('category_id', categoryData.id)
                .order('name')

            console.log('Items query result:', { itemsData, itemsError }) // 디버깅용

            if (itemsError) {
                console.error('Items error:', itemsError)
                throw new Error('아이템을 불러오는 중 오류가 발생했습니다.')
            }

            setItems(itemsData || [])
        } catch (err) {
            console.error('Fetch error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <Lock className="mx-auto h-12 w-12 text-gray-400" />
                    <h1 className="mt-4 text-xl font-semibold text-gray-900">접근 불가</h1>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <p className="mt-1 text-sm text-gray-500">
                        링크가 올바른지 확인하거나 관리자에게 문의하세요.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            이전 페이지로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h1 className="mt-4 text-xl font-semibold text-gray-900">카테고리를 찾을 수 없습니다</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Eye className="h-8 w-8 text-blue-600 mr-3" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <span>소유자: {category.owner?.name}</span>
                                        {category.manager && <span>담당자: {category.manager.name}</span>}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {category.is_public ? '공개됨' : '공유됨'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">재고 현황</h3>

                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">아이템이 없습니다</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    이 카테고리에는 아직 등록된 아이템이 없습니다.
                                </p>
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
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    이 페이지는 읽기 전용입니다. 수정이 필요하시면 관리자에게 문의하세요.
                </div>
            </div>
        </div>
    )
}
