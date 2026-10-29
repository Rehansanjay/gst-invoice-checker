// Types for the Razorpay Checkout script loaded in the browser
// (https://checkout.razorpay.com/v1/checkout.js).

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export interface RazorpayFailureResponse {
    error: {
        code?: string;
        description?: string;
        reason?: string;
    };
}

export interface RazorpayCheckoutOptions {
    key?: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color: string };
    handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
    modal?: { ondismiss?: () => void };
    /** Prioritises/reorders checkout method blocks — used to open straight into UPI. */
    config?: {
        display: {
            blocks: Record<string, { name: string; instruments: { method: string }[] }>;
            sequence: string[];
            preferences?: { show_default_blocks?: boolean };
        };
    };
}

export interface RazorpayCheckout {
    open: () => void;
    on: (event: 'payment.failed', callback: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
    }
}
