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
    prefill?: { name?: string; email?: string };
    theme?: { color: string };
    handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
    modal?: { ondismiss?: () => void };
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
