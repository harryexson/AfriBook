import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, X } from "lucide-react";

export default function ItemCustomizationModal({ item, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const toggleModifier = (modifier) => {
    setSelectedModifiers(prev =>
      prev.find(m => m.name === modifier.name)
        ? prev.filter(m => m.name !== modifier.name)
        : [...prev, modifier]
    );
  };

  const calculateTotal = () => {
    const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + (mod.price_adjustment || 0), 0);
    return (item.price + modifierTotal) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(item, {
      modifiers: selectedModifiers,
      special_instructions: specialInstructions,
      quantity
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <span>{item.name}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Image */}
          {item.image_url && (
            <img src={item.image_url} alt={item.name} className="w-full h-64 object-cover rounded-lg" />
          )}

          {/* Item Details */}
          <div>
            <p className="text-slate-600 mb-2">{item.description}</p>
            <div className="flex gap-2 flex-wrap">
              {item.tags?.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Modifiers */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div>
              <Label className="text-lg font-semibold mb-3 block">Customize Your Order</Label>
              <div className="space-y-2">
                {item.modifiers.map((modifier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleModifier(modifier)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedModifiers.find(m => m.name === modifier.name)}
                        onCheckedChange={() => toggleModifier(modifier)}
                      />
                      <span className="font-medium">{modifier.name}</span>
                    </div>
                    {modifier.price_adjustment !== 0 && (
                      <span className="text-sm text-slate-600">
                        {modifier.price_adjustment > 0 ? '+' : ''} ${modifier.price_adjustment.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <Label className="text-lg font-semibold mb-2 block">Special Instructions</Label>
            <Textarea
              placeholder="Any special requests? (e.g., allergies, preferences)"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <Label className="text-lg font-semibold">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold w-12 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
          >
            Add to Cart • ${calculateTotal().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}