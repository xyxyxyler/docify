-- =============================================
-- STEP 1: CREATE PROFILES TABLE
-- Run this first in Supabase SQL Editor
-- =============================================

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Create index on role for faster admin queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
