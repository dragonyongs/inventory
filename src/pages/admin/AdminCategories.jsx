import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import SearchInput from '../../components/SearchInput'
import { useWorkspaceStore } from '../../store/workspaceStore'

import { ArrowLeft, Activity, Package, Trash2, Eye, EyeOff, Share2, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast'

export default function AdminCategories() {
    const { currentWorkspace } = useWorkspaceStore()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // all, public, private, shared

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('inventory_categories')
                .select(`
          *,
            owner:inventory_users!owner_id(id, name, username),
            manager:inventory_users!manager_id(name),
            items:inventory_items(count),
            permissions:inventory_category_permissions(count)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.error('카테고리 목록을 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const togglePublicStatus = async (categoryId, currentStatus) => {
        try {
            const updateData = { is_public: !currentStatus }

            // 공개로 변경하면서 shared_token이 없으면 생성
            if (!currentStatus) {
                const category = categories.find(c => c.id === categoryId)
                if (!category.shared_token) {
                    updateData.shared_token = Math.random().toString(36).substring(2, 15) +
                        Math.random().toString(36).substring(2, 15)
                }
            }

            const { error } = await supabase
                .from('inventory_categories')
                .update(updateData)
                .eq('id', categoryId)

            if (error) throw error

            toast.success(`카테고리가 ${!currentStatus ? '공개' : '비공개'}로 변경되었습니다.`)
            fetchCategories()
        } catch (error) {
            console.error('Error updating category visibility:', error)
            toast.error('카테고리 공개 상태 변경 중 오류가 발생했습니다.')
        }
    }

    const deleteCategory = async (categoryId) => {
        if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까? 모든 아이템과 권한도 함께 삭제됩니다.')) {
            try {
                const { error } = await supabase
                    .from('inventory_categories')
                    .delete()
                    .eq('id', categoryId)

                if (error) throw error

                toast.success('카테고리가 삭제되었습니다.')
                fetchCategories()
            } catch (error) {
                console.error('Error deleting category:', error)
                toast.error('카테고리 삭제 중 오류가 발생했습니다.')
            }
        }
    }

    const generateShareLink = async (category) => {
        let shareToken = category.shared_token

        if (!shareToken) {
            shareToken = Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15)

            try {
                const { error } = await supabase
                    .from('inventory_categories')
                    .update({ shared_token: shareToken })
                    .eq('id', category.id)

                if (error) throw error
                fetchCategories()
            } catch (error) {
                toast.error('공유 링크 생성 중 오류가 발생했습니다.')
                return
            }
        }

        const shareUrl = `${window.location.origin}/shared/${shareToken}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('공유 링크가 클립보드에 복사되었습니다!')
    }

    const filteredCategories = categories.filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())

        switch (filterType) {
            case 'public':
                return matchesSearch && category.is_public
            case 'private':
                return matchesSearch && !category.is_public
            case 'shared':
                return matchesSearch && (category.permissions?.[0]?.count > 0)
            default:
                return matchesSearch
        }
    })

    const stats = {
        total: categories.length,
        public: categories.filter(c => c.is_public).length,
        private: categories.filter(c => !c.is_public).length,
        shared: categories.filter(c => c.permissions?.[0]?.count > 0).length,
        totalItems: categories.reduce((sum, c) => sum + (c.items?.[0]?.count || 0), 0)
    }

    const mappedCategories = filteredCategories.map(category => ({
        id: category.id,
        name: category.name,
        owner: category.owner,
        is_public: category.is_public,
        itemCount: Array.isArray(category.items) ? (category.items[0]?.count || 0) : 0,
        permissionCount: Array.isArray(category.permissions) ? (category.permissions?.count || 0) : 0,
        created_at: category.created_at,
        manager: category.manager,
        shared_token: category.shared_token,
    }));

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
                title="카테고리 관리"
                description={`전체 ${filteredCategories.length}개의 카테고리`}
                icon={
                    <Link to="/" className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                }
                rightSection={(
                    <button
                        onClick={fetchCategories}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        새로고침
                    </button>
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 검색 및 필터 */}
                <SearchInput
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="카테고리명이나 소유자로 검색..."
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
                                <option value="public">공개</option>
                                <option value="private">비공개</option>
                                <option value="shared">공유됨</option>
                            </select>
                        </>
                    }
                />

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                    <StatCard
                        icon={<Package className="h-6 w-6 text-blue-500" />}
                        label="총 카테고리"
                        value={stats.total}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<Eye className="h-6 w-6 text-green-500" />}
                        label="공개"
                        value={stats.public}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<EyeOff className="h-6 w-6 text-gray-500" />}
                        label="비공개"
                        value={stats.private}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<Share2 className="h-6 w-6 text-purple-500" />}
                        label="공유됨"
                        value={stats.shared}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                    <StatCard
                        icon={<Package className="h-6 w-6 text-orange-500" />}
                        label="총 아이템"
                        value={stats.totalItems}
                        valueClassName="text-2xl font-bold text-gray-900"
                    />
                </div>

                {/* 카테고리 테이블 */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            카테고리
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            소유자
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            상태
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            아이템 수
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            공유됨
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            생성일
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            작업
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCategories.map((category) => (
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <Package className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                                        {category.manager && (
                                                            <div className="text-sm text-gray-500">담당자: {category.manager.name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-white">
                                                                {category.owner?.name?.charAt(0)?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{category.owner?.name}</div>
                                                        <div className="text-sm text-gray-500">@{category.owner?.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {category.is_public ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        공개
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        비공개
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {category.items?.[0]?.count || 0}개
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {category.permissions?.[0]?.count || 0}명
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(category.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Link
                                                        to={`/workspace/${currentWorkspace?.id}/category/${category.id}`}
                                                        className="p-2 rounded-md text-blue-600 hover:text-blue-900"
                                                        title="카테고리 보기"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => generateShareLink(category)}
                                                        className="p-2 rounded-md text-purple-600 hover:text-purple-900"
                                                        title="공유 링크 복사"
                                                    >
                                                        <Share2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => togglePublicStatus(category.id, category.is_public)}
                                                        className={`p-2 rounded-md ${category.is_public ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                                                        title={category.is_public ? '비공개로 변경' : '공개로 변경'}
                                                    >
                                                        {category.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCategory(category.id)}
                                                        className="p-2 rounded-md text-red-600 hover:text-red-900"
                                                        title="카테고리 삭제"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm || filterType !== 'all' ? '검색 결과가 없습니다' : '카테고리가 없습니다'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm || filterType !== 'all' ? '다른 검색어나 필터를 사용해보세요.' : '아직 생성된 카테고리가 없습니다.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
