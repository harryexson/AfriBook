import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, Smartphone, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function QRCodePayment({ amount, orderId, customerName, onSuccess, onError }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generatePaymentQR', {
        amount,
        orderId,
        customerName,
      });

      if (response.data?.url) {
        setPaymentUrl(response.data.url);
        // Generate QR code from URL using a QR code library
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(response.data.url)}`;
        setQrCodeUrl(qrUrl);
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      onError?.(error.message);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-600 text-lg">Generating QR code...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border-2 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-700 font-medium">Total Amount</span>
          <span className="text-3xl font-bold text-emerald-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-200 p-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-slate-600" />
            <h3 className="text-xl font-bold text-slate-900">Scan to Pay</h3>
          </div>
        </div>

        {qrCodeUrl && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-64 h-64"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-600 justify-center">
            <Smartphone className="w-5 h-5" />
            <span>Scan with your phone's camera or payment app</span>
          </div>

          <div className="text-center text-sm text-slate-500">
            <p>Supports: Venmo, PayPal, Cash App, Banking Apps</p>
          </div>
        </div>

        {paymentUrl && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Button
              onClick={() => window.open(paymentUrl, '_blank')}
              variant="outline"
              className="w-full border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open Payment Link
            </Button>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Your order will be confirmed once payment is received. 
          This page will automatically update when payment is complete.
        </p>
      </div>
    </div>
  );
}