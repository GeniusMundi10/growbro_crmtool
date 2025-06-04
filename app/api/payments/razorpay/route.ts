import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST: Create a Razorpay order
export async function POST(req: Request) {
    try {
        const { amount, currency = "INR", plan_id, user_id } = await req.json();
        
        // Generate receipt (must be under 40 characters for Razorpay)
        const shortReceipt = `${plan_id}_${user_id ? user_id.slice(0,8) : ''}_${Date.now()}`;
        
        // Create order
        const options = {
            amount: Number(amount) * 100, // amount in paise
            currency,
            receipt: shortReceipt,
            payment_capture: true, // Automatically capture payment when customer completes payment
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json({ order });
    } catch (err: any) {
        console.error("Razorpay order creation error:", err);
        return NextResponse.json({ error: err.message || "Failed to create Razorpay order", details: err }, { status: 500 });
    }
}

// PUT: Verify Razorpay payment
export async function PUT(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, plan_id, amount, currency, billing_cycle } = await req.json();
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
        const { data: paymentData, error: paymentError } = await supabase.from('payments')
            .insert([{
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
            }])
            .select();
            
        if (paymentError) {
            console.error('Payment insertion failed:', paymentError);
            throw paymentError;
        }
        
        console.log('Payment record created:', paymentData);
        // If payment is successful, insert subscription and update user plan
        if (status === 'success') {
            console.log('Payment successful, proceeding with subscription creation...');
            console.log('Data to insert:', {
                user_id,
                plan_id,
                payment_id: razorpay_payment_id,
                start_date: new Date().toISOString()
            });

            try {
                // Get payment record ID (UUID) to use as foreign key in subscription
                const paymentId = paymentData?.[0]?.id;
                console.log('Using payment UUID as foreign key:', paymentId);
                
                if (!paymentId) {
                    throw new Error('Payment ID not found. Cannot create subscription.');
                }
                
                // Calculate end_date based on billing_cycle
                const startDate = new Date();
                const endDate = new Date(startDate);
                
                // Add months based on billing cycle
                if (billing_cycle === 'yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    console.log('Yearly plan selected. End date set to 1 year from now:', endDate.toISOString());
                } else {
                    // Default to monthly
                    endDate.setMonth(endDate.getMonth() + 1);
                    console.log('Monthly plan selected. End date set to 1 month from now:', endDate.toISOString());
                }
                
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .insert([{
                        user_id,
                        plan_id,
                        payment_id: paymentId,  // Use the payment table UUID as foreign key
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),  // Set end_date based on billing cycle
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (subscriptionError) {
                    console.error('Subscription insertion failed:', subscriptionError);
                    throw subscriptionError;
                }
                console.log('Subscription created successfully:', subscriptionData);
            } catch (subErr: unknown) {
                console.error("Detailed subscription error:", subErr);
                // Safe access to stack property
                if (subErr instanceof Error) {
                    console.error("Error stack:", subErr.stack);
                }
            }

            console.log('Updating user plan...');
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .update({ plan: plan_id, updated_at: new Date().toISOString() })
                    .eq('id', user_id)
                    .select();

                if (userError) {
                    console.error('User plan update failed:', userError);
                    throw userError;
                }
                console.log('User plan updated successfully:', userData);
            } catch (userErr: unknown) {
                console.error("Detailed user update error:", userErr);
                // Safe access to stack property
                if (userErr instanceof Error) {
                    console.error("Error stack:", userErr.stack);
                }
            }
        }
        return NextResponse.json({ success: status === 'success', error: error_reason });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Payment verification failed" }, { status: 500 });
    }
}
