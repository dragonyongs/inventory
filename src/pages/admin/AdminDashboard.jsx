import React, { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'

import { Link } from 'react-router-dom'
import { Users, Package, Shield, TrendingUp, AlertTriangle, Calendar, BarChart3, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

export default function AdminDashboard() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCategories: 0,
        totalItems: 0,
        publicCategories: 0,
        expiredItems: 0,
        recentUsers: [],
        recentCategories: [],
        systemActivity: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAdminStats()
    }, [])

    const fetchAdminStats = async () => {
        try {
            setLoading(true)

            // 전체 사용자 수
            const { count: userCount } = await supabase
                .from('inventory_users')
                .select('*', { count: 'exact', head: true })

            // 전체 카테고리 수
            const { count: categoryCount } = await supabase
                .from('inventory_categories')
                .select('*', { count: 'exact', head: true })

            // 전체 아이템 수
            const { count: itemCount } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true })

            // 공개 카테고리 수
            const { count: publicCategoryCount } = await supabase
                .from('inventory_categories')
                .select('*', { count: 'exact', head: true })
                .eq('is_public', true)

            // 만료된 아이템 수
            const today = new Date().toISOString().split('T')[0]
            const { count: expiredCount } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true })
                .lt('expiry_date', today)

            // 최근 가입 사용자
            const { data: recentUsers } = await supabase
                .from('inventory_users')
                .select('id, name, username, created_at')
                .order('created_at', { ascending: false })
                .limit(5)

            // 최근 생성 카테고리
            const { data: recentCategories } = await supabase
                .from('inventory_categories')
                .select(`
                    id, name, created_at, is_public,
                    owner:inventory_users!owner_id(name)
                `)
                .order('created_at', { ascending: false })
                .limit(5)

            setStats({
                totalUsers: userCount || 0,
                totalCategories: categoryCount || 0,
                totalItems: itemCount || 0,
                publicCategories: publicCategoryCount || 0,
                expiredItems: expiredCount || 0,
                recentUsers: recentUsers || [],
                recentCategories: recentCategories || [],
                systemActivity: [] // 추후 구현
            })
        } catch (error) {
            console.error('Error fetching admin stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <PageHeader
                title="관리자 대시보드"
                description={`${user?.name}님의 재고 관리 현황입니다`}
                // icon={<PieChart className="h-6 w-6 text-blue-500" />}
                rightSection={(
                    <button
                        onClick={fetchAdminStats}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        새로고침
                    </button>
                )}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">

                {/* 통계 카드들 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-8 w-8 text-blue-600" />}
                        label="총 사용자"
                        value={stats.totalUsers}
                        valueClassName="text-2xl font-bold text-gray-900"
                        link="/admin/users"
                        linkText="사용자 관리 →"
                    />
                    <StatCard
                        icon={<Package className="h-8 w-8 text-green-600" />}
                        label="총 카테고리"
                        value={stats.totalCategories}
                        valueClassName="text-2xl font-bold text-gray-900"
                        link="/admin/categories"
                        linkText="카테고리 관리 →"
                    />
                    <StatCard
                        icon={<Shield className="h-8 w-8 text-purple-600" />}
                        label="총 아이템"
                        value={stats.totalItems}
                        valueClassName="text-2xl font-bold text-gray-900"
                        link="/admin/items"
                        linkText="아이템 관리 →"
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-8 w-8 text-red-600" />}
                        label="만료된 아이템"
                        value={stats.expiredItems}
                        valueClassName="text-2xl font-bold text-red-600"
                        alertText="즉시 처리 필요"
                    />
                </div>

                {/* 추가 통계 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">공개 카테고리</dt>
                                        <dd className="text-lg font-bold text-gray-900">{stats.publicCategories}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <BarChart3 className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">평균 아이템/카테고리</dt>
                                        <dd className="text-lg font-bold text-gray-900">
                                            {stats.totalCategories > 0 ? Math.round(stats.totalItems / stats.totalCategories) : 0}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Activity className="h-6 w-6 text-teal-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">활성 사용자</dt>
                                        <dd className="text-lg font-bold text-gray-900">{stats.totalUsers}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 최근 활동 */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* 최근 가입 사용자 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">최근 가입 사용자</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {stats.recentUsers.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    최근 가입한 사용자가 없습니다.
                                </div>
                            ) : (
                                stats.recentUsers.map((user) => (
                                    <div key={user.id} className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">@{user.username}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 최근 생성 카테고리 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">최근 생성 카테고리</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {stats.recentCategories.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    최근 생성된 카테고리가 없습니다.
                                </div>
                            ) : (
                                stats.recentCategories.map((category) => (
                                    <div key={category.id} className="p-6 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                                {category.is_public && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        공개
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">소유자: {category.owner?.name}</p>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(category.created_at).toLocaleDateString('ko-KR')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 빠른 작업 */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">빠른 작업</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Link
                                to="/admin/users"
                                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Users className="h-5 w-5 mr-2" />
                                사용자 관리
                            </Link>
                            <Link
                                to="/admin/categories"
                                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Package className="h-5 w-5 mr-2" />
                                카테고리 관리
                            </Link>
                            <Link
                                to="/admin/items"
                                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Shield className="h-5 w-5 mr-2" />
                                아이템 관리
                            </Link>
                            <Link
                                to="/admin/settings"
                                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Calendar className="h-5 w-5 mr-2" />
                                시스템 설정
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
