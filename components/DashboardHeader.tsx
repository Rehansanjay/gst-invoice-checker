'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, Home, LayoutDashboard, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { LogoutDialog } from '@/components/LogoutDialog';

const NAV_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/history', label: 'History', icon: Clock },
    { href: '/pricing', label: 'Pricing', icon: Tag },
];

export default function DashboardHeader() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        setShowLogoutDialog(false);
        await signOut();
        router.replace('/');
    };

    return (
        <>
            <LogoutDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={confirmLogout}
            />

            <header className="bg-white border-b sticky top-0 z-40 w-full">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                        <img src="/invoicecheck-logo.svg" alt="InvoiceCheck Logo" className="w-6 h-6" />
                        <span className="text-lg font-bold tracking-tight">InvoiceCheck.in</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`hover:text-primary transition-colors ${pathname === link.href ? 'text-primary font-semibold' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Right */}
                    <div className="hidden md:flex items-center gap-3">
                        <span className="text-sm text-muted-foreground truncate max-w-[160px]">{user?.email}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLogoutDialog(true)}
                            disabled={isLoggingOut}
                            className="text-muted-foreground hover:text-red-600"
                        >
                            <LogOut className="w-4 h-4 mr-1.5" />
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </Button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Slide-down Menu */}
                {menuOpen && (
                    <div className="md:hidden border-t bg-white shadow-lg animate-in slide-in-from-top-2 duration-200">
                        {/* User email */}
                        {user?.email && (
                            <div className="px-4 py-3 bg-slate-50 border-b">
                                <p className="text-xs text-muted-foreground">Signed in as</p>
                                <p className="text-sm font-medium text-slate-800 truncate">{user.email}</p>
                            </div>
                        )}

                        {/* Nav Links */}
                        <nav className="flex flex-col py-2">
                            {NAV_LINKS.map((link) => {
                                const Icon = link.icon;
                                const active = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                            active
                                                ? 'text-primary bg-primary/5'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        {link.label}
                                        {active && <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="border-t px-4 py-3">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 h-10"
                                onClick={() => { setMenuOpen(false); setShowLogoutDialog(true); }}
                                disabled={isLoggingOut}
                            >
                                <LogOut className="w-4 h-4" />
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </Button>
                        </div>
                    </div>
                )}
            </header>
        </>
    );
}
