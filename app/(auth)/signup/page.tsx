'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ArrowLeft, Check, X, ShieldCheck, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Strength State
    const [validations, setValidations] = useState({
        minLength: false,
        hasUpperCase: false,
        hasSpecialChar: false
    });

    const router = useRouter();
    const { user, loading: authLoading, signUp } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    // Update validations on password change
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPassword(val);
        setValidations({
            minLength: val.length >= 8,
            hasUpperCase: /[A-Z]/.test(val),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(val)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!validations.minLength || !validations.hasUpperCase || !validations.hasSpecialChar) {
            setError('Please ensure your password meets all requirements.');
            return;
        }

        setLoading(true);

        const { error: authError } = await signUp(email, password, fullName);

        if (authError) {
            setError(authError.message || 'Failed to create account');
            setLoading(false);
        } else if (!user) {
            // signUp succeeded but no session yet → email confirmation required
            setSuccessMessage('✅ Account created! Please check your email and click the confirmation link to activate your account.');
            setLoading(false);
        } else {
            // Email confirmation OFF → redirect directly
            router.replace('/dashboard');
        }
    };

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
                        Start Validating
                        <br />
                        <span style={{ color: 'var(--warm-accent)' }}>
                            Invoices Today
                        </span>
                    </h1>

                    <p className="text-[1.125rem] mb-12" style={{ color: '#B8A895' }}>
                        Join thousands of businesses ensuring 100% GST compliance with AI-powered checks.
                    </p>

                    {/* Features */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                <Zap className="w-5 h-5" style={{ color: 'var(--warm-accent)' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-cream)' }}>Get Started in Seconds</p>
                                <p className="text-[13.5px]" style={{ color: '#B8A895' }}>No credit card required for trial</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(250, 248, 246, 0.1)' }}>
                                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--warm-success)' }} />
                            </div>
                            <div>
                                <p className="font-semibold text-[15px]" style={{ color: 'var(--warm-cream)' }}>Bank-Grade Security</p>
                                <p className="text-[13.5px]" style={{ color: '#B8A895' }}>Your data is encrypted & safe</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
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
                            <h2 className="text-[2rem] font-heading font-bold mb-2" style={{ color: 'var(--warm-charcoal)' }}>Create Account</h2>
                            <p className="text-[15px]" style={{ color: 'var(--warm-text-secondary)' }}>Join us and start validating invoices</p>
                        </div>

                        {successMessage && (
                            <div className="mb-6 px-4 py-4 rounded-lg text-center animate-in fade-in slide-in-from-top-2" style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', color: 'var(--warm-success)' }}>
                                <Check className="w-8 h-8 mx-auto mb-2" />
                                <p className="font-medium text-[15px]">{successMessage}</p>
                                <p className="text-[14px] mt-2 text-[#0D652D]">
                                    Already confirmed?{' '}
                                    <Link href="/login" className="font-semibold hover:opacity-80" style={{ color: '#0D652D', textDecoration: 'underline' }}>
                                        Sign In here
                                    </Link>
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ background: '#FDF5F4', border: '1px solid #FADEDC' }}>
                                <X className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warm-danger)' }} />
                                <p className="text-sm" style={{ color: 'var(--warm-danger)' }}>{error}</p>
                            </div>
                        )}

                        {!successMessage && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Your Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-12 bg-white transition-colors"
                                        style={{ borderColor: 'var(--warm-border)' }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-12 bg-white transition-colors"
                                        style={{ borderColor: 'var(--warm-border)' }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={loading}
                                        className="h-12 bg-white transition-colors"
                                        style={{ borderColor: 'var(--warm-border)' }}
                                    />

                                    {/* Real-time Password Strength Indicators */}
                                    <div className="grid grid-cols-1 gap-2 mt-3 p-3 rounded-lg border" style={{ background: 'var(--warm-bg-alt)', borderColor: 'var(--warm-border)' }}>
                                        <div className="flex items-center gap-2 text-[13px] transition-colors duration-300" style={{ color: validations.minLength ? 'var(--warm-success)' : 'var(--warm-text-secondary)', fontWeight: validations.minLength ? 500 : 400 }}>
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center border" style={{ background: validations.minLength ? '#E6F4EA' : 'transparent', borderColor: validations.minLength ? 'var(--warm-success)' : 'var(--warm-border)' }}>
                                                {validations.minLength && <Check className="w-2.5 h-2.5" style={{ color: 'var(--warm-success)' }} />}
                                            </div>
                                            Min 8 characters
                                        </div>

                                        <div className="flex items-center gap-2 text-[13px] transition-colors duration-300" style={{ color: validations.hasUpperCase ? 'var(--warm-success)' : 'var(--warm-text-secondary)', fontWeight: validations.hasUpperCase ? 500 : 400 }}>
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center border" style={{ background: validations.hasUpperCase ? '#E6F4EA' : 'transparent', borderColor: validations.hasUpperCase ? 'var(--warm-success)' : 'var(--warm-border)' }}>
                                                {validations.hasUpperCase && <Check className="w-2.5 h-2.5" style={{ color: 'var(--warm-success)' }} />}
                                            </div>
                                            At least 1 Uppercase letter (A-Z)
                                        </div>

                                        <div className="flex items-center gap-2 text-[13px] transition-colors duration-300" style={{ color: validations.hasSpecialChar ? 'var(--warm-success)' : 'var(--warm-text-secondary)', fontWeight: validations.hasSpecialChar ? 500 : 400 }}>
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center border" style={{ background: validations.hasSpecialChar ? '#E6F4EA' : 'transparent', borderColor: validations.hasSpecialChar ? 'var(--warm-success)' : 'var(--warm-border)' }}>
                                                {validations.hasSpecialChar && <Check className="w-2.5 h-2.5" style={{ color: 'var(--warm-success)' }} />}
                                            </div>
                                            At least 1 Special character (@$!%*?&)
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" style={{ color: 'var(--warm-charcoal)' }} className="font-medium">Confirm Password</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-12 bg-white transition-colors"
                                        style={{ borderColor: 'var(--warm-border)' }}
                                    />
                                </div>

                                <Button
                                    className="w-full btn-warm-primary magnetic-btn h-12 text-[15px]"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Sign In Link */}
                        <div className="mt-8 text-center text-[15px]">
                            <p style={{ color: 'var(--warm-text-secondary)' }}>
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold hover:opacity-80" style={{ color: 'var(--warm-accent)' }}>
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </Card>

                    {/* Trust Bar */}
                    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
                        <span>✅ 500+ invoices checked</span>
                        <span>✅ Trusted by CAs</span>
                        <span>✅ 100% secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
