import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Eye, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import CategoryStats from '../components/CategoryStats'
import ItemTable from '../components/ItemTable'

export default function SharedView() {
    const { token } = useParams()
    const [category, setCategory] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => { fetchSharedData() }, [token])

    const fetchSharedData = async () => {
        try {
            setLoading(true)
            const { data: categoryData, error: categoryError } = await supabase
                .from('inventory_categories')
                .select(`
          *,
          owner:inventory_users!owner_id(name, username),
          manager:inventory_users!manager_id(name)
        `)
                .eq('shared_token', token)
                .single()
            if (categoryError) throw new Error('공유된 카테고리를 찾을 수 없습니다.')
            if (!categoryData?.is_public && !categoryData?.shared_token)
                throw new Error('이 카테고리는 비공개 상태입니다.')
            setCategory(categoryData)

            const { data: itemsData, error: itemsError } = await supabase
                .from('inventory_items')
                .select(`
          *,
          added_by_user:inventory_users!added_by(name)
        `)
                .eq('category_id', categoryData.id)
                .order('name')
            if (itemsError) throw new Error('아이템을 불러오는 중 오류가 발생했습니다.')
            setItems(itemsData || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                </div>
            </div>
        )
    }
    if (!category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="mt-4 text-xl font-semibold text-gray-900">카테고리를 찾을 수 없습니다</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 1. Header */}
            <PageHeader
                icon={<Eye className="h-8 w-8 text-blue-600" />}
                title={category.name}
                description={
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>소유자: {category.owner?.name}</span>
                        {category.manager && <span>담당자: {category.manager.name}</span>}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category.is_public ? '공개됨' : '공유됨'}
                        </span>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 2. Stats */}
                <div className="mb-8">
                    <CategoryStats items={items} type="category" />
                </div>

                {/* 3. Item Table */}
                <ItemTable
                    items={items}
                    userPermission="view" // 공유 뷰는 조회권한만
                />

                <div className="mt-8 text-center text-sm text-gray-500">
                    이 페이지는 읽기 전용입니다. 수정이 필요하시면 관리자에게 문의하세요.
                </div>
            </div>
        </div>
    )
}
