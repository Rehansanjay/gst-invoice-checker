'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, DollarSign, ArrowRight, Zap, ShieldCheck, Star } from 'lucide-react';
import GetStartedModal from '@/components/GetStartedModal';
import LoggedInHome from '@/components/LoggedInHome';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <LoggedInHome />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GetStartedModal open={showModal} onClose={() => setShowModal(false)} />

      {/* HERO SECTION - Premium Dark Theme */}
      <section className="relative py-24 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Decorative Background Elements */}
        {/* ... (lines 19-45 unchanged) ... */}
        {/* Reuse existing layout, just modify the button logic */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">
              ⚡ Trusted by Users
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Catch GST Invoice Errors
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Before Submission
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Validate your invoices in 15 seconds. Avoid payment holds. Save thousands in CA fees.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => user ? router.push('/dashboard') : setShowModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg px-8 py-6 h-auto shadow-2xl hover:scale-105 transition-all font-bold border-0"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 h-auto backdrop-blur-sm"
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-300">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current opacity-50" />
                </div>
                <span className="font-semibold text-white">4.2/5</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>11 Validation Checks</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>15 Second Results</span>
              </div>
            </div>

            {/* Loved by Indian Sellers Badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-md rounded-full border border-purple-500/30">
              <span className="text-sm font-medium text-purple-200">❤️ Loved by Indian Sellers</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION - Redesigned */}
      <section className="py-20 bg-gradient-to-b from-red-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold mb-4">
              <AlertCircle className="w-5 h-5" />
              The Problem
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              One Small Error = Big Financial Loss
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Marketplaces reject invoices for tiny GST errors, holding your payments for weeks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 bg-white border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl font-bold text-red-600 mb-3">₹45,000</div>
              <p className="font-semibold text-slate-900 text-lg">Payment Held</p>
              <p className="text-sm text-slate-600">by marketplaces</p>
            </Card>

            <Card className="p-6 bg-white border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl font-bold text-red-600 mb-3">2-7 Days</div>
              <p className="font-semibold text-slate-900 text-lg">Delayed Payment</p>
              <p className="text-sm text-slate-600">cashflow impact</p>
            </Card>

            <Card className="p-6 bg-white border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl font-bold text-red-600 mb-3">₹500+</div>
              <p className="font-semibold text-slate-900 text-lg">CA Fee</p>
              <p className="text-sm text-slate-600">per invoice check</p>
            </Card>

            <Card className="p-6 bg-white border-red-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl font-bold text-red-600 mb-3">???</div>
              <p className="font-semibold text-slate-900 text-lg">Don't Know</p>
              <p className="text-sm text-slate-600">what's wrong</p>
            </Card>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION - Redesigned */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold mb-4">
              <CheckCircle2 className="w-5 h-5" />
              The Solution
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              InvoiceCheck.in - Your Safety Net
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Catch errors before submission. Get instant, actionable fixes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 bg-white border-green-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">15 Seconds</div>
              <p className="text-slate-600">Lightning-fast results</p>
            </Card>

            <Card className="p-6 bg-white border-green-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">₹99 Only</div>
              <p className="text-slate-600">80% cheaper than CA</p>
            </Card>

            <Card className="p-6 bg-white border-green-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">11 Checks</div>
              <p className="text-slate-600">100% accuracy guaranteed</p>
            </Card>

            <Card className="p-6 bg-white border-green-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">Instant Fix</div>
              <p className="text-slate-600">Step-by-step guidance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Simple 3-step process to validate your invoice</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting Lines */}
            <div className="hidden md:block absolute top-20 left-1/3 w-1/3 border-t-2 border-dashed border-purple-300"></div>
            <div className="hidden md:block absolute top-20 right-0 w-1/3 border-t-2 border-dashed border-purple-300"></div>

            <div className="relative bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Enter Invoice Details</h3>
              <p className="text-slate-600">Fill a simple form with your invoice data (takes 30 seconds)</p>
            </div>

            <div className="relative bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Get Instant Report</h3>
              <p className="text-slate-600">We run 11 validation checks and generate detailed report</p>
            </div>

            <div className="relative bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Fix & Submit</h3>
              <p className="text-slate-600">Follow our guidance to fix errors and submit confidently</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF - Innovative Anonymous Format */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4 text-yellow-500 text-3xl">
                <Star className="w-8 h-8 fill-current" />
                <Star className="w-8 h-8 fill-current" />
                <Star className="w-8 h-8 fill-current" />
                <Star className="w-8 h-8 fill-current" />
                <Star className="w-8 h-8 fill-current opacity-50" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Real Results from Real Sellers
              </h2>
              <p className="text-slate-600">What our users are saying</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-purple-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
                <div className="flex text-yellow-500 mb-3">★ ★ ★ ★ ★</div>
                <p className="text-slate-700 mb-4 italic relative z-10">
                  "Found my ₹1,800 error before sending to marketplace. Saved my ₹67,000 payment hold!"
                </p>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Mumbai Seller</div>
                    <div className="text-sm text-slate-600">E-commerce Business</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-30"></div>
                <div className="flex text-yellow-500 mb-3">★ ★ ★ ★ ★</div>
                <p className="text-slate-700 mb-4 italic relative z-10">
                  "Cheaper than CA, faster than email. Now I check every invoice before submission!"
                </p>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    D
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Delhi Seller</div>
                    <div className="text-sm text-slate-600">Online Retailer</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - Premium Dark */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Avoid Payment Holds?
          </h2>
          <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
            Join sellers who validate their invoices before submission
          </p>

          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xl px-12 py-8 h-auto shadow-2xl hover:scale-105 transition-all font-bold border-0"
          >
            Check Your Invoice Now <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <p className="mt-6 text-purple-200 text-sm">
            ✓ No signup required for first check  •  ✓ Results in 15 seconds  •  ✓ 100% secure
          </p>
        </div>
      </section>
    </div>
  );
}
