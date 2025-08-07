import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'fallback-secret-key-at-least-32-characters-long'
)
const JWT_EXPIRES_IN = import.meta.env.VITE_JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = import.meta.env.VITE_JWT_REFRESH_EXPIRES_IN || '7d'

// 만료 시간을 초 단위로 변환하는 함수
const parseExpirationTime = (timeString) => {
  const value = parseInt(timeString.slice(0, -1))
  const unit = timeString.slice(-1)
  
  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 24 * 60 * 60
    default: return 15 * 60 // 기본값 15분
  }
}

// 비밀번호 해시화
export const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// 비밀번호 검증
export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// JWT 액세스 토큰 생성
export const generateAccessToken = async (user) => {
  const expirationTime = Math.floor(Date.now() / 1000) + parseExpirationTime(JWT_EXPIRES_IN)
  
  return await new SignJWT({ 
    id: user.id, 
    username: user.username, 
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(JWT_SECRET)
}

// JWT 리프레시 토큰 생성
export const generateRefreshToken = async (user) => {
  const expirationTime = Math.floor(Date.now() / 1000) + parseExpirationTime(JWT_REFRESH_EXPIRES_IN)
  
  return await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(JWT_SECRET)
}

// JWT 토큰 검증
export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// 토큰에서 사용자 정보 추출
export const getUserFromToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

// 토큰 만료 확인 (브라우저에서 안전하게 확인)
export const isTokenExpired = (token) => {
  try {
    // JWT의 payload를 base64 디코딩
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    const decoded = JSON.parse(jsonPayload)
    return decoded.exp < Date.now() / 1000
  } catch (error) {
    return true
  }
}
