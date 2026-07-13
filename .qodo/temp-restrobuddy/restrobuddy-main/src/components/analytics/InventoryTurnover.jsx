import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function InventoryTurnover({ inventoryItems, orders }) {
  // Calculate usage from orders
  const itemUsage = {};
  orders.forEach(order => {
    order.items?.forEach(item => {
      const itemName = item.name;
      if (!itemUsage[itemName]) {
        itemUsage[itemName] = 0;
      }
      itemUsage[itemName] += item.quantity;
    });
  });

  // Match with inventory
  const turnoverData = inventoryItems.map(inv => {
    const usage = itemUsage[inv.name] || 0;
    const turnoverRate = inv.current_quantity > 0 ? (usage / inv.current_quantity) : 0;
    
    return {
      name: inv.name,
      category: inv.category,
      currentStock: inv.current_quantity,
      usage,
      turnoverRate: turnoverRate.toFixed(2),
      status: inv.status,
      costPerUnit: inv.cost_per_unit,
      totalValue: inv.current_quantity * inv.cost_per_unit,
      reorderPoint: inv.reorder_point,
      needsReorder: inv.current_quantity <= inv.reorder_point
    };
  }).sort((a, b) => b.usage - a.usage);

  const topMovers = turnoverData.slice(0, 10);
  const slowMovers = turnoverData.filter(item => item.usage === 0 && item.currentStock > 0).slice(0, 10);
  const needsReorder = turnoverData.filter(item => item.needsReorder);
  const totalInventoryValue = turnoverData.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold">{inventoryItems.length}</p>
              </div>
              <Package className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Inventory Value</p>
                <p className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Needs Reorder</p>
                <p className="text-2xl font-bold text-red-600">{needsReorder.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fast Movers</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {turnoverData.filter(i => parseFloat(i.turnoverRate) > 0.5).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Moving Items */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Top Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topMovers.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill="#10b981" name="Usage" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reorder Alerts */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Reorder Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsReorder.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-slate-600">All items adequately stocked</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {needsReorder.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        Current: {item.currentStock} {inventoryItems.find(i => i.name === item.name)?.unit || 'units'}
                      </p>
                    </div>
                    <Badge className="bg-red-600">Low Stock</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slow Moving Items */}
      {slowMovers.length > 0 && (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Slow Moving Items (No Usage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {slowMovers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      Stock: {item.currentStock} | Value: ${item.totalValue.toFixed(2)}
                    </p>
                  </div>
                  <Badge className="bg-amber-600">Slow</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}