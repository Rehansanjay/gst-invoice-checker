import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t bg-muted/30 mt-16">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold">InvoiceCheck.in</h3>
                        <p className="text-sm text-muted-foreground">
                            India&apos;s fastest GST invoice validator. Catch errors before the portal rejects your filing.
                        </p>
                    </div>

                    {/* Product */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/check" className="hover:text-foreground transition-colors">Check Invoice</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                            <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                            <li><Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} InvoiceCheck.in. All rights reserved.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Not a substitute for professional CA advice. For informational purposes only.
                    </p>
                </div>
            </div>
        </footer>
    );
}
