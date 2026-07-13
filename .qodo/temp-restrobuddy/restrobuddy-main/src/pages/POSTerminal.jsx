import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Minus,
  Trash2,
  Users,
  CreditCard,
  Receipt,
  Search,
  UtensilsCrossed,
  Coffee,
  Salad,
  Cake,
  Wine,
  ChefHat,
  Split
} from "lucide-react";
import { Table } from "@/entities/Table";
import { MenuItem } from "@/entities/MenuItem";
import { Order } from "@/entities/Order";
import CheckSplitDialog from "@/components/pos/CheckSplitDialog";
import PaymentDialog from "@/components/pos/PaymentDialog";
import TableSelector from "@/components/pos/TableSelector";

const categoryIcons = {
  appetizers: Salad,
  entrees: UtensilsCrossed,
  sides: Coffee,
  desserts: Cake,
  beverages: Wine
};

export default function POSTerminal() {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrder, setCurrentOrder] = useState({ items: [], subtotal: 0 });
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tablesData, menuData] = await Promise.all([
        Table.list(),
        MenuItem.filter({ available: true })
      ]);
      setTables(tablesData);
      setMenuItems(menuData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadTableOrder = async (table) => {
    setSelectedTable(table);
    if (table.current_order_id) {
      try {
        const orders = await Order.filter({ id: table.current_order_id });
        if (orders.length > 0) {
          const order = orders[0];
          setCurrentOrder({
            id: order.id,
            items: order.items || [],
            subtotal: order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
          });
        }
      } catch (e) {
        setCurrentOrder({ items: [], subtotal: 0 });
      }
    } else {
      setCurrentOrder({ items: [], subtotal: 0 });
    }
  };

  const addItemToOrder = (menuItem) => {
    setCurrentOrder(prev => {
      const existingIndex = prev.items.findIndex(i => i.menu_item_id === menuItem.id);
      let newItems;
      
      if (existingIndex >= 0) {
        newItems = prev.items.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev.items, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          special_instructions: ""
        }];
      }
      
      const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, subtotal };
    });
  };

  const updateItemQuantity = (index, delta) => {
    setCurrentOrder(prev => {
      const newItems = prev.items.map((item, idx) => {
        if (idx === index) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
      
      const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, subtotal };
    });
  };

  const removeItem = (index) => {
    setCurrentOrder(prev => {
      const newItems = prev.items.filter((_, idx) => idx !== index);
      const subtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return { ...prev, items: newItems, subtotal };
    });
  };

  const sendToKitchen = async () => {
    if (!selectedTable || currentOrder.items.length === 0) return;

    try {
      const tax = currentOrder.subtotal * 0.08;
      const total = currentOrder.subtotal + tax;

      if (currentOrder.id) {
        await Order.update(currentOrder.id, {
          items: currentOrder.items,
          total_amount: total,
          status: "confirmed"
        });
      } else {
        const newOrder = await Order.create({
          customer_name: `Table ${selectedTable.table_number}`,
          items: currentOrder.items,
          total_amount: total,
          status: "confirmed",
          order_type: "kiosk",
          delivery_type: "pickup"
        });
        
        await Table.update(selectedTable.id, {
          current_order_id: newOrder.id,
          status: "occupied"
        });
        
        setCurrentOrder(prev => ({ ...prev, id: newOrder.id }));
      }

      alert("Order sent to kitchen!");
    } catch (error) {
      console.error("Error sending order:", error);
      alert("Failed to send order");
    }
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      if (currentOrder.id) {
        await Order.update(currentOrder.id, {
          status: "completed",
          payment_status: "completed",
          payment_transaction_id: paymentData.transactionId
        });
      }

      await Table.update(selectedTable.id, {
        status: "needs_cleaning",
        current_order_id: null
      });

      setCurrentOrder({ items: [], subtotal: 0 });
      setSelectedTable(null);
      setShowPaymentDialog(false);
      loadData();
    } catch (error) {
      console.error("Error completing payment:", error);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ["all", "appetizers", "entrees", "sides", "desserts", "beverages"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="flex gap-4 h-[calc(100vh-2rem)]">
        {/* Left Panel - Menu */}
        <div className="flex-1 flex flex-col">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTableSelector(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {selectedTable ? `Table ${selectedTable.table_number}` : "Select Table"}
                </Button>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
            <TabsList className="bg-white p-1 rounded-lg mb-4 flex-wrap h-auto">
              {categories.map(cat => {
                const Icon = categoryIcons[cat] || UtensilsCrossed;
                return (
                  <TabsTrigger key={cat} value={cat} className="capitalize flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {cat}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <ScrollArea className="flex-1 bg-white rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMenu.map(item => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-emerald-500"
                    onClick={() => selectedTable && addItemToOrder(item)}
                  >
                    <CardContent className="p-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-emerald-600 font-bold">${item.price?.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Right Panel - Current Order */}
        <Card className="w-96 flex flex-col">
          <CardHeader className="bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Current Order
              </span>
              {selectedTable && (
                <Badge className="bg-emerald-500">Table {selectedTable.table_number}</Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {!selectedTable ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                <div>
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a table to start an order</p>
                  <Button
                    className="mt-4 bg-emerald-600"
                    onClick={() => setShowTableSelector(true)}
                  >
                    Select Table
                  </Button>
                </div>
              </div>
            ) : currentOrder.items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                <div>
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No items yet. Tap menu items to add.</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {currentOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-emerald-600 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(index, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(index, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Order Summary */}
            {selectedTable && currentOrder.items.length > 0 && (
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${currentOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%)</span>
                  <span>${(currentOrder.subtotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${(currentOrder.subtotal * 1.08).toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={sendToKitchen}
                    className="flex items-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    Send to Kitchen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowSplitDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Split className="w-4 h-4" />
                    Split Check
                  </Button>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ${(currentOrder.subtotal * 1.08).toFixed(2)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {showTableSelector && (
        <TableSelector
          tables={tables}
          onSelect={(table) => {
            loadTableOrder(table);
            setShowTableSelector(false);
          }}
          onClose={() => setShowTableSelector(false)}
        />
      )}

      {showSplitDialog && (
        <CheckSplitDialog
          order={currentOrder}
          onClose={() => setShowSplitDialog(false)}
          onSplit={(splits) => {
            setShowSplitDialog(false);
            // Handle split payments
          }}
        />
      )}

      {showPaymentDialog && (
        <PaymentDialog
          amount={currentOrder.subtotal * 1.08}
          orderId={currentOrder.id}
          onComplete={handlePaymentComplete}
          onClose={() => setShowPaymentDialog(false)}
        />
      )}
    </div>
  );
}