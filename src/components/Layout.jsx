import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Package, LogOut, Menu, X, Globe, ArrowLeft, BarChart3, Users, Shield, Settings } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useSystemStore } from '../store/systemStore'
import { toast } from 'react-hot-toast'

export default function Layout() {
    const { user, logout } = useAuthStore()
    const { getSetting, loadSettings } = useSystemStore()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const navigation = [
        { name: '대시보드', href: '/dashboard', icon: Home },
        { name: '재고 관리', href: '/inventory', icon: Package },
        { name: '공개 카테고리', href: '/public', icon: Globe },
    ]

    // 관리자 전용 메뉴
    const adminNavigation = [
        { name: '관리자 대시보드', href: '/admin', icon: BarChart3 },
        { name: '사용자 관리', href: '/admin/users', icon: Users },
        { name: '카테고리 관리', href: '/admin/categories', icon: Package },
        { name: '아이템 관리', href: '/admin/items', icon: Shield },
        { name: '시스템 설정', href: '/admin/settings', icon: Settings },
    ]

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const handleLogout = () => {
        logout()
        toast.success('로그아웃되었습니다.')
    }

    const handleBackClick = () => {
        navigate(-1)
    }

    const systemName = getSetting('general', 'systemName') || '재고 관리'

    return (
        <div className="flex h-screen bg-gray-50">
            {/* 모바일 사이드바 오버레이 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 사이드바 */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 bg-white shadow-lg flex flex-col`}>

                {/* 사이드바 헤더 */}
                <div className="flex items-center justify-between h-16 px-4 bg-blue-600">
                    <h1 className="text-xl font-bold text-white">{systemName}</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 네비게이션 메뉴 */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </Link>
                        )
                    })}

                    {/* 관리자 메뉴 */}
                    {user?.is_admin && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                관리자 메뉴
                            </h3>
                            {adminNavigation.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                            ? 'bg-red-100 text-red-700 border-r-2 border-red-600'
                                            : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                                            }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </div>
                    )}

                    {/* 공개 페이지용 뒤로 가기 */}
                    {location.pathname === '/public' && (
                        <button
                            onClick={handleBackClick}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="mr-3 h-5 w-5 flex-shrink-0" />
                            이전 페이지
                        </button>
                    )}
                </nav>

                {/* 사용자 정보 및 로그아웃 */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
                            </div>
                        </div>
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

            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                {/* 모바일 헤더 */}
                <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">재고 관리</h1>
                        <div className="w-10" /> {/* 균형을 위한 공간 */}
                    </div>
                </div>

                {/* 메인 컨텐츠 */}
                <main className="flex-1 overflow-y-auto">
                    {/* <div className="p-4 lg:p-8"> */}
                    <Outlet />
                    {/* </div> */}
                </main>
            </div>
        </div>
    )
}
