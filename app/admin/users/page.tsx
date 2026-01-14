'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    ArrowLeft,
    Shield,
    MoreHorizontal,
    UserCheck,
    UserX,
    Ban,
    Mail,
    Edit3,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    email_quota: number;
    emails_sent_today: number;
    created_at: string;
    suspended_at: string | null;
    suspended_reason: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionModal, setActionModal] = useState<'status' | 'quota' | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
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
        };

        checkAdmin();
    }, [router, supabase]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, pagination.page, search, statusFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(search && { search }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (data.users) {
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId: string, status: string, reason?: string) => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
            });

            if (response.ok) {
                fetchUsers();
                setActionModal(null);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuotaChange = async (userId: string, quota: number) => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}/quota`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_quota: quota }),
            });

            if (response.ok) {
                fetchUsers();
                setActionModal(null);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Error updating quota:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700 border-green-200',
            suspended: 'bg-amber-100 text-amber-700 border-amber-200',
            banned: 'bg-red-100 text-red-700 border-red-200',
        };
        return styles[status] || styles.active;
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
                            <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Admin</span>
                            </Link>
                            <div className="h-6 w-px bg-gray-200" />
                            <Logo variant="dark" size="md" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 border border-violet-200 rounded-full">
                            <Shield className="w-4 h-4 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700">User Management</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
                        <p className="text-gray-500">Manage and monitor all registered users</p>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Emails Today</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quota</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                                Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(user.status || 'active')}`}>
                                                    {user.status || 'active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-900">{user.emails_sent_today || 0}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-900">{user.email_quota || 100}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-500 text-sm">{formatDate(user.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <button
                                                                onClick={() => { setSelectedUser(user); setActionModal('status'); }}
                                                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                                title="Change Status"
                                                            >
                                                                {user.status === 'active' || !user.status ? (
                                                                    <UserX className="w-4 h-4 text-amber-600" />
                                                                ) : (
                                                                    <UserCheck className="w-4 h-4 text-green-600" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedUser(user); setActionModal('quota'); }}
                                                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                                title="Edit Quota"
                                                            >
                                                                <Edit3 className="w-4 h-4 text-gray-500" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {user.role === 'admin' && (
                                                        <span className="text-xs text-violet-600 font-medium">Admin</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Status Modal */}
            {actionModal === 'status' && selectedUser && (
                <StatusModal
                    user={selectedUser}
                    onClose={() => { setActionModal(null); setSelectedUser(null); }}
                    onSubmit={handleStatusChange}
                    loading={actionLoading}
                />
            )}

            {/* Quota Modal */}
            {actionModal === 'quota' && selectedUser && (
                <QuotaModal
                    user={selectedUser}
                    onClose={() => { setActionModal(null); setSelectedUser(null); }}
                    onSubmit={handleQuotaChange}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

// Status Change Modal Component
function StatusModal({ user, onClose, onSubmit, loading }: {
    user: User;
    onClose: () => void;
    onSubmit: (userId: string, status: string, reason?: string) => void;
    loading: boolean;
}) {
    const [status, setStatus] = useState(user.status || 'active');
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Change User Status</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">
                        Changing status for <span className="font-medium text-gray-900">{user.email}</span>
                    </p>

                    <div className="space-y-3 mb-6">
                        {['active', 'suspended', 'banned'].map((s) => (
                            <label key={s} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="status"
                                    value={s}
                                    checked={status === s}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="capitalize font-medium text-gray-900">{s}</span>
                            </label>
                        ))}
                    </div>

                    {status !== 'active' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason (optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for status change..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSubmit(user.id, status, reason)}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Quota Edit Modal Component
function QuotaModal({ user, onClose, onSubmit, loading }: {
    user: User;
    onClose: () => void;
    onSubmit: (userId: string, quota: number) => void;
    loading: boolean;
}) {
    const [quota, setQuota] = useState(user.email_quota || 100);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Email Quota</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">
                        Set daily email limit for <span className="font-medium text-gray-900">{user.email}</span>
                    </p>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Email Limit
                        </label>
                        <input
                            type="number"
                            value={quota}
                            onChange={(e) => setQuota(parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Current usage: {user.emails_sent_today || 0} emails sent today
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSubmit(user.id, quota)}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Quota'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
