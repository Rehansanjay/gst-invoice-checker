'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface PackagePurchaseButtonProps {
    packageType: 'pack_10' | 'pack_50' | 'pack_100';
    price: number;
    credits: number;
    title: string;
    className?: string;
    disabled?: boolean;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

import { useAuth } from '@/lib/auth-context';

export default function PackagePurchaseButton({
    packageType,
    price,
    credits,
    title,
    className,
    disabled
}: PackagePurchaseButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const router = useRouter();
    const { user } = useAuth();

    const handlePurchase = async () => {
        setIsProcessing(true);

        try {
            // Check auth
            if (!user) {
                toast.error('Please login to purchase credits');
                router.push('/login');
                setIsProcessing(false);
                return;
            }

            // Call API to create order// *correction*: The API requires userId. `page.tsx` needs to ensure we have a user.
            // However, the previous `PaymentButton` didn't seem to pass userId explicitly to `process-check`.
            // Let's check `purchase-package` route again. It expects `userId`.
            // We need to fetch the current user here or assume the API gets it from session if we use Supabase auth helpers.
            // BUT `purchase-package` route reads `userId` from body: `const { userId, ... } = result.data`.
            // This means we need the userId client-side.



            // Call API to create order
            const response = await fetch('/api/purchase-package', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    packageType,
                    couponCode: couponCode.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate purchase');
            }

            if (!window.Razorpay) {
                throw new Error('Razorpay SDK not loaded');
            }

            const options = {
                key: data.razorpayKeyId,
                amount: data.amount * 100,
                currency: 'INR',
                name: 'GST Invoice Checker',
                description: `Purchase ${credits} Credits`,
                order_id: data.orderId,
                prefill: {
                    email: user.email,
                },
                theme: {
                    color: '#2563EB',
                },
                handler: function (response: any) {
                    toast.success('Payment successful! Credits added.');
                    setIsProcessing(false);
                    router.refresh();
                    // Optionally redirect to dashboard
                    // router.push('/dashboard');
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

        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error.message || 'Something went wrong');
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full space-y-3">
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Button
                onClick={handlePurchase}
                disabled={isProcessing || disabled}
                className={className || "w-full"}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        Buy Pack
                    </>
                )}
            </Button>
            {couponCode.toUpperCase() === 'SAVE50' && (
                <p className="text-xs text-green-600 font-medium text-center">
                    'SAVE50' applied! You'll pay 50% less at checkout.
                </p>
            )}
        </div>
    );
}
