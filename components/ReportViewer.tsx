'use client';

import { useState } from 'react';
import { ParsedInvoice, ValidationResult } from '@/types';
import HealthScore from './HealthScore';
import IssueCard from './IssueCard';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Download, FileSpreadsheet, FileCode2, Share2, Mail, RefreshCw, Loader2, X, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { buildTallyPurchaseXml, buildPurchaseRegisterCsv, downloadTextFile } from '@/lib/invoiceExport';
import { readGstin, GST_PORTAL_SEARCH_URL } from '@/lib/gstin';

interface ReportViewerProps {
    result: ValidationResult;
    invoiceNumber?: string;
    /** Supplier/buyer/line-item data for the Tally XML + Purchase Register CSV
     * exports below. Optional because older saved reports may not have it on
     * hand — the export buttons are simply hidden when it's missing. */
    invoiceData?: ParsedInvoice;
}

export default function ReportViewer({ result, invoiceNumber = 'Invoice', invoiceData }: ReportViewerProps) {
    const gstinReading = invoiceData?.supplierGSTIN ? readGstin(invoiceData.supplierGSTIN) : null;
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

            /**
             * Writes one issue with the same depth the on-screen report shows.
             *
             * The PDF previously carried only title, description and (for
             * criticals) the fix — dropping the location, the expected/found
             * values, the impact and the GST section. That is the content that
             * makes the report actionable and credible, and the PDF is the
             * artifact the customer keeps and forwards to their CA, so it was
             * the wrong place to be thin. Warnings also silently lost their fix.
             */
            const addIssue = (
                issue: typeof result.issuesFound[number],
                idx: number,
                colour: [number, number, number]
            ) => {
                addLine(`${idx + 1}. ${issue.title}`, 11, 'bold', colour);
                if (issue.location) addLine(`   ${issue.location}`, 9, 'normal', [110, 110, 110]);
                addLine(`   ${issue.description}`, 10, 'normal', [60, 60, 60]);

                if (issue.expected !== undefined || issue.found !== undefined) {
                    addLine(
                        `   Expected: ${issue.expected ?? '—'}    Found: ${issue.found ?? '—'}`,
                        10, 'bold', [60, 60, 60]
                    );
                }
                if (issue.howToFix) addLine(`   Fix: ${issue.howToFix}`, 10, 'normal', [21, 128, 61]);
                if (issue.impact) addLine(`   Impact: ${issue.impact}`, 9, 'normal', [120, 80, 80]);
                if (issue.gstLawContext) addLine(`   Reference: ${issue.gstLawContext}`, 9, 'normal', [110, 110, 110]);
                y += 3;
            };

            if (criticals.length > 0) {
                addLine(`CRITICAL ISSUES (${criticals.length})`, 13, 'bold', [185, 28, 28]);
                criticals.forEach((issue, idx) => addIssue(issue, idx, [185, 28, 28]));
                addDivider();
            }

            if (warnings.length > 0) {
                addLine(`WARNINGS (${warnings.length})`, 13, 'bold', [161, 98, 7]);
                warnings.forEach((issue, idx) => addIssue(issue, idx, [161, 98, 7]));
                addDivider();
            }

            const infos = result.issuesFound.filter(i => i.severity === 'info');
            if (infos.length > 0) {
                addLine(`NOTES (${infos.length})`, 13, 'bold', [29, 78, 137]);
                infos.forEach((issue, idx) => addIssue(issue, idx, [29, 78, 137]));
                addDivider();
            }

            // ── Checks Passed ──
            addLine(`CHECKS PASSED (${result.checksPassed.length})`, 13, 'bold', [21, 128, 61]);
            result.checksPassed.forEach(check => {
                addLine(`• ${check.title}`, 10, 'normal', [60, 60, 60]);
            });
            addDivider();

            // ── Recommended actions ──
            // Mirrors the on-screen report so the PDF is a complete record on
            // its own, rather than a summary that only makes sense next to the
            // web page the reader no longer has open.
            if (criticals.length > 0 || warnings.length > 0) {
                addLine('RECOMMENDED ACTIONS', 13, 'bold', [30, 30, 30]);
                if (criticals.length > 0) {
                    addLine('Priority 1 — fix before filing:', 10, 'bold', [60, 60, 60]);
                    criticals.forEach((issue) => {
                        addLine(`• ${issue.title}${issue.location ? ` (${issue.location})` : ''}`, 10, 'normal', [60, 60, 60]);
                    });
                }
                if (warnings.length > 0) {
                    addLine('Priority 2 — review:', 10, 'bold', [60, 60, 60]);
                    warnings.forEach((issue) => {
                        addLine(`• ${issue.title}`, 10, 'normal', [60, 60, 60]);
                    });
                }
                addLine('• Re-issue or amend the invoice, then validate again before it goes into GSTR-1.', 10, 'normal', [60, 60, 60]);
                addDivider();
            }

            // ── Footer ──
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text('DISCLAIMER: Automated validation tool. Consult a CA before GST filing. Max liability ₹99.', pageWidth / 2, 285, { align: 'center' });

            doc.save(`invoice-report-${invoiceNumber || result.checkId}.pdf`);
            toast.success('PDF downloaded!');
        } catch (error) {
            console.error('PDF error:', error);
            toast.error('PDF generation failed: ' + ((error instanceof Error && error.message) || 'Unknown error'));
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
        } catch (error) {
            toast.error((error instanceof Error && error.message) || 'Email sending failed');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleDownloadTallyXml = () => {
        if (!invoiceData) return;
        const xml = buildTallyPurchaseXml(invoiceData);
        downloadTextFile(`tally-purchase-${invoiceNumber || result.checkId}.xml`, xml, 'application/xml');
        toast.success('Tally Prime XML downloaded!');
    };

    const handleDownloadCsv = () => {
        if (!invoiceData) return;
        const csv = buildPurchaseRegisterCsv(invoiceData, result);
        downloadTextFile(`purchase-register-${invoiceNumber || result.checkId}.csv`, csv, 'text/csv');
        toast.success('Purchase Register CSV downloaded!');
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

            {/* Seller GSTIN Forensics — the offline structural read (state,
                PAN, entity type, mod-36 checksum) always renders once a
                supplier GSTIN is on hand, since that's true the moment the
                invoice is parsed. The live Active/Cancelled/legal-name layer
                only joins in once GSTIN_API_KEY + GSTIN_API_PROVIDER are set
                and a lookup actually succeeded — until then this says so
                plainly instead of silently showing nothing, which is what a
                paying guest saw before this block existed. */}
            {gstinReading && (
                <Card className="p-4 space-y-3 border-slate-200 bg-slate-50/60">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        🔎 Seller GSTIN Forensics
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Registered State</p>
                            <p className="font-medium text-slate-800">
                                {gstinReading.stateName ?? 'Unknown'}{gstinReading.stateCode ? ` (${gstinReading.stateCode})` : ''}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Seller PAN</p>
                            <p className="font-medium text-slate-800">{gstinReading.pan ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Business Entity Type</p>
                            <p className="font-medium text-slate-800">{gstinReading.holderType ?? 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Mod-36 Checksum</p>
                            <p className={`font-medium flex items-center gap-1 ${gstinReading.valid ? 'text-emerald-700' : 'text-red-700'}`}>
                                {gstinReading.valid ? (
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                ) : (
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                )}
                                {gstinReading.valid ? 'Valid' : 'Invalid'}
                            </p>
                        </div>
                    </div>

                    {result.supplierGstinStatus && result.supplierGstinStatus.source !== 'offline' ? (
                        <div className="pt-3 border-t border-slate-200 flex items-start gap-2">
                            {result.supplierGstinStatus.status === 'Active' ? (
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : result.supplierGstinStatus.status === 'Unknown' ? (
                                <ShieldQuestion className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            ) : (
                                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Live status: {result.supplierGstinStatus.status ?? 'Unknown'}
                                    {result.supplierGstinStatus.taxpayerType && result.supplierGstinStatus.taxpayerType !== 'Unknown' && (
                                        <span className="text-muted-foreground font-normal"> · {result.supplierGstinStatus.taxpayerType}</span>
                                    )}
                                </p>
                                {result.supplierGstinStatus.legalName && (
                                    <p className="text-sm text-muted-foreground">{result.supplierGstinStatus.legalName}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="pt-3 border-t border-slate-200 text-xs text-slate-500">
                            {gstinReading.valid
                                ? 'This GSTIN could have been issued — '
                                : 'This GSTIN fails its own checksum — it was mistyped or made up. '}
                            Live Active/Cancelled status and legal name from the government GST network aren&apos;t connected yet, so this is structural verification only.{' '}
                            <a
                                href={GST_PORTAL_SEARCH_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                Check live status on the GST portal →
                            </a>
                        </p>
                    )}
                </Card>
            )}

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
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Checked before it reached the portal</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Prevented 2-7 day payment delay</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved potential payment hold</li>
                    </ul>
                </Card>
            )}

            {/* Footer Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                {invoiceData && (
                    <Button className="w-full" variant="outline" onClick={handleDownloadTallyXml}>
                        <FileCode2 className="w-4 h-4 mr-2" /> Tally Prime XML
                    </Button>
                )}
                {invoiceData && (
                    <Button className="w-full" variant="outline" onClick={handleDownloadCsv}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Purchase Register CSV
                    </Button>
                )}
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
                            We&apos;ll send the full validation report to your email using Resend.
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
