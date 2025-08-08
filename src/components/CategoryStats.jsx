// src/components/CategoryStats.jsx
import React from 'react'
import {
    getTotalCategories,
    getTotalItems,
    getTotalOwners,
    getOwnedCategories,
    getSharedCategories,
    getTotalItemsInList,
    getTotalValue,
    getExpiringSoon,
    getExpired,
} from '../lib/categoryUtils'

import { Folder, Package, Users, Share2, DollarSign, AlertTriangle, Calendar } from 'lucide-react'

/**
 * type
 * - 'dashboard': 대시보드 전체 (카테고리, 아이템, 관리자 등)
 * - 'inventory': 소유/공유/전체 아이템
 * - 'category': 카테고리별 집계 (아이템 리스트 기준)
 */
export default function CategoryStats({ categories = [], items = [], type = 'dashboard' }) {
    if (type === 'dashboard') {
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard icon={<Folder className="h-6 w-6 text-gray-400" />} label="총 카테고리" value={getTotalCategories(categories)} />
                <StatCard icon={<Package className="h-6 w-6 text-gray-400" />} label="총 아이템" value={getTotalItems(categories)} />
                <StatCard icon={<Users className="h-6 w-6 text-gray-400" />} label="관리자" value={getTotalOwners(categories)} />
            </div>
        )
    }

    if (type === 'inventory') {
        // 예) 소유, 공유받음, 총 아이템
        const owned = getOwnedCategories(categories)
        const shared = getSharedCategories(categories)
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard icon={<Folder className="h-6 w-6 text-blue-400" />} label="소유한 카테고리" value={`${owned.length}개`} />
                <StatCard icon={<Share2 className="h-6 w-6 text-green-400" />} label="공유받은 카테고리" value={`${shared.length}개`} />
                <StatCard icon={<Package className="h-6 w-6 text-purple-400" />} label="총 아이템" value={`${getTotalItems(categories)}개`} />
            </div>
        )
    }

    if (type === 'category') {
        // items 기준 통계
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <StatCard icon={<Package className="h-6 w-6 text-blue-500" />} label="총 아이템" value={getTotalItemsInList(items)} />
                <StatCard icon={<DollarSign className="h-6 w-6 text-green-500" />} label="총 가치" value={`₩${getTotalValue(items).toLocaleString()}`} />
                <StatCard icon={<AlertTriangle className="h-6 w-6 text-yellow-500" />} label="곧 만료" value={getExpiringSoon(items)} />
                <StatCard icon={<Calendar className="h-6 w-6 text-red-500" />} label="만료됨" value={getExpired(items)} />
            </div>
        )
    }

    return null
}

// 카드 모듈화
function StatCard({ icon, label, value }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">{icon}</div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                            <dd className="text-lg font-medium text-gray-900">{value}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
