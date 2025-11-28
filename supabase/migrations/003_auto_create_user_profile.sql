-- Migration: Auto-create user profile after signup
-- This trigger creates a user profile in the public.users table
-- when a new user is created in auth.users (after email verification)

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_username TEXT;
  user_name TEXT;
BEGIN
  -- Extract username and name from auth.users metadata
  user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', user_username);

  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    username,
    name,
    skills,
    available_for_projects,
    project_count,
    rating,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_username,
    user_name,
    ARRAY[]::TEXT[],
    true,
    0,
    0,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
-- This fires AFTER a user is inserted into auth.users
-- Note: For email confirmation flow, this runs after user confirms email
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a user profile in public.users when a new authenticated user is created. Runs with SECURITY DEFINER to bypass RLS policies.';
