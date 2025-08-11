import React from 'react'
import { Link } from 'react-router-dom'
import { Folder, Share2, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'

/**
 * CategoryList
 * @param {Array} categories         // 카테고리 배열
 * @param {String} type              // "owned" | "shared" | "public" | "dashboard"
 * @param {Function} onShare         // (category) => void, 공유버튼 클릭 핸들러
 * @param {Function} onSelect        // (category) => void, 상세 보기 등
 * @returns
 */
export default function CategoryList({
    categories,
    type = 'owned',
    onShare,
    onSelect,
    emptyMessage = '카테고리가 없습니다',
    showManage = true,
    showStats = false
}) {
    const { user } = useAuthStore()
    const myUserId = user?.id

    const { currentWorkspace } = useWorkspaceStore()
    const wsId = currentWorkspace?.id

    // 유틸: 라벨 결정
    function getOwnershipLabel(category) {
        if (category.owner_id === myUserId) return '소유'
        if (category.is_shared) return '공유받음'
        if (category.is_public) return '공개'
        return ''
    }

    if (!categories?.length) {
        return (
            <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => {
                const ownershipLabel = getOwnershipLabel(category)
                const isOwner = category.owner_id === myUserId
                const sharedRights = category.is_shared && (category.permission_level === 'edit' || category.permission_level === 'admin')
                // 공개-only: owner가 아니고 공유도 아닌데 is_public만 true
                const isPublicOnly = category.is_public && !isOwner && !category.is_shared

                return (
                    <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Folder className={`h-8 w-8 ${category.is_shared ? "text-green-500" : "text-blue-500"}`} />
                                    <div className="ml-4">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                                            {/* 상태 라벨 */}
                                            {ownershipLabel && (
                                                <span className={`
                                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${ownershipLabel === '소유' && 'bg-blue-100 text-blue-800'}
                                                    ${ownershipLabel === '공유받음' && 'bg-green-100 text-green-800'}
                                                    ${ownershipLabel === '공개' && 'bg-yellow-100 text-yellow-800'}
                                                `}>
                                                    {ownershipLabel}
                                                </span>
                                            )}
                                            {/* 공유 상세 권한 */}
                                            {category.is_shared && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {category.permission_level === 'view'
                                                        ? '조회'
                                                        : category.permission_level === 'edit'
                                                            ? '편집'
                                                            : '관리자'}
                                                </span>
                                            )}
                                            {/* 공개만: '조회전용' 세부라벨도 추가할 수 있음 */}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-500">
                                            {category.is_shared ? (
                                                <span>소유자: {category.owner?.name}</span>
                                            ) : (
                                                <>
                                                    {category.manager && <span>담당자: {category.manager.name}</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {onShare && (
                                    <button
                                        onClick={() => onShare(category)}
                                        className={`p-2 ${category.is_shared && category.permission_level === 'view' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-500'}`}
                                        disabled={category.is_shared && category.permission_level === 'view'}
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-gray-500">아이템 수</span>
                                <span className="font-medium">{category.items?.[0]?.count || 0}개</span>
                            </div>
                            <div className="mt-6 flex space-x-2">
                                <Link
                                    to={`/workspace/${wsId}/category/${category.id}`}
                                    className={`flex-1 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium 
                                        ${category.is_shared ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                                            isPublicOnly ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100' :
                                                'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                    재고 보기
                                </Link>
                                {/* 설정/편집: 오로지 owner, or 공유받은 edit/admin일 때만! */}
                                {showManage &&
                                    (
                                        isOwner ||
                                        sharedRights
                                    ) && (
                                        <Link
                                            to={`/workspace/${wsId}/category/${category.id}/manage`}
                                            className="flex-1 bg-gray-50 border border-transparent rounded-md py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-100"
                                        >
                                            {(category.is_shared && category.permission_level !== 'admin') ? "편집" : "설정"}
                                        </Link>
                                    )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}