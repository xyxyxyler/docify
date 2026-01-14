'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        // Check user status
        const { data: profile } = await supabase
          .from('profiles')
          .select('status, suspended_reason')
          .eq('id', data.session.user.id)
          .single();

        if (profile) {
          if (profile.status === 'suspended') {
            await supabase.auth.signOut();
            setError('Your account has been suspended. ' + (profile.suspended_reason ? `Reason: ${profile.suspended_reason}` : 'Contact support for details.'));
            return;
          }

          if (profile.status === 'banned') {
            await supabase.auth.signOut();
            setError('Your account has been permanently banned.');
            return;
          }
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      {/* Left Panel - Gradient Image with rounded corners */}
      <div className="hidden lg:flex lg:w-1/2 p-4">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900 via-pink-600 to-blue-500">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 opacity-90" />

          {/* Wave overlay effect */}
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(255, 0, 128, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 40% 40%, rgba(0, 200, 255, 0.3) 0%, transparent 50%),
              linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)
          `
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
            <div>
              <p className="text-sm tracking-widest uppercase opacity-80">Docify</p>
              <div className="w-16 h-px bg-white/40 mt-2" />
            </div>

            <div className="mt-auto">
              <h1 className="text-5xl font-serif italic leading-tight mb-6">
                Create<br />
                Documents<br />
                Effortlessly
              </h1>
              <p className="text-white/70 text-sm max-w-xs">
                Transform your data into beautiful, personalized documents with just a few clicks.
              </p>
            </div>
          </div>

          {/* Decorative flowing lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <path
              d="M0,100 Q200,150 400,100 T800,100"
              stroke="white"
              strokeWidth="1"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M0,200 Q200,250 400,200 T800,200"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M0,300 Q200,350 400,300 T800,300"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
        {/* Logo */}
        <div className="mb-12">
          <Logo variant="dark" size="md" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif italic text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Enter your email and password to access your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button type="button" className="text-sm text-gray-600 hover:text-purple-600 transition">
              Forgot Password
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link href="/signup" className="text-gray-900 font-medium hover:text-purple-600 transition">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
