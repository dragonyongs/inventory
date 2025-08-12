// src/components/dashboard/DashboardCategoryGrid.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, ChevronRight, AlertTriangle, TriangleAlert, Timer } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

function WBadge({ children, color = 'gray' }) {
    const colors = {
        gray: 'bg-gray-100 text-gray-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        rose: 'bg-rose-100 text-rose-700',
        green: 'bg-green-100 text-green-700',
    }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${colors[color]}`}>
            {children}
        </span>
    )
}

export default function DashboardCategoryGrid({ categories = [], onSelect }) {
    const navigate = useNavigate()
    const { currentWorkspace } = useWorkspaceStore()
    const wsId = currentWorkspace?.id

    const list = Array.isArray(categories) ? categories : []

    const cards = useMemo(() => {
        return list.map((c) => {
            const itemsCount = Array.isArray(c.items) ? (c.items[0]?.count || 0) : Number(c.items_count || 0)
            const warning = Number(c.warning_count || 0)
            const low = Number(c.low_count || 0)
            const expired = Number(c.expired_count || 0)
            return {
                ...c,
                itemsCount,
                warning,
                low,
                expired,
                hasAlert: warning > 0 || low > 0 || expired > 0,
            }
        })
    }, [list])

    if (!cards.length) {
        return (
            <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-600">카테고리가 없습니다</h3>
            </div>
        )
    }

    const goDetail = (cat) => {
        if (onSelect) onSelect(cat)
        else navigate(`/workspace/${wsId}/category/${cat.id}`)
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((cat) => (
                <div
                    key={cat.id}
                    className="group bg-white border rounded-lg hover:shadow-sm transition-shadow overflow-hidden"
                >
                    <button
                        onClick={() => goDetail(cat)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                        <div className="flex items-center min-w-0 gap-3">
                            <Folder className={`h-6 w-6 flex-shrink-0 ${cat.is_shared ? 'text-green-500' : 'text-blue-500'}`} />
                            <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">{cat.name}</div>
                                <div className="text-xs text-gray-500">{cat.itemsCount}개 아이템</div>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                    </button>

                    {/* 경고/상태 배지 - 있을 때만 */}
                    {(cat.warning > 0 || cat.low > 0 || cat.expired > 0) && (
                        <div className="px-4 pb-3 flex flex-wrap gap-2">
                            {cat.warning > 0 && (
                                <WBadge color="amber">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                    주의 {cat.warning}
                                </WBadge>
                            )}
                            {cat.low > 0 && (
                                <WBadge color="red">
                                    <TriangleAlert className="w-3.5 h-3.5 mr-1" />
                                    재고 부족 {cat.low}
                                </WBadge>
                            )}
                            {cat.expired > 0 && (
                                <WBadge color="rose">
                                    <Timer className="w-3.5 h-3.5 mr-1" />
                                    만료 {cat.expired}
                                </WBadge>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
