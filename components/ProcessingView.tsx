import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProcessingView() {
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState(0);

    const steps = [
        "Payment confirmed",
        "Data received",
        "GSTIN validated",
        "Checking calculations...",
        "Finalizing report..."
    ];

    useEffect(() => {
        // Simulate 10-15 seconds process
        const duration = 12000;
        const interval = 100;
        const stepsCount = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newProgress = Math.min((currentStep / stepsCount) * 100, 100);
            setProgress(newProgress);

            // Update text steps based on progress
            if (newProgress > 10) setStep(1);
            if (newProgress > 30) setStep(2);
            if (newProgress > 60) setStep(3);
            if (newProgress > 90) setStep(4);

            if (currentStep >= stepsCount) {
                clearInterval(timer);
            }
        }, interval);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-8 animate-pulse">🔍 Validating Your Invoice</h2>

            <Progress value={progress} className="h-4 w-full mb-4" />
            <p className="text-right text-sm text-muted-foreground w-full mb-8">{Math.round(progress)}%</p>

            <div className="space-y-4 w-full text-left pl-8">
                {steps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= step ? 'opacity-100 translate-x-0' : 'opacity-30 -translate-x-4'}`}>
                        {i < step ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : i === step ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted" />
                        )}
                        <span className={i === step ? 'font-bold text-primary' : ''}>{s}</span>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p>This takes 10-15 seconds...</p>
                <p>Please don't close this window.</p>
            </div>
        </div>
    );
}
