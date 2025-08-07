import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useSystemStore } from '../store/systemStore'

export default function Login() {
    const [isRegister, setIsRegister] = useState(false)
    const { login, register } = useAuthStore()
    const { getSetting, loadSettings } = useSystemStore()
    const { handleSubmit, register: formRegister, formState: { errors, isSubmitting }, reset } = useForm()

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const isPublicRegistrationEnabled = getSetting('general', 'enablePublicRegistration')
    const systemName = getSetting('general', 'systemName') || '재고 관리 PWA'

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isRegister ? '계정 만들기' : '로그인'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">{systemName}</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">사용자명</label>
                            <input
                                {...formRegister('username', { required: '사용자명을 입력해주세요' })}
                                type="text"
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="사용자명"
                            />
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                            )}
                        </div>

                        {isRegister && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">이름</label>
                                    <input
                                        {...formRegister('name', { required: '이름을 입력해주세요' })}
                                        type="text"
                                        className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="이름"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">이메일</label>
                                    <input
                                        {...formRegister('email', {
                                            required: '이메일을 입력해주세요',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: '올바른 이메일 형식을 입력해주세요'
                                            }
                                        })}
                                        type="email"
                                        className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="이메일"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                    )}
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                            <input
                                {...formRegister('password', { required: '비밀번호를 입력해주세요' })}
                                type="password"
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="비밀번호"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSubmitting ? '처리 중...' : (isRegister ? '계정 만들기' : '로그인')}
                        </button>
                    </div>

                    <div className="text-center">
                        {isPublicRegistrationEnabled ? (
                            <button
                                type="button"
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-blue-600 hover:text-blue-500 text-sm"
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
    )
}
