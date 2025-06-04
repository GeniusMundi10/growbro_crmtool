// This file is deprecated. Logic moved to route.ts
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/payments/razorpay/create-order
export async function POST(req: Request) {
    try {
        const { amount, currency = "INR", plan_id, user_id } = await req.json();
        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // amount in paise
            currency,
            receipt: `${plan_id}_${user_id}_${Date.now()}`,
            payment_capture: 1,
        });
        // Optionally, store pending payment in DB here
        return NextResponse.json({ order });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to create Razorpay order" }, { status: 500 });
    }
}
