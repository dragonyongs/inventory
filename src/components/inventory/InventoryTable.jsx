// src/components/inventory/InventoryTable.jsx
import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Folder, Settings as SettingsIcon } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { useAuthStore } from '../../store/authStore'

function CellBadge({ children }) {
    return <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{children}</span>
}

function formatDate(input) {
    if (!input) return '-'
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return '-'
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

export default function InventoryTable({
    categories = [],
    onView,
    onManage,
    showOwner = true,
    showPermission = true,
}) {
    const navigate = useNavigate()
    const { currentWorkspace } = useWorkspaceStore()
    const { user } = useAuthStore()
    const myUserId = user?.id
    const wsId = currentWorkspace?.id

    const rows = useMemo(() => {
        return (Array.isArray(categories) ? categories : []).map((c) => {
            const itemsCount = Array.isArray(c.items) ? (c.items?.count || 0) : Number(c.items_count || 0)
            const isOwner = c.owner_id === myUserId
            const sharedRights = c.is_shared && (c.permission_level === 'edit' || c.permission_level === 'admin')
            const canManage = isOwner || sharedRights
            return {
                ...c,
                itemsCount,
                isOwner,
                canManage,
            }
        })
    }, [categories, myUserId])

    const handleView = (cat) => {
        if (onView) onView(cat)
        else navigate(`/workspace/${wsId}/category/${cat.id}`)
    }
    const handleManage = (cat) => {
        if (onManage) onManage(cat)
        else navigate(`/workspace/${wsId}/category/${cat.id}/manage`)
    }

    if (!rows.length) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border">
                <Folder className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-600">등록된 카테고리가 없습니다</h3>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-medium text-nowrap">카테고리명</th>
                            <th className="px-4 py-3 font-medium text-nowrap">아이템 수</th>
                            {showOwner && <th className="px-4 py-3 font-medium text-nowrap">소유자</th>}
                            {showPermission && <th className="px-4 py-3 font-medium text-nowrap">권한</th>}
                            <th className="px-4 py-3 font-medium text-nowrap">마지막 수정</th>
                            <th className="px-4 py-3 font-medium w-48 text-nowrap">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleView(cat)}
                                        className="inline-flex items-center gap-2 text-gray-900 hover:underline"
                                        title="카테고리 보기"
                                    >
                                        <Folder className={`h-4 w-4 ${cat.is_shared ? 'text-green-500' : 'text-blue-500'}`} />
                                        <span className="truncate max-w-[28ch]">{cat.name}</span>
                                    </button>
                                </td>
                                <td className="px-4 py-3">{cat.itemsCount}개</td>
                                {showOwner && (
                                    <td className="px-4 py-3">
                                        {cat.owner_name || (cat.isOwner ? '나' : '-')}
                                    </td>
                                )}
                                {showPermission && (
                                    <td className="px-4 py-3">
                                        <CellBadge>{cat.permission_level || (cat.isOwner ? 'owner' : 'view')}</CellBadge>
                                    </td>
                                )}
                                <td className="px-4 py-3">{formatDate(cat.updated_at || cat.created_at)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleView(cat)}
                                            className="px-2.5 py-1.5 rounded-md border text-nowrap text-gray-700 hover:bg-gray-50"
                                        >
                                            보기
                                        </button>
                                        {cat.canManage && (
                                            <button
                                                onClick={() => handleManage(cat)}
                                                className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-nowrap hover:bg-blue-700 inline-flex items-center gap-1"
                                            >
                                                <SettingsIcon className="h-4 w-4" />
                                                설정
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
