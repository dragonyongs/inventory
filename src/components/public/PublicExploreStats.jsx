// src/components/public/PublicExploreStats.jsx
import React, { useMemo } from 'react'
import StatCard from '../StatCard'
import { FolderOpen, Package, Users } from 'lucide-react'

export default function PublicExploreStats({ categories = [] }) {
    const { totalCats, totalItems, totalOwners } = useMemo(() => {
        const list = Array.isArray(categories) ? categories : []
        const owners = new Set()
        let items = 0
        list.forEach(c => {
            if (c.owner?.id) owners.add(c.owner.id)
            items += Array.isArray(c.items) ? (c.items[0]?.count || 0) : Number(c.items_count || 0)
        })
        return { totalCats: list.length, totalItems: items, totalOwners: owners.size }
    }, [categories])

    return (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <StatCard icon={<FolderOpen className="h-6 w-6 text-blue-400" />} label="공개 카테고리" value={totalCats} />
            <StatCard icon={<Package className="h-6 w-6 text-purple-400" />} label="총 아이템" value={totalItems} />
            <StatCard icon={<Users className="h-6 w-6 text-green-400" />} label="공개한 사용자" value={totalOwners} />
        </div>
    )
}
