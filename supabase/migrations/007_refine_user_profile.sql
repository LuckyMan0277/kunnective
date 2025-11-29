-- Migration to refine user profile schema
-- 1. Remove MBTI column
-- 2. Add personality column (text array)
-- 3. Add is_seeking_team column (boolean)
-- 4. Change values column to text array (dropping old one and recreating)

-- 1. Remove MBTI
ALTER TABLE users DROP COLUMN IF EXISTS mbti;

-- 2. Add personality
ALTER TABLE users ADD COLUMN IF NOT EXISTS personality TEXT[] DEFAULT '{}';

-- 3. Add is_seeking_team
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_seeking_team BOOLEAN DEFAULT false;

-- 4. Change values to array
-- First, drop the existing text column (we assume data loss is acceptable or handled manually if needed, 
-- but since we are in early dev, dropping is fine. If we wanted to keep data, we'd need a temporary column)
ALTER TABLE users DROP COLUMN IF EXISTS values;
ALTER TABLE users ADD COLUMN values TEXT[] DEFAULT '{}';

COMMENT ON COLUMN users.personality IS 'Array of personality traits (e.g., Leader, Planner)';
COMMENT ON COLUMN users.is_seeking_team IS 'Whether the user is actively looking for a team';
COMMENT ON COLUMN users.values IS 'Array of values (e.g., Growth, Fun)';
