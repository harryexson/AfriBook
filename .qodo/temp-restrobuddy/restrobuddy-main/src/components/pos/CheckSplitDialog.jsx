import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Users, DollarSign, Percent, Check } from "lucide-react";

export default function CheckSplitDialog({ order, onClose, onSplit }) {
  const [splitType, setSplitType] = useState("equal");
  const [numGuests, setNumGuests] = useState(2);
  const [customSplits, setCustomSplits] = useState([]);
  const [itemAssignments, setItemAssignments] = useState({});

  const total = order.subtotal * 1.08;
  const equalSplit = total / numGuests;

  const initializeItemSplit = () => {
    const assignments = {};
    order.items.forEach((item, idx) => {
      assignments[idx] = Array(item.quantity).fill(0);
    });
    setItemAssignments(assignments);
    setCustomSplits(Array(numGuests).fill().map((_, i) => ({ guest: i + 1, items: [], total: 0 })));
  };

  const assignItemToGuest = (itemIndex, unitIndex, guestNum) => {
    setItemAssignments(prev => {
      const newAssignments = { ...prev };
      newAssignments[itemIndex] = [...prev[itemIndex]];
      newAssignments[itemIndex][unitIndex] = guestNum;
      return newAssignments;
    });
  };

  const calculateGuestTotals = () => {
    const guestTotals = Array(numGuests).fill(0);
    
    order.items.forEach((item, idx) => {
      const assignments = itemAssignments[idx] || [];
      assignments.forEach(guestNum => {
        if (guestNum > 0) {
          guestTotals[guestNum - 1] += item.price;
        }
      });
    });

    return guestTotals.map(subtotal => subtotal * 1.08);
  };

  const handleSplit = () => {
    if (splitType === "equal") {
      const splits = Array(numGuests).fill().map((_, i) => ({
        guest: i + 1,
        amount: equalSplit
      }));
      onSplit(splits);
    } else if (splitType === "by_item") {
      const totals = calculateGuestTotals();
      const splits = totals.map((amount, i) => ({
        guest: i + 1,
        amount
      }));
      onSplit(splits);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="bg-purple-600 text-white flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Split Check
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-purple-500">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          <Tabs value={splitType} onValueChange={setSplitType}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="equal" className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Split Equally
              </TabsTrigger>
              <TabsTrigger value="by_item" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                By Item
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Custom Amount
              </TabsTrigger>
            </TabsList>

            <TabsContent value="equal" className="space-y-4">
              <div>
                <Label>Number of Guests</Label>
                <div className="flex items-center gap-3 mt-2">
                  {[2, 3, 4, 5, 6].map(num => (
                    <Button
                      key={num}
                      variant={numGuests === num ? "default" : "outline"}
                      onClick={() => setNumGuests(num)}
                      className="w-12 h-12"
                    >
                      {num}
                    </Button>
                  ))}
                  <Input
                    type="number"
                    min="2"
                    max="20"
                    value={numGuests}
                    onChange={(e) => setNumGuests(parseInt(e.target.value) || 2)}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6">
                <div className="text-center mb-4">
                  <p className="text-slate-600">Total Check</p>
                  <p className="text-3xl font-bold">${total.toFixed(2)}</p>
                </div>
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array(numGuests).fill().map((_, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border-2 border-emerald-500">
                        <p className="text-sm text-slate-600">Guest {i + 1}</p>
                        <p className="text-xl font-bold text-emerald-600">${equalSplit.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="by_item" className="space-y-4">
              <div className="mb-4">
                <Label>Number of Guests</Label>
                <div className="flex items-center gap-3 mt-2">
                  {[2, 3, 4, 5, 6].map(num => (
                    <Button
                      key={num}
                      variant={numGuests === num ? "default" : "outline"}
                      onClick={() => {
                        setNumGuests(num);
                        initializeItemSplit();
                      }}
                      className="w-12 h-12"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto">
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-slate-600">${item.price.toFixed(2)} each</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {Array(item.quantity).fill().map((_, unitIdx) => (
                        <div key={unitIdx} className="flex gap-1">
                          {Array(numGuests).fill().map((_, guestIdx) => (
                            <Button
                              key={guestIdx}
                              size="sm"
                              variant={(itemAssignments[idx]?.[unitIdx] === guestIdx + 1) ? "default" : "outline"}
                              onClick={() => assignItemToGuest(idx, unitIdx, guestIdx + 1)}
                              className="w-8 h-8"
                            >
                              {guestIdx + 1}
                            </Button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {calculateGuestTotals().map((guestTotal, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 border-2 border-emerald-500">
                    <p className="text-sm text-slate-600">Guest {i + 1}</p>
                    <p className="text-xl font-bold text-emerald-600">${guestTotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <p className="text-slate-600">Enter custom amounts for each guest. Total: ${total.toFixed(2)}</p>
              <div className="space-y-3">
                {Array(numGuests).fill().map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Label className="w-20">Guest {i + 1}</Label>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSplit} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Check className="w-4 h-4 mr-2" />
              Apply Split
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}