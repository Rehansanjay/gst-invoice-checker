'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, ZoomIn, FileImage } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import ReportViewer from '@/components/ReportViewer';
import ProcessingView from '@/components/ProcessingView';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ParsedInvoice, ValidationResult } from '@/types';

export default function CheckPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageName, setImageName] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        setIsProcessing(true);
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
        }, 12000); // 12 seconds delay to match UI animation
    };

    return (
        <div className="min-h-screen bg-slate-50">
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
                    </div>
                </div>
            </header>

            {/* ─── Main Content ─── */}
            <main className="container mx-auto px-4 py-8">
                {isProcessing ? (
                    <ProcessingView />
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
                                <InvoiceForm onSubmit={handleSubmit} />
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
