export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto prose dark:prose-invert">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing InvoiceCheck.in, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                </p>

                <h2>2. Disclaimer</h2>
                <p>
                    The materials on InvoiceCheck.in are provided on an 'as is' basis.
                    While we strive for accuracy, our tool is a software aid and <strong>does not constitute professional legal or tax advice (CA advice).</strong>
                    You should verify critical data with a qualified Chartered Accountant.
                </p>

                <h2>3. Limitations</h2>
                <p>
                    In no event shall InvoiceCheck.in or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on InvoiceCheck.in.
                </p>

                <h2>4. Updates</h2>
                <p>
                    We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
                </p>
            </div>
        </div>
    );
}
