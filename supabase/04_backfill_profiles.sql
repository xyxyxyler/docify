-- =============================================
-- STEP 4: CREATE PROFILE FOR EXISTING USERS
-- Run this to create profiles for users who already exist
-- =============================================

-- Insert profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  'user'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
