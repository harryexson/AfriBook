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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, CreditCard } from "lucide-react";

export default function EWADialog({ open, onClose, earnings, onRequest }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const maxAmount = Math.min(earnings?.pending_balance || 0, 50); // Max $50 EWA
  const fee = 2.99; // Fixed EWA fee
  const netAmount = parseFloat(amount) - fee;

  const handleRequest = async () => {
    if (!amount || parseFloat(amount) <= fee || !reason.trim()) return;
    
    setIsProcessing(true);
    try {
      await onRequest(parseFloat(amount), reason);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Earned Wages Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">Access your earnings early</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Get up to ${maxAmount.toFixed(2)} from your pending earnings for emergencies.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="ewa-amount">Amount Needed</Label>
            <div className="mt-1">
              <Input
                id="ewa-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxAmount}
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Available from pending earnings: ${maxAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Request</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Emergency car repair, medical expense..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              Help us understand why you need early access to your earnings.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Requested Amount</span>
              <span>${parseFloat(amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>EWA Service Fee</span>
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
              <p className="text-xs text-gray-500">Typically arrives within 1 hour</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Default</Badge>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This amount will be deducted from your next regular payout.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleRequest}
              disabled={!amount || parseFloat(amount) <= fee || parseFloat(amount) > maxAmount || !reason.trim() || isProcessing}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? "Processing..." : "Request Access"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}