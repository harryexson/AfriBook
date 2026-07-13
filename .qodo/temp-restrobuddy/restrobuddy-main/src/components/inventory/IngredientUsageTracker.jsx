import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { InventoryItem } from "@/entities/InventoryItem";
import { Recipe } from "@/entities/Recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, TrendingDown, Bell, BellOff, Save, RefreshCw, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function IngredientUsageTracker({ restaurantId }) {
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [newReorderPoint, setNewReorderPoint] = useState("");
  const [alertsSent, setAlertsSent] = useState(new Set());

  useEffect(() => {
    load();

    // Subscribe to new orders to deduct ingredient usage
    const unsubscribe = base44.entities.Order.subscribe(async (event) => {
      if (event.type === "create" && event.data?.items) {
        await deductIngredients(event.data.items);
      }
    });
    return () => unsubscribe();
  }, []);

  const load = async () => {
    setLoading(true);
    const [invItems, recipeList] = await Promise.all([
      InventoryItem.list("-created_date"),
      Recipe.list(),
    ]);
    setItems(invItems);
    setRecipes(recipeList);
    setLoading(false);
  };

  // When an order is placed, deduct ingredient quantities based on recipes
  const deductIngredients = async (orderItems) => {
    const invItems = await InventoryItem.list();
    const recipeList = await Recipe.list();

    for (const orderItem of orderItems) {
      const recipe = recipeList.find(r => r.menu_item_id === orderItem.menu_item_id);
      if (!recipe?.ingredients) continue;

      for (const ingredient of recipe.ingredients) {
        const invItem = invItems.find(i => i.id === ingredient.inventory_item_id);
        if (!invItem) continue;

        const used = ingredient.quantity_needed * (orderItem.quantity || 1);
        const newQty = Math.max(0, (invItem.current_quantity || 0) - used);
        const newStatus = newQty === 0 ? "out_of_stock"
          : newQty <= invItem.reorder_point ? "low_stock"
          : "in_stock";

        await InventoryItem.update(invItem.id, {
          current_quantity: newQty,
          status: newStatus
        });

        // Show in-app alert for low stock (email requires backend functions upgrade)
        if (newStatus === "low_stock" || newStatus === "out_of_stock") {
          toast.warning(`Low stock: ${invItem.name} is at ${newQty.toFixed(1)} ${invItem.unit}`, {
            duration: 6000,
          });
        }
      }
    }

    // Refresh list after deduction
    load();
  };

  const handleSaveAdjustment = async () => {
    if (!editingItem || adjustQty === "") return;
    const newQty = parseFloat(adjustQty);
    const newStatus = newQty === 0 ? "out_of_stock"
      : newQty <= editingItem.reorder_point ? "low_stock"
      : "in_stock";

    const updates = { current_quantity: newQty, status: newStatus };
    if (newReorderPoint !== "") {
      updates.reorder_point = parseFloat(newReorderPoint);
    }

    await InventoryItem.update(editingItem.id, updates);
    toast.success(`${editingItem.name} updated`);
    setEditingItem(null);
    setAdjustQty("");
    setNewReorderPoint("");
    load();
  };

  const simulateLowStockAlert = async (item) => {
    // Since backend email functions require upgrade, we show a clear in-app notification
    // and note that email alerts would fire automatically with a backend upgrade
    toast.info(
      `📧 Alert simulation: "${item.name}" is at ${item.current_quantity} ${item.unit} — below reorder point of ${item.reorder_point}. Upgrade to Builder+ to send automatic email alerts.`,
      { duration: 8000 }
    );
    setAlertsSent(prev => new Set([...prev, item.id]));
  };

  const lowStockItems = items.filter(i =>
    i.current_quantity <= i.reorder_point && i.status !== "discontinued"
  );

  const statusColors = {
    in_stock: "bg-green-100 text-green-800",
    low_stock: "bg-amber-100 text-amber-800",
    out_of_stock: "bg-red-100 text-red-800",
    discontinued: "bg-slate-100 text-slate-800"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ingredient Usage & Alerts</h2>
          <p className="text-sm text-slate-500">Auto-deducted from orders via recipe links. Manually adjust below.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Low Stock Alert Panel */}
      {lowStockItems.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50 border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5" />
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} need restocking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.current_quantity} {item.unit} left · reorder at {item.reorder_point} {item.unit}
                      {item.supplier && ` · ${item.supplier}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[item.status]}>
                      {item.status.replace("_", " ")}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => simulateLowStockAlert(item)}
                      disabled={alertsSent.has(item.id)}
                    >
                      {alertsSent.has(item.id) ? (
                        <><BellOff className="w-3 h-3" /> Alerted</>
                      ) : (
                        <><Mail className="w-3 h-3" /> Alert</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setEditingItem(item);
                        setAdjustQty(String(item.current_quantity));
                        setNewReorderPoint(String(item.reorder_point));
                      }}
                    >
                      Adjust
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Automatic email alerts are available with a Builder+ plan upgrade.
            </p>
          </CardContent>
        </Card>
      )}

      {/* All Inventory Items */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-slate-600" />
            All Ingredients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map(item => {
              const pct = item.reorder_point > 0
                ? Math.min(100, (item.current_quantity / (item.reorder_point * 3)) * 100)
                : 100;
              const barColor = item.status === "out_of_stock" ? "bg-red-500"
                : item.status === "low_stock" ? "bg-amber-400"
                : "bg-emerald-500";

              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-medium text-sm text-slate-900 truncate">{item.name}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {item.current_quantity} / {item.reorder_point * 3} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Badge className={`${statusColors[item.status]} flex-shrink-0 text-xs`}>
                    {item.status.replace("_", " ")}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-shrink-0"
                    onClick={() => {
                      setEditingItem(item);
                      setAdjustQty(String(item.current_quantity));
                      setNewReorderPoint(String(item.reorder_point));
                    }}
                  >
                    Adjust
                  </Button>
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-sm">No inventory items found. Add items in the Inventory tab.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Adjust Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust: {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Current Stock ({editingItem?.unit})</Label>
              <Input
                type="number"
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <Label>Reorder Point ({editingItem?.unit})</Label>
              <Input
                type="number"
                value={newReorderPoint}
                onChange={e => setNewReorderPoint(e.target.value)}
                min={0}
              />
              <p className="text-xs text-slate-500 mt-1">Alert fires when stock drops below this value</p>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveAdjustment}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}