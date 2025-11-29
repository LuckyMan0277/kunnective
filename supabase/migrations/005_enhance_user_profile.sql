-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mbti VARCHAR(4),
ADD COLUMN IF NOT EXISTS double_major VARCHAR(100),
ADD COLUMN IF NOT EXISTS status_message VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_preference VARCHAR(50),
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN users.mbti IS 'MBTI personality type (e.g., INTJ)';
COMMENT ON COLUMN users.double_major IS 'Double major or minor';
COMMENT ON COLUMN users.status_message IS 'Short status message';
COMMENT ON COLUMN users.contact_preference IS 'Preferred contact method';
COMMENT ON COLUMN users.links IS 'List of external links (e.g., GitHub, Blog)';
