// src/App.jsx
import React, { useEffect, useState } from 'react'
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
  const { initialize, loading: wsLoading, currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore()
  const [booted, setBooted] = useState(false)

  useAutoNotifications()

  useEffect(() => {
    (async () => {
      try {
        await checkAuth()
        await loadSettings()
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          await initialize(userId)
          const { currentWorkspace: cur, workspaces: list } = useWorkspaceStore.getState()
          if (!cur && list.length > 0) {
            useWorkspaceStore.getState().setCurrentWorkspace(list[0])
          }
        }
      } finally {
        setBooted(true)
      }
    })()
  }, [])

  if (authLoading || wsLoading || !booted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isMaintenanceMode() && (!user || !user.is_admin)) {
    return <MaintenanceMode />
  }

  const safeHome = currentWorkspace?.id
    ? `/workspace/${currentWorkspace.id}/dashboard`
    : '/public-guest'

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={safeHome} replace />} />
          <Route path="/shared/:token" element={<SharedView />} />

          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/workspace/:wsId/dashboard" element={<WorkspaceDashboard />} />
            <Route path="/workspace/:wsId/inventory" element={<Inventory />} />
            <Route path="/workspace/:wsId/category/:categoryId" element={<CategoryView />} />
            <Route path="/workspace/:wsId/category/:categoryId/manage" element={<CategoryManage />} />
            <Route path="public" element={<PublicCategories />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="admin" element={user?.is_admin ? <AdminDashboard /> : <Navigate to={safeHome} replace />} />
            <Route path="admin/users" element={user?.is_admin ? <AdminUsers /> : <Navigate to={safeHome} replace />} />
            <Route path="admin/categories" element={user?.is_admin ? <AdminCategories /> : <Navigate to={safeHome} replace />} />
            <Route path="admin/items" element={user?.is_admin ? <AdminItems /> : <Navigate to={safeHome} replace />} />
            <Route path="admin/settings" element={user?.is_admin ? <AdminSettings /> : <Navigate to={safeHome} replace />} />
            <Route index element={<Navigate to={safeHome} replace />} />
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
