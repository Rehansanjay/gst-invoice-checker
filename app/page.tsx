import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, DollarSign } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">InvoiceCheck.in</h1>
          <Link href="/check">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            Catch GST Invoice Errors in 60 Seconds
          </h2>
          <p className="text-xl text-muted-foreground">
            Before Amazon/Flipkart Rejects Your Payment
          </p>

          <Card className="p-8 bg-red-50 border-red-200">
            <h3 className="text-2xl font-bold mb-4">The Problem:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">₹45,000 payment held by Amazon</p>
                  <p className="text-sm text-muted-foreground">&quot;GST invoice error&quot;</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">You don&apos;t know what&apos;s wrong</p>
                  <p className="text-sm text-muted-foreground">Portal error messages unclear</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">CA charges ₹500</p>
                  <p className="text-sm text-muted-foreground">Takes 2-3 days</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Payment delayed</p>
                  <p className="text-sm text-muted-foreground">Business impact</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-green-50 border-green-200">
            <h3 className="text-2xl font-bold mb-4">The Solution:</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">60 Seconds</p>
                <p className="text-sm text-muted-foreground">Quick validation</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">₹99 Only</p>
                <p className="text-sm text-muted-foreground">vs ₹500 CA fee</p>
              </div>
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">11 Checks</p>
                <p className="text-sm text-muted-foreground">Comprehensive</p>
              </div>
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Instant Fix</p>
                <p className="text-sm text-muted-foreground">Know exactly what to do</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">How It Works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">1</div>
                <h4 className="font-semibold mb-2">Enter Invoice Details</h4>
                <p className="text-sm text-muted-foreground">
                  Fill simple form with your invoice data (30 seconds)
                </p>
              </Card>
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">2</div>
                <h4 className="font-semibold mb-2">Get Instant Report</h4>
                <p className="text-sm text-muted-foreground">
                  11-point validation with exact errors found
                </p>
              </Card>
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">3</div>
                <h4 className="font-semibold mb-2">Fix &amp; Submit</h4>
                <p className="text-sm text-muted-foreground">
                  Follow fix instructions, avoid payment holds
                </p>
              </Card>
            </div>
          </div>

          <Link href="/check">
            <Button size="lg" className="text-lg px-8 py-6">
              Check My Invoice Now - ₹99
            </Button>
          </Link>

          <p className="text-sm text-muted-foreground">
            200+ sellers trust us • No subscription required
          </p>
        </div>
      </main>
    </div>
  );
}
