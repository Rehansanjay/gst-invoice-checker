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
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    // Don't render if user is logged in (will redirect)
    if (user) {
        return null;
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-900">
            {/* Left Side - Branding & Info (Similar to Login but blue theme) */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 right-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-600 rounded-full blur-3xl"></div>
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative z-10 max-w-lg">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <h1 className="text-5xl font-bold text-white mb-6">
                        Start Validating
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Invoices Today
                        </span>
                    </h1>

                    <p className="text-xl text-blue-100 mb-12">
                        Join thousands of businesses ensuring 100% GST compliance with AI-powered checks.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <Zap className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold">Get Started in Seconds</p>
                                <p className="text-sm text-blue-200">No credit card required for trial</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className=" font-semibold">Bank-Grade Security</p>
                                <p className="text-sm text-blue-200">Your data is encrypted & safe</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Signup Form */}
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
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
                            <p className="text-slate-600">Join us and start validating invoices</p>
                        </div>

                        {successMessage && (
                            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                                <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                <p className="font-medium">{successMessage}</p>
                                <p className="text-sm mt-2">
                                    Already confirmed?{' '}
                                    <Link href="/login" className="font-semibold text-green-800 hover:underline">
                                        Sign In here
                                    </Link>
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {!successMessage && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Rajesh Kumar"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        required
                                        disabled={loading}
                                        className="h-11"
                                    />

                                    {/* Real-time Password Strength Indicators */}
                                    <div className="grid grid-cols-1 gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className={cn("flex items-center gap-2 text-xs transition-colors duration-300",
                                            validations.minLength ? "text-green-600 font-medium" : "text-slate-500"
                                        )}>
                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center border",
                                                validations.minLength ? "bg-green-100 border-green-600" : "border-slate-300"
                                            )}>
                                                {validations.minLength && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            Min 8 characters
                                        </div>

                                        <div className={cn("flex items-center gap-2 text-xs transition-colors duration-300",
                                            validations.hasUpperCase ? "text-green-600 font-medium" : "text-slate-500"
                                        )}>
                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center border",
                                                validations.hasUpperCase ? "bg-green-100 border-green-600" : "border-slate-300"
                                            )}>
                                                {validations.hasUpperCase && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            At least 1 Uppercase letter (A-Z)
                                        </div>

                                        <div className={cn("flex items-center gap-2 text-xs transition-colors duration-300",
                                            validations.hasSpecialChar ? "text-green-600 font-medium" : "text-slate-500"
                                        )}>
                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center border",
                                                validations.hasSpecialChar ? "bg-green-100 border-green-600" : "border-slate-300"
                                            )}>
                                                {validations.hasSpecialChar && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            At least 1 Special character (@$!%*?&)
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="h-11"
                                    />
                                </div>

                                <Button
                                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg transition-all hover:scale-[1.01]"
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
                        <div className="mt-8 text-center text-sm">
                            <p className="text-slate-600">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
