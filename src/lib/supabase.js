import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SQL 스키마 (Supabase에서 실행)
/*
-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    shared_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    purchase_date DATE,
    expiry_date DATE,
    notes TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Category permissions
CREATE TABLE category_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id, user_id)
    );

-- 이메일 변경 요청 및 OTP 저장 테이블
CREATE TABLE inventory_email_change_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES inventory_users(id) ON DELETE CASCADE NOT NULL,
    current_email VARCHAR(255) NOT NULL,
    new_email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

- OTP 인덱스 추가
CREATE INDEX idx_email_change_otp ON inventory_email_change_requests(otp_code, user_id);
CREATE INDEX idx_email_change_expires ON inventory_email_change_requests(expires_at);

-- inventory_users 테이블에 프로필 수정 관련 필드 추가 (필요시)
ALTER TABLE inventory_users ADD COLUMN profile_updated_at TIMESTAMP DEFAULT NOW();

-- RLS 비활성화
ALTER TABLE inventory_email_change_requests DISABLE ROW LEVEL SECURITY;
*/
