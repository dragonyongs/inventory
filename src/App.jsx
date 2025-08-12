// src/App.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useSystemStore } from './store/systemStore'
import { useWorkspaceStore } from './store/workspaceStore'
import { useAutoNotifications } from './hooks/useAutoNotifications'
import MaintenanceMode from './components/MaintenanceMode'
import Layout from './components/Layout'
import Login from './pages/Login'
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
import WorkspaceDashboard from './pages/WorkspaceDashboard'
import WorkspaceEmptyState from './pages/WorkspaceEmptyState'
import NotFound from './pages/NotFound'
import './index.css'

function App() {
  const { user, loading: authLoading, checkAuth } = useAuthStore()
  const { isMaintenanceMode, loadSettings } = useSystemStore()
  const { initialize, loading: wsLoading, currentWorkspace, workspaces } = useWorkspaceStore()
  const [booted, setBooted] = useState(false)

  useAutoNotifications()

  useEffect(() => {
    (async () => {
      try {
        await checkAuth()
        await loadSettings()
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          // initialize 내부에서 currentWorkspace까지 세팅하도록 맡기고, 외부에서 중복 set 하지 않음
          await initialize(userId)
        }
      } finally {
        setBooted(true)
      }
    })()
  }, [])

  // initialize가 currentWorkspace를 정하지 못했고, workspaces는 로드가 끝났다면 첫 것을 할당
  useEffect(() => {
    if (!user) return
    if (!wsLoading && workspaces?.length && !currentWorkspace?.id) {
      useWorkspaceStore.getState().setCurrentWorkspace(workspaces[0])
    }
  }, [user, wsLoading, workspaces, currentWorkspace?.id])

  // safeHome을 useMemo로 래핑하여 의존성 변화시 재계산
  const safeHome = useMemo(() => {
    // 로그인 사용자인데 워크스페이스 로딩 중이면 null 반환 (리다이렉트 방지)
    if (user && wsLoading) {
      return null
    }

    return currentWorkspace?.id
      ? `/workspace/${currentWorkspace.id}/dashboard`
      : '/public-guest'
  }, [user, currentWorkspace?.id, wsLoading])

  // 준비 여부를 엄격히 판정
  const ready = useMemo(() => {
    if (!booted) return false
    if (authLoading || wsLoading) return false
    // 로그인 사용자면 최소 1회 워크스페이스 판정 끝난 이후에만 진행
    if (user && !currentWorkspace?.id && (workspaces?.length ?? 0) > 0) return false
    return true
  }, [booted, authLoading, wsLoading, user, currentWorkspace?.id, workspaces?.length])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isMaintenanceMode() && (!user || !user.is_admin)) {
    return <MaintenanceMode />
  }

  console.log("safeHome", safeHome);

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route
            path="/login"
            element={
              !user ? <Login /> : (
                safeHome ? <Navigate to={safeHome} replace /> : (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                  </div>
                )
              )
            }
          />
          <Route path="/shared/:token" element={<SharedView />} />

          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/workspace/:wsId/dashboard" element={<WorkspaceDashboard />} />
            <Route path="/workspace/:wsId/inventory" element={<Inventory />} />
            <Route path="/workspace/:wsId/category/:categoryId" element={<CategoryView />} />
            <Route path="/workspace/:wsId/category/:categoryId/manage" element={<CategoryManage />} />
            <Route path="public" element={<PublicCategories />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="admin" element={user?.is_admin ? <AdminDashboard /> : (safeHome ? <Navigate to={safeHome} replace /> : <div>Loading...</div>)} />
            <Route path="admin/users" element={user?.is_admin ? <AdminUsers /> : (safeHome ? <Navigate to={safeHome} replace /> : <div>Loading...</div>)} />
            <Route path="admin/categories" element={user?.is_admin ? <AdminCategories /> : (safeHome ? <Navigate to={safeHome} replace /> : <div>Loading...</div>)} />
            <Route path="admin/items" element={user?.is_admin ? <AdminItems /> : (safeHome ? <Navigate to={safeHome} replace /> : <div>Loading...</div>)} />
            <Route path="admin/settings" element={user?.is_admin ? <AdminSettings /> : (safeHome ? <Navigate to={safeHome} replace /> : <div>Loading...</div>)} />
            <Route
              index
              element={
                safeHome ? <Navigate to={safeHome} replace /> : (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                  </div>
                )
              }
            />
          </Route>

          <Route path="/public-guest" element={<WorkspaceEmptyState />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PWAInstallPrompt />
      </div>
    </Router>
  )
}

export default App
