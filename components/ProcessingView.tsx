import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

/**
 * Which flow is running. The free validation flow has no payment step, so it
 * must not claim one — this component is rendered for both.
 */
export type ProcessingMode = 'validate' | 'payment';

const STEPS: Record<ProcessingMode, string[]> = {
    validate: ['Invoice received', 'GSTIN checked', 'Tax calculations verified'],
    payment: ['Payment confirmed', 'Generating full report', 'Preparing your fixes'],
};

/**
 * Progress here is presentational. Validation itself completes in single-digit
 * milliseconds; the wait the user actually experiences is the network round
 * trip, whose duration we cannot know in advance. So the bar eases toward 90%
 * and holds — the parent unmounts this view the moment the request resolves.
 * It never gates the result, and it never claims a precise percentage it
 * cannot know.
 */
export default function ProcessingView({ mode = 'validate' }: { mode?: ProcessingMode }) {
    const [progress, setProgress] = useState(8);
    const steps = STEPS[mode];

    useEffect(() => {
        const timer = setInterval(() => {
            // Decelerating approach to 90% — never completes on its own.
            setProgress((p) => (p >= 90 ? 90 : p + Math.max(0.6, (90 - p) * 0.08)));
        }, 120);
        return () => clearInterval(timer);
    }, []);

    // Reveal step labels as the bar advances, purely as feedback that work is
    // in flight — not as a claim that each named stage has finished.
    const activeStep = progress > 65 ? 2 : progress > 35 ? 1 : 0;

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-8">
                {mode === 'payment' ? 'Preparing your report' : 'Validating your invoice'}
            </h2>

            <Progress value={progress} className="h-3 w-full mb-8" />

            <div className="space-y-4 w-full text-left pl-8">
                {steps.map((s, i) => (
                    <div
                        key={s}
                        className={`flex items-center gap-3 transition-all duration-500 ${
                            i <= activeStep ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-4'
                        }`}
                    >
                        {i < activeStep ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : i === activeStep ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                        )}
                        <span className={i === activeStep ? 'font-medium text-primary' : ''}>{s}</span>
                    </div>
                ))}
            </div>

            {mode === 'payment' && (
                <div className="mt-12 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <p>Please don&apos;t close this window while we confirm your payment.</p>
                </div>
            )}
        </div>
    );
}
