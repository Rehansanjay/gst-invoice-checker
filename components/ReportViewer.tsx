'use client';

import { useState } from 'react';
import { ValidationResult } from '@/types';
import HealthScore from './HealthScore';
import IssueCard from './IssueCard';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Download, Share2, Mail, RefreshCw, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ReportViewerProps {
    result: ValidationResult;
    invoiceNumber?: string;
}

export default function ReportViewer({ result, invoiceNumber = 'Invoice' }: ReportViewerProps) {
    const criticalIssues = result.issuesFound.filter(i => i.severity === 'critical');
    const warningIssues = result.issuesFound.filter(i => i.severity === 'warning');
    const infoIssues = result.issuesFound.filter(i => i.severity === 'info');
    const passedChecks = result.checksPassed;

    const [isDownloading, setIsDownloading] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            // Dynamically import jsPDF so it only loads client-side
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = 20;

            const addLine = (text: string, size = 11, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [30, 30, 30]) => {
                doc.setFontSize(size);
                doc.setFont('helvetica', style);
                doc.setTextColor(...color);
                const lines = doc.splitTextToSize(text, contentWidth);
                lines.forEach((line: string) => {
                    if (y > 275) { doc.addPage(); y = 20; }
                    doc.text(line, margin, y);
                    y += size * 0.45;
                });
                y += 3;
            };

            const addDivider = () => {
                if (y > 275) { doc.addPage(); y = 20; }
                doc.setDrawColor(220, 220, 220);
                doc.line(margin, y, pageWidth - margin, y);
                y += 5;
            };

            // ── Header ──
            doc.setFillColor(30, 64, 175);
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('GST Invoice Validation Report', pageWidth / 2, 13, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`InvoiceCheck.in  |  Check ID: ${result.checkId}`, pageWidth / 2, 22, { align: 'center' });
            y = 40;

            // ── Invoice Info ──
            addLine(`Invoice: ${invoiceNumber}   |   Date: ${new Date().toLocaleDateString('en-IN')}`, 10, 'normal', [80, 80, 80]);
            addDivider();

            // ── Health Score ──
            const scoreColor: [number, number, number] = result.healthScore >= 80 ? [34, 197, 94] : result.healthScore >= 50 ? [234, 179, 8] : [239, 68, 68];
            addLine('Health Score', 13, 'bold');
            addLine(`${result.healthScore} / 100  —  ${result.riskLevel.toUpperCase()} RISK`, 18, 'bold', scoreColor);
            addDivider();

            // ── Critical Issues ──
            const criticals = result.issuesFound.filter(i => i.severity === 'critical');
            const warnings = result.issuesFound.filter(i => i.severity === 'warning');

            if (criticals.length > 0) {
                addLine(`CRITICAL ISSUES (${criticals.length})`, 13, 'bold', [185, 28, 28]);
                criticals.forEach((issue, idx) => {
                    addLine(`${idx + 1}. ${issue.title}`, 11, 'bold', [185, 28, 28]);
                    addLine(`   ${issue.description}`, 10, 'normal', [60, 60, 60]);
                    if (issue.howToFix) addLine(`   Fix: ${issue.howToFix}`, 10, 'normal', [100, 100, 100]);
                    y += 2;
                });
                addDivider();
            }

            if (warnings.length > 0) {
                addLine(`WARNINGS (${warnings.length})`, 13, 'bold', [161, 98, 7]);
                warnings.forEach((issue, idx) => {
                    addLine(`${idx + 1}. ${issue.title}`, 11, 'bold', [161, 98, 7]);
                    addLine(`   ${issue.description}`, 10, 'normal', [60, 60, 60]);
                    y += 2;
                });
                addDivider();
            }

            // ── Checks Passed ──
            addLine(`CHECKS PASSED (${result.checksPassed.length})`, 13, 'bold', [21, 128, 61]);
            result.checksPassed.forEach(check => {
                addLine(`• ${check.title}`, 10, 'normal', [60, 60, 60]);
            });
            addDivider();

            // ── Footer ──
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text('DISCLAIMER: Automated validation tool. Consult a CA before GST filing. Max liability ₹99.', pageWidth / 2, 285, { align: 'center' });

            doc.save(`invoice-report-${invoiceNumber || result.checkId}.pdf`);
            toast.success('PDF downloaded!');
        } catch (error: any) {
            console.error('PDF error:', error);
            toast.error('PDF generation failed: ' + (error.message || 'Unknown error'));
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailAddress.trim()) {
            toast.error('Please enter an email address');
            return;
        }
        setIsSendingEmail(true);
        try {
            const res = await fetch('/api/email-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailAddress, result, checkId: result.checkId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send email');

            toast.success(`Report sent to ${emailAddress}`);
            setShowEmailModal(false);
            setEmailAddress('');
        } catch (error: any) {
            toast.error(error.message || 'Email sending failed');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleShareWhatsApp = () => {
        const riskEmoji = result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '🔴';
        const text = encodeURIComponent(
            `${riskEmoji} GST Invoice Validation Report\n` +
            `Health Score: ${result.healthScore}/100 (${result.riskLevel.toUpperCase()} RISK)\n` +
            `Issues Found: ${result.issuesFound.length}\n` +
            `Checks Passed: ${result.checksPassed.length}\n` +
            `Validated on InvoiceCheck.in`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Invoice Health Report</h2>
                    <p className="text-sm text-muted-foreground">Check ID: {result.checkId} • {new Date().toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowEmailModal(true)}>
                        <Mail className="w-4 h-4 mr-2" /> Email
                    </Button>
                </div>
            </div>

            {/* Health Score */}
            <HealthScore score={result.healthScore} riskLevel={result.riskLevel} />

            {/* Critical Issues */}
            {criticalIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
                        🔴 CRITICAL ISSUES ({criticalIssues.length})
                    </h3>
                    <div className="space-y-6">
                        {criticalIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            {/* Warning Issues */}
            {warningIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-yellow-600 flex items-center gap-2">
                        ⚠️ WARNINGS ({warningIssues.length})
                    </h3>
                    <div className="space-y-6">
                        {warningIssues.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                </div>
            )}

            {/* Informational Notes */}
            {infoIssues.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 text-blue-600 flex items-center gap-2">
                        ℹ️ INFORMATIONAL NOTES ({infoIssues.length})
                    </h3>
                    <Card className="p-5 border-blue-200 bg-blue-50/40 space-y-4">
                        {infoIssues.map((issue) => (
                            <div key={issue.id} className="border-b border-blue-100 last:border-0 pb-3 last:pb-0">
                                <p className="font-semibold text-blue-900 text-sm">{issue.title}</p>
                                <p className="text-blue-800 text-sm mt-1">{issue.description}</p>
                                {issue.howToFix && (
                                    <p className="text-blue-700 text-xs mt-1 italic">Note: {issue.howToFix}</p>
                                )}
                                {issue.gstLawContext && (
                                    <p className="text-blue-600 text-xs mt-1">📖 {issue.gstLawContext}</p>
                                )}
                            </div>
                        ))}
                    </Card>
                </div>
            )}

            {/* Checks Passed */}
            <div>
                <h3 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
                    ✅ CHECKS PASSED ({passedChecks.length})
                </h3>
                <Card className="p-6 border-green-200 bg-green-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {passedChecks.map((check) => (
                            <div key={check.id} className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{check.title}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recommended Actions */}
            <Card className="p-6 border-blue-200 bg-blue-50/30">
                <h3 className="text-lg font-bold mb-4 text-blue-900">📋 RECOMMENDED ACTIONS</h3>
                <div className="space-y-4">
                    {criticalIssues.length > 0 ? (
                        <div>
                            <h4 className="font-semibold text-red-700 mb-2">Priority 1 (Must Fix):</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                {criticalIssues.map((issue, i) => (
                                    <li key={i}>Fix {issue.title} {issue.location ? `at ${issue.location}` : ''}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div>
                            <h4 className="font-semibold text-green-700 mb-2">Invoice Ready!</h4>
                            <p className="text-sm text-slate-700">Your invoice looks good. ready for submission.</p>
                        </div>
                    )}

                    <div>
                        <h4 className="font-semibold text-slate-700 mb-2">Priority 2 (Review):</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                            <li>Share this report with your CA</li>
                            <li>Generate revised invoice if needed</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Estimated Savings */}
            {criticalIssues.length > 0 && (
                <Card className="p-6 border-green-200 bg-green-50 border-l-4 border-l-green-500">
                    <h3 className="text-lg font-bold mb-4 text-green-800">💰 ESTIMATED SAVINGS</h3>
                    <p className="mb-2 text-sm font-medium text-green-900">By catching these errors now:</p>
                    <ul className="space-y-2 text-sm text-green-800">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Avoided ₹500 CA review fee</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Prevented 2-7 day payment delay</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved potential payment hold</li>
                    </ul>
                </Card>
            )}

            {/* Footer Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="w-full" variant="outline" onClick={handleDownloadPDF} disabled={isDownloading}>
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Download PDF
                </Button>
                <Button className="w-full" variant="outline" onClick={handleShareWhatsApp}>
                    <Share2 className="w-4 h-4 mr-2" /> Share WhatsApp
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setShowEmailModal(true)}>
                    <Mail className="w-4 h-4 mr-2" /> Email Report
                </Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Check Another
                </Button>
            </div>

            {/* Disclaimer */}
            <Card className="p-4 bg-yellow-50 border-yellow-200 text-xs text-muted-foreground">
                <p className="font-bold mb-1">⚠️ DISCLAIMER</p>
                <p>
                    This is an automated validation tool. Always consult a qualified Chartered Accountant for final approval before
                    GST filing. Maximum liability: ₹99 (amount paid).
                </p>
            </Card>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Email Report</h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            We'll send the full validation report to your email using Resend.
                        </p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                className="flex-1"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                            >
                                {isSendingEmail ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                ) : (
                                    <><Mail className="w-4 h-4 mr-2" /> Send Report</>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
