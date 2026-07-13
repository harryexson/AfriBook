import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, CheckCircle, Trash2 } from "lucide-react";

export default function SplitPaymentDialog({ open, onClose, totalAmount, onComplete }) {
  const [payments, setPayments] = useState([
    { id: 1, method: 'card', amount: 0, status: 'pending' }
  ]);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

  const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const addPaymentMethod = () => {
    setPayments([...payments, { 
      id: Date.now(), 
      method: 'card', 
      amount: 0, 
      status: 'pending' 
    }]);
  };

  const removePayment = (index) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const updatePaymentAmount = (index, amount) => {
    const newPayments = [...payments];
    newPayments[index].amount = parseFloat(amount) || 0;
    setPayments(newPayments);
  };

  const updatePaymentMethod = (index, method) => {
    const newPayments = [...payments];
    newPayments[index].method = method;
    setPayments(newPayments);
  };

  const markPaymentComplete = (index) => {
    const newPayments = [...payments];
    newPayments[index].status = 'completed';
    setPayments(newPayments);
    
    // Move to next pending payment
    const nextPending = payments.findIndex((p, i) => i > index && p.status === 'pending');
    if (nextPending !== -1) {
      setActivePaymentIndex(nextPending);
    }
  };

  const allPaymentsComplete = payments.every(p => p.status === 'completed');
  const totalPaid = payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0);

  const handleComplete = () => {
    if (allPaymentsComplete && Math.abs(totalPaid - totalAmount) < 0.01) {
      onComplete(payments);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white border-emerald-500/50">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">Split Payment</DialogTitle>
          <p className="text-emerald-300 text-lg">
            Total: ${totalAmount.toFixed(2)} | Remaining: ${remainingAmount.toFixed(2)}
          </p>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {payments.map((payment, index) => (
            <div 
              key={payment.id}
              className={`bg-white/10 backdrop-blur-xl border-2 rounded-xl p-4 transition-all ${
                activePaymentIndex === index ? 'border-emerald-500' : 'border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">Payment {index + 1}</span>
                  {payment.status === 'completed' && (
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                {payments.length > 1 && payment.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePayment(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      type="number"
                      step="0.01"
                      value={payment.amount || ''}
                      onChange={(e) => updatePaymentAmount(index, e.target.value)}
                      disabled={payment.status === 'completed'}
                      className="pl-9 h-12 bg-white/10 border-white/20 text-white text-lg"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Method</Label>
                  <select
                    value={payment.method}
                    onChange={(e) => updatePaymentMethod(index, e.target.value)}
                    disabled={payment.status === 'completed'}
                    className="w-full h-12 bg-white/10 border-2 border-white/20 rounded-lg px-4 text-white"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="cash">Cash</option>
                    <option value="mobile">Mobile Wallet</option>
                    <option value="qr">QR Code</option>
                  </select>
                </div>
              </div>

              {payment.status === 'pending' && payment.amount > 0 && (
                <Button
                  onClick={() => markPaymentComplete(index)}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={addPaymentMethod}
            variant="outline"
            className="flex-1 border-2 border-white/20 text-white hover:bg-white/10"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Payment Method
          </Button>

          <Button
            onClick={handleComplete}
            disabled={!allPaymentsComplete || Math.abs(remainingAmount) > 0.01}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Complete Split Payment
          </Button>
        </div>

        {Math.abs(remainingAmount) > 0.01 && (
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-3 text-center">
            <p className="text-amber-200">
              Remaining balance: ${remainingAmount.toFixed(2)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}