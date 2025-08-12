// src/pages/workspace/Inventory.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import InventoryTable from '../components/inventory/InventoryTable'

export default function Inventory() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { currentWorkspace } = useWorkspaceStore()
    const wsId = currentWorkspace?.id
    const { categories, fetchCategories } = useInventoryStore()

    const [query, setQuery] = useState('')

    useEffect(() => {
        if (user?.id) fetchCategories(user.id)
    }, [user?.id, fetchCategories])

    const filtered = useMemo(() => {
        if (!query) return categories
        const q = query.toLowerCase()
        return (categories || []).filter(
            (c) =>
                c?.name?.toLowerCase?.().includes(q) ||
                c?.description?.toLowerCase?.().includes(q)
        )
    }, [categories, query])

    // onView: 카테고리 상세 보기로 이동
    const handleView = (category) => {
        if (!category?.id || !wsId) {
            toast.error('이동할 카테고리 정보를 찾을 수 없습니다.')
            return
        }
        // 필요 시 로깅
        // console.debug('[Inventory] view category', category.id)
        navigate(`/workspace/${wsId}/category/${category.id}`)
    }

    // onManage: 권한 체크 후 설정 페이지로 이동
    const handleManage = (category) => {
        if (!category?.id || !wsId) {
            toast.error('설정 페이지 정보를 찾을 수 없습니다.')
            return
        }
        const isOwner = category.owner_id === user?.id
        const canEdit =
            isOwner ||
            (category.is_shared &&
                (category.permission_level === 'edit' || category.permission_level === 'admin'))

        if (!canEdit) {
            toast.error('이 카테고리를 관리할 권한이 없습니다.')
            return
        }

        // 필요 시 로깅
        // console.debug('[Inventory] manage category', category.id)
        navigate(`/workspace/${wsId}/category/${category.id}/manage`)
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="py-6">
                    <h1 className="text-2xl font-bold text-gray-900">전체 재고 관리</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {user?.name}님의 카테고리 {categories?.length || 0}개
                    </p>
                </div>

                {/* 검색 바 (선택) */}
                <div className="w-72">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="카테고리 검색..."
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <InventoryTable
                    categories={filtered}
                    onView={handleView}
                    onManage={handleManage}
                    showOwner
                    showPermission
                />
            </div>
        </div>
    )
}
