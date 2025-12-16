import { createServerClient } from '@/lib/clients/supabase';
import { redirect } from 'next/navigation';
import CallTranscript from '@/components/CallTranscript';
import { PlatformLayout } from '@/components/platform-layout';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get call
  const { data: call, error } = await supabase
    .from('calls')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !call) {
    redirect('/calls');
  }

  // Verify user owns the firm that owns this call
  const { data: firmData } = await supabase
    .from('firms')
    .select('owner_user_id')
    .eq('id', (call as any).firm_id)
    .single();

  const firm = firmData as any;
  if (!firm || firm.owner_user_id !== session.user.id) {
    redirect('/calls');
  }

  return (
    <PlatformLayout>
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col" style={{ backgroundColor: '#F5F7FA' }}>
        <CallTranscript call={call as any} />
      </div>
    </PlatformLayout>
  );
}

