// src/lib/itemUtils.js
import { differenceInDays, isAfter } from 'date-fns'

export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null
  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysToExpiry = differenceInDays(expiry, today)
  if (daysToExpiry < 0)
    return { status: 'expired', message: '만료됨', color: 'text-red-600 bg-red-100' }
  if (daysToExpiry <= 7)
    return { status: 'warning', message: `${daysToExpiry}일 후 만료`, color: 'text-yellow-600 bg-yellow-100' }
  if (daysToExpiry <= 30)
    return { status: 'caution', message: `${daysToExpiry}일 후 만료`, color: 'text-blue-600 bg-blue-100' }
  return null
}
