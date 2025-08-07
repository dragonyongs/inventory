import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Folder, Package, Users, Share2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import CategoryModal from '../components/CategoryModal'
import { toast } from 'react-hot-toast'

export default function Dashboard() {
    const { user } = useAuthStore()
    const { categories, loading, fetchCategories } = useInventoryStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (user) {
            fetchCategories(user.id)
        }
    }, [user, fetchCategories])

    const handleShareCategory = async (category) => {
        if (!category.shared_token) {
            // 공유 토큰 생성 로직
            const token = Math.random().toString(36).substring(2, 15)
            // 실제로는 서버에서 토큰을 업데이트해야 합니다
        }

        const shareUrl = `${window.location.origin}/shared/${category.shared_token || 'temp-token'}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('공유 링크가 클립보드에 복사되었습니다!')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="py-6">
                    <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {user?.name}님의 재고 관리 현황입니다
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    새 카테고리
                </button>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">

                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Folder className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            총 카테고리
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {categories.length}
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
                                    <Package className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            총 아이템
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {categories.reduce((sum, cat) => sum + (cat.items?.[0]?.count || 0), 0)}
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
                                    <Users className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            관리자
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {categories.filter(cat => cat.manager_id).length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Folder className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {category.name}
                                                </h3>
                                                {/* 공유 상태 라벨 */}
                                                {category.is_shared ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        공유받음
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        소유
                                                    </span>
                                                )}
                                                {/* 권한 레벨 표시 */}
                                                {category.is_shared && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {category.permission_level === 'view' ? '조회' :
                                                            category.permission_level === 'edit' ? '편집' : '관리자'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {category.is_shared ? (
                                                    <span>소유자: {category.owner?.name}</span>
                                                ) : (
                                                    <>
                                                        {category.manager && (
                                                            <span>담당자: {category.manager.name}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleShareCategory(category)}
                                        className="p-2 text-gray-400 hover:text-gray-500"
                                        disabled={category.is_shared && category.permission_level === 'view'}
                                    >
                                        <Share2 className={`h-4 w-4 ${category.is_shared && category.permission_level === 'view' ? 'opacity-50' : ''}`} />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">아이템 수</span>
                                        <span className="font-medium">
                                            {category.items?.[0]?.count || 0}개
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {/* 권한에 따른 버튼 표시 */}
                                    {category.is_shared ? (
                                        // 공유받은 카테고리인 경우
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/category/${category.id}`}
                                                className="flex-1 bg-blue-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-blue-700 hover:bg-blue-100"
                                            >
                                                재고 보기
                                            </Link>
                                            {(category.permission_level === 'edit' || category.permission_level === 'admin') && (
                                                <Link
                                                    to={`/category/${category.id}/manage`}
                                                    className="flex-1 bg-gray-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                                                >
                                                    {category.permission_level === 'admin' ? '설정' : '편집'}
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        // 소유한 카테고리인 경우 (기존과 동일)
                                        <div className="flex space-x-2">
                                            <Link
                                                to={`/category/${category.id}`}
                                                className="flex-1 bg-blue-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-blue-700 hover:bg-blue-100"
                                            >
                                                재고 보기
                                            </Link>
                                            <Link
                                                to={`/category/${category.id}/manage`}
                                                className="flex-1 bg-gray-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                                            >
                                                설정
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {categories.length === 0 && (
                    <div className="text-center py-12">
                        <Folder className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">카테고리가 없습니다</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            첫 번째 카테고리를 만들어 재고 관리를 시작해보세요.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                새 카테고리 만들기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
