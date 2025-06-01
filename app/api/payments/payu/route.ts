import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Plan pricing map (could be replaced with DB lookup) ---
const PLAN_PRICING: Record<string, number> = {
  starter: 49,
  basic: 199,
  pro: 349,
  growth: 649,
  advanced: 1199,
};

// --- Util: Generate unique txnid ---
function generateTxnId() {
  return 'txn_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

// --- Util: Generate PayU hash ---
function generatePayUHash(params: Record<string, string>, salt: string) {
  // Hash sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    '', '', '', '', '', '', '', '', '', '', '',
    salt,
  ].join('|');
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, plan, firstname, email, phone } = body;
    if (!userId || !plan || !firstname || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lookup plan amount
    const amount = PLAN_PRICING[plan.toLowerCase()];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Generate transaction ID
    const txnid = generateTxnId();
    const productinfo = plan;

    // Prepare PayU params
    const payuParams = {
      key: process.env.PAYU_MERCHANT_KEY!,
      txnid,
      amount: amount.toFixed(2),
      productinfo,
      firstname,
      email,
      phone,
      surl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/billing/success`,
      furl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/billing/failure`,
      udf1: userId,
    };

    // Generate hash
    const hash = generatePayUHash(payuParams, process.env.PAYU_MERCHANT_SALT!);

    // --- Save payment record in DB (Supabase implementation) ---
    const { error: dbError } = await supabase.from('payments').insert([{
      user_id: userId,
      plan,
      amount,
      status: 'pending',
      payu_txn_id: txnid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    if (dbError) throw dbError;

    // Return params to frontend
    return NextResponse.json({ ...payuParams, hash, action: process.env.PAYU_BASE_URL });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
