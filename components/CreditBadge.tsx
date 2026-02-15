'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function CreditBadge() {
    const { user } = useAuth();
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        if (!user) return;

        fetchCredits();

        // Listen for credit updates via custom event or window function
        // This connects with the dashboard refresh logic
        const interval = setInterval(fetchCredits, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [user]);

    async function fetchCredits() {
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('credits_remaining')
            .eq('id', user.id)
            .single();

        if (data) setCredits(data.credits_remaining);
    }

    if (!user || credits === null) return null;

    const isLow = credits < 3;

    return (
        <Link href="/settings">
            <Badge
                variant={isLow ? "destructive" : "secondary"}
                className="flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
            >
                {isLow ? <AlertTriangle className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                <span>{credits} Credits</span>
            </Badge>
        </Link>
    );
}
