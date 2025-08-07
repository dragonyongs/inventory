import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useSystemStore } from './store/systemStore'
import { useAutoNotifications } from './hooks/useAutoNotifications'
import MaintenanceMode from './components/MaintenanceMode'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import CategoryView from './pages/CategoryView'
import CategoryManage from './pages/CategoryManage'
import PublicCategories from './pages/PublicCategories'
import SharedView from './pages/SharedView'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCategories from './pages/admin/AdminCategories'
import AdminItems from './pages/admin/AdminItems'
import AdminSettings from './pages/admin/AdminSettings'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import './index.css'

function App() {
  const { user, loading, checkAuth } = useAuthStore()
  const { isMaintenanceMode, loadSettings } = useSystemStore()

  // 자동 알림 시스템 초기화
  useAutoNotifications()

  useEffect(() => {
    checkAuth()
    loadSettings()
  }, [checkAuth, loadSettings])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 유지보수 모드 확인 (관리자는 제외)
  if (isMaintenanceMode() && (!user || !user.is_admin)) {
    return <MaintenanceMode />
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/shared/:token" element={<SharedView />} />
          {/* Layout을 사용하는 경로들 */}
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="public" element={<PublicCategories />} />
            <Route path="category/:categoryId" element={<CategoryView />} />
            <Route path="category/:categoryId/manage" element={<CategoryManage />} />
            <Route path="profile" element={<UserProfile />} />

            {/* 관리자 전용 라우트 */}
            <Route path="admin" element={user?.is_admin ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
            <Route path="admin/users" element={user?.is_admin ? <AdminUsers /> : <Navigate to="/dashboard" />} />
            <Route path="admin/categories" element={user?.is_admin ? <AdminCategories /> : <Navigate to="/dashboard" />} />
            <Route path="admin/items" element={user?.is_admin ? <AdminItems /> : <Navigate to="/dashboard" />} />
            <Route path="admin/settings" element={user?.is_admin ? <AdminSettings /> : <Navigate to="/dashboard" />} />

            <Route index element={<Navigate to="/dashboard" />} />
          </Route>
          {/* 로그인하지 않은 사용자도 공개 카테고리 볼 수 있도록 별도 경로 */}
          <Route path="/public-guest" element={<PublicCategories />} />
        </Routes>
        <PWAInstallPrompt />
      </div>
    </Router>
  )
}

export default App
