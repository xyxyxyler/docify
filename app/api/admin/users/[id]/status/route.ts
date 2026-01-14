import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH /api/admin/users/[id]/status - Update user status
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const userId = params.id;

        // Check if current user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Prevent admin from modifying their own status
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot modify your own status' }, { status: 400 });
        }

        // Get request body
        const body = await request.json();
        const { status, reason } = body;

        // Validate status
        if (!['active', 'suspended', 'banned'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // Update user profile
        const updateData: Record<string, any> = {
            status,
            suspended_reason: status === 'active' ? null : reason || null,
            suspended_at: status === 'active' ? null : new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user status:', error);
            return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data });
    } catch (error) {
        console.error('Admin status API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
