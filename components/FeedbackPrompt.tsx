'use client';

/**
 * "Did this help?" under a tool's result.
 *
 * Traffic and events say a check ran; they cannot say whether it was any
 * use. The thumbs answer goes to GA as feedback_given, so each tool gets a
 * helpful-rate. The optional comment is what to build next: it is emailed
 * to us via /api/feedback, with an email address only if the visitor gives
 * one for a follow-up question.
 */

import { useState } from 'react';
import { Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { FeedbackTool } from '@/lib/feedback';

type Stage = 'ask' | 'comment' | 'done';

export default function FeedbackPrompt({ tool }: { tool: FeedbackTool }) {
    const [stage, setStage] = useState<Stage>('ask');
    const [useful, setUseful] = useState<boolean | null>(null);
    const [comment, setComment] = useState('');
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const answer = (value: boolean) => {
        setUseful(value);
        track('feedback_given', { tool, useful: value ? 'yes' : 'no' });
        setStage('comment');
    };

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) { setStage('done'); return; }
        setError('');
        setSending(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool,
                    useful,
                    comment: comment.trim(),
                    email: email.trim() || undefined,
                    page: window.location.pathname,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'Could not send that. Please try again.');
                return;
            }
            track('feedback_comment', { tool, useful: useful ? 'yes' : 'no' });
            setStage('done');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const box = 'rounded-xl border p-4 sm:p-5 text-left';
    const boxStyle = { borderColor: 'var(--warm-border, #E8E0D8)', background: '#fff' };

    if (stage === 'done') {
        return (
            <div className={box} style={boxStyle} aria-live="polite">
                <p className="text-[14px] font-medium" style={{ color: 'var(--warm-text, #281E15)' }}>
                    Thank you. This is how we decide what to fix next.
                </p>
            </div>
        );
    }

    if (stage === 'ask') {
        return (
            <div className={`${box} flex flex-col sm:flex-row sm:items-center gap-3`} style={boxStyle}>
                <p className="flex-1 text-[14.5px] font-semibold" style={{ color: 'var(--warm-text, #281E15)' }}>
                    Did this help?
                </p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => answer(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[14px] font-medium"
                        style={{ borderColor: 'var(--warm-border, #E8E0D8)', color: 'var(--warm-text, #281E15)' }}
                    >
                        <ThumbsUp className="w-4 h-4" /> Yes
                    </button>
                    <button
                        type="button"
                        onClick={() => answer(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[14px] font-medium"
                        style={{ borderColor: 'var(--warm-border, #E8E0D8)', color: 'var(--warm-text, #281E15)' }}
                    >
                        <ThumbsDown className="w-4 h-4" /> No
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={send} className={`${box} space-y-3`} style={boxStyle} data-clarity-mask="true">
            <label htmlFor={`feedback-${tool}`} className="block text-[14.5px] font-semibold" style={{ color: 'var(--warm-text, #281E15)' }}>
                {useful
                    ? 'Thanks! What would have made it even more useful?'
                    : 'Sorry about that. What were you hoping to find out?'}
            </label>
            <textarea
                id={`feedback-${tool}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Optional, but it really helps"
                className="w-full px-3 py-2 rounded-lg border text-[14px]"
                style={{ borderColor: 'var(--warm-border, #E8E0D8)', color: 'var(--warm-text, #281E15)' }}
            />
            <label htmlFor={`feedback-${tool}-email`} className="sr-only">Email (optional)</label>
            <input
                id={`feedback-${tool}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email, if we may ask a follow-up (optional)"
                autoComplete="email"
                className="w-full px-3 py-2 rounded-lg border text-[14px]"
                style={{ borderColor: 'var(--warm-border, #E8E0D8)', color: 'var(--warm-text, #281E15)' }}
            />
            {error && <p className="text-[13px]" style={{ color: 'var(--warm-danger, #C44B3F)' }}>{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={sending} className="btn-warm-primary px-4 py-2 text-[14px] inline-flex items-center gap-2">
                    {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {comment.trim() ? 'Send' : 'Skip'}
                </button>
            </div>
        </form>
    );
}
