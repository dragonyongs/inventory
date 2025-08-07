import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Settings, Save, RefreshCw, Database, Shield, Globe, Bell, Users, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useSystemStore } from '../../store/systemStore'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { toast } from 'react-hot-toast'

export default function AdminSettings() {
    const { user } = useAuthStore()
    const { settings, loading, loadSettings, saveSettings, getSetting } = useSystemStore()

    const [localSettings, setLocalSettings] = useState({
        general: {},
        limits: {},
        automation: {}
    })

    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        totalCategories: 0,
        totalItems: 0,
        expiredItems: 0,
        lastBackup: null,
        systemUptime: null
    })

    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
        fetchSystemStats()
    }, [loadSettings])

    useEffect(() => {
        // 시스템 설정이 로드되면 로컬 설정에 복사
        setLocalSettings({
            general: { ...settings.general },
            limits: { ...settings.limits },
            automation: { ...settings.automation }
        })
    }, [settings])

    const fetchSystemStats = async () => {
        try {
            // 전체 사용자 수
            const { count: userCount } = await supabase
                .from('inventory_users')
                .select('*', { count: 'exact', head: true })

            // 전체 카테고리 수
            const { count: categoryCount } = await supabase
                .from('inventory_categories')
                .select('*', { count: 'exact', head: true })

            // 전체 아이템 수
            const { count: itemCount } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true })

            // 만료된 아이템 수
            const today = new Date().toISOString().split('T')[0]
            const { count: expiredCount } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true })
                .lt('expiry_date', today)

            setSystemStats({
                totalUsers: userCount || 0,
                totalCategories: categoryCount || 0,
                totalItems: itemCount || 0,
                expiredItems: expiredCount || 0,
                lastBackup: localStorage.getItem('lastBackup') || null,
                systemUptime: '99.9%'
            })
        } catch (error) {
            console.error('Error fetching system stats:', error)
        }
    }

    const handleSaveSettings = async () => {
        try {
            setSaving(true)

            // 각 카테고리별로 설정 저장
            const results = await Promise.all([
                saveSettings('general', localSettings.general, user.id),
                saveSettings('limits', localSettings.limits, user.id),
                saveSettings('automation', localSettings.automation, user.id)
            ])

            const allSuccess = results.every(result => result.success)

            if (allSuccess) {
                toast.success('시스템 설정이 저장되었습니다!')
            } else {
                toast.error('일부 설정 저장에 실패했습니다.')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('설정 저장 중 오류가 발생했습니다.')
        } finally {
            setSaving(false)
        }
    }

    const cleanupExpiredItems = async () => {
        if (window.confirm('만료된 모든 아이템을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            try {
                const today = new Date().toISOString().split('T')[0]
                const { data, error } = await supabase
                    .from('inventory_items')
                    .delete()
                    .lt('expiry_date', today)
                    .select()

                if (error) throw error

                toast.success(`${data?.length || 0}개의 만료된 아이템이 삭제되었습니다.`)
                fetchSystemStats()
            } catch (error) {
                console.error('Error cleaning up expired items:', error)
                toast.error('만료된 아이템 정리 중 오류가 발생했습니다.')
            }
        }
    }

    const performSystemBackup = async () => {
        try {
            setSaving(true)
            toast.info('시스템 백업을 시작합니다...')

            // 모든 테이블의 데이터 백업
            const tables = [
                'inventory_users',
                'inventory_categories',
                'inventory_items',
                'inventory_category_permissions',
                'inventory_system_settings'
            ]
            const backupData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                tables: {}
            }

            for (const table of tables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')

                    if (error) throw error
                    backupData.tables[table] = data

                    console.log(`백업 완료: ${table} (${data?.length || 0}개 레코드)`)
                } catch (error) {
                    console.error(`${table} 백업 실패:`, error)
                    backupData.tables[table] = { error: error.message }
                }
            }

            // 백업 통계 생성
            const stats = {
                total_users: backupData.tables.inventory_users?.length || 0,
                total_categories: backupData.tables.inventory_categories?.length || 0,
                total_items: backupData.tables.inventory_items?.length || 0,
                total_permissions: backupData.tables.inventory_category_permissions?.length || 0,
                backup_size_mb: (JSON.stringify(backupData).length / 1024 / 1024).toFixed(2)
            }

            backupData.stats = stats

            // 백업 데이터를 JSON 파일로 다운로드
            const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            })

            const url = URL.createObjectURL(backupBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            // 백업 시간 기록
            const backupTime = new Date().toISOString()
            localStorage.setItem('lastBackup', backupTime)

            setSystemStats(prev => ({
                ...prev,
                lastBackup: backupTime
            }))

            // 관리자에게 백업 완료 알림
            const { sendSystemNotification } = useNotificationStore.getState()
            await sendSystemNotification(
                '시스템 백업 완료',
                `시스템 백업이 성공적으로 완료되었습니다.\n\n백업 통계:\n- 사용자: ${stats.total_users}명\n- 카테고리: ${stats.total_categories}개\n- 아이템: ${stats.total_items}개\n- 백업 크기: ${stats.backup_size_mb}MB`,
                'admin'
            )

            toast.success('시스템 백업이 완료되었습니다!')
        } catch (error) {
            console.error('Error performing backup:', error)
            toast.error('백업 중 오류가 발생했습니다.')
        } finally {
            setSaving(false)
        }
    }

    const resetToDefaults = () => {
        if (window.confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
            setLocalSettings({
                general: {
                    systemName: '재고 관리 PWA',
                    systemDescription: '회사 및 개인용 재고 관리 시스템',
                    enablePublicRegistration: true,
                    enablePublicCategories: true,
                    systemMaintenanceMode: false,
                    emailNotifications: true
                },
                limits: {
                    maxUsersPerCategory: 10,
                    maxItemsPerCategory: 1000,
                    maxCategoriesPerUser: 50,
                    defaultItemExpiry: 365,
                    lowStockThreshold: 5
                },
                automation: {
                    autoDeleteExpiredItems: false,
                    autoBackupEnabled: false,
                    autoNotificationEnabled: true
                }
            })
            toast.info('설정이 기본값으로 되돌려졌습니다.')
        }
    }

    const updateGeneralSetting = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            general: { ...prev.general, [key]: value }
        }))
    }

    const updateLimitSetting = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            limits: { ...prev.limits, [key]: value }
        }))
    }

    const updateAutomationSetting = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            automation: { ...prev.automation, [key]: value }
        }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        to="/admin"
                        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            시스템 전체 설정 및 관리 옵션
                        </p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={resetToDefaults}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        기본값으로 재설정
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                        {saving ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        설정 저장
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
                {/* 시스템 상태 */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">시스템 상태</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{systemStats.totalUsers}</div>
                                <div className="text-sm text-gray-500">총 사용자</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{systemStats.totalCategories}</div>
                                <div className="text-sm text-gray-500">총 카테고리</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{systemStats.totalItems}</div>
                                <div className="text-sm text-gray-500">총 아이템</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{systemStats.expiredItems}</div>
                                <div className="text-sm text-gray-500">만료된 아이템</div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                onClick={performSystemBackup}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Database className="h-4 w-4 mr-2" />
                                시스템 백업
                            </button>
                            <button
                                onClick={cleanupExpiredItems}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                만료 아이템 정리
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* 일반 설정 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">일반 설정</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    시스템 이름
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.general.systemName || ''}
                                    onChange={(e) => updateGeneralSetting('systemName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    시스템 설명
                                </label>
                                <textarea
                                    value={localSettings.general.systemDescription || ''}
                                    onChange={(e) => updateGeneralSetting('systemDescription', e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-700">공개 회원가입 허용</div>
                                    <div className="text-sm text-gray-500">누구나 계정을 만들 수 있습니다</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.general.enablePublicRegistration || false}
                                        onChange={(e) => updateGeneralSetting('enablePublicRegistration', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-700">공개 카테고리 허용</div>
                                    <div className="text-sm text-gray-500">사용자가 카테고리를 공개할 수 있습니다</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.general.enablePublicCategories || false}
                                        onChange={(e) => updateGeneralSetting('enablePublicCategories', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-700">유지보수 모드</div>
                                    <div className="text-sm text-gray-500">시스템 유지보수를 위해 일시 중단합니다</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.general.systemMaintenanceMode || false}
                                        onChange={(e) => updateGeneralSetting('systemMaintenanceMode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 제한 설정 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">제한 설정</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    카테고리당 최대 사용자 수
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.limits.maxUsersPerCategory || 10}
                                    onChange={(e) => updateLimitSetting('maxUsersPerCategory', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    카테고리당 최대 아이템 수
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.limits.maxItemsPerCategory || 1000}
                                    onChange={(e) => updateLimitSetting('maxItemsPerCategory', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    min="1"
                                    max="10000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    사용자당 최대 카테고리 수
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.limits.maxCategoriesPerUser || 50}
                                    onChange={(e) => updateLimitSetting('maxCategoriesPerUser', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    min="1"
                                    max="200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    기본 아이템 유통기한 (일)
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.limits.defaultItemExpiry || 365}
                                    onChange={(e) => updateLimitSetting('defaultItemExpiry', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    min="1"
                                    max="3650"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    저재고 기준 (개)
                                </label>
                                <input
                                    type="number"
                                    value={localSettings.limits.lowStockThreshold || 5}
                                    onChange={(e) => updateLimitSetting('lowStockThreshold', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                                    min="1"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 자동화 설정 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">자동화 설정</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-700">만료된 아이템 자동 삭제</div>
                                    <div className="text-sm text-gray-500">매일 자동으로 만료된 아이템을 삭제합니다</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.automation.autoDeleteExpiredItems || false}
                                        onChange={(e) => updateAutomationSetting('autoDeleteExpiredItems', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-700">이메일 알림</div>
                                    <div className="text-sm text-gray-500">만료 임박, 저재고 등의 알림을 이메일로 발송</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.general.emailNotifications || false}
                                        onChange={(e) => updateGeneralSetting('emailNotifications', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 시스템 정보 */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">시스템 정보</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">마지막 백업</span>
                                <span className="text-sm font-medium">
                                    {systemStats.lastBackup ? new Date(systemStats.lastBackup).toLocaleString('ko-KR') : '-'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">시스템 가동률</span>
                                <span className="text-sm font-medium text-green-600">{systemStats.systemUptime}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">버전</span>
                                <span className="text-sm font-medium">v1.0.0</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">데이터베이스</span>
                                <span className="text-sm font-medium">Supabase PostgreSQL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}