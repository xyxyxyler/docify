-- =============================================
-- STEP 5: ADMIN FEATURES - User Management
-- Run this to add admin management columns
-- =============================================

-- Add status column for account state
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for valid status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'banned'));
  END IF;
END $$;

-- Add email quota management columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_quota INTEGER DEFAULT 100;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS emails_sent_today INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_email_reset DATE DEFAULT CURRENT_DATE;

-- Add suspension tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);

-- Update RLS to allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
