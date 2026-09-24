import Link from 'next/link';
import { ShieldCheck, FileCheck, Calculator, ArrowRight } from 'lucide-react';
import { TOOL_GROUPS, type ToolGroup } from '@/lib/tools';

/**
 * Every tool on the site, one click away, in three groups.
 *
 * Replaces AudienceSplit, which split the tools into two "doors" and left
 * several pages out. Renders from lib/tools.ts, the same list as the header
 * menu, so a page added there appears here too.
 */

const ICONS: Record<ToolGroup['id'], typeof ShieldCheck> = {
    received: ShieldCheck,
    issuing: FileCheck,
    money: Calculator,
};

export default function ToolDirectory() {
    return (
        <div className="grid gap-5 md:grid-cols-3">
            {TOOL_GROUPS.map((group) => {
                const Icon = ICONS[group.id];
                return (
                    <div
                        key={group.id}
                        className="flex flex-col rounded-2xl p-6"
                        style={{ background: '#fff', border: '1px solid var(--warm-border)', boxShadow: 'var(--warm-card-shadow)' }}
                    >
                        <div
                            className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: 'var(--warm-bg-alt)', color: 'var(--warm-accent)' }}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-heading text-[1.35rem] leading-tight" style={{ color: 'var(--warm-charcoal)' }}>
                            {group.title}
                        </h3>
                        <p className="mt-1.5 mb-4 min-h-[2.75rem] text-[14px] leading-relaxed" style={{ color: 'var(--warm-text-secondary)' }}>
                            {group.blurb}
                        </p>
                        <ul className="-mx-2">
                            {group.tools.map((tool) => (
                                <li key={tool.href}>
                                    <Link
                                        href={tool.href}
                                        className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--warm-bg-alt)]"
                                    >
                                        <span className="min-w-0">
                                            <span className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: 'var(--warm-charcoal)' }}>
                                                {tool.label}
                                                {tool.badge && (
                                                    <span
                                                        className="rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
                                                        style={{ background: 'var(--warm-accent)', color: 'var(--warm-cream)' }}
                                                    >
                                                        {tool.badge}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block text-[13px]" style={{ color: 'var(--warm-text-secondary)' }}>
                                                {tool.desc}
                                            </span>
                                        </span>
                                        <ArrowRight
                                            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                                            style={{ color: 'var(--warm-accent)' }}
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
