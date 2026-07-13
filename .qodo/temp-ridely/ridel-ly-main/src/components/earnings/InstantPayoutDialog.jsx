import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, CreditCard, Clock } from "lucide-react";

export default function InstantPayoutDialog({ open, onClose, earnings, onPayout }) {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const maxAmount = Math.min(earnings?.available_balance || 0, earnings?.instant_payout_balance || 0);
  const fee = earnings?.instant_payout_fee || 0.50;
  const netAmount = parseFloat(amount) - fee;

  const handlePayout = async () => {
    if (!amount || parseFloat(amount) <= fee) return;
    
    setIsProcessing(true);
    try {
      await onPayout(parseFloat(amount));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Instant Payout
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Get paid instantly</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Funds typically arrive within 30 minutes to your debit card.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Payout Amount</Label>
            <div className="mt-1">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxAmount}
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Maximum available: ${maxAmount.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Payout Amount</span>
              <span>${parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Instant Payout Fee</span>
              <span>-${fee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>You'll receive</span>
              <span>${Math.max(0, netAmount).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-sm">Debit Card ****1234</p>
              <p className="text-xs text-gray-500">Typically arrives in 30 minutes</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Default</Badge>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayout}
              disabled={!amount || parseFloat(amount) <= fee || parseFloat(amount) > maxAmount || isProcessing}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? "Processing..." : "Get Paid Instantly"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}