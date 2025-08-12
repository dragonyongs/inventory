// src/components/public/PublicCategoryExploreList.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, User, Copy, Eye, Link2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function PublicCategoryExploreList({
    categories = [],
    emptyMessage = '공개된 카테고리가 없습니다',
}) {
    const navigate = useNavigate()
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

    const copyShare = async (cat) => {
        const token = cat.shared_token || cat.share_token
        if (!token) {
            toast('해당 카테고리는 공유 링크가 없습니다.')
            return
        }
        const url = `${window.location.origin}/shared/${token}`
        await navigator.clipboard.writeText(url)
        toast.success('공유 링크 복사됨')
    }

    const preview = (cat) => {
        // 공개보기/프리뷰 라우트가 있다면 거기로, 없으면 읽기전용 상세로
        if (cat.shared_token) {
            navigate(`/shared/${cat.shared_token}`)
        } else if (wsId) {
            navigate(`/workspace/${wsId}/category/${cat.id}?readonly=1`)
        }
    }

    const openInWorkspace = (cat) => {
        if (!wsId) return
        navigate(`/workspace/${wsId}/category/${cat.id}`)
    }

    return (
        <div className="divide-y rounded-lg border bg-white overflow-hidden">
            {categories.map((cat) => {
                const itemsCount = Array.isArray(cat.items) ? (cat.items[0]?.count || 0) : Number(cat.items_count || 0)
                const ownerName = cat.owner?.name || cat.owner_name || '알 수 없음'
                const tags = Array.isArray(cat.tags) ? cat.tags : []

                return (
                    <div key={cat.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            {/* 좌측: 기본 정보 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-blue-500" />
                                    <h3 className="font-medium text-gray-900 truncate">{cat.name}</h3>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-gray-400" />
                                        {ownerName}
                                    </span>
                                    <span>아이템 {itemsCount}개</span>
                                    {cat.updated_at && (
                                        <span>업데이트 {new Date(cat.updated_at).toLocaleDateString()}</span>
                                    )}
                                </div>

                                {tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {tags.slice(0, 6).map((t, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 우측: 액션 */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button
                                    onClick={() => preview(cat)}
                                    className="px-2.5 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                >
                                    <Eye className="h-4 w-4" />
                                    미리보기
                                </button>
                                <button
                                    onClick={() => copyShare(cat)}
                                    className="px-2.5 py-1.5 rounded-md border text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                >
                                    <Link2 className="h-4 w-4" />
                                    링크복사
                                </button>
                                <button
                                    onClick={() => openInWorkspace(cat)}
                                    className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    열기
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
