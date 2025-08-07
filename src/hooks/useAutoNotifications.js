import { useEffect } from 'react'
import { useNotificationStore } from '../store/notificationStore'
import { useSystemStore } from '../store/systemStore'

export const useAutoNotifications = () => {
    const { checkExpiryAlerts, checkLowStockAlerts } = useNotificationStore()
    const { getSetting } = useSystemStore()

    useEffect(() => {
        // 자동 알림이 활성화된 경우에만 실행
        const isAutoNotificationEnabled = getSetting('automation', 'autoNotificationEnabled')
        
        if (!isAutoNotificationEnabled) return

        // 매시간 만료 임박 및 저재고 체크
        const interval = setInterval(async () => {
        try {
            console.log('자동 알림 체크 시작...')
            
            // 만료 임박 체크
            const expiryResult = await checkExpiryAlerts()
            if (expiryResult.success) {
                console.log(`만료 임박 알림 ${expiryResult.count}명에게 발송`)
            }
            
            // 저재고 체크
            const lowStockResult = await checkLowStockAlerts()
            if (lowStockResult.success) {
                console.log(`저재고 알림 ${lowStockResult.count}명에게 발송`)
            }
        } catch (error) {
            console.error('자동 알림 체크 중 오류:', error)
        }
        }, 60 * 60 * 1000) // 1시간마다

        // 컴포넌트 언마운트 시 interval 정리
        return () => clearInterval(interval)
    }, [checkExpiryAlerts, checkLowStockAlerts, getSetting])
}
