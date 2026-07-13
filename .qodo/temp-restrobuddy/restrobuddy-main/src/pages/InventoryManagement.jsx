import React, { useState, useEffect } from "react";
import { InventoryItem } from "@/entities/InventoryItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, AlertCircle, Package, TrendingDown, DollarSign, MapPin, Calculator, Activity } from "lucide-react";
import IngredientUsageTracker from "@/components/inventory/IngredientUsageTracker";
import MultiLocationTracker from "../components/inventory/MultiLocationTracker";
import SpoilageAdjustment from "../components/inventory/SpoilageAdjustment";
import RecipeCosting from "../components/inventory/RecipeCosting";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "produce",
    unit: "kg",
    current_quantity: 0,
    reorder_point: 10,
    cost_per_unit: 0,
    supplier: "",
    supplier_contact: "",
    status: "in_stock"
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const allItems = await InventoryItem.list("-created_date");
    setItems(allItems);
  };

  const handleAddItem = async () => {
    await InventoryItem.create(newItem);
    setShowAddDialog(false);
    setNewItem({
      name: "",
      category: "produce",
      unit: "kg",
      current_quantity: 0,
      reorder_point: 10,
      cost_per_unit: 0,
      supplier: "",
      supplier_contact: "",
      status: "in_stock"
    });
    loadInventory();
  };

  const updateQuantity = async (itemId, newQuantity) => {
    const item = items.find(i => i.id === itemId);
    const status = newQuantity === 0 ? "out_of_stock" 
      : newQuantity <= item.reorder_point ? "low_stock" 
      : "in_stock";
    
    await InventoryItem.update(itemId, { 
      current_quantity: newQuantity,
      status: status
    });
    loadInventory();
  };

  const filteredItems = filterCategory === "all" 
    ? items 
    : items.filter(item => item.category === filterCategory);

  const lowStockItems = items.filter(item => 
    item.current_quantity <= item.reorder_point && item.status !== "discontinued"
  );

  const totalInventoryValue = items.reduce((sum, item) => 
    sum + (item.current_quantity * item.cost_per_unit), 0
  );

  const statusColors = {
    in_stock: "bg-green-100 text-green-800",
    low_stock: "bg-amber-100 text-amber-800",
    out_of_stock: "bg-red-100 text-red-800",
    discontinued: "bg-slate-100 text-slate-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-600">Multi-location tracking, reorder alerts, spoilage tracking & recipe costing</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-md">
            <TabsTrigger value="inventory" className="rounded-lg px-4 py-2">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="usage" className="rounded-lg px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              Usage & Alerts
            </TabsTrigger>
            <TabsTrigger value="recipes" className="rounded-lg px-4 py-2">
              <Calculator className="w-4 h-4 mr-2" />
              Recipe Costing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
        <div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{items.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{lowStockItems.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600">${totalInventoryValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <Card className="border-0 shadow-xl mb-8 bg-gradient-to-br from-red-50 to-white border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-red-700">
                <TrendingDown className="w-5 h-5" />
                Reorder Needed ({lowStockItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-red-200">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        Current: {item.current_quantity} {item.unit} | Reorder at: {item.reorder_point} {item.unit}
                      </p>
                      {item.supplier && (
                        <p className="text-xs text-slate-500 mt-1">
                          Supplier: {item.supplier} {item.supplier_contact && `(${item.supplier_contact})`}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-red-600 text-white">Reorder Now</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Inventory Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Inventory Items</CardTitle>
              <div className="flex gap-3">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="dry_goods">Dry Goods</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Inventory Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Item Name</Label>
                        <Input
                          value={newItem.name}
                          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                          placeholder="e.g., Tomatoes"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={newItem.category}
                          onValueChange={(value) => setNewItem({...newItem, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="produce">Produce</SelectItem>
                            <SelectItem value="meat">Meat</SelectItem>
                            <SelectItem value="dairy">Dairy</SelectItem>
                            <SelectItem value="dry_goods">Dry Goods</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="supplies">Supplies</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Current Quantity</Label>
                        <Input
                          type="number"
                          value={newItem.current_quantity}
                          onChange={(e) => setNewItem({...newItem, current_quantity: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Select
                          value={newItem.unit}
                          onValueChange={(value) => setNewItem({...newItem, unit: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="lb">Pounds (lb)</SelectItem>
                            <SelectItem value="oz">Ounces (oz)</SelectItem>
                            <SelectItem value="g">Grams (g)</SelectItem>
                            <SelectItem value="L">Liters (L)</SelectItem>
                            <SelectItem value="gal">Gallons (gal)</SelectItem>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="cases">Cases</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Reorder Point</Label>
                        <Input
                          type="number"
                          value={newItem.reorder_point}
                          onChange={(e) => setNewItem({...newItem, reorder_point: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Cost per Unit ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.cost_per_unit}
                          onChange={(e) => setNewItem({...newItem, cost_per_unit: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>Supplier</Label>
                        <Input
                          value={newItem.supplier}
                          onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                          placeholder="Supplier name"
                        />
                      </div>
                      <div>
                        <Label>Supplier Contact</Label>
                        <Input
                          value={newItem.supplier_contact}
                          onChange={(e) => setNewItem({...newItem, supplier_contact: e.target.value})}
                          placeholder="Phone or email"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddItem} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                      Add to Inventory
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, Math.max(0, item.current_quantity - 1))}
                        >
                          -
                        </Button>
                        <span className="w-16 text-center font-semibold">
                          {item.current_quantity} {item.unit}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.current_quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{item.reorder_point} {item.unit}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      ${item.cost_per_unit.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-bold">
                      ${(item.current_quantity * item.cost_per_unit).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status]}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.location_quantities ? (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          <span>{Object.keys(item.location_quantities).length} locations</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Single location</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedItem(item)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
          </TabsContent>

          <TabsContent value="usage">
            <IngredientUsageTracker />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeCosting />
          </TabsContent>
        </Tabs>

        {/* Item Management Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage: {selectedItem?.name}</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="grid md:grid-cols-2 gap-6">
                <MultiLocationTracker
                  item={selectedItem}
                  onUpdate={async (updates) => {
                    await InventoryItem.update(selectedItem.id, updates);
                    loadInventory();
                  }}
                />
                <SpoilageAdjustment
                  item={selectedItem}
                  onAdjust={async (updates) => {
                    await InventoryItem.update(selectedItem.id, updates);
                    loadInventory();
                    setSelectedItem({ ...selectedItem, ...updates });
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}