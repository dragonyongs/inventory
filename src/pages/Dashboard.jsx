import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Folder, Package, Users, Share2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useInventoryStore } from '../store/inventoryStore'
import PageHeader from '../components/PageHeader'
import CategoryModal from '../components/CategoryModal'
import CategoryStats from '../components/CategoryStats'
import CategoryList from '../components/CategoryList'
import { copyCategoryShareLink } from '../lib/categoryUtils'
import { toast } from 'react-hot-toast'

export default function Dashboard() {
    const { user } = useAuthStore()
    const { categories, loading, fetchCategories } = useInventoryStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (user) {
            fetchCategories(user.id)
        }
    }, [user, fetchCategories])

    const handleShareCategory = (category) => copyCategoryShareLink(category, { toast })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader
                title="대시보드"
                description={`${user?.name}님의 재고 관리 현황입니다`}
                // icon={<PieChart className="h-6 w-6 text-blue-500" />}
                rightSection={(
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        새 카테고리
                    </button>
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">

                {/* Stats */}
                <CategoryStats categories={categories} type="dashboard" />

                {/* Categories Grid */}
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
