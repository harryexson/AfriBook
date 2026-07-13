import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, X } from "lucide-react";

const commonAddOns = [
  { name: "Extra Cheese", price: 1.00 },
  { name: "Extra Sauce", price: 0.50 },
  { name: "Extra Bacon", price: 1.50 },
  { name: "Extra Vegetables", price: 0.75 },
  { name: "Grilled Onions", price: 0.50 },
  { name: "Avocado", price: 1.25 }
];

const commonVariations = [
  { name: "Size", options: ["Small", "Medium", "Large"] },
  { name: "Cooking", options: ["Rare", "Medium Rare", "Medium", "Medium Well", "Well Done"] },
  { name: "Sauce", options: ["Mild", "Medium", "Spicy"] }
];

export default function ItemCustomizer({ item, onCustomize, onClose }) {
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  const addOnsCost = selectedAddOns.reduce((sum, name) => {
    const addOn = commonAddOns.find(a => a.name === name);
    return sum + (addOn?.price || 0);
  }, 0);

  const totalPrice = (item.price || 0) + addOnsCost;

  const handleAddOnToggle = (addOnName) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnName)
        ? prev.filter(a => a !== addOnName)
        : [...prev, addOnName]
    );
  };

  const handleVariationChange = (category, option) => {
    setSelectedVariations(prev => ({
      ...prev,
      [category]: option
    }));
  };

  const handleConfirm = () => {
    onCustomize({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      customizations: {
        special_instructions: specialInstructions,
        add_ons: selectedAddOns,
        variations: selectedVariations,
        add_ons_cost: addOnsCost,
        total_price: totalPrice
      }
    });
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          title="Customize this item"
        >
          <Settings className="w-4 h-4" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Variations */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Choose Variations</h3>
            <div className="space-y-3">
              {commonVariations.map(variation => (
                <div key={variation.name}>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    {variation.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variation.options.map(option => (
                      <Button
                        key={option}
                        size="sm"
                        variant={selectedVariations[variation.name] === option ? "default" : "outline"}
                        onClick={() => handleVariationChange(variation.name, option)}
                        className={selectedVariations[variation.name] === option ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Add-ons</h3>
            <div className="space-y-2">
              {commonAddOns.map(addOn => (
                <div key={addOn.name} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                  <Checkbox
                    checked={selectedAddOns.includes(addOn.name)}
                    onCheckedChange={() => handleAddOnToggle(addOn.name)}
                  />
                  <Label className="flex-1 cursor-pointer">
                    {addOn.name}
                    <span className="text-sm text-slate-500 ml-2">+${addOn.price.toFixed(2)}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="border-t pt-6">
            <Label>Special Instructions</Label>
            <Textarea
              placeholder="e.g., No onions, Extra sauce, Gluten-free if possible..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600">Base Price:</span>
              <span className="font-semibold">${item.price?.toFixed(2)}</span>
            </div>
            {addOnsCost > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Add-ons:</span>
                <span className="font-semibold">+${addOnsCost.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total:</span>
              <span className="text-lg font-bold text-emerald-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}