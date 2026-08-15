import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{ background: 'var(--warm-charcoal)' }}>
            <div className="container mx-auto px-4 sm:px-6 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <img
                                src="/invoicecheck-logo.svg"
                                alt="InvoiceCheck Logo"
                                className="w-6 h-6 brightness-0 invert opacity-80"
                            />
                            <h3 className="text-lg font-bold" style={{ color: 'var(--warm-cream)' }}>
                                InvoiceCheck.in
                            </h3>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#A8917A' }}>
                            India&apos;s fastest GST invoice validator. Catch errors before the portal rejects your filing.
                        </p>
                    </div>

                    {/* Product */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase" style={{ color: '#C4B5A3' }}>
                            Product
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/check" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Check Invoice
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/bulk" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Bulk Check (CA firms)
                                </Link>
                            </li>
                            <li>
                                <Link href="/vendor-invoice-check" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Vendor Invoice Check
                                </Link>
                            </li>
                            <li>
                                <Link href="/gst-penalty-calculator" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    GST Penalty Calculator
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase" style={{ color: '#C4B5A3' }}>
                            Resources
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/gst-error-codes" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    GST Error Codes
                                </Link>
                            </li>
                            <li>
                                <Link href="/guides" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    GST Guides
                                </Link>
                            </li>
                            <li>
                                <Link href="/guides/igst-vs-cgst-sgst-place-of-supply" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    IGST vs CGST/SGST
                                </Link>
                            </li>
                            <li>
                                <Link href="/guides/amazon-flipkart-gst-invoice-rejection-reasons" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Marketplace Rejections
                                </Link>
                            </li>
                            <li>
                                <Link href="/ca-case-studies" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    CA Case Studies
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase" style={{ color: '#C4B5A3' }}>
                            Company
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase" style={{ color: '#C4B5A3' }}>
                            Legal
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/privacy" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/refund" className="transition-colors" style={{ color: '#9E8A78' }}>
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(250, 248, 246, 0.1)' }}>
                    <p className="text-sm" style={{ color: '#9E8A78' }}>
                        © {new Date().getFullYear()} InvoiceCheck.in. All rights reserved.
                    </p>
                    <p className="text-xs" style={{ color: '#7A6B5D' }}>
                        Not a substitute for professional CA advice. For informational purposes only.
                    </p>
                </div>
            </div>
        </footer>
    );
}
