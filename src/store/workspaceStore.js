//src/store/workspaceStore.js

import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const ROLE_WEIGHT = { owner: 4, admin: 3, member: 2, viewer: 1 }

export const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    currentWorkspace: null,
    members: [],
    loading: false,
    error: null,
    loadedOnce: false,

    initialize: async (userId) => {
        if (get().loadedOnce) return
        set({ loading: true, error: null })
        try {
            const list = await get().loadWorkspaces(userId, { force: true })
            const lastId = localStorage.getItem('lastWorkspaceId')

            let picked = null
            if (lastId) {
                picked = list.find(w => w.id === lastId) || null
                if (!picked) localStorage.removeItem('lastWorkspaceId')
            }
            if (!picked) picked = list[0] || null

            set({ currentWorkspace: picked, loadedOnce: true })
            if (picked?.id) localStorage.setItem('lastWorkspaceId', picked.id)
        } catch (e) {
            set({ error: e?.message || '워크스페이스 초기화 실패', loadedOnce: true })
        } finally {
            set({ loading: false })
        }
    },

    // options: { force?: boolean }
    loadWorkspaces: async (userId, options = {}) => {
        const { force = false } = options
        // 1) userId 없으면 네트워크 호출 금지
        if (!userId) return get().workspaces

        // 2) 이미 목록이 있고 강제 새로고침이 아니면 재호출 금지
        if (!force && get().workspaces.length) return get().workspaces

        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    role,
                    joined_at,
                    workspace:workspaces!workspace_id ( id, name, plan, is_archived )
                `)
                .eq('user_id', userId)
                // created_at가 아니라 joined_at이 스키마에 존재
                .order('joined_at', { ascending: true })

            if (error) throw error

            const list = (data || [])
                .filter(r => !!r.workspace)
                .map(r => ({
                    id: r.workspace.id,
                    name: r.workspace.name,
                    plan: r.workspace.plan,
                    is_archived: r.workspace.is_archived,
                    role: r.role
                }))
                // 보기 좋게 이름순으로 한 번 더 정렬(선택)
                .sort((a, b) => a.name.localeCompare(b.name))

            set({ workspaces: list })
            return list
        } catch (e) {
            set({ error: e?.message || '워크스페이스 목록 로드 실패' })
            return []
        } finally {
            set({ loading: false })
        }
    },

    createWorkspace: async (name, ownerId) => {
        set({ loading: true, error: null })
        try {
            const { data: ws, error: wsErr } = await supabase
                .from('workspaces')
                .insert([{ name, owner_id: ownerId }])
                .select('id,name,plan,is_archived')
                .single()
            if (wsErr) throw wsErr

            const { error: memErr } = await supabase
                .from('workspace_members')
                .insert([{ workspace_id: ws.id, user_id: ownerId, role: 'owner' }])
            if (memErr) {
                await supabase.from('workspaces').delete().eq('id', ws.id)
                throw memErr
            }

            const newWS = { id: ws.id, name: ws.name, plan: ws.plan, is_archived: ws.is_archived, role: 'owner' }
            const list = [...get().workspaces, newWS].sort((a, b) => a.name.localeCompare(b.name))
            const current = get().currentWorkspace
            set({
                workspaces: list,
                currentWorkspace: current || newWS
            })
            localStorage.setItem('lastWorkspaceId', (current || newWS).id)
            return newWS
        } catch (e) {
            set({ error: e?.message || '워크스페이스 생성 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    // 이름 변경
    updateWorkspaceName: async (workspaceId, name) => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('workspaces')
                .update({ name, updated_at: new Date().toISOString() })
                .eq('id', workspaceId)
                .select('id,name,plan,is_archived')
                .single()
            if (error) throw error

            const { workspaces, currentWorkspace } = get()
            const updatedList = (workspaces || []).map(w => w.id === workspaceId ? { ...w, name: data.name } : w)
            updatedList.sort((a, b) => a.name.localeCompare(b.name))
            const updatedCurrent = currentWorkspace?.id === workspaceId ? { ...currentWorkspace, name: data.name } : currentWorkspace

            set({ workspaces: updatedList, currentWorkspace: updatedCurrent })
            return data
        } catch (e) {
            set({ error: e?.message || '워크스페이스 이름 변경 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    archiveWorkspace: async (workspaceId, archived = true) => {
        set({ loading: true, error: null })
        try {
            const { error } = await supabase
                .from('workspaces')
                .update({ is_archived: archived, updated_at: new Date().toISOString() })
                .eq('id', workspaceId)
            if (error) throw error

            set({
                workspaces: get().workspaces.map(w =>
                    w.id === workspaceId ? { ...w, is_archived: archived } : w
                )
            })
        } catch (e) {
            set({ error: e?.message || '워크스페이스 아카이브 실패' })
        } finally {
            set({ loading: false })
        }
    },

    deleteWorkspace: async (workspaceId) => {
        set({ loading: true, error: null })
        const prev = get().workspaces
        try {
            // 낙관적 업데이트
            const after = prev.filter(w => w.id !== workspaceId)
            set({ workspaces: after })

            const { error } = await supabase
                .from('workspaces')
                .delete()
                .eq('id', workspaceId)
            if (error) {
                set({ workspaces: prev })
                throw error
            }

            const cur = get().currentWorkspace
            if (cur?.id === workspaceId) {
                const left = get().workspaces[0] || null
                set({ currentWorkspace: left })
                if (left?.id) localStorage.setItem('lastWorkspaceId', left.id)
                else localStorage.removeItem('lastWorkspaceId')
            }
        } catch (e) {
            set({ error: e?.message || '워크스페이스 삭제 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    loadMembers: async (workspaceId) => {
        set({ loading: true, error: null })
        try {
            const wsId = workspaceId || get().currentWorkspace?.id
            if (!wsId) throw new Error('워크스페이스가 선택되지 않았습니다.')

            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    user_id,
                    role,
                    inventory_users:user_id ( name, username, email )
                `)
                .eq('workspace_id', wsId)
            if (error) throw error

            const members = (data || []).map(r => ({
                user_id: r.user_id,
                role: r.role,
                name: r.inventory_users?.name,
                username: r.inventory_users?.username,
                email: r.inventory_users?.email ?? null
            }))

            set({ members })
            return members
        } catch (e) {
            set({ error: e?.message || '멤버 로드 실패' })
            return []
        } finally {
            set({ loading: false })
        }
    },

    addMember: async (workspaceId, payload) => {
        set({ loading: true, error: null })
        try {
            const role = payload.role || 'member'
            const { error } = await supabase
                .from('workspace_members')
                .insert([{ workspace_id: workspaceId, user_id: payload.user_id, role }])
            if (error) throw error

            await get().loadMembers(workspaceId)
        } catch (e) {
            if (e?.code === '23505') set({ error: '이미 워크스페이스에 존재하는 사용자입니다.' })
            else set({ error: e?.message || '멤버 추가 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    updateMemberRole: async (workspaceId, userId, role) => {
        set({ loading: true, error: null })
        try {
            const { error } = await supabase
                .from('workspace_members')
                .update({ role })
                .eq('workspace_id', workspaceId)
                .eq('user_id', userId)
            if (error) throw error

            set({
                members: get().members.map(m =>
                    m.user_id === userId ? { ...m, role } : m
                )
            })
        } catch (e) {
            set({ error: e?.message || '역할 변경 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    removeMember: async (workspaceId, userId) => {
        set({ loading: true, error: null })
        try {
            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('workspace_id', workspaceId)
                .eq('user_id', userId)
            if (error) throw error

            set({ members: get().members.filter(m => m.user_id !== userId) })
        } catch (e) {
            set({ error: e?.message || '멤버 제거 실패' })
            throw e
        } finally {
            set({ loading: false })
        }
    },

    setCurrentWorkspace: (ws) => {
        const cur = get().currentWorkspace
        if (cur?.id === ws?.id) return // 동일 선택 시 상태 진동 방지
        set({ currentWorkspace: ws })
        if (ws?.id) localStorage.setItem('lastWorkspaceId', ws.id)
        else localStorage.removeItem('lastWorkspaceId')
    },

    setError: (msg) => set({ error: msg }),

    hasAtLeastRole: (required) => {
        const cur = get().currentWorkspace
        if (!cur) return false
        return (ROLE_WEIGHT[cur.role] || 0) >= (ROLE_WEIGHT[required] || 0)
    },
    isOwner: () => get().hasAtLeastRole('owner'),
    isAdmin: () => get().hasAtLeastRole('admin'),
    canEdit: () => get().hasAtLeastRole('member'),

    getAuthWorkspaceFilter: () => {
        const ws = get().currentWorkspace
        return ws ? { workspace_id: ws.id } : null
    }
}))
