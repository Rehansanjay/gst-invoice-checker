import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground">
                    Pay-as-you-go or save big with bulk credits.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">



                {/* Option 2: Starter Pack */}
                <Card className="p-6 border hover:border-primary/50 transition-colors">
                    <h3 className="text-lg font-bold mb-2">Starter Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹799
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹80 / check (Save 20%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        10 Credits. Good for small sellers.
                    </p>
                    <Button variant="outline" className="w-full mb-6 border-input hover:bg-accent h-11" disabled>Buy Pack</Button>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Valid forever</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dashboard Access</li>
                    </ul>
                </Card>

                {/* Option 3: Pro Pack */}
                <Card className="p-6 border-2 border-blue-200 bg-blue-50/20">
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase">
                        Best Value
                    </div>
                    <h3 className="text-lg font-bold mb-2">Growth Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹2,999
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹60 / check (Save 40%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        50 Credits. For growing businesses.
                    </p>
                    <Button className="w-full mb-6 h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled>Buy Pack</Button>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Priority Support</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Export Reports</li>
                    </ul>
                </Card>

                {/* Option 4: Power Pack */}
                <Card className="p-6 border">
                    <h3 className="text-lg font-bold mb-2">Power Pack</h3>
                    <div className="text-3xl font-bold mb-1">
                        ₹4,999
                    </div>
                    <p className="text-sm text-green-600 font-semibold mb-4">
                        ₹50 / check (Save 50%)
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        100 Credits. For high volume.
                    </p>
                    <Button variant="outline" className="w-full mb-6 border-input hover:bg-accent h-11" disabled>Buy Pack</Button>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dedicated Manager</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4" /> API Access</li>
                    </ul>
                </Card>

            </div>

            <div className="mt-16 text-center bg-muted/30 p-8 rounded-lg max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">Why credits?</h3>
                <p className="text-muted-foreground mb-6">
                    Credits give you the flexibility to check invoices whenever you need without a monthly expiry.
                    Unused credits roll over forever.
                </p>
                <Link href="/contact">
                    <Button variant="link" className="text-primary">Have questions? Contact Sales</Button>
                </Link>
            </div>
        </div>
    );
}
