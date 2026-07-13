import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SpoilageAdjustment({ item, onAdjust }) {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    const user = await base44.auth.me();
    const newAdjustment = {
      date: new Date().toISOString(),
      quantity: parseFloat(quantity),
      reason: reason || "Spoilage/Loss",
      adjusted_by: user.full_name || user.email
    };

    const spoilageHistory = item.spoilage_adjustments || [];
    spoilageHistory.push(newAdjustment);

    await onAdjust({
      spoilage_adjustments: spoilageHistory,
      current_quantity: Math.max(0, item.current_quantity - parseFloat(quantity))
    });

    setQuantity(0);
    setReason("");
  };

  const recentAdjustments = (item.spoilage_adjustments || []).slice(-5).reverse();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Spoilage & Loss Adjustment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Quantity to Deduct</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              step="0.1"
            />
            <span className="flex items-center text-sm text-slate-600">{item.unit}</span>
          </div>
        </div>

        <div>
          <Label>Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Spoiled, Damaged, Dropped"
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-amber-600 hover:bg-amber-700"
          disabled={!quantity || quantity <= 0}
        >
          <Save className="w-4 h-4 mr-2" />
          Record Adjustment
        </Button>

        {recentAdjustments.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-900 mb-3">Recent Adjustments</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentAdjustments.map((adj, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-amber-700">-{adj.quantity} {item.unit}</span>
                      <p className="text-slate-600">{adj.reason}</p>
                    </div>
                    <span className="text-slate-500">{new Date(adj.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 mt-1">by {adj.adjusted_by}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}