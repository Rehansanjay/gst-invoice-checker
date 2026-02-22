'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Gift, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ParsedInvoice, LineItem, VALID_GST_RATES, InvoiceType, INVOICE_TYPE_LABELS, STATE_CODE_NAMES, VALID_STATE_CODES } from '@/types';

export default function InvoiceForm({ onSubmit, isAuthLoading = false, submitLabel, initialData }: {
    onSubmit: (data: ParsedInvoice) => void;
    isAuthLoading?: boolean;
    submitLabel?: string;
    initialData?: Partial<ParsedInvoice>;
}) {
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        supplierGSTIN: '',
        buyerGSTIN: '',
        supplierName: '',
        buyerName: '',
        invoiceType: 'tax_invoice' as InvoiceType,
        placeOfSupply: '',
        reverseCharge: false,
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        {
            lineNumber: 1,
            description: '',
            hsnCode: '',
            quantity: 1,
            rate: 0,
            taxableAmount: 0,
            taxRate: 18,
            taxType: 'CGST_SGST',
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalAmount: 0,
        },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Freemium 3-check model (guest users only) ──
    const FREE_CHECKS_KEY = 'gst_free_checks_used';
    const MAX_FREE_CHECKS = 3;
    const [freeChecksUsed, setFreeChecksUsed] = useState(0);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Only show freemium UI if the parent hasn't provided a custom submit label
        // (custom label = logged-in user with credits)
        if (!submitLabel) {
            setIsGuest(true);
            const stored = parseInt(localStorage.getItem(FREE_CHECKS_KEY) || '0', 10);
            setFreeChecksUsed(stored);
        }
    }, [submitLabel]);

    const freeChecksRemaining = Math.max(0, MAX_FREE_CHECKS - freeChecksUsed);
    const hasUsedAllFreeChecks = isGuest && freeChecksUsed >= MAX_FREE_CHECKS;

    // Apply auto-filled data from OCR whenever it changes
    useEffect(() => {
        if (!initialData) return;
        setFormData(prev => ({
            ...prev,
            invoiceNumber: initialData.invoiceNumber || prev.invoiceNumber,
            invoiceDate: initialData.invoiceDate || prev.invoiceDate,
            supplierGSTIN: initialData.supplierGSTIN || prev.supplierGSTIN,
            buyerGSTIN: initialData.buyerGSTIN || prev.buyerGSTIN,
            supplierName: initialData.supplierName || prev.supplierName,
            buyerName: initialData.buyerName || prev.buyerName,
        }));
        if (initialData.lineItems && initialData.lineItems.length > 0) {
            setLineItems(initialData.lineItems);
        }
    }, [initialData]);

    // Auto-detect states from GSTIN
    const supplierState = formData.supplierGSTIN.substring(0, 2);
    const buyerState = formData.buyerGSTIN.substring(0, 2);
    const isSameState = supplierState === buyerState && supplierState !== '';

    // Auto-fill Place of Supply from buyer GSTIN when it changes
    const handleBuyerGSTINChange = (value: string) => {
        const upper = value.toUpperCase();
        const newBuyerState = upper.substring(0, 2);
        setFormData(prev => ({
            ...prev,
            buyerGSTIN: upper,
            // Auto-fill PoS from buyer state if user hasn't manually overridden it
            placeOfSupply: prev.placeOfSupply === prev.buyerGSTIN.substring(0, 2) || prev.placeOfSupply === ''
                ? newBuyerState
                : prev.placeOfSupply,
        }));
    };

    // Calculate totals
    const taxableTotalAmount = lineItems.reduce((sum, item) => sum + item.taxableAmount, 0);
    const totalTaxAmount = lineItems.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
    const invoiceTotalAmount = taxableTotalAmount + totalTaxAmount;

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            {
                lineNumber: lineItems.length + 1,
                description: '',
                hsnCode: '',
                quantity: 1,
                rate: 0,
                taxableAmount: 0,
                taxRate: 18,
                taxType: isSameState ? 'CGST_SGST' : 'IGST',
                cgst: 0,
                sgst: 0,
                igst: 0,
                totalAmount: 0,
            },
        ]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            const updated = lineItems.filter((_, i) => i !== index);
            updated.forEach((item, i) => item.lineNumber = i + 1);
            setLineItems(updated);
        }
    };

    const recalculateTax = (item: LineItem): LineItem => {
        const taxAmount = (item.taxableAmount * item.taxRate) / 100;

        if (item.taxType === 'CGST_SGST') {
            item.cgst = taxAmount / 2;
            item.sgst = taxAmount / 2;
            item.igst = 0;
        } else {
            item.cgst = 0;
            item.sgst = 0;
            item.igst = taxAmount;
        }

        item.totalAmount = item.taxableAmount + taxAmount;
        return item;
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
            updated[index].taxableAmount = updated[index].quantity * updated[index].rate;
            updated[index] = recalculateTax(updated[index]);
        }

        // Recalculate when taxable amount, tax rate, or tax type changes
        if (field === 'taxableAmount' || field === 'taxRate' || field === 'taxType') {
            updated[index] = recalculateTax(updated[index]);
        }

        setLineItems(updated);
    };

    const validateForm = () => {
        const errors: string[] = [];
        if (!formData.invoiceNumber.trim()) errors.push('Invoice Number is required');
        if (!formData.invoiceDate) errors.push('Invoice Date is required');
        if (formData.supplierGSTIN.length !== 15) errors.push('Supplier GSTIN must be exactly 15 characters');
        if (formData.buyerGSTIN && formData.buyerGSTIN.length !== 15) errors.push('Buyer GSTIN must be exactly 15 characters (or leave empty)');

        if (errors.length > 0) {
            alert(errors.join('\n'));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        const invoiceData: ParsedInvoice = {
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: formData.invoiceDate,
            supplierGSTIN: formData.supplierGSTIN,
            buyerGSTIN: formData.buyerGSTIN,
            supplierName: formData.supplierName,
            buyerName: formData.buyerName,
            lineItems,
            taxableTotalAmount,
            totalTaxAmount,
            invoiceTotalAmount,
            invoiceType: formData.invoiceType,
            placeOfSupply: formData.placeOfSupply,
            reverseCharge: formData.reverseCharge,
        };

        try {
            await onSubmit(invoiceData);
            // Increment free check counter for guest users
            if (isGuest) {
                const newCount = freeChecksUsed + 1;
                localStorage.setItem(FREE_CHECKS_KEY, String(newCount));
                setFreeChecksUsed(newCount);
            }
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Supplier Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="supplierGSTIN">Supplier GSTIN *</Label>
                        <Input
                            id="supplierGSTIN"
                            value={formData.supplierGSTIN}
                            onChange={(e) => setFormData({ ...formData, supplierGSTIN: e.target.value.toUpperCase() })}
                            placeholder="27AABCP1234A1Z5"
                            maxLength={15}
                            className="font-mono"
                        />
                        {supplierState && <p className="text-sm text-muted-foreground mt-1">State: {STATE_CODE_NAMES[supplierState] || supplierState}</p>}
                    </div>
                    <div>
                        <Label htmlFor="supplierName">Supplier Name (Optional)</Label>
                        <Input
                            id="supplierName"
                            value={formData.supplierName}
                            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                            placeholder="Company Name"
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Buyer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="buyerGSTIN">Buyer GSTIN *</Label>
                        <Input
                            id="buyerGSTIN"
                            value={formData.buyerGSTIN}
                            onChange={(e) => handleBuyerGSTINChange(e.target.value)}
                            placeholder="27BBDCT5678B1Z3"
                            maxLength={15}
                            className="font-mono"
                        />
                        {buyerState && <p className="text-sm text-muted-foreground mt-1">State: {STATE_CODE_NAMES[buyerState] || buyerState}</p>}
                    </div>
                    <div>
                        <Label htmlFor="buyerName">Buyer Name (Optional)</Label>
                        <Input
                            id="buyerName"
                            value={formData.buyerName}
                            onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                            placeholder="Customer Name"
                        />
                    </div>
                </div>

                {isSameState && supplierState && (
                    <Alert className="mt-4">
                        <AlertDescription>
                            Same state transaction detected. Use CGST + SGST (not IGST)
                        </AlertDescription>
                    </Alert>
                )}

                {!isSameState && supplierState && buyerState && (
                    <Alert className="mt-4">
                        <AlertDescription>
                            Interstate transaction detected. Use IGST (not CGST + SGST)
                        </AlertDescription>
                    </Alert>
                )}
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Type */}
                    <div>
                        <Label htmlFor="invoiceType">Invoice Type *</Label>
                        <select
                            id="invoiceType"
                            value={formData.invoiceType}
                            onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value as InvoiceType })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((key) => (
                                <option key={key} value={key}>{INVOICE_TYPE_LABELS[key]}</option>
                            ))}
                        </select>
                        {formData.invoiceType === 'bill_of_supply' && (
                            <p className="text-xs text-amber-600 mt-1">⚠️ Bill of Supply: no GST applicable</p>
                        )}
                        {formData.invoiceType === 'export_invoice' && (
                            <p className="text-xs text-blue-600 mt-1">🌐 Export: use IGST or zero-rated (LUT)</p>
                        )}
                    </div>

                    {/* Invoice Number */}
                    <div>
                        <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                        <Input
                            id="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="INV/2025/001"
                        />
                    </div>

                    {/* Invoice Date */}
                    <div>
                        <Label htmlFor="invoiceDate">Invoice Date *</Label>
                        <Input
                            id="invoiceDate"
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                        />
                    </div>

                    {/* Place of Supply */}
                    <div>
                        <Label htmlFor="placeOfSupply">
                            Place of Supply *
                            {formData.placeOfSupply && formData.placeOfSupply === buyerState && (
                                <span className="ml-2 text-xs text-green-600 font-normal">✓ Auto-filled from buyer</span>
                            )}
                        </Label>
                        <select
                            id="placeOfSupply"
                            value={formData.placeOfSupply}
                            onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="">Select state...</option>
                            {VALID_STATE_CODES.map((code) => (
                                <option key={code} value={code}>
                                    {STATE_CODE_NAMES[code] || code}
                                </option>
                            ))}
                        </select>
                        {formData.placeOfSupply && supplierState && (
                            formData.placeOfSupply === supplierState
                                ? <p className="text-xs text-green-600 mt-1">✓ Intrastate — use CGST + SGST</p>
                                : <p className="text-xs text-blue-600 mt-1">↔ Interstate — use IGST</p>
                        )}
                    </div>

                    {/* Reverse Charge */}
                    <div className="md:col-span-2">
                        <div className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${formData.reverseCharge ? 'border-amber-400 bg-amber-50' : 'border-transparent bg-muted/40'
                            }`}>
                            <input
                                type="checkbox"
                                id="reverseCharge"
                                checked={formData.reverseCharge}
                                onChange={(e) => setFormData({ ...formData, reverseCharge: e.target.checked })}
                                className="mt-1 h-4 w-4 accent-amber-500"
                            />
                            <div>
                                <label htmlFor="reverseCharge" className="font-medium cursor-pointer text-sm">
                                    Reverse Charge (RCM) Applicable
                                </label>
                                {formData.reverseCharge ? (
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        ⚠️ Under RCM: supplier charges ₹0 tax — buyer pays GST directly to the government.
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Enable if this supply is under Reverse Charge Mechanism (Section 9(3) of CGST Act)
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Line Items</h3>
                    <Button onClick={addLineItem} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>

                <div className="space-y-4">
                    {lineItems.map((item, index) => (
                        <Card key={index} className="p-4 bg-muted/50">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium">Item {index + 1}</h4>
                                {lineItems.length > 1 && (
                                    <Button
                                        onClick={() => removeLineItem(index)}
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label>Description *</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        placeholder="Product/Service name"
                                    />
                                </div>

                                <div>
                                    <Label>HSN Code *</Label>
                                    <Input
                                        value={item.hsnCode}
                                        onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                                        placeholder="8518"
                                        maxLength={8}
                                    />
                                </div>

                                <div>
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <Label>Rate (per unit)</Label>
                                    <Input
                                        type="number"
                                        value={item.rate}
                                        onChange={(e) => updateLineItem(index, 'rate', Number(e.target.value))}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <Label>Taxable Amount</Label>
                                    <Input
                                        type="number"
                                        value={item.taxableAmount}
                                        onChange={(e) => updateLineItem(index, 'taxableAmount', Number(e.target.value))}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <Label>GST Rate</Label>
                                    <select
                                        value={item.taxRate}
                                        onChange={(e) => updateLineItem(index, 'taxRate', Number(e.target.value))}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        {VALID_GST_RATES.map((rate) => (
                                            <option key={rate} value={rate}>{rate}%</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label>Tax Type</Label>
                                    <div className="flex gap-4 mt-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={item.taxType === 'CGST_SGST'}
                                                onChange={() => updateLineItem(index, 'taxType', 'CGST_SGST')}
                                            />
                                            CGST + SGST (Same State)
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                checked={item.taxType === 'IGST'}
                                                onChange={() => updateLineItem(index, 'taxType', 'IGST')}
                                            />
                                            IGST (Interstate)
                                        </label>
                                    </div>
                                </div>

                                {item.taxType === 'CGST_SGST' ? (
                                    <>
                                        <div>
                                            <Label>CGST ({item.taxRate / 2}%)</Label>
                                            <Input
                                                type="number"
                                                value={item.cgst}
                                                onChange={(e) => updateLineItem(index, 'cgst', Number(e.target.value))}
                                                step="0.01"
                                            />
                                        </div>
                                        <div>
                                            <Label>SGST ({item.taxRate / 2}%)</Label>
                                            <Input
                                                type="number"
                                                value={item.sgst}
                                                onChange={(e) => updateLineItem(index, 'sgst', Number(e.target.value))}
                                                step="0.01"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <Label>IGST ({item.taxRate}%)</Label>
                                        <Input
                                            type="number"
                                            value={item.igst}
                                            onChange={(e) => updateLineItem(index, 'igst', Number(e.target.value))}
                                            step="0.01"
                                        />
                                    </div>
                                )}

                                <div>
                                    <Label>Total Amount</Label>
                                    <Input
                                        type="number"
                                        value={item.totalAmount.toFixed(2)}
                                        readOnly
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </Card>

            <Card className="p-6 bg-primary/5">
                <h3 className="text-lg font-semibold mb-4">Invoice Totals</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-lg">
                        <span>Taxable Total:</span>
                        <span className="font-semibold">₹{taxableTotalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                        <span>Tax Total:</span>
                        <span className="font-semibold">₹{totalTaxAmount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-xl font-bold">
                        <span>Invoice Total:</span>
                        <span>₹{invoiceTotalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* Freemium: free checks badge (guest only) */}
            {isGuest && !hasUsedAllFreeChecks && (
                <div className="flex items-center justify-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">
                        {freeChecksRemaining === MAX_FREE_CHECKS
                            ? `${MAX_FREE_CHECKS} free checks — no signup needed`
                            : `${freeChecksRemaining} free check${freeChecksRemaining !== 1 ? 's' : ''} remaining`}
                    </span>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                    </>
                ) : (
                    submitLabel || (freeChecksRemaining > 0 ? 'Validate Invoice — Free' : 'Validate Invoice — ₹99')
                )}
            </Button>

            {/* Soft signup prompt after 3 checks used */}
            {isGuest && hasUsedAllFreeChecks && (
                <Card className="p-5 border-blue-200 bg-blue-50/40">
                    <div className="flex items-start gap-3">
                        <UserPlus className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-blue-900 mb-1">You&apos;ve used your 3 free checks</p>
                            <p className="text-sm text-blue-800 mb-3">
                                Create a free account to save your reports and get dashboard access. Or continue with ₹99/check.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Link href="/auth/signup" className="flex-1">
                                    <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" size="sm">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Create Free Account
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-800"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    Continue — ₹99
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <Alert>
                <AlertDescription>
                    ⚠️ We validate YOUR entered data - not OCR. This ensures 100% accuracy.
                </AlertDescription>
            </Alert>
        </div>
    );
}
