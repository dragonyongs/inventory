import React, { useEffect, useState } from 'react'
import { Globe, Folder, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryStats from '../components/CategoryStats'
import CategoryList from '../components/CategoryList'
import PageHeader from '../components/PageHeader'
import SearchInput from '../components/SearchInput'
import { fetchPublicCategories } from '../lib/categoryUtils'

export default function PublicCategories() {
    const [publicCategories, setPublicCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                const data = await fetchPublicCategories()
                setPublicCategories(data)
            } catch (error) {
                console.error('Error fetching public categories:', error)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const filteredCategories = publicCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <PageHeader
                icon={<Globe className="h-8 w-8 text-blue-600" />}
                title="공개 카테고리"
                description="다른 사용자들이 공개한 재고 카테고리를 둘러보세요"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <SearchInput
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="카테고리 이름이나 소유자로 검색..."
                    className="mb-6"
                />

                {/* Stats */}
                <div className="mb-8">
                    <CategoryStats categories={filteredCategories} type="dashboard" />
                </div>

                {/* Category List */}
                <CategoryList
                    categories={filteredCategories}
                    emptyMessage={searchTerm ? '검색 결과가 없습니다' : '공개된 카테고리가 없습니다'}
                />
            </div>
        </div>
    )
}
