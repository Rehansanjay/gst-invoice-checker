'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/gst-penalty-calculator', label: 'Penalty Calc', highlight: true },
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
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setUserMenuOpen(false);
        setMobileOpen(false);
        await signOut();
        router.replace('/');
    };

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
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
                    InvoiceCheck.in
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm transition-colors hover:text-foreground flex items-center gap-1 ${pathname === link.href ? 'text-foreground font-medium' : 'text-muted-foreground'
                                }`}
                        >
                            {link.highlight && <Calculator className="w-3.5 h-3.5 text-amber-500" />}
                            {link.highlight
                                ? <span className="text-amber-600 font-medium">{link.label}</span>
                                : link.label}
                        </Link>
                    ))}

                    {loading ? (
                        <div className="w-24 h-9 bg-muted animate-pulse rounded" />
                    ) : user ? (
                        // Authenticated User Menu
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div className="relative" ref={menuRef}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="gap-2"
                                >
                                    <User className="w-4 h-4" />
                                    Account
                                </Button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-2 border-b">
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                                <Button variant="ghost" size="sm">
                                    Check Invoice
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">
                                    Sign Up
                                </Button>
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Nav */}
            {mobileOpen && (
                <div className="md:hidden border-t bg-background">
                    <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm py-2 transition-colors ${pathname === link.href
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="border-t pt-3 mt-2" />

                        {loading ? (
                            <div className="h-10 bg-muted animate-pulse rounded" />
                        ) : user ? (
                            // Authenticated Mobile Menu
                            <>
                                <div className="px-3 py-2 bg-muted rounded-md">
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                </div>
                                <Link href="/dashboard">
                                    <Button variant="outline" className="w-full gap-2 justify-start">
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
                            <>
                                <Link href="/check">
                                    <Button variant="ghost" className="w-full">
                                        Check Invoice
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="w-full">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
