// The official `razorpay` npm package does not ship reliable first-party
// TypeScript definitions. This is a minimal, hand-written declaration
// covering only the surface area this project actually calls — expand it
// if you start using more of the SDK.
declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt?: string;
    status: string;
    notes?: Record<string, string>;
    created_at: number;
  }

  interface RazorpayOrderCreateParams {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    payment_capture?: 0 | 1;
  }

  interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method: string;
    email?: string;
    contact?: string;
    created_at: number;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(params: RazorpayOrderCreateParams): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
    payments: {
      fetch(paymentId: string): Promise<RazorpayPayment>;
    };
  }

  export = Razorpay;
}
