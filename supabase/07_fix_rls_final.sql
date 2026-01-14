-- =============================================
-- FIX RLS CIRCULAR REFERENCE ISSUE
-- The problem: Admin policy queries profiles table
-- while we're already querying profiles table
-- =============================================

-- Option 1: Simplest fix - drop all policies and recreate simple ones
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.profiles;

-- Simple policy: Users can always read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Simple policy: Users can update their own profile  
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow inserts (for the trigger that creates profiles)
CREATE POLICY "Allow profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- For admin access to ALL profiles, we'll handle that in the API using service role key
-- This avoids the circular reference problem entirely
