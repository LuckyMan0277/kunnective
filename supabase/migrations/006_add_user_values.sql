-- Add values column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "values" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users."values" IS 'User values and philosophy (e.g., Growth, Fun, Impact)';
