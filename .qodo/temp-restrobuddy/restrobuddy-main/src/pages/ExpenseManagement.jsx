import React, { useState, useEffect } from "react";
import { Expense } from "@/entities/Expense";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Camera,
  DollarSign,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Receipt,
  Eye
} from "lucide-react";
import ReceiptScanner from "@/components/expenses/ReceiptScanner";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewReceipt, setViewReceipt] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "food_supplies",
    vendor: "",
    description: "",
    payment_method: "credit_card",
    notes: "",
    receipt_url: "",
    tax_deductible: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        const rest = restaurants[0];
        setRestaurant(rest);
        
        const expenseData = await Expense.filter({ restaurant_id: rest.id });
        setExpenses(expenseData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      const user = await base44.auth.me();
      await Expense.create({
        ...formData,
        restaurant_id: restaurant.id,
        recorded_by: user.email,
        amount: parseFloat(formData.amount)
      });
      
      await loadData();
      resetForm();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to save expense");
    }
  };

  const handleExpenseExtracted = (extractedData) => {
    setFormData({
      ...formData,
      date: extractedData.date || formData.date,
      amount: extractedData.amount?.toString() || formData.amount,
      category: extractedData.category || formData.category,
      vendor: extractedData.vendor || formData.vendor,
      description: extractedData.description || formData.description,
      payment_method: extractedData.payment_method || formData.payment_method,
      receipt_url: extractedData.receipt_url || formData.receipt_url
    });
    setShowScanner(false);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: "",
      category: "food_supplies",
      vendor: "",
      description: "",
      payment_method: "credit_card",
      notes: "",
      receipt_url: "",
      tax_deductible: true
    });
  };

  const filteredExpenses = expenses.filter(exp => {
    const categoryMatch = filterCategory === "all" || exp.category === filterCategory;
    const monthMatch = exp.date?.startsWith(filterMonth);
    return categoryMatch && monthMatch;
  });

  const stats = {
    total: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    count: filteredExpenses.length,
    byCategory: filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {})
  };

  const categoryColors = {
    food_supplies: "bg-orange-100 text-orange-800",
    beverages: "bg-blue-100 text-blue-800",
    utilities: "bg-yellow-100 text-yellow-800",
    rent: "bg-purple-100 text-purple-800",
    payroll: "bg-green-100 text-green-800",
    equipment: "bg-red-100 text-red-800",
    maintenance: "bg-pink-100 text-pink-800",
    marketing: "bg-indigo-100 text-indigo-800",
    insurance: "bg-teal-100 text-teal-800",
    taxes: "bg-amber-100 text-amber-800",
    supplies: "bg-cyan-100 text-cyan-800",
    other: "bg-slate-100 text-slate-800"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Please complete restaurant setup first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Expense Management</h1>
          <p className="text-slate-600">Track and manage restaurant expenses for P&L</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-slate-900">${stats.total.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Transactions</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.count}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Average per Day</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ${stats.count > 0 ? (stats.total / new Date().getDate()).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </Button>
          
          <Button 
            onClick={() => {
              setShowScanner(true);
              setShowAddDialog(true);
            }} 
            variant="outline" 
            className="gap-2"
          >
            <Camera className="w-5 h-5" />
            Scan Receipt
          </Button>

          <div className="flex gap-2 ml-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food_supplies">Food Supplies</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="taxes">Taxes</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* Expense List */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No expenses recorded yet</p>
                <p className="text-sm text-slate-500">Click "Add Expense" or scan a receipt to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{expense.vendor}</p>
                          <Badge className={categoryColors[expense.category]}>
                            {expense.category.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{expense.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(expense.date).toLocaleDateString()} • {expense.payment_method?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">-${expense.amount.toFixed(2)}</p>
                        {expense.receipt_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1 mt-1"
                            onClick={() => setViewReceipt(expense.receipt_url)}
                          >
                            <Eye className="w-3 h-3" />
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {Object.keys(stats.byCategory).length > 0 && (
          <Card className="border-0 shadow-xl mt-6">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                        <Badge className={categoryColors[category]} variant="outline">
                          {((amount / stats.total) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">${amount.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>

          {showScanner ? (
            <ReceiptScanner 
              onExpenseExtracted={handleExpenseExtracted}
              onClose={() => setShowScanner(false)}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food_supplies">Food Supplies</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="taxes">Taxes</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method *</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Vendor *</Label>
                <Input
                  placeholder="Supplier or vendor name"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="What was purchased?"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              {!showScanner && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-5 h-5" />
                  Or Scan Receipt with Camera
                </Button>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setShowScanner(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Save Expense
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer */}
      <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {viewReceipt && (
            <img src={viewReceipt} alt="Receipt" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}