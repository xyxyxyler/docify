-- =============================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- Run this after creating the profiles table
-- =============================================

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Allow insert for authenticated users (for trigger)
CREATE POLICY "Enable insert for service role"
  ON public.profiles FOR INSERT
  WITH CHECK (true);
