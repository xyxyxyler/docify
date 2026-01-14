'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Shield,
    BarChart3,
    ArrowLeft,
    UserCheck,
    UserX,
    Ban,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

interface Stats {
    total: number;
    active: number;
    suspended: number;
    banned: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, suspended: 0, banned: 0 });
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            setIsAdmin(true);
            fetchStats();
        };

        checkAdmin();
    }, [router, supabase]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/users?limit=1000');
            const data = await response.json();

            if (data.users) {
                const users = data.users;
                setStats({
                    total: users.length,
                    active: users.filter((u: any) => u.status === 'active' || !u.status).length,
                    suspended: users.filter((u: any) => u.status === 'suspended').length,
                    banned: users.filter((u: any) => u.status === 'banned').length,
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Back</span>
                            </Link>
                            <div className="h-6 w-px bg-gray-200" />
                            <Logo variant="dark" size="md" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 border border-violet-200 rounded-full">
                            <Shield className="w-4 h-4 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700">Admin Panel</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage users and monitor platform activity</p>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                                <UserX className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Suspended</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.suspended}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                                <Ban className="w-6 h-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Banned</p>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.banned}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/admin/users"
                        className="group bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:border-violet-300 hover:shadow-lg transition-all duration-200"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-violet-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">User Management</h3>
                        <p className="text-sm text-gray-500">View, search, and manage all registered users</p>
                    </Link>

                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm opacity-60">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                            <BarChart3 className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Analytics</h3>
                        <p className="text-sm text-gray-500">Coming soon - Usage statistics and insights</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm opacity-60">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Logs</h3>
                        <p className="text-sm text-gray-500">Coming soon - View all sent emails</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
