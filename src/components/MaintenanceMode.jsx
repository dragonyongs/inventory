import React from 'react'
import { Settings } from 'lucide-react'

export default function MaintenanceMode() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
                <Settings className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    시스템 유지보수 중
                </h1>
                <p className="text-gray-600 mb-6">
                    더 나은 서비스 제공을 위해 현재 시스템 점검 중입니다.
                    잠시 후 다시 이용해 주세요.
                </p>
                <div className="text-sm text-gray-500">
                    문의사항이 있으시면 관리자에게 연락해 주세요.
                </div>
            </div>
        </div>
    )
}
