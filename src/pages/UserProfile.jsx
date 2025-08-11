import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { hashPassword, verifyPassword } from '../lib/auth'
import EmailChangeModal from '../components/EmailChangeModal'

export default function UserProfile() {
    const { user, updateUserProfile } = useAuthStore()
    const [activeTab, setActiveTab] = useState('profile')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [loading, setLoading] = useState(false)

    // 프로필 수정 폼
    const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isSubmitting: profileSubmitting }, setValue } = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || ''
        }
    })

    // 비밀번호 변경 폼
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors, isSubmitting: passwordSubmitting }, reset: resetPasswordForm } = useForm()

    useEffect(() => {
        if (user) {
            setValue('name', user.name)
            setValue('email', user.email)
        }
    }, [user, setValue])

    // 이름 수정
    const onProfileSubmit = async (data) => {
        try {
            const { error } = await supabase
                .from('inventory_users')
                .update({
                    name: data.name,
                    profile_updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) throw error

            // 로컬 스토리지와 상태 업데이트
            const updatedUser = { ...user, name: data.name }
            localStorage.setItem('user', JSON.stringify(updatedUser))
            updateUserProfile(updatedUser)

            toast.success('프로필이 업데이트되었습니다!')
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error('프로필 업데이트 중 오류가 발생했습니다.')
        }
    }

    // 비밀번호 변경
    const onPasswordSubmit = async (data) => {
        try {
            // 현재 비밀번호 확인
            const { data: userData, error: userError } = await supabase
                .from('inventory_users')
                .select('password_hash')
                .eq('id', user.id)
                .single()

            if (userError) throw userError

            const isValidPassword = await verifyPassword(data.currentPassword, userData.password_hash)
            if (!isValidPassword) {
                toast.error('현재 비밀번호가 올바르지 않습니다.')
                return
            }

            // 새 비밀번호와 확인 비밀번호 일치 확인
            if (data.newPassword !== data.confirmPassword) {
                toast.error('새 비밀번호가 일치하지 않습니다.')
                return
            }

            // 새 비밀번호 해시화 및 업데이트
            const hashedNewPassword = await hashPassword(data.newPassword)

            const { error: updateError } = await supabase
                .from('inventory_users')
                .update({
                    password_hash: hashedNewPassword,
                    profile_updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            toast.success('비밀번호가 성공적으로 변경되었습니다!')
            resetPasswordForm()
        } catch (error) {
            console.error('Password change error:', error)
            toast.error('비밀번호 변경 중 오류가 발생했습니다.')
        }
    }

    // 이메일 변경 시작
    const handleEmailChange = () => {
        setShowEmailModal(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
                            <p className="text-sm text-gray-500">개인정보를 관리하고 계정 설정을 변경하세요</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    {/* 탭 네비게이션 */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 text-sm font-medium border-b-2 ${activeTab === 'profile'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <User className="h-4 w-4 inline mr-2" />
                                기본 정보
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`py-4 text-sm font-medium border-b-2 ${activeTab === 'password'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Lock className="h-4 w-4 inline mr-2" />
                                보안
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* 프로필 탭 */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>

                                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                이름
                                            </label>
                                            <input
                                                {...registerProfile('name', { required: '이름을 입력해주세요' })}
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="이름을 입력하세요"
                                            />
                                            {profileErrors.name && (
                                                <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                이메일 주소
                                            </label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleEmailChange}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                                                >
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    변경
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                이메일 변경 시 새 이메일로 인증 코드가 발송됩니다.
                                            </p>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={profileSubmitting}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {profileSubmitting ? (
                                                    '저장 중...'
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        저장
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* 비밀번호 변경 탭 */}
                        {activeTab === 'password' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경</h3>

                                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                현재 비밀번호
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...registerPassword('currentPassword', { required: '현재 비밀번호를 입력해주세요' })}
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="현재 비밀번호를 입력하세요"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.currentPassword && (
                                                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                새 비밀번호
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...registerPassword('newPassword', {
                                                        required: '새 비밀번호를 입력해주세요',
                                                        minLength: { value: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' }
                                                    })}
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="새 비밀번호를 입력하세요"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.newPassword && (
                                                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                새 비밀번호 확인
                                            </label>
                                            <div className="relative">
                                                <input
                                                    {...registerPassword('confirmPassword', { required: '비밀번호 확인을 입력해주세요' })}
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="새 비밀번호를 다시 입력하세요"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                            {passwordErrors.confirmPassword && (
                                                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                                            )}
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                            <div className="text-sm text-yellow-700">
                                                <strong>비밀번호 요구사항:</strong>
                                                <ul className="mt-2 list-disc list-inside space-y-1">
                                                    <li>최소 6자 이상</li>
                                                    <li>영문, 숫자 조합 권장</li>
                                                    <li>특수문자 포함 권장</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={passwordSubmitting}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {passwordSubmitting ? (
                                                    '변경 중...'
                                                ) : (
                                                    <>
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        비밀번호 변경
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 이메일 변경 모달 */}
            <EmailChangeModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                currentEmail={user?.email}
            />
        </div>
    )
}
