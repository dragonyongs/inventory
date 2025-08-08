import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useInventoryStore = create((set, get) => ({
  categories: [],
  items: [],
  selectedCategory: null,
  loading: false,

  inventoryUseItem: async ({ category_id, item_id, user_id, used_quantity, note }) => {
    try {
      // 1. 사용 기록 생성
      const { data: usage, error: usageError } = await supabase
        .from('inventory_item_usages')
        .insert([{
          category_id, item_id, user_id, used_quantity, note, used_at: new Date().toISOString()
        }])
        .select()
        .single()
      if (usageError) throw usageError

      // 2. 현재 수량 조회
      const { data: itemData, error: getError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', item_id)
        .single()
      if (getError) throw getError

      const newQty = (itemData.quantity || 0) - used_quantity
      if (newQty < 0) throw new Error('현재 재고보다 많이 차감할 수 없습니다.')

      // 3. 새 수량 업데이트
      const { data: updated, error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQty })
        .eq('id', item_id)
        .select()
        .single()
      if (updateError) throw updateError

      // 4. 프론트 상태 반영
      const { items } = get()
      set({
        items: items.map(i =>
          i.id === item_id ? { ...i, quantity: updated.quantity } : i
        )
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  fetchCategories: async (userId) => {
    set({ loading: true })
    try {
      // 1. 소유한 카테고리 조회
      const { data: ownedCategories, error: ownedError } = await supabase
        .from('inventory_categories')
        .select(`
          *,
          manager:inventory_users!manager_id(name),
          items:inventory_items(count),
          owner:inventory_users!owner_id(name)
        `)
        .eq('owner_id', userId)
        .order('name')

      if (ownedError) throw ownedError

      // 2. 공유받은 카테고리 조회 (permissions를 통해)
      const { data: sharedCategories, error: sharedError } = await supabase
        .from('inventory_category_permissions')
        .select(`
          permission_level,
          category:inventory_categories!category_id(
            *,
            manager:inventory_users!manager_id(name),
            items:inventory_items(count),
            owner:inventory_users!owner_id(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sharedError) throw sharedError

      // 3. 공유받은 카테고리 데이터 가공 (permission_level 추가)
      const processedSharedCategories = sharedCategories.map(item => ({
        ...item.category,
        permission_level: item.permission_level,
        is_shared: true // 공유받은 카테고리임을 표시
      }))

      // 4. 소유 카테고리에 is_shared: false 표시 추가
      const processedOwnedCategories = ownedCategories.map(category => ({
        ...category,
        is_shared: false,
        permission_level: 'admin' // 소유자는 관리자 권한
      }))

      // 5. 두 배열 합치기
      const allCategories = [...processedOwnedCategories, ...processedSharedCategories]
      
      set({ categories: allCategories, loading: false })
    } catch (error) {
      console.error('Error fetching categories:', error)
      set({ loading: false })
    }
  },

  createItem: async (itemData) => {
    try {
      // 1. 아이템 row 생성
      const { data: newItem, error } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single()
      if (error) throw error

      // 2. 입고 내역(item_usages)에 기록
      // itemData.quantity가 0이 아닐 때만 기록(입고 없는 초기 등록 예외 처리 가능)
      if (newItem.quantity && newItem.quantity > 0) {
        await supabase
          .from('inventory_item_usages')
          .insert([{
            category_id: newItem.category_id,
            item_id: newItem.id,
            user_id: itemData.added_by || itemData.user_id, // 만든 사람 id
            used_quantity: newItem.quantity,
            type: 'in',
            note: '초기 입고',  // 또는 itemData.note 등
            used_at: new Date().toISOString()
          }])
      }

      // 3. 프론트 상태 reflect 등
      const { items } = get()
      set({ items: [...items, newItem] })
      return { success: true, data: newItem }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateCategory: async (categoryId, updateData) => {
    try {
        const { data, error } = await supabase
            .from('inventory_categories')
            .update(updateData)
            .eq('id', categoryId)
            .select()
            .single()

        if (error) throw error

        const { categories } = get()
        const updatedCategories = categories.map(category => 
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
          const { error } = await supabase
              .from('inventory_categories')
              .delete()
              .eq('id', categoryId)

          if (error) throw error

          const { categories } = get()
          set({ categories: categories.filter(category => category.id !== categoryId) })
          return { success: true }
      } catch (error) {
          return { success: false, error: error.message }
      }
  },

  fetchItems: async (categoryId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('inventory_items') // 새 테이블명
        .select(`
          *,
          added_by_user:inventory_users!added_by(name)
        `)
        .eq('category_id', categoryId)
        .order('name')

      if (error) throw error
      set({ items: data, loading: false })
    } catch (error) {
      console.error('Error fetching items:', error)
      set({ loading: false })
    }
  },

  createItem: async (itemData) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items') // 새 테이블명
        .insert([itemData])
        .select()
        .single()

      if (error) throw error

      const { items } = get()
      set({ items: [...items, data] })
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  updateItem: async (itemId, updateData) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items') // 새 테이블명
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error

      const { items } = get()
      const updatedItems = items.map(item => 
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
      const { error } = await supabase
        .from('inventory_items') // 새 테이블명
        .delete()
        .eq('id', itemId)

      if (error) throw error

      const { items } = get()
      set({ items: items.filter(item => item.id !== itemId) })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  fetchAllItems: async (userId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('inventory_items') // 새 테이블명
        .select(`
          *,
          category:inventory_categories!category_id(name),
          added_by_user:inventory_users!added_by(name)
        `)
        .eq('inventory_categories.owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
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
