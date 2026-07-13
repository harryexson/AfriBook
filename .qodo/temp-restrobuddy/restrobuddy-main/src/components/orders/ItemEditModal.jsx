import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function ItemEditModal({ isOpen, item, onClose, onSave }) {
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [instructions, setInstructions] = useState(item?.special_instructions || "");

  const handleSave = () => {
    onSave({
      ...item,
      quantity: parseInt(quantity),
      special_instructions: instructions,
    });
  };

  const handleDelete = () => {
    if (confirm("Remove this item from your order?")) {
      onSave(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-slate-900 mb-2">{item?.name}</p>
            <p className="text-sm text-slate-600">${item?.price.toFixed(2)} each</p>
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="instructions">Special Instructions</Label>
            <textarea
              id="instructions"
              placeholder="e.g., No onions, extra sauce..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              rows="3"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm text-slate-600">Subtotal</p>
            <p className="text-2xl font-bold text-slate-900">
              ${(item?.price * quantity).toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}