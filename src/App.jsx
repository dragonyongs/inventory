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
          // 초기 마운트 시 초기화 시도 (로그인 후 새로 로그인하면 아래 user-effect로 보완됨)
          await initialize(userId)
        }
      } finally {
        setBooted(true)
      }
    })()
  }, [checkAuth, loadSettings, initialize])

  // "user"가 새로 설정될 때(예: 로그인 후) 워크스페이스 초기화 트리거
  useEffect(() => {
    if (!user) return
    // 이미 로딩 중이면 기다리고, workspaces가 비어있을 때만 초기화 시도
    if (wsLoading) return
    if (Array.isArray(workspaces) && workspaces.length > 0) {
      // 이미 워크스페이스가 있으면 currentWorkspace 설정은 다른 로직에서 처리 가능
      return
    }

    (async () => {
      try {
        await initialize(user.id)
      } catch (err) {
        console.error('워크스페이스 초기화 실패:', err)
      }
    })()
  }, [user, workspaces?.length, wsLoading, initialize])

  // initialize가 currentWorkspace를 정하지 못했고, workspaces는 로드가 끝났다면 첫 것을 할당
  useEffect(() => {
    if (!user) return
    if (!wsLoading && workspaces?.length && !currentWorkspace?.id) {
      useWorkspaceStore.getState().setCurrentWorkspace(workspaces[0])
    }
  }, [user, wsLoading, workspaces, currentWorkspace?.id])



  // 준비 여부를 엄격히 판정
  const ready = useMemo(() => {
    if (!booted) return false
    if (authLoading) return false

    // 로그인 사용자의 경우 워크스페이스 관련 로딩도 완료되어야 함
    if (user) {
      if (wsLoading) return false
      // 로그인 사용자인데 워크스페이스가 하나도 없으면 아직 로딩 중으로 간주
      if (!workspaces || workspaces.length === 0) return false
      // currentWorkspace가 설정되지 않았으면 아직 준비되지 않음
      if (!currentWorkspace?.id) return false
    }

    return true
  }, [booted, authLoading, wsLoading, user, workspaces, currentWorkspace?.id])

  // safeHome 로직 개선
  const safeHome = useMemo(() => {
    // 로그인 사용자인데 워크스페이스 준비가 안되었으면 null
    if (user && (!workspaces?.length || !currentWorkspace?.id)) {
      return null
    }

    const targetWorkspaceId = currentWorkspace?.id ?? workspaces?.[0]?.id

    return targetWorkspaceId
      ? `/workspace/${targetWorkspaceId}/dashboard`
      : '/public-guest'
  }, [user, currentWorkspace?.id, workspaces])

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
