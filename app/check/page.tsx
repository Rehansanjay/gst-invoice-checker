'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvoiceForm from '@/components/InvoiceForm';
import ReportViewer from '@/components/ReportViewer';
import { ParsedInvoice, ValidationResult } from '@/types';

export default function CheckPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const handleSubmit = async (invoiceData: ParsedInvoice) => {
        setIsProcessing(true);

        try {
            // Call validation API
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
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1
                        className="text-2xl font-bold cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        InvoiceCheck.in
                    </h1>
                    {validationResult && (
                        <button
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                            onClick={() => setValidationResult(null)}
                        >
                            ← Check Another Invoice
                        </button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {!validationResult ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2">Enter Invoice Details</h2>
                            <p className="text-muted-foreground">
                                Fill in your invoice information for instant GST validation
                            </p>
                        </div>
                        <InvoiceForm onSubmit={handleSubmit} />
                    </>
                ) : (
                    <>
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-2">Validation Report</h2>
                            <p className="text-muted-foreground">
                                Check ID: {validationResult.checkId} • Processed in {validationResult.processingTimeMs}ms
                            </p>
                        </div>
                        <ReportViewer result={validationResult} />
                    </>
                )}
            </main>
        </div>
    );
}
