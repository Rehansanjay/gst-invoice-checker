'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, ZoomIn, FileImage, Loader2 } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import ReportViewer from '@/components/ReportViewer';
import ProcessingView from '@/components/ProcessingView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ParsedInvoice, ValidationResult } from '@/types';
import { useAuth } from '@/lib/auth-context';
import Script from 'next/script';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageName, setImageName] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload an image (JPG, PNG, WebP) or PDF file.');
            return;
        }

        // Validate file size (10MB max for reference images)
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum 10MB.');
            return;
        }

        setImageName(file.name);

        if (file.type === 'application/pdf') {
            // For PDFs, show a placeholder since we can't preview them inline
            setUploadedImage('pdf');
        } else {
            // For images, create a preview URL
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }

        // Reset file input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImageName('');
        setIsFullscreen(false);
    };

    const handleSubmit = async (invoiceData: ParsedInvoice) => {
        if (loading) return;

        setIsProcessing(true);

        try {
            if (user) {
                // LOGGED IN USER FLOW - Direct Validation (Credit Deduction handled by API)
                setProcessingStep('Validating invoice...');

                // Simulate processing delay for UX (as requested)
                setTimeout(async () => {
                    try {
                        const response = await fetch('/api/validate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ invoiceData }),
                        });

                        const data = await response.json();

                        if (data.success || data.result) {
                            setValidationResult(data.result);
                        } else {
                            alert('Validation failed: ' + (data.error || 'Unknown error'));
                        }
                    } catch (error) {
                        console.error('Validation error:', error);
                        alert('Validation failed. Please try again.');
                    } finally {
                        setIsProcessing(false);
                    }
                }, 2000); // reduced delay for verified users
            } else {
                // GUEST FLOW - Payment Required
                setProcessingStep('Initializing payment...');
                console.log('Starting guest payment flow...');

                // 1. Create Order
                console.log('Sending request to /api/quick-check...');
                const orderResponse = await fetch('/api/quick-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        invoiceData,
                        guestEmail: '' // Optional, could ask user
                    }),
                });

                console.log('Order response status:', orderResponse.status);
                const orderData = await orderResponse.json();
                console.log('Order data received:', orderData);

                if (!orderData.orderId) {
                    console.error('Order creation failed:', orderData);
                    throw new Error(orderData.error || 'Failed to create payment order');
                }

                if (!window.Razorpay) {
                    console.error('Razorpay SDK not loaded');
                    alert('Payment gateway not loaded. Please verify your internet connection and refresh the page.');
                    throw new Error('Payment gateway not loaded');
                }

                // 2. Open Razorpay
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: 'INR',
                    name: 'GST Invoice Checker',
                    description: 'Invoice Validation Check',
                    order_id: orderData.orderId,
                    handler: async function (response: any) {
                        console.log('Payment success, verifying...', response);
                        setProcessingStep('Verifying payment...');

                        try {
                            // 3. Verify & Get Result
                            const resultResponse = await fetch('/api/process-check', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    checkId: orderData.checkId,
                                    paymentId: orderData.paymentId, // This is the DB ID we just added
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                }),
                            });

                            const data = await resultResponse.json();
                            console.log('Verification response:', data);

                            if (data.success) {
                                toast.success('Payment successful!');
                                setValidationResult(data.result);
                            } else {
                                toast.error(data.error || 'Payment verification failed');
                                alert('Payment verification failed: ' + (data.error || 'Unknown error'));
                            }
                        } catch (err) {
                            console.error('Verification error:', err);
                            toast.error('Error verifying payment.');
                            alert('An error occurred while verifying payment. Please contact support if amount was deducted.');
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            console.log('Payment modal dismissed');
                            setIsProcessing(false);
                            toast('Payment cancelled');
                        }
                    },
                    theme: {
                        color: '#2563EB',
                    },
                };

                console.log('Opening Razorpay options:', options);
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    console.error('Payment failed event:', response.error);
                    alert(`Payment failed: ${response.error.description}`);
                });
                rzp.open();
            }
        } catch (error: any) {
            console.error('Process error:', error);
            alert(`Error: ${error.message || 'An error occurred during processing'}`);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />

            {/* ─── Header ─── */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="md:hidden"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <h1 className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => router.push('/')}>InvoiceCheck.in</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {validationResult && (
                            <Button variant="ghost" size="sm" onClick={() => setValidationResult(null)}>
                                Check Another Invoice
                            </Button>
                        )}
                        {!loading && !user && (
                            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                                Sign In / Sign Up
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="container mx-auto px-4 py-8">
                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <ProcessingView />
                        <p className="mt-4 text-muted-foreground animate-pulse">{processingStep}</p>
                    </div>
                ) : validationResult ? (
                    <ReportViewer result={validationResult} />
                ) : (
                    <>
                        <div className="mb-8 text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold mb-2">Enter Invoice Details</h2>
                            <p className="text-muted-foreground">
                                Fill in your invoice information for instant validation. Upload reference for accuracy.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* ─── LEFT: Reference Image (Sticky on Desktop) ─── */}
                            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                                <Card className="p-4 border-2 border-dashed border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Invoice Preview</h3>
                                        {uploadedImage && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">Loaded</span>}
                                    </div>

                                    {!uploadedImage ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-slate-50 rounded-lg p-12 text-center cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-primary/20 aspect-[3/4] flex flex-col items-center justify-center"
                                        >
                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                                <Upload className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="font-semibold mb-1">Upload PDF/Image</p>
                                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                                Click to upload invoice reference. Max 10MB.
                                            </p>
                                        </div>
                                    ) : uploadedImage === 'pdf' ? (
                                        <div className="bg-slate-50 rounded-lg p-8 aspect-[3/4] flex flex-col items-center justify-center relative">
                                            <FileImage className="w-20 h-20 text-red-500 mb-4" />
                                            <p className="font-medium truncate max-w-full px-4">{imageName}</p>
                                            <p className="text-xs text-muted-foreground mb-6">PDF Document</p>
                                            <Button variant="outline" size="sm" onClick={removeImage}>Remove</Button>
                                        </div>
                                    ) : (
                                        <div className="relative group h-full">
                                            <div className="aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden border">
                                                <img
                                                    src={uploadedImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsFullscreen(true)}>
                                                    <ZoomIn className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={removeImage}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </Card>
                            </div>

                            {/* ─── RIGHT: Form ─── */}
                            <div className="lg:col-span-7">
                                <InvoiceForm onSubmit={handleSubmit} isAuthLoading={loading} />
                            </div>

                        </div>
                    </>
                )}
            </main>

            {/* ─── Fullscreen Image Overlay ─── */}
            {isFullscreen && uploadedImage && uploadedImage !== 'pdf' && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(false);
                        }}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <img
                        src={uploadedImage}
                        alt="Full view"
                        className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
