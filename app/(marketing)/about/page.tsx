import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold mb-4">About InvoiceCheck.in</h1>

                <section className="space-y-4">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        InvoiceCheck.in was built to solve a specific pain point for Indian e-commerce sellers: <strong>payment holds due to incorrect GST invoices.</strong>
                    </p>
                    <p className="leading-relaxed">
                        We noticed that thousands of small businesses lose money or face delays from platforms like Amazon and Flipkart simply because their invoices have minor compliance errors—wrong tax codes, invalid HSNs, or calculation mistakes.
                    </p>
                    <p className="leading-relaxed">
                        Hiring a CA for every single invoice verification is expensive and slow. Manual checking is prone to human error.
                    </p>
                </section>

                <section className="bg-muted/30 p-8 rounded-lg border">
                    <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                    <p className="text-lg font-medium">
                        To make GST compliance accessible, instant, and affordable for every Indian business owner.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold">Why Trust Us?</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                        <li>Built by developers who understand Indian GST Technical Standards.</li>
                        <li>We do not sell your data. Your privacy is paramount.</li>
                        <li>We offer a 100% money-back guarantee if our tool fails you.</li>
                    </ul>
                </section>

                <div className="pt-8 text-center">
                    <h3 className="text-xl font-bold mb-4">Ready to verify your first invoice?</h3>
                    <Link href="/check">
                        <Button className="h-11 px-8">Start Checking Now</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
