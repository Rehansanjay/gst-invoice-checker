import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy — InvoiceCheck.in',
    description: 'Privacy Policy for InvoiceCheck.in — learn how we collect, use, and protect your data when you use our GST invoice validation service.',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mb-10">
                    Last Updated: February 22, 2026 &nbsp;·&nbsp; Effective: February 22, 2026
                </p>

                <p>
                    InvoiceCheck.in ("we", "our", or "us") is committed to protecting the privacy of
                    businesses and individuals who use our GST invoice validation service. This Privacy
                    Policy explains what data we collect, how we use it, and the choices you have.
                </p>

                <h2>1. Information We Collect</h2>
                <h3>1a. Data You Enter</h3>
                <p>
                    When you validate an invoice, you provide invoice details such as GSTIN, invoice
                    number, date, line items, tax amounts, HSN/SAC codes, and Place of Supply. This
                    information is used solely to perform the GST compliance check.
                </p>
                <h3>1b. Account Information</h3>
                <p>
                    If you create an account, we collect your email address and, optionally, your name
                    and business GSTIN. Passwords are never stored in plain text — we use Supabase Auth
                    (which follows bcrypt hashing standards).
                </p>
                <h3>1c. Payment Information</h3>
                <p>
                    Payments are processed by Razorpay. We do not store your card number, CVV, or bank
                    credentials on our servers. Razorpay provides us with a transaction ID and payment
                    status only.
                </p>
                <h3>1d. Usage and Analytics</h3>
                <p>
                    We collect anonymous usage data (pages visited, features used) to improve the
                    product. This data cannot be used to identify you individually. We also collect
                    UTM parameters and referral codes to attribute traffic sources.
                </p>
                <h3>1e. Technical Data</h3>
                <p>
                    Standard server logs include your IP address, browser type, and timestamps. These
                    are retained for security and debugging purposes for up to 90 days.
                </p>

                <h2>2. How We Use Your Data</h2>
                <ul>
                    <li>To perform GST invoice validation and generate the compliance report.</li>
                    <li>To process payments and issue receipts via Razorpay.</li>
                    <li>To send transactional emails (payment confirmation, report delivery).</li>
                    <li>To send filing deadline reminders if you have opted in.</li>
                    <li>To improve our 15-rule validation engine based on aggregated, anonymised data.</li>
                    <li>To detect fraud, abuse, or misuse of the service.</li>
                </ul>
                <p>We do <strong>not</strong> use your invoice data to train AI/ML models.</p>

                <h2>3. Data Retention</h2>
                <ul>
                    <li>
                        <strong>Guest users:</strong> Invoice input data is cached for up to 1 hour
                        for idempotency (to prevent duplicate charges) and then permanently deleted.
                    </li>
                    <li>
                        <strong>Registered users:</strong> Validation results are stored in your
                        dashboard history for as long as your account is active. You can delete
                        individual checks or your entire account at any time from Settings.
                    </li>
                    <li>
                        <strong>Payment records:</strong> Required by law to be retained for 7 years
                        under Indian accounting regulations.
                    </li>
                </ul>

                <h2>4. Data Sharing</h2>
                <p>
                    We do <strong>not</strong> sell, rent, or trade your personal information.
                    We share data only with the following trusted sub-processors:
                </p>
                <ul>
                    <li><strong>Supabase</strong> — database and authentication (servers in AWS ap-south-1, India)</li>
                    <li><strong>Razorpay</strong> — payment processing (RBI-regulated)</li>
                    <li><strong>Resend / Nodemailer</strong> — transactional email delivery</li>
                    <li><strong>Vercel</strong> — application hosting</li>
                </ul>
                <p>
                    We may disclose data if required by Indian law (e.g., a valid court order or
                    regulatory direction from GSTN/CBIC).
                </p>

                <h2>5. Cookies</h2>
                <p>
                    We use strict-necessity cookies for session authentication and a localStorage key
                    (<code>gst_free_checks_used</code>) to track your free check usage. We do not use
                    third-party advertising cookies.
                </p>

                <h2>6. Security</h2>
                <p>
                    All data is transmitted over HTTPS (TLS 1.3). Database access is protected by
                    Row Level Security (Supabase RLS policies) so users can only access their own data.
                    We undergo periodic security reviews.
                </p>

                <h2>7. Your Rights</h2>
                <p>
                    Under India's Digital Personal Data Protection Act, 2023 (DPDPA), you have the
                    right to:
                </p>
                <ul>
                    <li>Access the personal data we hold about you.</li>
                    <li>Correct inaccurate personal data.</li>
                    <li>Request erasure of your data (right to be forgotten).</li>
                    <li>Withdraw consent at any time.</li>
                    <li>Nominate a representative in the event of your death or incapacity.</li>
                </ul>
                <p>
                    To exercise any of these rights, email us at{' '}
                    <a href="mailto:privacy@invoicecheck.in">privacy@invoicecheck.in</a>. We will
                    respond within 30 days.
                </p>

                <h2>8. Children's Privacy</h2>
                <p>
                    Our service is intended for businesses and is not directed at individuals under 18.
                    We do not knowingly collect data from minors.
                </p>

                <h2>9. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. Material changes will be
                    notified via email (for registered users) or a notice on the website at least 7
                    days before they take effect.
                </p>

                <h2>10. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us:
                </p>
                <ul>
                    <li>Email: <a href="mailto:privacy@invoicecheck.in">privacy@invoicecheck.in</a></li>
                    <li>Website: <a href="https://invoicecheck.in/contact">invoicecheck.in/contact</a></li>
                </ul>
            </div>
        </div>
    );
}
