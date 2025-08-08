// src/lib/categoryUtils.js
import { differenceInDays, isAfter } from 'date-fns'
import { supabase } from '../lib/supabase'

export function getTotalCategories(categories) {
  return categories.length
}

export function getTotalItems(categories) {
  // 예시: items를 배열이거나 count field로 갖고 있다고 가정
  return categories.reduce(
    (sum, cat) => sum + (cat.items?.[0]?.count || 0),
    0
  )
}

export function getTotalOwners(categories) {
  return categories.filter(cat => !!cat.manager_id).length
}

export function getOwnedCategories(categories) {
  return categories.filter(cat => !cat.is_shared)
}

export function getSharedCategories(categories) {
  return categories.filter(cat => cat.is_shared)
}

export function getTotalItemsInList(items) {
  return items.length
}

export function getTotalValue(items) {
  return items.reduce(
    (sum, item) => sum + ((item.price || 0) * (item.quantity || 0)),
    0
  )
}

export function getExpiringSoon(items, days = 7) {
  return items.filter(item => {
    if (!item.expiry_date) return false
    const daysToExpiry = differenceInDays(
      new Date(item.expiry_date),
      new Date()
    )
    return daysToExpiry >= 0 && daysToExpiry <= days
  }).length
}

export function getExpired(items) {
  return items.filter(item => {
    if (!item.expiry_date) return false
    return isAfter(new Date(), new Date(item.expiry_date))
  }).length
}

export function copyCategoryShareLink(category, opts = {}) {
  if (!category.shared_token) {
    if (opts.toast) opts.toast('카테고리 설정에서 공유 링크를 생성하세요.', { icon: 'ℹ️' })
    return null
  }
  const shareUrl = `${window.location.origin}/shared/${category.shared_token}`
  navigator.clipboard.writeText(shareUrl)
  if (opts.toast) opts.toast('공유 링크가 클립보드에 복사되었습니다!', { icon: '🔗' })
  return shareUrl
}

export async function fetchPublicCategories() {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select(`
      *,
      owner:inventory_users!owner_id(name, username),
      items:inventory_items(count)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}