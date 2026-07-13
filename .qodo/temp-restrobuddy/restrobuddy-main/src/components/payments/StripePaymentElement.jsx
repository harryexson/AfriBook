import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Smartphone, CheckCircle } from "lucide-react";

export default function StripePaymentElement({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError 
}) {
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Load Stripe.js
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      const stripeInstance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY');
      setStripe(stripeInstance);

      if (clientSecret) {
        const elementsInstance = stripeInstance.elements({
          clientSecret,
          appearance: {
            theme: 'flat',
            variables: {
              colorPrimary: '#10b981',
              colorBackground: '#ffffff',
              colorText: '#1e293b',
              borderRadius: '12px',
            },
          },
        });
        
        const paymentElement = elementsInstance.create('payment', {
          layout: {
            type: 'tabs',
            defaultCollapsed: false,
          },
        });
        
        paymentElement.mount('#payment-element');
        setElements(elementsInstance);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError?.(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      onError?.(err.message);
    }

    setIsProcessing(false);
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
        <p className="text-slate-600">Your order has been placed.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-700 font-medium">Total Amount</span>
          <span className="text-3xl font-bold text-emerald-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-slate-600" />
          <span className="font-semibold text-slate-900">Payment Method</span>
        </div>
        <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
          <Smartphone className="w-4 h-4" />
          <span>Supports Apple Pay, Google Pay, and all major cards</span>
        </div>
        <div id="payment-element" className="min-h-[200px]"></div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl py-8 rounded-2xl"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-center text-slate-500">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}