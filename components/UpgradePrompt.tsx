'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

export default function UpgradePrompt() {
    const [usageCount, setUsageCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check local storage for quick check usage
        const count = parseInt(localStorage.getItem('quick_check_count') || '0');
        setUsageCount(count);

        // Show after 3 checks
        if (count >= 3 && !localStorage.getItem('upgrade_prompt_dismissed')) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem('upgrade_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-10 fade-in">
            <Card className="p-4 border-2 border-primary shadow-xl bg-white relative">
                <button
                    onClick={dismiss}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Save ₹191 Instantly!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            You've used Quick Check {usageCount} times (₹{usageCount * 99}).
                        </p>
                        <p className="text-sm font-medium text-green-600 mt-1">
                            Get 10 checks for only ₹799 (₹79/check).
                        </p>

                        <div className="mt-3 flex gap-2">
                            <Link href="/pricing" className="w-full">
                                <Button size="sm" className="w-full">View Packs</Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={dismiss}>Later</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
