// src/lib/itemUtils.js
import { differenceInDays } from 'date-fns';

export function getExpiryStatus(expiryDateString) {
    if (!expiryDateString) return null;

    const today = new Date();
    const expiryDate = new Date(expiryDateString);
    const daysToExpiry = differenceInDays(expiryDate, today);

    if (daysToExpiry < 0) {
        return { status: 'expired', message: '만료됨', color: 'text-red-600 bg-red-100' };
    } else if (daysToExpiry <= 7) {
        return { status: 'expiring', message: `${daysToExpiry}일 후 만료`, color: 'text-yellow-600 bg-yellow-100' };
    } else if (daysToExpiry <= 30) {
        return { status: 'caution', message: `${daysToExpiry}일 후 만료`, color: 'text-blue-600 bg-blue-100' };
    }
    return { status: 'normal', message: '정상', color: 'text-green-600 bg-green-100' };
}
