import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy } from "lucide-react";

export default function OrderDuplicator({ order, onDuplicate }) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState(
    order?.items?.map((_, idx) => idx) || []
  );

  const handleToggleItem = (idx) => {
    setSelectedItems(prev =>
      prev.includes(idx)
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === order.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(order.items.map((_, idx) => idx));
    }
  };

  const handleDuplicate = () => {
    const duplicatedItems = selectedItems.map(idx => order.items[idx]);
    onDuplicate(duplicatedItems);
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Copy className="w-4 h-4" />
          Duplicate Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Duplicate Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="font-medium">Select items to reorder</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedItems.length === order.items.length ? "Deselect All" : "Select All"}
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50"
              >
                <Checkbox
                  checked={selectedItems.includes(idx)}
                  onCheckedChange={() => handleToggleItem(idx)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {item.quantity}x {item.name}
                  </p>
                  {item.special_instructions && (
                    <p className="text-xs text-slate-600">
                      Note: {item.special_instructions}
                    </p>
                  )}
                  {item.customizations && (
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      {item.customizations.add_ons?.length > 0 && (
                        <p>Add-ons: {item.customizations.add_ons.join(", ")}</p>
                      )}
                      {Object.keys(item.customizations.variations || {}).length > 0 && (
                        <p>
                          Variations: {Object.values(item.customizations.variations).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-emerald-600">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <Card className="bg-slate-50 border-0">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${selectedItems
                      .reduce((sum, idx) => sum + (order.items[idx].price * order.items[idx].quantity), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={selectedItems.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Reorder Selected Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}