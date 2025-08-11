// src/components/Sidebar.jsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWorkspaceStore } from '../store/workspaceStore'
import { useAuthStore } from '../store/authStore'
import { useSystemStore } from '../store/systemStore'
import { toast } from 'react-hot-toast'
import WorkspaceSwitcher from './workspace/WorkspaceSwitcher'
import { Home, Package, Globe, BarChart3, Users, Shield, Settings, LogOut, X } from 'lucide-react'

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    const { currentWorkspace } = useWorkspaceStore()
    const { user, logout } = useAuthStore()
    const { getSetting } = useSystemStore()
    const location = useLocation()

    const systemName = getSetting('general', 'systemName') || '재고 관리'
    const wsId = currentWorkspace?.id

    // 워크스페이스 종속 네비게이션
    const navigation = [
        {
            name: '대시보드',
            to: wsId ? `/workspace/${wsId}/dashboard` : null,
            icon: Home,
            match: wsId ? `/workspace/${wsId}/dashboard` : null,
        },
        {
            name: '재고 관리',
            to: wsId ? `/workspace/${wsId}/inventory` : null,
            icon: Package,
            match: wsId ? `/workspace/${wsId}/inventory` : null,
        },
        {
            name: '공개 카테고리',
            to: '/public',
            icon: Globe,
            match: '/public',
        },
    ]

    // 관리자 네비게이션
    const adminNavigation = [
        { name: '관리자 대시보드', to: '/admin', icon: BarChart3, match: '/admin' },
        { name: '사용자 관리', to: '/admin/users', icon: Users, match: '/admin/users' },
        { name: '카테고리 관리', to: '/admin/categories', icon: Package, match: '/admin/categories' },
        { name: '아이템 관리', to: '/admin/items', icon: Shield, match: '/admin/items' },
        { name: '시스템 설정', to: '/admin/settings', icon: Settings, match: '/admin/settings' },
    ]

    const handleLogout = () => {
        logout()
        toast.success('로그아웃되었습니다.')
    }

    // 링크/비활성 공통 렌더
    const renderNavItem = (item, activeClass, hoverClass) => {
        const Icon = item.icon
        const isActive = item.match ? location.pathname.startsWith(item.match) : false
        const disabled = !item.to

        const baseClass = isActive
            ? activeClass
            : disabled
                ? 'text-gray-300 cursor-not-allowed'
                : hoverClass

        const content = (
            <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${baseClass}`}>
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
            </div>
        )

        if (disabled) {
            return <div key={item.name}>{content}</div>
        }
        return (
            <Link key={item.name} to={item.to} onClick={() => setSidebarOpen(false)}>
                {content}
            </Link>
        )
    }

    return (
        <>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 bg-white shadow-lg flex flex-col`}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
                    <h1 className="text-xl font-bold text-white truncate">{systemName}</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 lg:hidden"
                        aria-label="close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 네비게이션 */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {navigation.map(item =>
                        renderNavItem(
                            item,
                            'bg-blue-100 text-blue-700 border-r-2 border-blue-600',
                            'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )
                    )}

                    {user?.is_admin && (
                        <div className="space-y-2 mt-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                관리자 메뉴
                            </h3>
                            {adminNavigation.map(item =>
                                renderNavItem(
                                    item,
                                    'bg-red-100 text-red-700 border-r-2 border-red-600',
                                    'text-gray-600 hover:bg-red-50 hover:text-red-700'
                                )
                            )}
                        </div>
                    )}
                </nav>

                {/* 사용자 정보 + 로그아웃 */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/profile"
                            className="flex items-center min-w-0 hover:bg-gray-50 rounded-lg p-2 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <div
                                className={`h-10 w-10 rounded-full ${user?.is_admin ? 'bg-red-600' : 'bg-blue-600'
                                    } flex items-center justify-center`}
                            >
                                <span className="text-sm font-medium text-white">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    @{user?.username} {user?.is_admin && '• 관리자'}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            title="로그아웃"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
