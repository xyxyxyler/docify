'use client';

import { Ban, ShieldAlert, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';

export default function BlockedPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('status, suspended_reason')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setStatus(profile.status);
                    setReason(profile.suspended_reason);
                    // If they somehow got here but are active, redirect to dashboard
                    if (profile.status === 'active') {
                        router.push('/dashboard');
                    }
                }
            }
        };
        fetchStatus();
    }, [supabase, router]);

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        localStorage.removeItem('docify_session');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-md w-full p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        {status === 'banned' ? (
                            <Ban className="w-8 h-8 text-red-600" />
                        ) : (
                            <ShieldAlert className="w-8 h-8 text-orange-600" />
                        )}
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {status === 'banned' ? 'Account Permanently Banned' : 'Account Suspended'}
                </h1>

                <p className="text-gray-600 mb-6">
                    {status === 'banned'
                        ? 'Your account has been permanently banned due to a violation of our terms of service.'
                        : 'Your account has been temporarily suspended.'}
                </p>

                {reason && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason</p>
                        <p className="text-gray-800 font-medium">{reason}</p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>

                    <p className="text-xs text-gray-400 mt-4">
                        If you believe this is a mistake, please contact support at{' '}
                        <a href="mailto:support@docify.com" className="text-violet-600 hover:underline">
                            support@docify.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
