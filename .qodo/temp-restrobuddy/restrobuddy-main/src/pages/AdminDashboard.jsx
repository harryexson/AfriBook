import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Order } from "@/entities/Order";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import OrdersAnalytics from "../components/dashboard/OrdersAnalytics";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ExternalLink } from "lucide-react";

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "entrees",
    price: 0,
    image_url: "",
    available: true,
    keyword: "" // Added keyword field
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await MenuItem.list();
    const allOrders = await Order.list("-created_date", 50);
    setMenuItems(items);
    setOrders(allOrders);
  };

  const handleAddItem = async () => {
    await MenuItem.create(newItem);
    setShowAddItem(false);
    setNewItem({
      name: "",
      description: "",
      category: "entrees",
      price: 0,
      image_url: "",
      available: true,
      keyword: "" // Reset keyword field
    });
    loadData();
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    await MenuItem.update(itemId, { available: !currentStatus });
    loadData();
  };

  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
              <p className="text-slate-600">Manage your menu and monitor performance</p>
            </div>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to={createPageUrl("KitchenDisplay")}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Kitchen Display
              </Link>
            </Button>
          </div>
        </div>

        <OrdersAnalytics />

        <div className="h-8" />

        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Menu Management</CardTitle>
              <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
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
                          <SelectItem value="appetizers">Appetizers</SelectItem>
                          <SelectItem value="entrees">Entrées</SelectItem>
                          <SelectItem value="sides">Sides</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label>SMS Keyword (optional)</Label>
                      <Input
                        value={newItem.keyword}
                        onChange={(e) => setNewItem({...newItem, keyword: e.target.value.toUpperCase()})}
                        placeholder="BURGER"
                        className="font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Customers can text this to quickly order
                      </p>
                    </div>
                    <div>
                      <Label>Image URL (optional)</Label>
                      <Input
                        value={newItem.image_url}
                        onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <Button onClick={handleAddItem} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      ${item.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {item.available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAvailability(item.id, item.available)}
                      >
                        Toggle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}