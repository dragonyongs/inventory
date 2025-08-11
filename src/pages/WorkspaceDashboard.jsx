// src/pages/WorkspaceDashboard.jsx
import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useInventoryStore } from '../store/inventoryStore'
import CategoryStats from '../components/CategoryStats'
import CategoryList from '../components/CategoryList'
import CategoryModal from '../components/CategoryModal'
import { copyCategoryShareLink } from '../lib/categoryUtils'
import { toast } from 'react-hot-toast'

export default function WorkspaceDashboard() {
    const { user } = useAuthStore()
    const { currentWorkspace, loading: wsLoading } = useWorkspaceStore()
    const { categories, loading, fetchCategories } = useInventoryStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (!user?.id) return
        if (!currentWorkspace?.id) return
        fetchCategories(user.id)
    }, [user?.id, currentWorkspace?.id, fetchCategories])

    if (wsLoading || !currentWorkspace?.id) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const handleShareCategory = (category) =>
        copyCategoryShareLink(category, { toast })

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
                    <p className="text-sm text-gray-500">{user?.name}님의 대시보드</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    새 카테고리
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 py-2 space-y-8">
                <CategoryStats categories={categories} type="dashboard" />
                <CategoryList
                    categories={categories}
                    onShare={handleShareCategory}
                    onClickNew={() => setIsModalOpen(true)}
                />
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
