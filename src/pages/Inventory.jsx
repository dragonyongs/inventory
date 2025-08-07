import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Folder, Share2, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { toast } from 'react-hot-toast'

export default function Inventory() {
    const { user } = useAuthStore()
    const { categories, fetchCategories } = useInventoryStore()

    useEffect(() => {
        if (user) {
            fetchCategories(user.id)
        }
    }, [user, fetchCategories])

    const handleShareCategory = async (category) => {
        // 조회 권한만 있는 경우 공유 기능 제한
        if (category.is_shared && category.permission_level === 'view') {
            toast.error('공유 권한이 없습니다.')
            return
        }

        if (!category.shared_token) {
            // 공유 토큰 생성 로직 (실제로는 서버에서 처리)
            const token = Math.random().toString(36).substring(2, 15)
            // 여기서는 임시로 표시만, 실제로는 CategoryManage에서 처리
            toast.info('카테고리 설정에서 공유 링크를 생성하세요.')
            return
        }

        const shareUrl = `${window.location.origin}/shared/${category.shared_token}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('공유 링크가 클립보드에 복사되었습니다!')
    }

    // 카테고리를 소유/공유 상태별로 분류
    const ownedCategories = categories.filter(cat => !cat.is_shared)
    const sharedCategories = categories.filter(cat => cat.is_shared)

    return (
        <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="py-6">
                    <h1 className="text-2xl font-bold text-gray-900">전체 재고 관리</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        소유 {ownedCategories.length}개, 공유받음 {sharedCategories.length}개 카테고리
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 통계 카드 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Folder className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            소유한 카테고리
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {ownedCategories.length}개
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
                                    <Share2 className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            공유받은 카테고리
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {sharedCategories.length}개
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
                                    <Package className="h-6 w-6 text-purple-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            총 아이템
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {categories.reduce((sum, cat) => sum + (cat.items?.[0]?.count || 0), 0)}개
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 소유한 카테고리 섹션 */}
                {ownedCategories.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <Folder className="h-5 w-5 text-blue-500 mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">소유한 카테고리</h2>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {ownedCategories.length}개
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {ownedCategories.map((category) => (
                                <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
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
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            소유
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {category.items?.[0]?.count || 0}개 아이템
                                                        {category.manager && (
                                                            <span className="ml-2">• 담당자: {category.manager.name}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleShareCategory(category)}
                                                className="p-2 text-gray-400 hover:text-gray-500"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-6 flex space-x-2">
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 공유받은 카테고리 섹션 */}
                {sharedCategories.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <Share2 className="h-5 w-5 text-green-500 mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">공유받은 카테고리</h2>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {sharedCategories.length}개
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {sharedCategories.map((category) => (
                                <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border-l-4 border-green-400">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Folder className="h-8 w-8 text-green-500" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {category.name}
                                                        </h3>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            공유받음
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {category.permission_level === 'view' ? '조회' :
                                                                category.permission_level === 'edit' ? '편집' : '관리자'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        <p>{category.items?.[0]?.count || 0}개 아이템</p>
                                                        <div className="flex items-center mt-1">
                                                            <User className="h-3 w-3 mr-1" />
                                                            <span>소유자: {category.owner?.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleShareCategory(category)}
                                                className={`p-2 ${category.permission_level === 'view' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-500'}`}
                                                disabled={category.permission_level === 'view'}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-6">
                                            {/* 권한에 따른 버튼 표시 */}
                                            <div className="flex space-x-2">
                                                <Link
                                                    to={`/category/${category.id}`}
                                                    className="flex-1 bg-green-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-green-700 hover:bg-green-100"
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

                                            {/* 조회 전용 권한 표시 */}
                                            {category.permission_level === 'view' && (
                                                <div className="mt-2 text-center">
                                                    <span className="text-xs text-gray-500">조회 전용 권한</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 카테고리가 없는 경우 */}
                {categories.length === 0 && (
                    <div className="text-center py-12">
                        <Folder className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">카테고리가 없습니다</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            첫 번째 카테고리를 만들어보세요.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                대시보드로 이동
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
