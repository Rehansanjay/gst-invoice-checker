'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogoutDialog } from '@/components/LogoutDialog';

/**
 * Grouped rather than flat. Ten top-level links with two competing gold
 * highlights read as clutter and gave no sense of which pages matter — every
 * new page added over time made the bar worse. Three menus keep the tools
 * discoverable while leaving the header quiet.
 *
 * About / FAQ / Contact are intentionally absent: they live in the footer,
 * which is where people look for them, and they were taking header space from
 * the pages that actually do something.
 */
type NavItem = { href: string; label: string; desc?: string };

const TOOLS: NavItem[] = [
    { href: '/check', label: 'Check an invoice', desc: 'One invoice, 15 compliance checks' },
    { href: '/bulk', label: 'Bulk check', desc: 'A whole batch before you file' },
    { href: '/verify-invoice', label: 'Verify an invoice', desc: 'Is an invoice you received genuine?' },
    { href: '/gst-penalty-calculator', label: 'Penalty calculator', desc: 'What a late return costs' },
];

const RESOURCES: NavItem[] = [
    { href: '/guides', label: 'GST guides', desc: 'Place of supply, Rule 46, late fees' },
    { href: '/gst-error-codes', label: 'Error codes', desc: 'Every GSTR-1 upload error, explained' },
];

/** Flattened for the mobile sheet and for active-state matching. */
const ALL_NAV = [...TOOLS, ...RESOURCES, { href: '/pricing', label: 'Pricing' }];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openMenu, setOpenMenu] = useState<'tools' | 'resources' | null>(null);
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
        setOpenMenu(null);
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
                        <NavMenu
                            label="Tools"
                            items={TOOLS}
                            pathname={pathname}
                            open={openMenu === 'tools'}
                            onToggle={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
                        />
                        <NavMenu
                            label="Resources"
                            items={RESOURCES}
                            pathname={pathname}
                            open={openMenu === 'resources'}
                            onToggle={() => setOpenMenu(openMenu === 'resources' ? null : 'resources')}
                        />
                        <Link
                            href="/pricing"
                            className="text-sm px-3 py-2 rounded-lg transition-colors"
                            style={{
                                color: pathname === '/pricing' ? 'var(--warm-charcoal)' : 'var(--warm-text-secondary)',
                                fontWeight: pathname === '/pricing' ? 600 : 400,
                                background: pathname === '/pricing' ? 'var(--warm-bg-alt)' : 'transparent',
                            }}
                        >
                            Pricing
                        </Link>

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
                            {/* Mobile keeps a flat list — a dropdown inside a
                                dropdown is worse than a little scrolling — but
                                headings preserve the same grouping. */}
                            <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--warm-text-secondary)' }}>
                                Tools
                            </p>
                            {ALL_NAV.map((link) => (
                                <div key={link.href}>
                                    {link.href === '/guides' && (
                                        <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--warm-text-secondary)' }}>
                                            Resources
                                        </p>
                                    )}
                                    <Link
                                        href={link.href}
                                        className="block text-sm py-2.5 px-3 rounded-lg transition-colors"
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
                                </div>
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

/**
 * A grouped header menu. Opens on click rather than hover so it behaves the
 * same on touch, and closes on outside click, Escape, or route change.
 */
function NavMenu({
    label,
    items,
    pathname,
    open,
    onToggle,
}: {
    label: string;
    items: NavItem[];
    pathname: string;
    open: boolean;
    onToggle: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const containsCurrent = items.some((i) => pathname === i.href);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggle(); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onToggle]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-haspopup="true"
                className="text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                style={{
                    color: containsCurrent ? 'var(--warm-charcoal)' : 'var(--warm-text-secondary)',
                    fontWeight: containsCurrent ? 600 : 400,
                    background: containsCurrent ? 'var(--warm-bg-alt)' : 'transparent',
                }}
            >
                {label}
                <ChevronDown
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                />
            </button>

            {open && (
                <div
                    className="absolute left-0 mt-2 w-72 rounded-xl shadow-lg py-2 z-50"
                    style={{ background: 'white', border: '1px solid var(--warm-border)' }}
                >
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2.5 transition-colors hover:bg-[var(--warm-bg-alt)]"
                        >
                            <span
                                className="block text-sm"
                                style={{
                                    color: 'var(--warm-charcoal)',
                                    fontWeight: pathname === item.href ? 600 : 500,
                                }}
                            >
                                {item.label}
                            </span>
                            {item.desc && (
                                <span className="block text-xs mt-0.5" style={{ color: 'var(--warm-text-secondary)' }}>
                                    {item.desc}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
