import React, { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { toast } from 'react-hot-toast'
import CategoryStats from '../components/CategoryStats'
import CategoryList from '../components/CategoryList'

export default function Inventory() {
    const { user } = useAuthStore()
    const { categories, fetchCategories } = useInventoryStore()

    useEffect(() => {
        if (user) fetchCategories(user.id)
    }, [user, fetchCategories])

    // 공유 권한/토큰 등 정책 처리만 공통 함수화 추천!
    const handleShareCategory = (category) => {
        if (category.is_shared && category.permission_level === 'view') {
            toast.error('공유 권한이 없습니다.')
            return
        }
        if (!category.shared_token) {
            toast.info('카테고리 설정에서 공유 링크를 생성하세요.')
            return
        }
        const shareUrl = `${window.location.origin}/shared/${category.shared_token}`
        navigator.clipboard.writeText(shareUrl)
        toast.success('공유 링크가 클립보드에 복사되었습니다!')
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="py-6">
                    <h1 className="text-2xl font-bold text-gray-900">전체 재고 관리</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {user?.name}님의 카테고리 {categories.length}개
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 통계 카드 */}
                <CategoryStats categories={categories} type="inventory" />

                {/* 카테고리 리스트(통합) */}
                <CategoryList
                    categories={categories}
                    onShare={handleShareCategory}
                />
            </div>
        </div>
    )
}
