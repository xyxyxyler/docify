import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// PATCH /api/admin/users/[id]/quota - Update user email quota
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

        // Get request body
        const body = await request.json();
        const { email_quota } = body;

        // Validate quota
        if (typeof email_quota !== 'number' || email_quota < 0) {
            return NextResponse.json({ error: 'Invalid quota value' }, { status: 400 });
        }

        // Update user profile
        const { data, error } = await supabase
            .from('profiles')
            .update({ email_quota })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user quota:', error);
            return NextResponse.json({ error: 'Failed to update user quota' }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data });
    } catch (error) {
        console.error('Admin quota API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
