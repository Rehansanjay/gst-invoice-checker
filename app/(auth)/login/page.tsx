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
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--warm-bg)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--warm-accent)' }} />
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
        <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--warm-bg)' }}>
            {/* Left Side - Branding & Info */}
            <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden" style={{ background: 'var(--warm-charcoal)' }}>
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-[0.12]">
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, #9E542F 0%, transparent 70%)' }}></div>
                    <div className="absolute -bottom-48 -right-24 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, #C4B5A3 0%, transparent 70%)' }}></div>
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, var(--warm-cream) 1px, transparent 1px), linear-gradient(to bottom, var(--warm-cream) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div className="relative z-10 max-w-lg">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 transition-colors" style={{ color: '#B8A895' }}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <h1 className="text-[3rem] leading-[1.1] font-heading font-bold mb-6" style={{ color: 'var(--warm-cream)' }}>
                        Welcome Back to
                        <br />
                        <span style={{ color: 'var(--warm-accent)' }}>
                            InvoiceCheck.in
                        </span>
                    </h1>

                    <p className="text-[1.125rem] mb-12" style={{ color: '#B8A895' }}>
                        Access your dashboard and continue validating invoices with ease.
                    </p>

                    {/* Features */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                <Zap className="w-5 h-5" style={{ color: 'var(--warm-accent)' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-cream)' }}>15 Second Validation</p>
                                <p className="text-[13.5px]" style={{ color: '#B8A895' }}>Lightning-fast invoice checking</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--warm-success)' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-cream)' }}>15 GST Checks</p>
                                <p className="text-[13.5px]" style={{ color: '#B8A895' }}>100% accuracy guaranteed</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                <Star className="w-5 h-5 fill-current" style={{ color: '#D4A056' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-cream)' }}>Grounded in the Act</p>
                                <p className="text-[13.5px]" style={{ color: '#B8A895' }}>Every issue cites its GST section</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-6" style={{ background: 'var(--warm-bg)' }}>
                <div className="w-full max-w-md">
                    {/* Mobile: Back Button */}
                    <Link href="/" className="inline-flex lg:hidden items-center gap-2 mb-6 transition-colors" style={{ color: 'var(--warm-text-secondary)' }}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <Card className="warm-card p-8 border-0">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-[2rem] font-heading font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>Sign In</h2>
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>Welcome back! Please enter your details</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 rounded-lg" style={{ background: '#FDF5F4', border: '1px solid #FADEDC' }}>
                                <p className="text-sm" style={{ color: 'var(--warm-danger)' }}>{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 bg-white transition-colors"
                                    style={{ borderColor: 'var(--warm-border)' }}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Password</Label>
                                    <Link href="/forgot-password" className="text-sm font-medium hover:opacity-80" style={{ color: 'var(--warm-accent)' }}>
                                        Forgot?
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-white transition-colors"
                                    style={{ borderColor: 'var(--warm-border)' }}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-warm-primary magnetic-btn h-12 text-[15px]"
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
                            <div className="flex-1" style={{ borderTop: '1px solid var(--warm-border)' }}></div>
                            <span className="text-[13px] font-medium" style={{ color: 'var(--warm-text-secondary)' }}>OR</span>
                            <div className="flex-1" style={{ borderTop: '1px solid var(--warm-border)' }}></div>
                        </div>

                        {/* Sign Up Link */}
                        <div className="text-center">
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>
                                Don't have an account?{' '}
                                <Link href="/signup" className="font-semibold hover:opacity-80" style={{ color: 'var(--warm-accent)' }}>
                                    Sign up for free
                                </Link>
                            </p>
                        </div>

                        {/* Quick Check Option */}
                        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'var(--warm-bg-alt)' }}>
                            <p className="text-[14px] mb-2" style={{ color: 'var(--warm-charcoal)' }}>
                                Need a one-time check?
                            </p>
                            <Link href="/check">
                                <Button className="w-full btn-warm-secondary bg-white h-11 text-[14px]">
                                    Quick Check (₹99)
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Trust Bar */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-[13px] font-medium" style={{ color: 'var(--warm-text-secondary)' }}>
                        <span>✅ 500+ invoices checked</span>
                        <span>✅ Trusted by CAs</span>
                        <span>✅ 100% secure</span>
                    </div>

                    {/* Mobile: Features */}
                    <div className="lg:hidden mt-8 space-y-3 px-4">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5" style={{ color: 'var(--warm-accent)' }} />
                            <span className="text-[14.5px]" style={{ color: 'var(--warm-charcoal)' }}>15 second validation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--warm-success)' }} />
                            <span className="text-[14.5px]" style={{ color: 'var(--warm-charcoal)' }}>15 GST checks</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Star className="w-5 h-5 fill-current" style={{ color: '#D4A056' }} />
                            <span className="text-[14.5px]" style={{ color: 'var(--warm-charcoal)' }}>Cites the GST section</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
