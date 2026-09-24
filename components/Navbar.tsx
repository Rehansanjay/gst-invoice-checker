'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogoutDialog } from '@/components/LogoutDialog';
import { TOOL_GROUPS, ALL_TOOLS, type ToolGroup } from '@/lib/tools';

/**
 * One "Tools" menu grouped the same way as the homepage tool grid, both
 * rendered from lib/tools.ts so a page added there is reachable from the
 * header, the mobile sheet and the homepage at once. Vendor GST Watch also
 * gets its own link while it is the early-access test we want seen.
 *
 * About / FAQ / Contact are intentionally absent: they live in the footer,
 * which is where people look for them.
 */
export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(false);
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
        setToolsOpen(false);
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
                        <ToolsMenu
                            groups={TOOL_GROUPS}
                            pathname={pathname}
                            open={toolsOpen}
                            onToggle={() => setToolsOpen((o) => !o)}
                        />
                        <Link
                            href="/vendor-gst-watch"
                            className="text-sm px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                            style={{
                                color: pathname === '/vendor-gst-watch' ? 'var(--warm-charcoal)' : 'var(--warm-text-secondary)',
                                fontWeight: pathname === '/vendor-gst-watch' ? 600 : 400,
                                background: pathname === '/vendor-gst-watch' ? 'var(--warm-bg-alt)' : 'transparent',
                            }}
                        >
                            Vendor GST Watch
                            <span className="rounded-full px-1.5 py-px text-[10px] font-bold uppercase" style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}>
                                New
                            </span>
                        </Link>
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
                                {/* Hidden below lg: the Tools menu already has it, and the bar wraps at tablet width. */}
                                <Link href="/check" className="hidden lg:inline-block">
                                    <button
                                        className="text-sm px-3 py-2 rounded-lg transition-colors font-medium whitespace-nowrap"
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
                                dropdown is worse than a little scrolling — with
                                the same group headings as the desktop menu. */}
                            {TOOL_GROUPS.map((group) => (
                                <div key={group.id}>
                                    <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--warm-text-secondary)' }}>
                                        {group.title}
                                    </p>
                                    {group.tools.map((link) => (
                                        <MobileLink key={link.href} href={link.href} label={link.label} badge={link.badge} active={pathname === link.href} />
                                    ))}
                                </div>
                            ))}
                            <div className="pt-2">
                                <MobileLink href="/pricing" label="Pricing" active={pathname === '/pricing'} />
                            </div>

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

function MobileLink({ href, label, badge, active }: { href: string; label: string; badge?: string; active: boolean }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 text-sm py-2.5 px-3 rounded-lg transition-colors"
            style={{
                color: active ? 'var(--warm-charcoal)' : 'var(--warm-charcoal-soft)',
                fontWeight: active ? 600 : 400,
                background: active ? 'var(--warm-bg-alt)' : 'transparent',
            }}
        >
            {label}
            {badge && (
                <span className="rounded-full px-1.5 py-px text-[10px] font-bold uppercase" style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}>
                    {badge}
                </span>
            )}
        </Link>
    );
}

/**
 * The grouped Tools menu: three columns, one per side of the invoice. Opens on
 * click rather than hover so it behaves the same on touch, and closes on
 * outside click, Escape, or route change.
 */
function ToolsMenu({
    groups,
    pathname,
    open,
    onToggle,
}: {
    groups: ToolGroup[];
    pathname: string;
    open: boolean;
    onToggle: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const containsCurrent = ALL_TOOLS.some((t) => pathname === t.href);

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

    // Not `relative`: the panel positions against the sticky header, so it
    // can centre under the whole bar instead of hanging off the Tools button
    // and running past the right edge of a laptop screen.
    return (
        <div ref={ref}>
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
                Tools
                <ChevronDown
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                />
            </button>

            {open && (
                <div
                    className="absolute left-1/2 top-full -translate-x-1/2 mt-1 grid w-[min(760px,calc(100vw-2rem))] grid-cols-3 gap-2 rounded-2xl p-3 shadow-xl z-50"
                    style={{ background: 'white', border: '1px solid var(--warm-border)' }}
                >
                    {groups.map((group) => (
                        <div key={group.id}>
                            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--warm-accent)' }}>
                                {group.title}
                            </p>
                            {group.tools.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="block rounded-lg px-3 py-2 transition-colors hover:bg-[var(--warm-bg-alt)]"
                                >
                                    <span
                                        className="flex items-center gap-1.5 text-sm"
                                        style={{ color: 'var(--warm-charcoal)', fontWeight: pathname === item.href ? 600 : 500 }}
                                    >
                                        {item.label}
                                        {item.badge && (
                                            <span className="rounded-full px-1.5 py-px text-[10px] font-bold uppercase" style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-xs mt-0.5" style={{ color: 'var(--warm-text-secondary)' }}>
                                        {item.desc}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
