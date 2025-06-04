// This file is deprecated. Logic moved to route.ts
import { createClient } from '@supabase/supabase-js';

// POST /api/payments/razorpay/verify-payment
export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, plan_id, amount, currency } = await req.json();
        const crypto = await import("crypto");
        const generated_signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");
        let status = 'success';
        let error_reason = null;
        if (generated_signature !== razorpay_signature) {
            status = 'failure';
            error_reason = 'Invalid signature';
        }
        // Store payment result in Supabase
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await supabase.from('payments').insert([{
            user_id,
            plan_id,
            razorpay_order_id,
            razorpay_payment_id,
            amount,
            currency,
            status,
            error_reason,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }]);
        return NextResponse.json({ success: status === 'success', error: error_reason });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Payment verification failed" }, { status: 500 });
    }
}
