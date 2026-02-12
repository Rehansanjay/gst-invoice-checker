export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Information We Collect</h2>
                <p>
                    When you use InvoiceCheck.in, we collect the data you explicitly enter into our validation form (invoice details).
                    If you upload an image for reference, it is processed temporarily and not permanently stored unless you log in/save it.
                </p>

                <h2>2. How We Use Your Data</h2>
                <p>
                    We use your data solely to:
                </p>
                <ul>
                    <li>Perform GST validation checks.</li>
                    <li>Generate the validation report.</li>
                    <li>Process payments via our payment gateway.</li>
                </ul>

                <h2>3. Data Retention</h2>
                <p>
                    For guest users, validation data is cached for short-term performance (idempotency) and then deleted.
                    We do not sell, trade, or rent your personal identification information to others.
                </p>

                <h2>4. Security</h2>
                <p>
                    We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access.
                </p>

                <h2>5. Contact Us</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us at support@invoicecheck.in.
                </p>
            </div>
        </div>
    );
}
