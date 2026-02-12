import { Card } from '@/components/ui/card';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5" /> Email Support
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            For tech support, refunds, or general questions.
                        </p>
                        <a href="mailto:support@invoicecheck.in" className="text-primary hover:underline font-medium">
                            support@invoicecheck.in
                        </a>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5" /> WhatsApp Support
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Chat with us for urgent queries (9 AM - 6 PM IST).
                        </p>
                        <a href="https://wa.me/919999999999" className="text-primary hover:underline font-medium">
                            +91 99999 99999
                        </a>
                    </Card>
                </div>

                <div className="bg-muted/30 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Office Location</h2>
                    <div className="flex items-start gap-4">
                        <MapPin className="w-6 h-6 text-muted-foreground mt-1" />
                        <div>
                            <p className="font-medium">InvoiceCheck Technologies Pvt Ltd.</p>
                            <p className="text-muted-foreground">
                                12th Floor, Tech Park,<br />
                                HSR Layout, Bangalore - 560102<br />
                                Karnataka, India
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
