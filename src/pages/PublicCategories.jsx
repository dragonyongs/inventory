// src/pages/PublicCategories.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SearchInput from '../components/SearchInput'
import { fetchPublicCategories } from '../lib/categoryUtils'
import PublicExploreStats from '../components/public/PublicExploreStats'
import PublicCategoryExploreList from '../components/public/PublicCategoryExploreList'

const SORTS = [
    { key: 'recent', label: '최신순' },
    { key: 'popular', label: '아이템 많은 순' },
    { key: 'name', label: '이름순' },
]

export default function PublicCategories() {
    const [publicCategories, setPublicCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sort, setSort] = useState('recent')

    useEffect(() => {
        (async () => {
            setLoading(true)
            try {
                const data = await fetchPublicCategories()
                setPublicCategories(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase()
        let list = (publicCategories || []).filter(c => {
            const ownerName = c.owner?.name || c.owner_name || ''
            return (
                c.name?.toLowerCase?.().includes(q) ||
                ownerName.toLowerCase().includes(q)
            )
        })

        // 정렬
        list = [...list].sort((a, b) => {
            const aItems = Array.isArray(a.items) ? (a.items[0]?.count || 0) : Number(a.items_count || 0)
            const bItems = Array.isArray(b.items) ? (b.items?.count || 0) : Number(b.items_count || 0)
            if (sort === 'popular') return bItems - aItems
            if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
            // recent(default)
            return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
        })

        return list
    }, [publicCategories, searchTerm, sort])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <PageHeader
                icon={<Globe className="h-8 w-8 text-blue-600" />}
                title="공개 카테고리"
                description="다른 사용자들의 공개한 카테고리를 탐색해 보세요."
                rightSection={
                    <div className="flex items-center gap-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="px-3 py-2 border rounded-md bg-white text-sm"
                        >
                            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="카테고리 이름이나 소유자로 검색..."
                    className="mb-6"
                />

                <div className="mb-8">
                    <PublicExploreStats categories={filtered} />
                </div>

                <PublicCategoryExploreList
                    categories={filtered}
                    emptyMessage={searchTerm ? '검색 결과가 없습니다' : '공개된 카테고리가 없습니다'}
                />
            </div>
        </div>
    )
}
