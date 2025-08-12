// src/pages/workspace/WorkspaceDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Package,
    Plus,
    Search,
    QrCode,
    Settings,
    ChevronRight,
    AlertTriangle,
    TriangleAlert,
    ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useInventoryStore } from '../store/inventoryStore'
import WorkspaceSwitcher from '../components/workspace/WorkspaceSwitcher'
// import CategoryList from '../components/CategoryList'
import DashboardCategoryGrid from '../components/dashboard/DashboardCategoryGrid'
import CategoryModal from '../components/CategoryModal'
import { copyCategoryShareLink } from '../lib/categoryUtils'
import { toast } from 'react-hot-toast'

export default function WorkspaceDashboard() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { currentWorkspace, workspaces, loading: wsLoading, setCurrentWorkspace } = useWorkspaceStore()
    const { categories, fetchCategories } = useInventoryStore()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [switcherOpen, setSwitcherOpen] = useState(false)

    useEffect(() => {
        if (!user?.id || !currentWorkspace?.id) return
        fetchCategories(user.id)
    }, [user?.id, currentWorkspace?.id, fetchCategories])

    const wsId = currentWorkspace?.id

    const stats = useMemo(() => {
        const list = Array.isArray(categories) ? categories : []
        const sum = (key) => list.reduce((acc, c) => acc + (Number(c?.[key]) || 0), 0)
        const totalItems = list.reduce((acc, c) => {
            const count = Array.isArray(c?.items)
                ? Number(c.items[0]?.count) || 0
                : Number(c?.items_count) || 0
            return acc + count
        }, 0)
        return {
            totalItems,
            warning: sum('warning_count'),
            low: sum('low_count'),
            expired: sum('expired_count'),
        }
    }, [categories])

    const filteredCategories = useMemo(() => {
        if (!search) return categories
        const q = search.toLowerCase()
        return (categories || []).filter(
            (c) =>
                c?.name?.toLowerCase?.().includes(q) ||
                c?.description?.toLowerCase?.().includes(q)
        )
    }, [categories, search])

    if (wsLoading || !currentWorkspace?.id) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const changeWorkspace = (ws) => {
        if (!ws?.id || ws.id === currentWorkspace.id) return
        setCurrentWorkspace(ws)
        setSwitcherOpen(false)
        navigate(`/workspace/${ws.id}/dashboard`, { replace: true })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-20 bg-white border-b">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <WorkspaceSwitcher />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            새 카테고리
                        </button>
                        <button
                            onClick={() => toast('QR 스캔은 추후 지원 예정')}
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                            aria-label="QR 스캔"
                            title="QR 스캔"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => toast('개발 예정')}
                            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                            aria-label="설정"
                            title="설정"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* 워크스페이스 전환 칩(선택): 필요 시 유지, 아니면 제거해도 됨 */}
                <section className="flex gap-2 overflow-x-auto pb-1">
                    {(workspaces || []).map((ws) => (
                        <button
                            key={ws.id}
                            onClick={() => changeWorkspace(ws)}
                            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${ws.id === currentWorkspace.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {ws.name}
                        </button>
                    ))}
                </section>

                {/* 상단 스탯 */}
                <section className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <StatCard label="총 물품" value={stats.totalItems} />
                    <StatCard
                        label="주의 필요"
                        value={stats.warning}
                        color="text-amber-600"
                        Icon={AlertTriangle}
                    />
                    <StatCard
                        label="재고 부족"
                        value={stats.low}
                        color="text-red-600"
                        Icon={TriangleAlert}
                    />
                    <StatCard label="만료" value={stats.expired} color="text-rose-600" />
                </section>

                {/* 검색 + 액션 */}
                <section className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="카테고리 검색..."
                            className="w-full pl-9 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="sm:hidden inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" /> 새 카테고리
                        </button>
                        <button
                            onClick={() => toast('QR 스캔은 추후 지원 예정')}
                            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 bg-white"
                        >
                            <QrCode className="w-4 h-4" /> QR 스캔
                        </button>
                        <button
                            onClick={() => navigate(`/workspace/${wsId}/inventory`)}
                            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 bg-white"
                        >
                            재고 관리 <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                {/* 카테고리 */}
                <section className="bg-white rounded-lg shadow-sm border">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h2 className="font-semibold">카테고리</h2>
                        <div className="text-sm text-gray-500">
                            총 {filteredCategories?.length || 0}개
                        </div>
                    </div>
                    <div className="p-4">
                        <DashboardCategoryGrid
                            categories={filteredCategories}
                        // onSelect={(cat) => { ...optional }}
                        />
                    </div>
                </section>
            </main>

            {/* 모달 */}
            <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}

/* 보조 컴포넌트 */
function StatCard({ label, value, color = 'text-gray-900', Icon }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className={`text-2xl font-bold ${color}`}>{Number(value) || 0}</div>
                </div>
                {Icon ? <Icon className={`w-6 h-6 ${color}`} /> : null}
            </div>
        </div>
    )
}
