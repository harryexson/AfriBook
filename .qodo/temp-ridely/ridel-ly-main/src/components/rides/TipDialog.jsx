import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function TipDialog({ ride, isOpen, onClose, onTipSubmit }) {
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const handleTipSelect = (percentage) => {
    const calculatedTip = (ride.fare.total_fare * percentage) / 100;
    setTipAmount(calculatedTip);
    setCustomTip(calculatedTip.toFixed(2));
  };

  const handleCustomTipChange = (e) => {
    const value = e.target.value;
    setCustomTip(value);
    setTipAmount(parseFloat(value) || 0);
  };
  
  const handleSubmit = () => {
    if (tipAmount <= 0) {
        toast.error("Please enter a valid tip amount.");
        return;
    }
    onTipSubmit(tipAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Tip for Your Driver</DialogTitle>
          <DialogDescription>
            Show your appreciation for a great ride. 100% of the tip goes to the driver.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="font-semibold">Ride Total: ${ride?.fare?.total_fare?.toFixed(2)}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => handleTipSelect(15)}>15%</Button>
            <Button variant="outline" onClick={() => handleTipSelect(20)}>20%</Button>
            <Button variant="outline" onClick={() => handleTipSelect(25)}>25%</Button>
          </div>
          <div>
            <Input 
                type="number"
                placeholder="Custom tip amount"
                value={customTip}
                onChange={handleCustomTipChange}
            />
          </div>
          <p className="text-center text-2xl font-bold">
            Total Tip: ${tipAmount.toFixed(2)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Tip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}