import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Minus } from "lucide-react";

export default function MultiLocationTracker({ item, onUpdate }) {
  const locations = ["Main Kitchen", "Bar", "Storage Room", "Prep Station"];
  const [quantities, setQuantities] = useState(item.location_quantities || {});

  const handleQuantityChange = async (location, newQuantity) => {
    const updatedQuantities = { ...quantities, [location]: Math.max(0, newQuantity) };
    setQuantities(updatedQuantities);

    const totalQuantity = Object.values(updatedQuantities).reduce((sum, q) => sum + q, 0);
    
    await onUpdate({
      location_quantities: updatedQuantities,
      current_quantity: totalQuantity
    });
  };

  const totalStock = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Multi-Location Stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {locations.map(location => (
          <div key={location} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <Label className="font-medium">{location}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuantityChange(location, (quantities[location] || 0) - 1)}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={quantities[location] || 0}
                onChange={(e) => handleQuantityChange(location, parseFloat(e.target.value) || 0)}
                className="w-20 text-center"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuantityChange(location, (quantities[location] || 0) + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <span className="text-sm text-slate-600 w-12">{item.unit}</span>
            </div>
          </div>
        ))}
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-900">Total Stock:</span>
            <Badge className="bg-emerald-600 text-white text-lg px-4 py-1">
              {totalStock} {item.unit}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}