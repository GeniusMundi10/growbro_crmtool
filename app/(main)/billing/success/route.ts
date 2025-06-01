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
      // Update payment status to 'success'
      await supabase.from('payments')
        .update({
          status: 'success',
          payu_response,
          updated_at: new Date().toISOString(),
        })
        .eq('payu_txn_id', txnid);
    }

    // Redirect or show a success message
    return NextResponse.redirect('/billing?payment=success');
  } catch (error) {
    console.error('Error processing payment success:', error);
    return NextResponse.redirect('/billing?payment=error');
  }
}
