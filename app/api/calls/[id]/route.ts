import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/clients/supabase';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get call to verify ownership
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('*, firms!inner(owner_user_id)')
      .eq('id', id)
      .single();

    if (callError || !callData) {
      return new NextResponse('Call not found', { status: 404 });
    }

    const call = callData as any;
    const firm = call.firms as any;

    // Verify user owns the firm
    if (firm.owner_user_id !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the call
    const { error: deleteError } = await supabase
      .from('calls')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting call:', deleteError);
      return new NextResponse('Failed to delete call', { status: 500 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/calls/[id]:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

