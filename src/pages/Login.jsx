import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { User, Lock, Mail, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useSystemStore } from '../store/systemStore'

export default function Login() {
    const [isRegister, setIsRegister] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { login, register } = useAuthStore()
    const { getSetting, loadSettings } = useSystemStore()
    const {
        handleSubmit,
        register: formRegister,
        formState: { errors, isSubmitting },
        reset,
        watch
    } = useForm()

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const isPublicRegistrationEnabled = getSetting('general', 'enablePublicRegistration')
    const systemName = getSetting('general', 'systemName') || '물품 관리'

    const onSubmit = async (data) => {
        try {
            if (isRegister && !isPublicRegistrationEnabled) {
                toast.error('현재 신규 회원가입이 제한되어 있습니다.')
                return
            }

            let result
            if (isRegister) {
                result = await register(data.username, data.name, data.password, data.email)
            } else {
                result = await login(data.username, data.password)
            }

            if (result.success) {
                toast.success(isRegister ? '회원가입 성공!' : '로그인 성공!')
                reset()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('오류가 발생했습니다.')
        }
    }

    const toggleMode = () => {
        setIsRegister(!isRegister)
        setShowPassword(false)
        reset()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                        {isRegister ?
                            <UserPlus className="h-8 w-8 text-white" /> :
                            <LogIn className="h-8 w-8 text-white" />
                        }
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        {isRegister ? '새 계정 만들기' : '로그인'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">{systemName}</p>
                </div>

                {/* Form Card */}
                <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-8">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Username field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                사용자명
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...formRegister('username', { required: '사용자명을 입력해주세요' })}
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${errors.username
                                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500'
                                            : 'border-gray-300 placeholder-gray-400 focus:border-blue-500'
                                        }`}
                                    placeholder="사용자명을 입력하세요"
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                            )}
                        </div>

                        {/* Register-only fields */}
                        {isRegister && (
                            <>
                                {/* Name field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        이름
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...formRegister('name', { required: '이름을 입력해주세요' })}
                                            type="text"
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${errors.name
                                                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500'
                                                    : 'border-gray-300 placeholder-gray-400 focus:border-blue-500'
                                                }`}
                                            placeholder="이름을 입력하세요"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        이메일
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...formRegister('email', {
                                                required: '이메일을 입력해주세요',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: '올바른 이메일 형식을 입력해주세요'
                                                }
                                            })}
                                            type="email"
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${errors.email
                                                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500'
                                                    : 'border-gray-300 placeholder-gray-400 focus:border-blue-500'
                                                }`}
                                            placeholder="이메일을 입력하세요"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    {...formRegister('password', { required: '비밀번호를 입력해주세요' })}
                                    type={showPassword ? "text" : "password"}
                                    className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${errors.password
                                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500'
                                            : 'border-gray-300 placeholder-gray-400 focus:border-blue-500'
                                        }`}
                                    placeholder="비밀번호를 입력하세요"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ?
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> :
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    }
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    {isSubmitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    ) : isRegister ? (
                                        <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                                    ) : (
                                        <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                                    )}
                                </span>
                                {isSubmitting ? '처리 중...' : (isRegister ? '계정 만들기' : '로그인')}
                            </button>
                        </div>

                        {/* Toggle mode */}
                        <div className="text-center">
                            {isPublicRegistrationEnabled ? (
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                >
                                    {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                                </button>
                            ) : (
                                !isRegister && (
                                    <p className="text-xs text-gray-500">
                                        신규 회원가입은 현재 제한되어 있습니다.
                                    </p>
                                )
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
