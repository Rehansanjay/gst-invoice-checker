import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
    try {
        const { invoiceData, guestEmail } = await request.json();

        // Step 1: Create Razorpay order
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.create({
            amount: 9900, // ₹99 in paisa
            currency: 'INR',
            receipt: `quick_${Date.now()}`,
        });

        // Step 2: Create payment record
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .insert({
                razorpay_order_id: order.id,
                amount: 99,
                payment_type: 'quick_check',
                package_type: 'single',
                customer_email: guestEmail || null,
                status: 'created',
            })
            .select()
            .single();

        // Step 3: Create check record (pending)
        const { data: check } = await supabaseAdmin
            .from('checks')
            .insert({
                check_type: 'quick',
                guest_email: guestEmail || null,
                guest_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
                invoice_number: invoiceData.invoiceNumber,
                invoice_date: invoiceData.invoiceDate,
                supplier_gstin: invoiceData.supplierGSTIN,
                buyer_gstin: invoiceData.buyerGSTIN,
                line_items: invoiceData.lineItems,
                taxable_total_amount: invoiceData.taxableTotalAmount,
                total_tax_amount: invoiceData.totalTaxAmount,
                invoice_total_amount: invoiceData.invoiceTotalAmount,
                payment_id: payment.id,
                status: 'pending',
            })
            .select()
            .single();

        return NextResponse.json({
            success: true,
            orderId: order.id,
            checkId: check.id,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error('Quick check error:', error);
        return NextResponse.json({ error: 'Failed to create check' }, { status: 500 });
    }
}
