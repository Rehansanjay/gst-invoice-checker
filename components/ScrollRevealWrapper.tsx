'use client';

import React from 'react';
import { useScrollReveal } from '@/lib/useScrollReveal';

export default function ScrollRevealWrapper({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {
    const ref = useScrollReveal();
    
    return (
        <div ref={ref} className={className} style={style}>
            {children}
        </div>
    );
}
