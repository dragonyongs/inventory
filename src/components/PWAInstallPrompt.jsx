import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowInstallPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('PWA 설치 승인')
        } else {
            console.log('PWA 설치 거부')
        }

        setDeferredPrompt(null)
        setShowInstallPrompt(false)
    }

    const handleDismiss = () => {
        setShowInstallPrompt(false)
    }

    if (!showInstallPrompt) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    <div>
                        <p className="text-sm font-medium">앱으로 설치하기</p>
                        <p className="text-xs opacity-90">홈 화면에 추가하여 더 빠르게 이용하세요</p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="ml-2 p-1 rounded-md hover:bg-blue-500"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <button
                onClick={handleInstallClick}
                className="mt-3 w-full bg-white text-blue-600 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-100"
            >
                설치하기
            </button>
        </div>
    )
}
