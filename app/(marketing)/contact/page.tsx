import { Card } from '@/components/ui/card';
import { Mail, Clock, FileText, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Have a question, need help, or want to report an issue?
                        We&apos;re here to help via email.
                    </p>
                </div>

                {/* Email Support Card */}
                <Card className="p-8 mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-2xl font-bold mb-3">Email Support</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            For all queries — technical issues, refunds, billing, feedback, or general questions —
                            reach out to us at:
                        </p>
                        <a
                            href="mailto:mailtoinvoicecheck@gmail.com"
                            className="inline-flex items-center gap-2 text-xl font-semibold text-primary hover:underline transition-colors"
                        >
                            <Mail className="w-5 h-5" />
                            mailtoinvoicecheck@gmail.com
                        </a>
                    </div>
                </Card>

                {/* How to Raise a Query */}
                <Card className="p-8 mb-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        How to Raise a Query
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        To help us resolve your issue quickly, please include the following in your email:
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Subject Line</p>
                                <p className="text-sm text-muted-foreground">
                                    Briefly describe your issue (e.g., &ldquo;Refund Request — Order #12345&rdquo; or &ldquo;Invoice Check Error&rdquo;)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Your Registered Email</p>
                                <p className="text-sm text-muted-foreground">
                                    The email you used to sign up or make a purchase
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Description of the Issue</p>
                                <p className="text-sm text-muted-foreground">
                                    Explain what happened, including any error messages or screenshots if possible
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">Transaction ID (if applicable)</p>
                                <p className="text-sm text-muted-foreground">
                                    For payment or refund related queries, include your Razorpay transaction ID
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Response Time */}
                <Card className="p-8 mb-8 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Expected Response Time</h3>
                            <p className="text-muted-foreground">
                                We typically respond within <span className="font-semibold text-foreground">1–2 business days</span>.
                                During peak periods, it may take slightly longer. We appreciate your patience and will
                                get back to you as soon as possible.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* FAQ Shortcut */}
                <Card className="p-8">
                    <div className="flex items-start gap-4">
                        <div className="shrink-0">
                            <HelpCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Before You Email...</h3>
                            <p className="text-muted-foreground mb-3">
                                Many common questions are already answered in our FAQ. Check there first —
                                you might find an instant answer!
                            </p>
                            <a
                                href="/faq"
                                className="inline-flex items-center gap-1 text-primary font-medium hover:underline transition-colors"
                            >
                                Visit our FAQ →
                            </a>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
