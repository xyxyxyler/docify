-- =============================================
-- STEP 8: ADD BATCH LIMIT TO PROFILES
-- Run this to add document generation batch limits
-- =============================================

-- Add batch_limit column with default of 200
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS batch_limit INTEGER DEFAULT 200;

-- Add constraint to ensure batch_limit is positive
ALTER TABLE public.profiles 
ADD CONSTRAINT positive_batch_limit CHECK (batch_limit > 0);

-- Update the trigger function to include batch_limit for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status, email_quota, batch_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'active',
    100,
    200
  );
  RETURN NEW;
END;
$$;

-- Update existing users to have default batch_limit of 200
UPDATE public.profiles 
SET batch_limit = 200 
WHERE batch_limit IS NULL;
