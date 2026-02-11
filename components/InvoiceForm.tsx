'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParsedInvoice, LineItem, VALID_GST_RATES } from '@/types';

export default function InvoiceForm({ onSubmit }: { onSubmit: (data: ParsedInvoice) => void }) {
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        supplierGSTIN: '',
        buyerGSTIN: '',
        supplierName: '',
        buyerName: '',
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

    // Auto-detect states from GSTIN
    const supplierState = formData.supplierGSTIN.substring(0, 2);
    const buyerState = formData.buyerGSTIN.substring(0, 2);
    const isSameState = supplierState === buyerState && supplierState !== '';

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

    const handleSubmit = async () => {
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
        };

        onSubmit(invoiceData);
        setIsSubmitting(false);
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
                        {supplierState && <p className="text-sm text-muted-foreground mt-1">State Code: {supplierState}</p>}
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
                            onChange={(e) => setFormData({ ...formData, buyerGSTIN: e.target.value.toUpperCase() })}
                            placeholder="27BBDCT5678B1Z3"
                            maxLength={15}
                            className="font-mono"
                        />
                        {buyerState && <p className="text-sm text-muted-foreground mt-1">State Code: {buyerState}</p>}
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
                    <div>
                        <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                        <Input
                            id="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="INV/2025/001"
                        />
                    </div>
                    <div>
                        <Label htmlFor="invoiceDate">Invoice Date *</Label>
                        <Input
                            id="invoiceDate"
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                        />
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
                    'Validate Invoice - ₹99'
                )}
            </Button>

            <Alert>
                <AlertDescription>
                    ⚠️ We validate YOUR entered data - not OCR. This ensures 100% accuracy.
                </AlertDescription>
            </Alert>
        </div>
    );
}
