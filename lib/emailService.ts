import { Resend } from 'resend';
import { ValidationResult } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailReport(
  email: string,
  validationResult: ValidationResult,
  checkId: string
) {
  try {
    const { healthScore, riskLevel, issuesFound } = validationResult;

    const criticalIssues = issuesFound.filter(i => i.severity === 'critical');
    const warningIssues = issuesFound.filter(i => i.severity === 'warning');

    const riskEmoji = riskLevel === 'low' ? '✅' : riskLevel === 'medium' ? '⚠️' : '🔴';
    const riskColor = riskLevel === 'low' ? '#22c55e' : riskLevel === 'medium' ? '#f59e0b' : '#ef4444';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .score { background: ${riskColor}; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #e5e7eb; }
    .critical { border-left-color: #ef4444; }
    .warning { border-left-color: #f59e0b; }
    .issue { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Invoice Validation Report</h1>
    <p>Check ID: ${checkId}</p>
  </div>

  <div class="score">
    <h2>${riskEmoji} Health Score: ${healthScore}/100</h2>
    <p>${riskLevel.toUpperCase()} RISK</p>
  </div>

  ${criticalIssues.length > 0 ? `
  <div class="section critical">
    <h3>🔴 Critical Issues (${criticalIssues.length})</h3>
    ${criticalIssues.map(issue => `
      <div class="issue">
        <strong>${issue.title}</strong>
        ${issue.location ? `<br><small>${issue.location}</small>` : ''}
        <p>${issue.description}</p>
        <p><strong>💡 How to Fix:</strong> ${issue.howToFix}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${warningIssues.length > 0 ? `
  <div class="section warning">
    <h3>⚠️ Warnings (${warningIssues.length})</h3>
    ${warningIssues.map(issue => `
      <div class="issue">
        <strong>${issue.title}</strong>
        <p>${issue.description}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${criticalIssues.length === 0 && warningIssues.length === 0 ? `
  <div class="section" style="border-left-color: #22c55e;">
    <h3>✅ All Checks Passed!</h3>
    <p>Your invoice looks good and ready for submission.</p>
  </div>
  ` : ''}

  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/check?id=${checkId}" class="button">
      View Full Report
    </a>
  </div>

  <div class="footer">
    <p>⚠️ <strong>Disclaimer:</strong> This is an automated validation tool. Always consult a qualified Chartered Accountant for final approval before GST filing.</p>
    <p>© ${new Date().getFullYear()} InvoiceCheck.in • Maximum liability: ₹99</p>
  </div>
</body>
</html>
    `;

    await resend.emails.send({
      // For local/testing: Resend's built-in sender works without domain verification
      // For production: verify invoicecheck.in in Resend dashboard and switch to:
      // from: 'InvoiceCheck.in <reports@invoicecheck.in>',
      from: 'InvoiceCheck.in <onboarding@resend.dev>',
      to: email,
      subject: `${riskEmoji} Invoice Validation Report - ${riskLevel.toUpperCase()} RISK`,
      html: htmlContent,
    });

    console.log(`✅ Email sent to ${email} for check ${checkId}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}
