'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, X, ZoomIn, FileImage, Lock, CreditCard, Loader2, Sparkles } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import ReportViewer from '@/components/ReportViewer';
import ProcessingView from '@/components/ProcessingView';
import BlurredReportPreview from '@/components/BlurredReportPreview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ParsedInvoice, ValidationResult } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

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

function CheckPageInner() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [previewResult, setPreviewResult] = useState<ValidationResult | null>(null);
    const [invoiceDataForPayment, setInvoiceDataForPayment] = useState<ParsedInvoice | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageName, setImageName] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [outOfCredits, setOutOfCredits] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<Partial<ParsedInvoice> | null>(null);
    const uploadedFileRef = useRef<File | null>(null);

    // ── Read UTM & referral params from URL ──────────────────────────
    const searchParams = useSearchParams();
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const refCode = searchParams.get('ref');

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
        uploadedFileRef.current = file;
        setExtractedData(null);

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

        // Kick off OCR extraction
        runOcr(file);
    };

    const runOcr = async (file: File) => {
        setIsOcrLoading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/ocr-extract', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.success && data.extracted) {
                const e = data.extracted;
                // Only apply fields that were actually found
                const partial: Partial<ParsedInvoice> = {};
                if (e.supplierGSTIN) partial.supplierGSTIN = e.supplierGSTIN;
                if (e.buyerGSTIN) partial.buyerGSTIN = e.buyerGSTIN;
                if (e.supplierName) partial.supplierName = e.supplierName;
                if (e.buyerName) partial.buyerName = e.buyerName;
                if (e.invoiceNumber) partial.invoiceNumber = e.invoiceNumber;
                if (e.invoiceDate) partial.invoiceDate = e.invoiceDate;
                if (e.hsnCode || e.taxableAmount) {
                    partial.lineItems = [{
                        lineNumber: 1,
                        description: '',
                        hsnCode: e.hsnCode || '',
                        quantity: 1,
                        rate: e.taxableAmount || 0,
                        taxableAmount: e.taxableAmount || 0,
                        taxRate: 18,
                        taxType: e.taxType as 'CGST_SGST' | 'IGST',
                        cgst: e.cgst || 0,
                        sgst: e.sgst || 0,
                        igst: e.igst || 0,
                        totalAmount: e.totalAmount || 0,
                    }];
                }
                const filledCount = Object.keys(partial).length;
                if (filledCount > 0) {
                    setExtractedData(partial);
                    toast.success(`✓ Auto-filled ${filledCount} field${filledCount > 1 ? 's' : ''} from your document`);
                } else {
                    toast.info('OCR complete — no fields detected. Please fill manually.');
                }
            } else {
                toast.warning(data.error || 'Could not extract data — please fill manually.');
            }
        } catch {
            toast.warning('OCR failed — please fill in the form manually.');
        } finally {
            setIsOcrLoading(false);
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImageName('');
        setIsFullscreen(false);
        setExtractedData(null);
        uploadedFileRef.current = null;
    };

    const handleSubmit = async (invoiceData: ParsedInvoice) => {
        console.log('handleSubmit called, user:', user?.email ?? 'guest', 'loading:', loading);

        if (loading) {
            console.log('Auth still loading, ignoring submit');
            return;
        }

        setIsProcessing(true);
        setProcessingStep('Starting...');

        try {
            if (user) {
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
                    if (data.code === 'insufficient_credits') {
                        setOutOfCredits(true);
                        setIsProcessing(false);
                        setProcessingStep('');
                        return;
                    }
                    throw new Error(data.error || 'Validation failed');
                }

                if (data.success || data.result) {
                    setValidationResult(data.result);
                } else {
                    throw new Error(data.error || 'Unknown validation error');
                }

                setIsProcessing(false);

            } else {
                console.log('Guest flow starting (Preview)...');
                setProcessingStep('Analyzing invoice...');

                setInvoiceDataForPayment(invoiceData);

                const response = await fetch('/api/preview-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoiceData }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Preview failed');
                }

                setPreviewResult(data.result);
                setIsProcessing(false);
                setProcessingStep('');
                toast.success('Analysis complete! Issues found.');
            }

        } catch (error: any) {
            console.error('handleSubmit error:', error);
            toast.error(error.message || 'Something went wrong. Please try again.');
            setIsProcessing(false);
            setProcessingStep('');
        }
    };

    const handleUnlockReport = async () => {
        if (!invoiceDataForPayment) {
            toast.error('Session expired. Please re-enter details.');
            return;
        }

        setIsProcessing(true);
        setProcessingStep('Initializing payment...');

        try {
            console.log('Calling /api/quick-check...');
            const requestBody = {
                invoiceData: invoiceDataForPayment,
                guestEmail: '',
                // Attribution — pass through from URL params
                utm_source: utmSource || undefined,
                utm_medium: utmMedium || undefined,
                utm_campaign: utmCampaign || undefined,
                ref_code: refCode || undefined,
            };

            const orderResponse = await fetch('/api/quick-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok || !orderData.orderId) {
                throw new Error(orderData.error || 'Failed to create payment order');
            }

            if (!window.Razorpay) {
                await loadRazorpayScript();
            }

            if (!window.Razorpay) {
                throw new Error('Payment gateway failed to load.');
            }

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

                        if (!resultResponse.ok || !data.success) {
                            throw new Error(data.error || 'Processing failed');
                        }

                        toast.success('Payment verified! Showing your report.');
                        setValidationResult(data.result);
                        setPreviewResult(null);
                        setIsProcessing(false);

                    } catch (err: any) {
                        console.error('Process-check error:', err);
                        toast.error('Payment processing failed. Contact support.');
                        setIsProcessing(false);
                    }
                },

                modal: {
                    ondismiss: () => {
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
                toast.error(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });

            rzp.open();

        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment initiation failed.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
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
                        {(validationResult || previewResult) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setValidationResult(null);
                                    setPreviewResult(null);
                                    setInvoiceDataForPayment(null);
                                }}
                            >
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

            <main className="container mx-auto px-4 py-8">
                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <ProcessingView />
                        <p className="mt-4 text-muted-foreground animate-pulse">{processingStep}</p>
                    </div>
                ) : outOfCredits ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Lock className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Free Trial Used</h2>
                        <p className="text-muted-foreground max-w-md mb-6">
                            You've used your 1 free invoice check. Purchase a credit pack to keep validating GST invoices.
                        </p>
                        <div className="flex gap-3">
                            <Button size="lg" className="gap-2" onClick={() => router.push('/pricing')}>
                                <CreditCard className="w-5 h-5" /> View Pricing Plans
                            </Button>
                            <Button size="lg" variant="outline" onClick={() => setOutOfCredits(false)}>
                                Go Back
                            </Button>
                        </div>
                    </div>
                ) : validationResult ? (
                    <ReportViewer result={validationResult} />
                ) : previewResult ? (
                    <BlurredReportPreview
                        result={previewResult}
                        onUnlock={handleUnlockReport}
                        isProcessing={isProcessing}
                    />
                ) : (
                    <>
                        <div className="mb-8 text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl font-bold mb-2">Enter Invoice Details</h2>
                            <p className="text-muted-foreground">
                                Fill in your invoice information for instant validation.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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

                                    {isOcrLoading ? (
                                        <div className="bg-slate-50 rounded-lg aspect-[3/4] flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            <p className="font-semibold text-sm">Reading document...</p>
                                            <p className="text-xs text-muted-foreground">Extracting invoice fields</p>
                                        </div>
                                    ) : !uploadedImage ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-slate-50 rounded-lg p-12 text-center cursor-pointer hover:bg-slate-100 transition-all border border-transparent hover:border-primary/20 aspect-[3/4] flex flex-col items-center justify-center"
                                        >
                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                                <Upload className="w-8 h-8 text-primary" />
                                            </div>
                                            <p className="font-semibold mb-1">Upload PDF/Image</p>
                                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                                Auto-fills form fields. Max 10MB.
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

                            <div className="lg:col-span-7">
                                {extractedData && (
                                    <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                                        <Sparkles className="w-4 h-4 shrink-0" />
                                        <span><strong>Fields auto-filled from your document</strong> — please verify and correct if needed.</span>
                                    </div>
                                )}
                                <InvoiceForm
                                    onSubmit={handleSubmit}
                                    isAuthLoading={loading}
                                    submitLabel={user ? 'Validate Invoice' : 'Analyze Invoice Free'}
                                    initialData={extractedData ?? undefined}
                                />
                            </div>
                        </div>
                    </>
                )}
            </main>

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

export default function CheckPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <CheckPageInner />
        </Suspense>
    );
}
