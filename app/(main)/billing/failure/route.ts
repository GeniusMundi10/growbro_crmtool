import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const form = await req.formData();
    const txnid = form.get('txnid') as string;
    const payu_response = Object.fromEntries(form.entries());

    // (Optional) Verify hash here

    // Only update if the Supabase URL is configured
    if (process.env.SUPABASE_URL) {
      // Update payment status to 'failure'
      await supabase.from('payments')
        .update({
          status: 'failure',
          payu_response,
          updated_at: new Date().toISOString(),
        })
        .eq('payu_txn_id', txnid);
    }

    // Redirect or show a failure message
    return NextResponse.redirect('/billing?payment=failure');
  } catch (error) {
    console.error('Error processing payment failure:', error);
    return NextResponse.redirect('/billing?payment=error');
  }
}
