import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useWorkspaceStore } from './workspaceStore'

export const useInventoryStore = create((set, get) => ({
  categories: [],
  items: [],
  selectedCategory: null,
  loading: false,
  error: null,

  // 공통: 현재 워크스페이스 필터 확보
  _requireWorkspace: () => {
    const { getAuthWorkspaceFilter } = useWorkspaceStore.getState()
    const ws = getAuthWorkspaceFilter && getAuthWorkspaceFilter()
    if (!ws) throw new Error('워크스페이스가 선택되지 않았습니다.')
    return ws
  },

  // 재고 사용/출고
  inventoryUseItem: async ({ category_id, item_id, user_id, used_quantity, note }) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      // 1) 사용 기록 생성
      const { data: usage, error: usageError } = await supabase
        .from('inventory_item_usages')
        .insert([{
          category_id,
          item_id,
          user_id,
          used_quantity,
          note,
          used_at: new Date().toISOString(),
          type: 'out',
          workspace_id
        }])
        .select()
        .single()
      if (usageError) throw usageError

      // 2) 현재 수량 조회(워크스페이스 가드)
      const { data: itemData, error: getError } = await supabase
        .from('inventory_items')
        .select('quantity, workspace_id')
        .eq('id', item_id)
        .eq('workspace_id', workspace_id)
        .single()
      if (getError) throw getError

      const newQty = (itemData.quantity || 0) - used_quantity
      if (newQty < 0) throw new Error('현재 재고보다 많이 차감할 수 없습니다.')

      // 3) 수량 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .eq('workspace_id', workspace_id)
        .select()
        .single()
      if (updateError) throw updateError

      // 4) 프론트 상태 반영
      const { items } = get()
      set({
        items: (items || []).map(i =>
          i.id === item_id ? { ...i, quantity: updated.quantity } : i
        )
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 카테고리 목록(소유 + 공유) 불러오기
  fetchCategories: async (userId) => {
    set({ loading: true, error: null })
    try {
      const { workspace_id } = get()._requireWorkspace()

      // 1) 소유 카테고리 (해당 워크스페이스 한정)
      const { data: ownedCategories, error: ownedError } = await supabase
        .from('inventory_categories')
        .select(`
          *,
          manager:inventory_users!manager_id(name),
          items:inventory_items(count),
          owner:inventory_users!owner_id(name)
        `)
        .eq('owner_id', userId)
        .eq('workspace_id', workspace_id)
        .order('name')
      if (ownedError) throw ownedError

      // 2) 공유받은 카테고리 (해당 워크스페이스 한정)
      const { data: sharedCategories, error: sharedError } = await supabase
        .from('inventory_category_permissions')
        .select(`
          permission_level,
          workspace_id,
          category:inventory_categories!category_id(
            *,
            manager:inventory_users!manager_id(name),
            items:inventory_items(count),
            owner:inventory_users!owner_id(name)
          )
        `)
        .eq('user_id', userId)
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
      if (sharedError) throw sharedError

      const processedSharedCategories = (sharedCategories || []).map(item => ({
        ...item.category,
        permission_level: item.permission_level,
        is_shared: true
      }))

      const processedOwnedCategories = (ownedCategories || []).map(category => ({
        ...category,
        is_shared: false,
        permission_level: 'admin'
      }))

      const allCategories = [...processedOwnedCategories, ...processedSharedCategories]
      set({ categories: allCategories, loading: false })
    } catch (error) {
      console.error('Error fetching categories:', error)
      set({ loading: false, error: error.message })
    }
  },

  // 아이템 생성 + 초기 입고 기록
  createItem: async (itemData) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      // 1) 아이템 생성
      const payload = { ...itemData, workspace_id }
      const { data: newItem, error } = await supabase
        .from('inventory_items')
        .insert([payload])
        .select()
        .single()
      if (error) throw error

      // 2) 초기 입고 기록
      if (newItem.quantity && newItem.quantity > 0) {
        await supabase
          .from('inventory_item_usages')
          .insert([{
            category_id: newItem.category_id,
            item_id: newItem.id,
            user_id: itemData.added_by || itemData.user_id,
            used_quantity: newItem.quantity,
            type: 'in',
            note: '초기 입고',
            used_at: new Date().toISOString(),
            workspace_id
          }])
      }

      const { items } = get()
      set({ items: [...(items || []), newItem] })
      return { success: true, data: newItem }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateCategory: async (categoryId, updateData) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { data, error } = await supabase
        .from('inventory_categories')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', categoryId)
        .eq('workspace_id', workspace_id)
        .select()
        .single()
      if (error) throw error

      const { categories } = get()
      const updatedCategories = (categories || []).map(category =>
        category.id === categoryId ? { ...category, ...data } : category
      )
      set({ categories: updatedCategories })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', categoryId)
        .eq('workspace_id', workspace_id)
      if (error) throw error

      const { categories } = get()
      set({ categories: (categories || []).filter(category => category.id !== categoryId) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  fetchItems: async (categoryId) => {
    set({ loading: true, error: null })
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          added_by_user:inventory_users!added_by(name)
        `)
        .eq('category_id', categoryId)
        .eq('workspace_id', workspace_id)
        .order('name')
      if (error) throw error

      set({ items: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching items:', error)
      set({ loading: false, error: error.message })
    }
  },

  updateItem: async (itemId, updateData) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { data, error } = await supabase
        .from('inventory_items')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('workspace_id', workspace_id)
        .select()
        .single()
      if (error) throw error

      const { items } = get()
      const updatedItems = (items || []).map(item =>
        item.id === itemId ? data : item
      )
      set({ items: updatedItems })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  deleteItem: async (itemId) => {
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)
        .eq('workspace_id', workspace_id)
      if (error) throw error

      const { items } = get()
      set({ items: (items || []).filter(item => item.id !== itemId) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // 전체 아이템: 현재 워크스페이스에서만
  fetchAllItems: async () => {
    set({ loading: true, error: null })
    try {
      const { workspace_id } = get()._requireWorkspace()

      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          category:inventory_categories!category_id(name),
          added_by_user:inventory_users!added_by(name)
        `)
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
      if (error) throw error

      set({ items: data || [] })
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all items:', error)
      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category })
  }
}))
