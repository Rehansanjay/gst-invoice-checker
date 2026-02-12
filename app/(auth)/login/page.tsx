'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ArrowLeft, ShieldCheck, Zap, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, loading: authLoading, signIn } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    // Don't render if user is logged in (will redirect)
    if (user) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await signIn(email, password);

        if (authError) {
            setError(authError.message || 'Failed to sign in');
            setLoading(false);
        } else {
            router.replace('/dashboard');
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-900">
            {/* Left Side - Branding & Info */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"></div>
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative z-10 max-w-lg">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <h1 className="text-5xl font-bold text-white mb-6">
                        Welcome Back to
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            InvoiceCheck.in
                        </span>
                    </h1>

                    <p className="text-xl text-purple-200 mb-12">
                        Access your dashboard and continue validating invoices with ease.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="font-semibold">15 Second Validation</p>
                                <p className="text-sm text-purple-200">Lightning-fast invoice checking</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className=" font-semibold">11 GST Checks</p>
                                <p className="text-sm text-purple-200">100% accuracy guaranteed</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            </div>
                            <div>
                                <p className="font-semibold">Loved by Sellers</p>
                                <p className="text-sm text-purple-200">4.2/5 rating from users</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile: Back Button */}
                    <Link href="/" className="inline-flex lg:hidden items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <Card className="p-8 shadow-xl border-0">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
                            <p className="text-slate-600">Welcome back! Please enter your details</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                    <Link href="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                        Forgot?
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="my-8 flex items-center gap-4">
                            <div className="flex-1 border-t border-slate-300"></div>
                            <span className="text-sm text-slate-500 font-medium">OR</span>
                            <div className="flex-1 border-t border-slate-300"></div>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center">
                            <p className="text-slate-600">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
                                    Sign up for free
                                </Link>
                            </p>
                        </div>

                        {/* Quick Check Option */}
                        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-center">
                            <p className="text-sm text-slate-700 mb-2">
                                Need a one-time check?
                            </p>
                            <Link href="/check">
                                <Button variant="outline" className="w-full border-slate-300 hover:bg-white">
                                    Quick Check (₹99)
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Mobile: Features */}
                    <div className="lg:hidden mt-8 space-y-3 px-4">
                        <div className="flex items-center gap-3 text-slate-700">
                            <Zap className="w-5 h-5 text-purple-600" />
                            <span className="text-sm">15 second validation</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span className="text-sm">11 GST checks</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            <span className="text-sm">4.2/5 rating</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
