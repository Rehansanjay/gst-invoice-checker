'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function DashboardHeader() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut();
        router.replace('/');
    };

    return (
        <header className="bg-white border-b sticky top-0 z-10 w-full">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold tracking-tight">
                        InvoiceCheck.in
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <Link href="/dashboard" className="text-primary font-semibold">Dashboard</Link>
                        <Link href="/dashboard/history" className="hover:text-primary">History</Link>
                        <Link href="/pricing" className="hover:text-primary">Pricing</Link>
                        <Link href="/contact" className="hover:text-primary">Support</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium hidden md:inline-block">
                        {user?.email || 'User'}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-muted-foreground hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </Button>
                </div>
            </div>
        </header>
    );
}
