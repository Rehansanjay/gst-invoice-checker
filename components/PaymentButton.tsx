'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentButtonProps {
    orderId: string;
    amount: number;
    checkId: string;
    customerEmail?: string;
    customerName?: string;
    description?: string;
    onSuccess?: (paymentId: string) => void;
    className?: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PaymentButton({
    orderId,
    amount,
    checkId,
    customerEmail,
    customerName,
    description = 'Invoice Validation Check',
    onSuccess,
    className
}: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handlePayment = () => {
        setIsProcessing(true);

        if (!window.Razorpay) {
            toast.error('Payment gateway failed to load. Please refresh.');
            setIsProcessing(false);
            return;
        }

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: amount * 100, // Amount is in paise
            currency: 'INR',
            name: 'GST Invoice Checker',
            description: description,
            order_id: orderId,
            prefill: {
                name: customerName,
                email: customerEmail,
            },
            theme: {
                color: '#2563EB', // Primary blue
            },
            handler: async function (response: any) {
                // Payment successful - verification needed on backend
                try {
                    // Call backend to verify and process check
                    const result = await fetch('/api/process-check', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                            checkId: checkId
                        }),
                    });

                    const data = await result.json();

                    if (data.success) {
                        toast.success('Payment successful! Validating invoice...');
                        if (onSuccess) {
                            onSuccess(response.razorpay_payment_id);
                        } else {
                            // Default redirect
                            router.push(`/check/result/${checkId}`);
                        }
                    } else {
                        toast.error(data.error || 'Payment verification failed');
                        setIsProcessing(false);
                    }
                } catch (error) {
                    console.error('Payment verification error:', error);
                    toast.error('Error verifying payment. Please contact support.');
                    setIsProcessing(false);
                }
            },
            modal: {
                ondismiss: function () {
                    setIsProcessing(false);
                    toast('Payment cancelled');
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
            toast.error(response.error.description || 'Payment failed');
            setIsProcessing(false);
        });

        rzp1.open();
    };

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />

            <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className={className}
                size="lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay ₹{amount} & Validate
                    </>
                )}
            </Button>
        </>
    );
}
