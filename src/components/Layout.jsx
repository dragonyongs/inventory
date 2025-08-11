// src/components/Layout.jsx
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
// import GlobalModals from './GlobalModals'
import { useSystemStore } from '../store/systemStore'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { getSetting } = useSystemStore()
    const systemName = getSetting('general', 'systemName') || '재고 관리'

    return (
        <div className="flex h-screen bg-gray-50">
            {/* 사이드바 */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* 메인 영역 */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                {/* 모바일 상단 헤더: 메뉴 버튼 + 워크스페이스 셀렉트 */}
                <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            aria-label="open sidebar"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        {systemName}
                        <div className="w-10" />
                    </div>
                </div>

                {/* 콘텐츠 */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            {/* <GlobalModals /> */}
        </div>
    )
}
