import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  DollarSign,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PaymentDialog({ amount, orderId, onComplete, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cashReceived, setCashReceived] = useState("");
  const [tipAmount, setTipAmount] = useState(0);

  const tipOptions = [0, 0.15, 0.18, 0.20, 0.25];
  const totalWithTip = amount + tipAmount;
  const cashChange = parseFloat(cashReceived) - totalWithTip;

  const processPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === "card") {
        // Process Square payment
        const response = await base44.functions.invoke("processSquarePayment", {
          amount: Math.round(totalWithTip * 100), // Convert to cents
          orderId: orderId,
          tipAmount: Math.round(tipAmount * 100)
        });

        if (response.data?.success) {
          onComplete({
            method: "card",
            transactionId: response.data.transactionId,
            amount: totalWithTip
          });
        } else {
          setError(response.data?.error || "Payment failed");
        }
      } else if (paymentMethod === "cash") {
        if (parseFloat(cashReceived) < totalWithTip) {
          setError("Insufficient cash received");
          setIsProcessing(false);
          return;
        }
        
        onComplete({
          method: "cash",
          transactionId: `CASH-${Date.now()}`,
          amount: totalWithTip,
          cashReceived: parseFloat(cashReceived),
          change: cashChange
        });
      } else {
        // Other payment methods
        onComplete({
          method: paymentMethod,
          transactionId: `${paymentMethod.toUpperCase()}-${Date.now()}`,
          amount: totalWithTip
        });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment processing failed");
    }

    setIsProcessing(false);
  };

  const quickCashAmounts = [20, 50, 100];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="bg-emerald-600 text-white flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-emerald-500">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="text-center bg-slate-50 rounded-xl p-6">
            <p className="text-slate-600 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-slate-900">${amount.toFixed(2)}</p>
            {tipAmount > 0 && (
              <p className="text-emerald-600 mt-2">+ ${tipAmount.toFixed(2)} tip = ${totalWithTip.toFixed(2)}</p>
            )}
          </div>

          {/* Tip Selection */}
          <div>
            <Label className="mb-2 block">Add Tip</Label>
            <div className="flex gap-2">
              {tipOptions.map(tip => (
                <Button
                  key={tip}
                  variant={tipAmount === amount * tip ? "default" : "outline"}
                  onClick={() => setTipAmount(amount * tip)}
                  className="flex-1"
                >
                  {tip === 0 ? "None" : `${tip * 100}%`}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="flex flex-col items-center gap-2 h-20"
              >
                <CreditCard className="w-6 h-6" />
                Card
              </Button>
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="flex flex-col items-center gap-2 h-20"
              >
                <Banknote className="w-6 h-6" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === "mobile" ? "default" : "outline"}
                onClick={() => setPaymentMethod("mobile")}
                className="flex flex-col items-center gap-2 h-20"
              >
                <Smartphone className="w-6 h-6" />
                Mobile Pay
              </Button>
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === "cash" && (
            <div className="space-y-3">
              <Label>Cash Received</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="pl-10 text-2xl h-14"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                {quickCashAmounts.map(amt => (
                  <Button
                    key={amt}
                    variant="outline"
                    onClick={() => setCashReceived(amt.toString())}
                    className="flex-1"
                  >
                    ${amt}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setCashReceived(Math.ceil(totalWithTip).toString())}
                  className="flex-1"
                >
                  Exact
                </Button>
              </div>
              {parseFloat(cashReceived) >= totalWithTip && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-bold text-xl">
                    Change: ${cashChange.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card Processing Info */}
          {paymentMethod === "card" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment will be processed via Square. Insert, tap, or swipe card on terminal.
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Process Button */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            onClick={processPayment}
            disabled={isProcessing || (paymentMethod === "cash" && parseFloat(cashReceived) < totalWithTip)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Complete Payment - ${totalWithTip.toFixed(2)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}