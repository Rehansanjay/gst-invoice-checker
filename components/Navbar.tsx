'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, Calculator, FileSpreadsheet, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogoutDialog } from '@/components/LogoutDialog';

// `icon` doubles as the highlight flag — highlighted links get the gold
// treatment and their own glyph, so a bulk upload is not badged as a calculator.
const navLinks: { href: string; label: string; icon?: LucideIcon }[] = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/gst-penalty-calculator', label: 'Penalty Calc', icon: Calculator },
    { href: '/bulk', label: 'Bulk Check', icon: FileSpreadsheet },
    { href: '/gst-error-codes', label: 'Error Codes' },
    { href: '/guides', label: 'Guides' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        setUserMenuOpen(false);
        setMobileOpen(false);
        setShowLogoutDialog(true);
    };

    const confirmLogout = async () => {
        setShowLogoutDialog(false);
        await signOut();
        router.replace('/');
    };

    // Track scroll for backdrop effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
    }, [pathname]);

    // Don't show navbar on auth pages or check page (focused flows)
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isCheckPage = pathname === '/check';
    if (isAuthPage || isCheckPage) return null;

    return (
        <>
            <LogoutDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={confirmLogout}
            />
            <header
                className="sticky top-0 z-40 transition-all duration-300"
                style={{
                    background: scrolled
                        ? 'rgba(250, 248, 246, 0.85)'
                        : 'rgba(250, 248, 246, 0.6)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: scrolled ? '1px solid var(--warm-border)' : '1px solid transparent',
                }}
            >
                <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img
                            src="/invoicecheck-logo.svg"
                            alt="InvoiceCheck Logo"
                            className="w-7 h-7"
                        />
                        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--warm-charcoal)' }}>
                            InvoiceCheck.in
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                style={{
                                    color: pathname === link.href
                                        ? 'var(--warm-charcoal)'
                                        : 'var(--warm-text-secondary)',
                                    fontWeight: pathname === link.href ? 600 : 400,
                                    background: pathname === link.href ? 'var(--warm-bg-alt)' : 'transparent',
                                }}
                            >
                                {link.icon && <link.icon className="w-3.5 h-3.5" style={{ color: '#B8860B' }} />}
                                {link.icon
                                    ? <span style={{ color: '#8B6914', fontWeight: 600 }}>{link.label}</span>
                                    : link.label}
                            </Link>
                        ))}

                        <div className="w-px h-5 mx-2" style={{ background: 'var(--warm-border)' }} />

                        {loading ? (
                            <div className="w-24 h-9 rounded-lg animate-pulse" style={{ background: 'var(--warm-border)' }} />
                        ) : user ? (
                            // Authenticated User Menu
                            <>
                                <Link href="/dashboard">
                                    <Button variant="ghost" size="sm" className="gap-2 text-sm" style={{ color: 'var(--warm-charcoal)' }}>
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <div className="relative" ref={menuRef}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="gap-2 text-sm"
                                        style={{
                                            borderColor: 'var(--warm-border)',
                                            color: 'var(--warm-charcoal)',
                                        }}
                                    >
                                        <User className="w-4 h-4" />
                                        Account
                                    </Button>
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 z-50" style={{
                                            background: 'white',
                                            border: '1px solid var(--warm-border)',
                                        }}>
                                            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--warm-border)' }}>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--warm-charcoal)' }}>{user.email}</p>
                                            </div>
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                                                style={{ color: 'var(--warm-charcoal-soft)' }}
                                            >
                                                <LayoutDashboard className="w-4 h-4" />
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                                                style={{ color: 'var(--warm-danger)' }}
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Guest User Buttons
                            <>
                                <Link href="/check">
                                    <button
                                        className="text-sm px-3 py-2 rounded-lg transition-colors font-medium"
                                        style={{ color: 'var(--warm-charcoal-soft)' }}
                                    >
                                        Check Invoice
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button
                                        className="btn-warm-secondary text-sm px-4 py-2"
                                    >
                                        Login
                                    </button>
                                </Link>
                                <Link href="/signup">
                                    <button
                                        className="btn-warm-primary text-sm px-4 py-2"
                                    >
                                        Sign Up
                                    </button>
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-lg transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        style={{ color: 'var(--warm-charcoal)' }}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <div className="md:hidden" style={{ borderTop: '1px solid var(--warm-border)', background: 'var(--warm-bg)' }}>
                        <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm py-2.5 px-3 rounded-lg transition-colors"
                                    style={{
                                        color: pathname === link.href
                                            ? 'var(--warm-charcoal)'
                                            : 'var(--warm-text-secondary)',
                                        fontWeight: pathname === link.href ? 600 : 400,
                                        background: pathname === link.href ? 'var(--warm-bg-alt)' : 'transparent',
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="my-2" style={{ borderTop: '1px solid var(--warm-border)' }} />

                            {loading ? (
                                <div className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--warm-border)' }} />
                            ) : user ? (
                                // Authenticated Mobile Menu
                                <>
                                    <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--warm-bg-alt)' }}>
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--warm-charcoal)' }}>{user.email}</p>
                                    </div>
                                    <Link href="/dashboard">
                                        <Button variant="outline" className="w-full gap-2 justify-start" style={{
                                            borderColor: 'var(--warm-border)',
                                            color: 'var(--warm-charcoal)',
                                        }}>
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="destructive"
                                        onClick={handleLogout}
                                        className="w-full gap-2 justify-start"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                // Guest Mobile Menu
                                <div className="flex flex-col gap-2">
                                    <Link href="/check">
                                        <button className="btn-warm-secondary w-full text-sm py-2.5">
                                            Check Invoice
                                        </button>
                                    </Link>
                                    <Link href="/login">
                                        <button className="btn-warm-secondary w-full text-sm py-2.5">
                                            Login
                                        </button>
                                    </Link>
                                    <Link href="/signup">
                                        <button className="btn-warm-primary w-full text-sm py-2.5">
                                            Sign Up
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </header>
        </>
    );
}
