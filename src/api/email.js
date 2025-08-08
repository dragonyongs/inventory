// src/api/email.js
export async function verifyEmailChangeOtp({ userId, newEmail, otpCode }) {
    const res = await fetch('/api/verify-email-change-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newEmail, otpCode }),
    })
    return await res.json()
}

export async function sendEmailChangeOtp({ userId, currentEmail, newEmail }) {
    const res = await fetch('/api/send-email-change-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentEmail, newEmail }),
    })
    return await res.json()
}
