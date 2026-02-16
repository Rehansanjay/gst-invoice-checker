'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, ZoomIn, FileImage } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import ReportViewer from '@/components/ReportViewer';
import ProcessingView from '@/components/ProcessingView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ParsedInvoice, ValidationResult } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

// ── FIX 1: declare global, NOT interface Window ──────────────────────
// Your original code had:
//   interface Window { Razorpay: any }
// This does NOTHING because it's inside the module, not the global scope.
// Replace it with this:
declare global {
    interface Window {
        Razorpay: any;
    }
}

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const existingScript = document.getElementById('razorpay-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => resolve(false));
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            console.log('Razorpay script loaded');
            resolve(true);
        };
        script.onerror = () => {
            console.error('Failed to load Razorpay script');
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

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

    // Pre-load Razorpay script on page mount
    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload an image (JPG, PNG, WebP) or PDF file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum 10MB.');
            return;
        }

        setImageName(file.name);

        if (file.type === 'application/pdf') {
            setUploadedImage('pdf');
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImageName('');
        setIsFullscreen(false);
    };

    // ── FIX 2: handleSubmit was NOT passed to InvoiceForm ────────────
    // Your original code had:
    //   <InvoiceForm onSubmit={handleSubmit} isAuthLoading={loading} />
    // But loading=true during auth check makes isAuthLoading=true
    // which DISABLES the submit button inside InvoiceForm.
    // The button click never reaches handleSubmit at all.
    //
    // The fix: only block when loading=true AND user check isn't done.
    // Once loading=false (auth resolved), the button must work normally.
    //
    // We also add a console.log at the very top so you can confirm
    // handleSubmit is actually being called.

    const handleSubmit = async (invoiceData: ParsedInvoice) => {
        // ── THIS LOG TELLS YOU IF THE BUTTON IS WORKING ──────────────
        console.log('handleSubmit called, user:', user?.email ?? 'guest', 'loading:', loading);

        // Don't block if auth is still loading
        // InvoiceForm already disables submit while loading=true
        // But if somehow called while loading, just wait
        if (loading) {
            console.log('Auth still loading, ignoring submit');
            return;
        }

        setIsProcessing(true);
        setProcessingStep('Starting...');

        try {
            if (user) {
                // ── LOGGED IN USER: Use credits ───────────────────────
                console.log('Logged-in user flow starting...');
                setProcessingStep('Validating invoice...');

                const response = await fetch('/api/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceData }),
                });

                const data = await response.json();
                console.log('Validate response:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Validation failed');
                }

                if (data.success || data.result) {
                    setValidationResult(data.result);
                } else {
                    throw new Error(data.error || 'Unknown validation error');
                }

                setIsProcessing(false);

            } else {
                // ── GUEST USER: Payment required ──────────────────────
                console.log('Guest flow starting...');
                setProcessingStep('Initializing payment...');

                // Step 1: Create order
                console.log('Calling /api/quick-check...');
                const requestBody = {
                    invoiceData,
                    guestEmail: '',
                };
                console.log('Request Body:', JSON.stringify(requestBody, null, 2));

                const orderResponse = await fetch('/api/quick-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                console.log('Order response status:', orderResponse.status);
                const orderData = await orderResponse.json();
                console.log('Order data:', orderData);

                if (!orderResponse.ok || !orderData.orderId) {
                    throw new Error(orderData.error || 'Failed to create payment order');
                }

                // Step 2: Load Razorpay script
                setProcessingStep('Loading payment gateway...');
                const scriptLoaded = await loadRazorpayScript();

                if (!scriptLoaded || !window.Razorpay) {
                    throw new Error('Payment gateway failed to load. Please check your internet and try again.');
                }

                // Step 3: Open Razorpay checkout
                console.log('Opening Razorpay with orderId:', orderData.orderId);
                setProcessingStep('Opening payment...');

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: 'INR',
                    name: 'InvoiceCheck.in',
                    description: 'GST Invoice Validation — ₹99',
                    order_id: orderData.orderId,

                    handler: async function (response: any) {
                        console.log('Payment success response:', response);
                        setProcessingStep('Verifying payment...');

                        try {
                            const resultResponse = await fetch('/api/process-check', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    checkId: orderData.checkId,
                                    paymentId: orderData.paymentId,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                }),
                            });

                            const data = await resultResponse.json();
                            console.log('Process-check response:', data);

                            if (!resultResponse.ok || !data.success) {
                                throw new Error(data.error || 'Processing failed');
                            }

                            toast.success('Payment verified! Showing your report.');
                            setValidationResult(data.result);
                            setIsProcessing(false);

                        } catch (err: any) {
                            console.error('Process-check error:', err);
                            toast.error('Payment received but processing failed.');
                            alert(
                                `Payment received but processing failed.\n` +
                                `Your Check ID: ${orderData.checkId}\n` +
                                `Email support@invoicecheck.in with this ID for help.`
                            );
                            setIsProcessing(false);
                        }
                    },

                    modal: {
                        ondismiss: () => {
                            console.log('Razorpay modal dismissed');
                            setIsProcessing(false);
                            setProcessingStep('');
                            toast('Payment cancelled');
                        },
                    },

                    theme: {
                        color: '#2563EB',
                    },
                };

                const rzp = new window.Razorpay(options);

                rzp.on('payment.failed', (response: any) => {
                    console.error('Payment failed:', response.error);
                    toast.error(`Payment failed: ${response.error.description}`);
                    setIsProcessing(false);
                    setProcessingStep('');
                });

                rzp.open();
                // Note: don't setIsProcessing(false) here
                // It stays true until handler() or ondismiss() fires
            }

        } catch (error: any) {
            console.error('handleSubmit error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
            setIsProcessing(false);
            setProcessingStep('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ─── Header ─── */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="md:hidden">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <h1
                            className="text-xl font-bold tracking-tight cursor-pointer"
                            onClick={() => router.push('/')}
                        >
                            InvoiceCheck.in
                        </h1>
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
                                Fill in your invoice information for instant validation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* LEFT: Reference Image */}
                            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
                                <Card className="p-4 border-2 border-dashed border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                            Invoice Preview
                                        </h3>
                                        {uploadedImage && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                                                Loaded
                                            </span>
                                        )}
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
                                                Optional reference. Max 10MB.
                                            </p>
                                        </div>
                                    ) : uploadedImage === 'pdf' ? (
                                        <div className="bg-slate-50 rounded-lg p-8 aspect-[3/4] flex flex-col items-center justify-center">
                                            <FileImage className="w-20 h-20 text-red-500 mb-4" />
                                            <p className="font-medium truncate max-w-full px-4">{imageName}</p>
                                            <p className="text-xs text-muted-foreground mb-6">PDF Document</p>
                                            <Button variant="outline" size="sm" onClick={removeImage}>Remove</Button>
                                        </div>
                                    ) : (
                                        <div className="relative group h-full">
                                            <div className="aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden border">
                                                <img src={uploadedImage} alt="Preview" className="w-full h-full object-contain" />
                                            </div>
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button
                                                    size="icon" variant="secondary"
                                                    className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setIsFullscreen(true)}
                                                >
                                                    <ZoomIn className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon" variant="destructive"
                                                    className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={removeImage}
                                                >
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

                            {/* RIGHT: Form */}
                            <div className="lg:col-span-7">
                                <InvoiceForm onSubmit={handleSubmit} isAuthLoading={loading} />
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Fullscreen overlay */}
            {isFullscreen && uploadedImage && uploadedImage !== 'pdf' && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                        className="absolute top-6 right-6 text-white/80 hover:text-white"
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
