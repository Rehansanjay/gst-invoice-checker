'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Loader2, Gift, UserPlus, Building2, ShoppingCart, FileText, Package, ChevronDown, ChevronUp, CheckCircle2, XCircle, Sparkles, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ParsedInvoice, LineItem, VALID_GST_RATES, InvoiceType, INVOICE_TYPE_LABELS, STATE_CODE_NAMES, VALID_STATE_CODES } from '@/types';

// ── GSTIN validation regex ──────────────────────────────────────────────────
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function GSTINBadge({ value }: { value: string }) {
    if (!value) return null;
    if (value.length < 15) return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {value.length}/15 characters
        </span>
    );
    const valid = GSTIN_REGEX.test(value);
    return valid ? (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valid format
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-xs text-red-500 mt-1 font-medium">
            <XCircle className="w-3.5 h-3.5" /> Invalid GSTIN format
        </span>
    );
}

// ── Step Progress Bar ────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Supplier', icon: Building2 },
    { label: 'Buyer', icon: ShoppingCart },
    { label: 'Invoice Info', icon: FileText },
    { label: 'Line Items', icon: Package },
];

function StepBar({ activeStep }: { activeStep: number }) {
    return (
        <div className="flex items-center justify-between mb-6 px-1">
            {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i < activeStep;
                const current = i === activeStep;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center relative">
                        {/* connector line */}
                        {i < STEPS.length - 1 && (
                            <div className={`absolute top-4 left-1/2 w-full h-0.5 transition-colors duration-500 ${done ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                        )}
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${done ? 'bg-primary text-primary-foreground shadow-md' :
                                current ? 'bg-primary/10 border-2 border-primary text-primary' :
                                    'bg-muted border-2 border-muted-foreground/20 text-muted-foreground'
                            }`}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs mt-1 font-medium transition-colors ${current ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                            }`}>{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tax Type Pill Toggle ─────────────────────────────────────────────────────
function TaxTypePill({ value, onChange, suggestedType }: {
    value: 'CGST_SGST' | 'IGST';
    onChange: (v: 'CGST_SGST' | 'IGST') => void;
    suggestedType?: 'CGST_SGST' | 'IGST';
}) {
    return (
        <div className="flex gap-2 mt-1">
            <button
                type="button"
                onClick={() => onChange('CGST_SGST')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${value === 'CGST_SGST'
                        ? 'bg-green-50 border-green-500 text-green-800 shadow-sm'
                        : 'bg-muted/50 border-transparent text-muted-foreground hover:border-muted-foreground/30'
                    }`}
            >
                CGST + SGST
                <div className="text-xs font-normal opacity-70">Same State</div>
                {suggestedType === 'CGST_SGST' && value !== 'CGST_SGST' && (
                    <div className="text-xs text-amber-600 font-normal">↑ Suggested</div>
                )}
            </button>
            <button
                type="button"
                onClick={() => onChange('IGST')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${value === 'IGST'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                        : 'bg-muted/50 border-transparent text-muted-foreground hover:border-muted-foreground/30'
                    }`}
            >
                IGST
                <div className="text-xs font-normal opacity-70">Interstate</div>
                {suggestedType === 'IGST' && value !== 'IGST' && (
                    <div className="text-xs text-amber-600 font-normal">↑ Suggested</div>
                )}
            </button>
        </div>
    );
}

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

    const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formReady, setFormReady] = useState(false);

    // ── Freemium 3-check model (guest users only) ──
    const FREE_CHECKS_KEY = 'gst_free_checks_used';
    const MAX_FREE_CHECKS = 3;
    const [freeChecksUsed, setFreeChecksUsed] = useState(0);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
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
    const suggestedTaxType: 'CGST_SGST' | 'IGST' | undefined =
        supplierState && buyerState ? (isSameState ? 'CGST_SGST' : 'IGST') : undefined;

    // Compute active step for progress bar
    const activeStep = useMemo(() => {
        const supplierOk = formData.supplierGSTIN.length === 15;
        const buyerOk = formData.buyerGSTIN.length === 15;
        const invoiceInfoOk = !!formData.invoiceNumber && !!formData.invoiceDate;
        const lineItemsOk = lineItems.some(i => i.description && i.taxableAmount > 0);
        if (lineItemsOk) return 4;
        if (invoiceInfoOk) return 3;
        if (buyerOk) return 2;
        if (supplierOk) return 1;
        return 0;
    }, [formData, lineItems]);

    // Track form readiness for glow effect
    useEffect(() => {
        const supplierOk = formData.supplierGSTIN.length === 15;
        const invoiceOk = !!formData.invoiceNumber && !!formData.invoiceDate;
        setFormReady(supplierOk && invoiceOk);
    }, [formData]);

    // Auto-fill Place of Supply from buyer GSTIN when it changes
    const handleBuyerGSTINChange = (value: string) => {
        const upper = value.toUpperCase();
        const newBuyerState = upper.substring(0, 2);
        setFormData(prev => ({
            ...prev,
            buyerGSTIN: upper,
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
            setCollapsedItems(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    };

    const toggleCollapse = (index: number) => {
        setCollapsedItems(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
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
        if (field === 'quantity' || field === 'rate') {
            updated[index].taxableAmount = updated[index].quantity * updated[index].rate;
            updated[index] = recalculateTax(updated[index]);
        }
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
        <div className="space-y-5">
            {/* ── Step Progress Bar ── */}
            <StepBar activeStep={activeStep} />

            {/* ── Supplier Details ── */}
            <Card className="p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Supplier Details</h3>
                    {formData.supplierGSTIN.length === 15 && GSTIN_REGEX.test(formData.supplierGSTIN) && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="supplierGSTIN">Supplier GSTIN *</Label>
                        <Input
                            id="supplierGSTIN"
                            value={formData.supplierGSTIN}
                            onChange={(e) => setFormData({ ...formData, supplierGSTIN: e.target.value.toUpperCase() })}
                            placeholder="27AABCP1234A1Z5"
                            maxLength={15}
                            className="font-mono mt-1"
                        />
                        <GSTINBadge value={formData.supplierGSTIN} />
                        {supplierState && <p className="text-sm text-muted-foreground mt-1">📍 {STATE_CODE_NAMES[supplierState] || supplierState}</p>}
                    </div>
                    <div>
                        <Label htmlFor="supplierName">Supplier Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                            id="supplierName"
                            value={formData.supplierName}
                            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                            placeholder="Company Name"
                            className="mt-1"
                        />
                    </div>
                </div>
            </Card>

            {/* ── Buyer Details ── */}
            <Card className="p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold">Buyer Details</h3>
                    {formData.buyerGSTIN.length === 15 && GSTIN_REGEX.test(formData.buyerGSTIN) && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="buyerGSTIN">Buyer GSTIN *</Label>
                        <Input
                            id="buyerGSTIN"
                            value={formData.buyerGSTIN}
                            onChange={(e) => handleBuyerGSTINChange(e.target.value)}
                            placeholder="27BBDCT5678B1Z3"
                            maxLength={15}
                            className="font-mono mt-1"
                        />
                        <GSTINBadge value={formData.buyerGSTIN} />
                        {buyerState && <p className="text-sm text-muted-foreground mt-1">📍 {STATE_CODE_NAMES[buyerState] || buyerState}</p>}
                    </div>
                    <div>
                        <Label htmlFor="buyerName">Buyer Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                            id="buyerName"
                            value={formData.buyerName}
                            onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                            placeholder="Customer Name"
                            className="mt-1"
                        />
                    </div>
                </div>

                {isSameState && supplierState && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        <span className="text-lg">🏠</span>
                        <span><strong>Same state</strong> — use CGST + SGST (not IGST)</span>
                    </div>
                )}
                {!isSameState && supplierState && buyerState && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <span className="text-lg">↔️</span>
                        <span><strong>Interstate</strong> — use IGST (not CGST + SGST)</span>
                    </div>
                )}
            </Card>

            {/* ── Invoice Information ── */}
            <Card className="p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="text-base font-semibold">Invoice Information</h3>
                    {formData.invoiceNumber && formData.invoiceDate && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Type */}
                    <div>
                        <Label htmlFor="invoiceType">Invoice Type *</Label>
                        <select
                            id="invoiceType"
                            value={formData.invoiceType}
                            onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value as InvoiceType })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-1"
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
                            placeholder="INV/2025-26/001"
                            className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Max 16 chars recommended per GST rules</p>
                    </div>

                    {/* Invoice Date */}
                    <div>
                        <Label htmlFor="invoiceDate">Invoice Date *</Label>
                        <Input
                            id="invoiceDate"
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                            className="mt-1"
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
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm mt-1"
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
                        <div className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${formData.reverseCharge ? 'border-amber-400 bg-amber-50' : 'border-transparent bg-muted/40'}`}>
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

            {/* ── Line Items ── */}
            <Card className="p-6 border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-base font-semibold">Line Items</h3>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="space-y-3">
                    {lineItems.map((item, index) => {
                        const isCollapsed = collapsedItems.has(index);
                        const isFilled = item.description && item.taxableAmount > 0;
                        return (
                            <Card key={index} className={`border transition-all duration-200 ${isFilled ? 'border-green-200 bg-green-50/30' : 'border-border/40 bg-muted/30'}`}>
                                {/* Item header — always visible */}
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer select-none"
                                    onClick={() => isFilled && toggleCollapse(index)}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isFilled ? 'bg-green-500 text-white' : 'bg-primary/15 text-primary'}`}>
                                        {isFilled ? '✓' : index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isCollapsed && item.description ? (
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-sm truncate">{item.description}</span>
                                                <span className="text-xs text-muted-foreground shrink-0">HSN: {item.hsnCode || '—'}</span>
                                                <span className="text-xs font-semibold text-foreground shrink-0">₹{item.totalAmount.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {item.description || `Item ${index + 1}`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {lineItems.length > 1 && (
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); removeLineItem(index); }}
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive h-7 w-7 p-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        {isFilled && (
                                            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                                                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Item fields — collapsible */}
                                {!isCollapsed && (
                                    <div className="px-4 pb-4 border-t border-border/30 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Label>Description *</Label>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    placeholder="Product/Service name"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label>HSN Code *</Label>
                                                <Input
                                                    value={item.hsnCode}
                                                    onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                                                    placeholder="8518"
                                                    maxLength={8}
                                                    className="mt-1"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">4–8 digit code from schedule</p>
                                            </div>

                                            <div>
                                                <Label>GST Rate</Label>
                                                <select
                                                    value={item.taxRate}
                                                    onChange={(e) => updateLineItem(index, 'taxRate', Number(e.target.value))}
                                                    className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1 text-sm"
                                                >
                                                    {VALID_GST_RATES.map((rate) => (
                                                        <option key={rate} value={rate}>{rate}%</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <Label>Quantity</Label>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                                                    min="1"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label>Rate (per unit) ₹</Label>
                                                <Input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => updateLineItem(index, 'rate', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label>Taxable Amount ₹</Label>
                                                <Input
                                                    type="number"
                                                    value={item.taxableAmount}
                                                    onChange={(e) => updateLineItem(index, 'taxableAmount', Number(e.target.value))}
                                                    min="0"
                                                    step="0.01"
                                                    className="mt-1"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Auto-calculated from Qty × Rate</p>
                                            </div>

                                            <div>
                                                <Label>Total Amount ₹</Label>
                                                <Input
                                                    type="number"
                                                    value={item.totalAmount.toFixed(2)}
                                                    readOnly
                                                    className="mt-1 bg-muted text-muted-foreground cursor-not-allowed"
                                                />
                                            </div>

                                            {/* Tax Type Pill */}
                                            <div className="md:col-span-2">
                                                <Label>Tax Type</Label>
                                                <TaxTypePill
                                                    value={item.taxType as 'CGST_SGST' | 'IGST'}
                                                    onChange={(v) => updateLineItem(index, 'taxType', v)}
                                                    suggestedType={suggestedTaxType}
                                                />
                                            </div>

                                            {/* Tax breakdown */}
                                            {item.taxType === 'CGST_SGST' ? (
                                                <>
                                                    <div>
                                                        <Label>CGST ({item.taxRate / 2}%) ₹</Label>
                                                        <Input
                                                            type="number"
                                                            value={item.cgst}
                                                            onChange={(e) => updateLineItem(index, 'cgst', Number(e.target.value))}
                                                            step="0.01"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>SGST ({item.taxRate / 2}%) ₹</Label>
                                                        <Input
                                                            type="number"
                                                            value={item.sgst}
                                                            onChange={(e) => updateLineItem(index, 'sgst', Number(e.target.value))}
                                                            step="0.01"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <Label>IGST ({item.taxRate}%) ₹</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.igst}
                                                        onChange={(e) => updateLineItem(index, 'igst', Number(e.target.value))}
                                                        step="0.01"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Dashed Add Item Button */}
                <button
                    type="button"
                    onClick={addLineItem}
                    className="mt-4 w-full py-3 border-2 border-dashed border-primary/30 rounded-lg text-sm text-primary/70 font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <span className="w-5 h-5 rounded-full border-2 border-primary/40 group-hover:border-primary flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3" />
                    </span>
                    Add Another Item
                </button>
            </Card>

            {/* ── Invoice Totals ── */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Invoice Totals</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">Taxable Total</span>
                        <span className="font-semibold tabular-nums">₹{taxableTotalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground text-sm">Tax Total</span>
                        <span className="font-semibold tabular-nums text-blue-600">₹{totalTaxAmount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center py-1">
                        <span className="text-lg font-bold">Invoice Total</span>
                        <span className="text-2xl font-bold text-primary tabular-nums">₹{invoiceTotalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* ── Free checks badge ── */}
            {isGuest && !hasUsedAllFreeChecks && (
                <div className="flex items-center justify-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">
                        {freeChecksRemaining === MAX_FREE_CHECKS
                            ? `${MAX_FREE_CHECKS} free checks — no signup needed`
                            : `${freeChecksRemaining} free check${freeChecksRemaining !== 1 ? 's' : ''} remaining`}
                    </span>
                </div>
            )}

            {/* ── Submit Button with glow ── */}
            <div className="relative">
                {formReady && !isSubmitting && (
                    <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md animate-pulse pointer-events-none" />
                )}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isAuthLoading}
                    size="lg"
                    className="relative w-full text-base h-12 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isSubmitting || isAuthLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isSubmitting ? 'Validating...' : 'Loading...'}
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {submitLabel || (freeChecksRemaining > 0 ? 'Validate Invoice — Free' : 'Validate Invoice — ₹99')}
                        </>
                    )}
                </Button>
            </div>

            {/* ── Soft signup prompt after 3 checks used ── */}
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

            <Alert className="border-amber-200 bg-amber-50/50">
                <AlertDescription className="text-amber-800 text-xs">
                    ⚠️ We validate YOUR entered data — not OCR. This ensures 100% accuracy.
                </AlertDescription>
            </Alert>
        </div>
    );
}
