-- Migration: Add profile fields for user setup and remove role restrictions
-- Philosophy: 자율성 - 누구든 무엇이든 할 수 있다

-- Remove role field (역할 제한 없음)
ALTER TABLE public.users
DROP COLUMN IF EXISTS role;

-- Add major field (전공)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS major VARCHAR(100);

-- Add year field (학년)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS year VARCHAR(50);

-- Add comment
COMMENT ON COLUMN public.users.major IS '전공 (예: 컴퓨터공학과, 예술학과, 경영학과 등 - 제한 없음)';
COMMENT ON COLUMN public.users.year IS '학년 (예: 1학년, 2학년, 대학원생 등)';
COMMENT ON TABLE public.users IS 'Kunnective - 자율적인 사용자 프로필. 역할 제한 없이 누구든 무엇이든 할 수 있습니다.';
