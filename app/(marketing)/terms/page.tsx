import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service — InvoiceCheck.in',
    description: 'Terms of Service for InvoiceCheck.in. Please read these terms carefully before using our GST invoice validation service.',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-sm text-muted-foreground mb-10">
                    Last Updated: February 22, 2026 &nbsp;·&nbsp; Effective: February 22, 2026
                </p>

                <p>
                    Welcome to InvoiceCheck.in, a GST invoice validation service operated by
                    InvoiceCheck Technologies ("Company", "we", "us", or "our"). By accessing or
                    using our website at <a href="https://invoicecheck.in">invoicecheck.in</a> (the
                    "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do
                    not agree, do not use the Service.
                </p>

                <h2>1. Description of Service</h2>
                <p>
                    InvoiceCheck.in provides an automated, software-based tool for checking GST
                    invoices against a rule set derived from the CGST Act 2017, IGST Act 2017, and
                    notifications issued by the CBIC. The Service validates invoice fields, tax
                    calculations, HSN/SAC codes, Place of Supply, and related compliance parameters.
                </p>

                <h2>2. Not Professional Tax Advice</h2>
                <p>
                    <strong>
                        The Service is a software aid and does not constitute professional legal,
                        financial, or tax (CA) advice.
                    </strong>{' '}
                    Validation results are based on automated rule checks and may not account for
                    all factual circumstances, recent notifications, or jurisdiction-specific
                    interpretations. You should verify critical filings and decisions with a
                    qualified Chartered Accountant or tax advisor licensed by ICAI.
                </p>
                <p>
                    We disclaim all liability for GST notices, demands, penalties, or assessments
                    arising from reliance on our validation results without independent professional
                    verification.
                </p>

                <h2>3. Acceptance of Terms</h2>
                <p>
                    By creating an account or making a payment, you confirm that:
                </p>
                <ul>
                    <li>You are at least 18 years of age.</li>
                    <li>You have the authority to enter into this agreement on behalf of your business (if applicable).</li>
                    <li>All information you provide is accurate and up to date.</li>
                </ul>

                <h2>4. Pricing and Payments</h2>
                <ul>
                    <li>
                        <strong>Pay-per-check:</strong> ₹99 per invoice validation (for guest users
                        after 3 free checks, or registered users without a subscription).
                    </li>
                    <li>
                        <strong>Subscriptions:</strong> Monthly and annual plans are billed in
                        advance. Credits are non-transferable between accounts.
                    </li>
                    <li>
                        Payments are processed by Razorpay and are subject to Razorpay's terms. All
                        prices are inclusive of applicable taxes.
                    </li>
                </ul>

                <h2>5. Refund Policy</h2>
                <p>
                    If a validation check fails due to a server error on our side (i.e., you are
                    charged but no result is returned), we will refund the credit or charge within
                    5 business days upon request to{' '}
                    <a href="mailto:support@invoicecheck.in">support@invoicecheck.in</a>.
                </p>
                <p>
                    Refunds are not issued for completed validations where results were delivered,
                    regardless of whether the invoice passed or failed the check.
                </p>

                <h2>6. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the Service to validate fictitious or fraudulent invoices for tax evasion purposes.</li>
                    <li>Reverse-engineer, scrape, or automate calls to our API without prior written consent.</li>
                    <li>Share account credentials or credits purchased under a personal plan.</li>
                    <li>Attempt to bypass the payment mechanism, including manipulating the free-check counter.</li>
                </ul>
                <p>
                    We reserve the right to suspend accounts that violate this policy without prior
                    notice and without refund.
                </p>

                <h2>7. Intellectual Property</h2>
                <p>
                    The Service, including its validation rules, UI design, and written content, is
                    owned by InvoiceCheck Technologies and protected under applicable Indian
                    intellectual property law. You may not copy, reproduce, or create derivative
                    works without our express written permission.
                </p>

                <h2>8. Limitation of Liability</h2>
                <p>
                    To the maximum extent permitted by law, our total liability to you for any claim
                    arising out of or relating to the Service shall not exceed the amount you paid us
                    in the 30 days preceding the claim.
                </p>
                <p>
                    We shall not be liable for any indirect, incidental, consequential, or punitive
                    damages, including loss of profits, loss of data, or business interruption, even
                    if we have been advised of the possibility of such damages.
                </p>

                <h2>9. Indemnification</h2>
                <p>
                    You agree to indemnify and hold harmless InvoiceCheck Technologies, its
                    officers, employees, and affiliates from any claims, liabilities, damages, and
                    expenses (including reasonable legal fees) arising from your use of the Service
                    or violation of these Terms.
                </p>

                <h2>10. Modifications to the Service</h2>
                <p>
                    We reserve the right to modify, suspend, or discontinue the Service at any time.
                    For paid subscribers, if we discontinue the Service, we will provide a pro-rated
                    refund for the unused portion of the subscription.
                </p>

                <h2>11. Governing Law and Dispute Resolution</h2>
                <p>
                    These Terms are governed by the laws of India. Any disputes arising from these
                    Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai,
                    Maharashtra, India. Before initiating legal proceedings, you agree to attempt
                    resolution via email negotiation for a minimum of 30 days.
                </p>

                <h2>12. Updates to These Terms</h2>
                <p>
                    We may revise these Terms at any time. We will notify you of material changes
                    via email (for registered users) at least 7 days before the new terms take
                    effect. Continued use of the Service after the effective date constitutes
                    acceptance of the revised Terms.
                </p>

                <h2>13. Contact Us</h2>
                <p>
                    For any questions regarding these Terms, please contact us:
                </p>
                <ul>
                    <li>Email: <a href="mailto:support@invoicecheck.in">support@invoicecheck.in</a></li>
                    <li>Website: <a href="https://invoicecheck.in/contact">invoicecheck.in/contact</a></li>
                </ul>
            </div>
        </div>
    );
}
