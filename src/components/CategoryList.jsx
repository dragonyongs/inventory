// src/components/CategoryList.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Folder, ChevronRight, Settings as SettingsIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'

export default function CategoryList({
    categories,
    type = 'owned',
    onShare,          // 더 이상 카드에서 직접 사용하지 않음(상세에서 처리 권장)
    onSelect,         // 필요 시 외부에서 전체 카드 클릭 핸들
    emptyMessage = '카테고리가 없습니다',
    showManage = true,
}) {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const myUserId = user?.id
    const { currentWorkspace } = useWorkspaceStore()
    const wsId = currentWorkspace?.id

    if (!categories?.length) {
        return (
            <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-600">{emptyMessage}</h3>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
                const isOwner = category.owner_id === myUserId
                const sharedRights =
                    category.is_shared &&
                    (category.permission_level === 'edit' || category.permission_level === 'admin')

                const canManage = showManage && (isOwner || sharedRights)

                const itemsCount =
                    Array.isArray(category.items) ? (category.items[0]?.count || 0) : Number(category.items_count || 0)

                const goDetail = () => {
                    if (onSelect) onSelect(category)
                    else navigate(`/workspace/${wsId}/category/${category.id}`)
                }

                return (
                    <div
                        key={category.id}
                        className="group bg-white border rounded-lg hover:shadow-md transition-shadow overflow-hidden"
                    >
                        {/* 헤더: 아이콘 + 이름 + 이동 화살표 */}
                        <button
                            onClick={goDetail}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                            <div className="flex items-center min-w-0">
                                <Folder className={`h-5 w-5 flex-shrink-0 ${category.is_shared ? 'text-green-500' : 'text-blue-500'}`} />
                                <span className="ml-3 font-medium text-gray-900 truncate">{category.name}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                        </button>

                        {/* 바디: 아이템 수 + 보조 버튼들 */}
                        <div className="px-4 pb-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <div>
                                    아이템 수
                                    <span className="ml-1 font-semibold text-gray-900">{itemsCount}</span>개
                                </div>

                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/workspace/${wsId}/category/${category.id}`}
                                        className="px-2.5 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50"
                                        aria-label="재고 보기"
                                    >
                                        보기
                                    </Link>

                                    {canManage && (
                                        <Link
                                            to={`/workspace/${wsId}/category/${category.id}/manage`}
                                            className="px-2.5 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                        >
                                            <SettingsIcon className="h-4 w-4" />
                                            설정
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
