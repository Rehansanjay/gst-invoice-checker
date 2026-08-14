import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata = {
    title: 'GST Invoice Validation FAQ | InvoiceCheck.in',
    description: 'Common questions about GST invoice errors, validation rules, GSTIN format, HSN codes and more.',
    alternates: { canonical: '/faq' },
};

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Is my invoice data safe?</AccordionTrigger>
                        <AccordionContent>
                            A free check is processed in memory and is never written to our database — we keep nothing from it. A paid check is different: we store the invoice details so you can re-open, download and email that report later, and so it appears in your dashboard history if you have an account. Data is encrypted in transit and at rest, we never sell it or use it to train AI models, and you can ask us to delete a stored check at any time by emailing privacy@invoicecheck.in. See our Privacy Policy for the full retention position.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger>Why was my invoice rejected by Amazon?</AccordionTrigger>
                        <AccordionContent>
                            Amazon and Flipkart automated systems check for 11+ critical parameters including correct tax codes (IGST vs CGST/SGST), valid HSN codes, and calculation accuracy. Our tool checks all these parameters instantly.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                        <AccordionContent>
                            Yes. If our validation report is incorrect or you are unhappy with the service, we offer a 100% money-back guarantee within 48 hours of purchase. No questions asked.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                        <AccordionTrigger>What happens if I find an error?</AccordionTrigger>
                        <AccordionContent>
                            Our report provides specific "How to Fix" instructions for every error found. You can correct the invoice in your accounting software (Tally, Zoho, etc.) and re-verify it.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                        <AccordionTrigger>Is this tool tailored for Indian GST?</AccordionTrigger>
                        <AccordionContent>
                            Yes, this tool is built specifically for Indian GST laws (CGST, SGST, IGST Acts) and handles state codes, tax slabs, and HSN codes as per CBIC guidelines.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
