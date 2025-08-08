import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Mail, Send, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { createClient } from '@supabase/supabase-js'
import { sendEmailChangeOtp, verifyEmailChangeOtp } from '../api/email'

// (환경변수 import는 필요시 별도 util로 빼도 OK)
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function EmailChangeModal({ isOpen, onClose, currentEmail }) {
    const { user, setUser } = useAuthStore()
    const [step, setStep] = useState(1) // 1: 새 이메일 입력, 2: OTP 인증
    const [newEmail, setNewEmail] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [timeLeft, setTimeLeft] = useState(300)
    const [loading, setLoading] = useState(false)

    // 새 이메일 입력 폼
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    // OTP 입력 폼
    const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors, isSubmitting: otpSubmitting } } = useForm()

    React.useEffect(() => {
        let interval = null
        if (otpSent && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((sec) => sec - 1), 1000)
        } else if (timeLeft === 0) {
            setOtpSent(false)
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [otpSent, timeLeft])

    // [1] 새 이메일로 OTP 전송
    const sendOTP = async (data) => {
        try {
            setLoading(true)
            const result = await sendEmailChangeOtp({
                userId: user.id,
                currentEmail: user.email,
                newEmail: data.newEmail,
            })

            if (result.success) {
                setNewEmail(data.newEmail)
                setStep(2)
                setOtpSent(true)
                setTimeLeft(300)
                toast.success('인증 코드가 새 이메일로 발송되었습니다!')
            } else {
                toast.error(result.error || '이메일 발송 중 오류가 발생했습니다.')
            }
        } catch (error) {
            console.error('OTP send error:', error)
            toast.error('이메일 발송 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // [2] OTP 인증 및 이메일 바꾸기(성공 시 store도 API로 fetch → setUser)
    const verifyOTP = async (data) => {
        try {
            const result = await verifyEmailChangeOtp({
                userId: user.id,
                newEmail,
                otpCode: data.otpCode,
            })

            if (result.success) {
                toast.success('이메일이 성공적으로 변경되었습니다!')
                // 서버에서 최신 유저 정보 다시 가져오기
                const { data: updatedUser, error } = await supabase
                    .from('inventory_users')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (!error && updatedUser) {
                    setUser(updatedUser)
                    onClose()
                } else {
                    toast.error('이메일은 변경됐지만, 사용자 정보를 다시 불러올 수 없습니다.')
                    onClose()
                }
            } else {
                toast.error(result.error || '인증 코드가 올바르지 않습니다.')
            }
        } catch (error) {
            console.error('OTP verify error:', error)
            toast.error('인증 중 오류가 발생했습니다.')
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleClose = () => {
        setStep(1)
        setNewEmail('')
        setOtpSent(false)
        setTimeLeft(300)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 !mt-0">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        {step === 1 ? '이메일 변경' : '이메일 인증'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Step 1: 새 이메일 입력 */}
                {step === 1 && (
                    <form onSubmit={handleSubmit(sendOTP)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                현재 이메일
                            </label>
                            <input
                                type="email"
                                value={currentEmail}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                새 이메일 주소
                            </label>
                            <input
                                {...register('newEmail', {
                                    required: '새 이메일을 입력해주세요',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: '올바른 이메일 형식을 입력해주세요'
                                    }
                                })}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="새 이메일 주소를 입력하세요"
                            />
                            {errors.newEmail && (
                                <p className="mt-1 text-sm text-red-600">{errors.newEmail.message}</p>
                            )}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="text-sm text-blue-700">
                                <Mail className="h-4 w-4 inline mr-2" />
                                새 이메일 주소로 6자리 인증 코드가 발송됩니다.
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting || loading ? '발송 중...' : (<><Send className="h-4 w-4 mr-2 inline" />인증 코드 발송</>)}
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 2: OTP 인증 */}
                {step === 2 && (
                    <form onSubmit={handleOtpSubmit(verifyOTP)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                새 이메일 주소
                            </label>
                            <input
                                type="email"
                                value={newEmail}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                인증 코드
                            </label>
                            <input
                                {...registerOtp('otpCode', {
                                    required: '인증 코드를 입력해주세요',
                                    pattern: {
                                        value: /^\d{6}$/,
                                        message: '6자리 숫자를 입력해주세요'
                                    }
                                })}
                                type="text"
                                maxLength="6"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-wider"
                                placeholder="000000"
                            />
                            {otpErrors.otpCode && (
                                <p className="mt-1 text-sm text-red-600">{otpErrors.otpCode.message}</p>
                            )}
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="text-sm text-green-700">
                                <Check className="h-4 w-4 inline mr-2" />
                                <strong>{newEmail}</strong>로 인증 코드를 발송했습니다.
                                {otpSent && (
                                    <div className="mt-1">
                                        남은 시간: <strong>{formatTime(timeLeft)}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                이전
                            </button>
                            <button
                                type="submit"
                                disabled={otpSubmitting || timeLeft === 0}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                                {otpSubmitting ? '인증 중...' : (<><Check className="h-4 w-4 mr-2 inline" />이메일 변경</>)}
                            </button>
                        </div>
                        {timeLeft === 0 && (
                            <div className="text-center">
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    인증 코드 재발송
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    )
}
