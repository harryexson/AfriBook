import React, { useState, useEffect } from "react";
import { CustomerProfile } from "@/entities/CustomerProfile";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Order } from "@/entities/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Search, DollarSign,
  ShoppingBag, Heart, MapPin, Mail, Phone,
  ChevronDown, ChevronUp
} from "lucide-react";
import { format } from "date-fns";

export default function CustomerInsights() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_spent");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const allCustomers = await CustomerProfile.list();
      setCustomers(allCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
    setIsLoading(false);
  };

  const loadCustomerOrders = async (customer) => {
    try {
      const [marketplaceOrders, regularOrders] = await Promise.all([
        MarketplaceOrder.filter({ customer_email: customer.user_email }, "-created_date", 100),
        customer.phone ? Order.filter({ customer_phone: customer.phone }, "-created_date", 100) : Promise.resolve([])
      ]);

      const allOrders = [...marketplaceOrders, ...regularOrders]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setCustomerOrders(allOrders);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error("Error loading customer orders:", error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aVal = a[sortBy] || 0;
    let bVal = b[sortBy] || 0;
    
    if (sortBy === "last_order_date") {
      aVal = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
      bVal = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
    }
    
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => 
    c.last_order_date && new Date(c.last_order_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgOrderValue = customers.reduce((sum, c) => sum + (c.average_order_value || 0), 0) / (customers.length || 1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading customer insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Customer Insights</h1>
          <p className="text-slate-600">View customer profiles, order patterns, and preferences</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalCustomers}</p>
              <p className="text-sm text-blue-100 mt-2">{activeCustomers} active this month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${avgOrderValue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Customer List */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Customer Database</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Sort Headers */}
                  <div className="grid grid-cols-4 gap-2 p-3 bg-slate-100 rounded-lg font-semibold text-sm">
                    <button 
                      onClick={() => handleSort("full_name")}
                      className="text-left flex items-center gap-1 hover:text-emerald-600"
                    >
                      Customer
                      {sortBy === "full_name" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort("total_orders")}
                      className="text-center flex items-center justify-center gap-1 hover:text-emerald-600"
                    >
                      Orders
                      {sortBy === "total_orders" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort("total_spent")}
                      className="text-center flex items-center justify-center gap-1 hover:text-emerald-600"
                    >
                      Spent
                      {sortBy === "total_spent" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort("last_order_date")}
                      className="text-center flex items-center justify-center gap-1 hover:text-emerald-600"
                    >
                      Last Order
                      {sortBy === "last_order_date" && (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Customer Rows */}
                  {sortedCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => loadCustomerOrders(customer)}
                      className={`grid grid-cols-4 gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-emerald-100 border-2 border-emerald-500'
                          : 'bg-white hover:bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{customer.full_name}</p>
                        <p className="text-xs text-slate-600">{customer.user_email}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900">{customer.total_orders || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">${(customer.total_spent || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-slate-600">
                          {customer.last_order_date 
                            ? format(new Date(customer.last_order_date), 'MMM d')
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {sortedCustomers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No customers found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Details */}
          <div>
            {selectedCustomer ? (
              <Card className="border-0 shadow-xl sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">{selectedCustomer.full_name}</CardTitle>
                  <div className="flex flex-col gap-2 mt-2">
                    {selectedCustomer.user_email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${selectedCustomer.user_email}`} className="hover:text-emerald-600">
                          {selectedCustomer.user_email}
                        </a>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${selectedCustomer.phone}`} className="hover:text-emerald-600">
                          {selectedCustomer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Stats</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Orders:</span>
                          <span className="font-bold">{selectedCustomer.total_orders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Spent:</span>
                          <span className="font-bold text-emerald-600">${(selectedCustomer.total_spent || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Avg Order:</span>
                          <span className="font-bold">${(selectedCustomer.average_order_value || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Member Since:</span>
                          <span className="font-bold">
                            {selectedCustomer.customer_since 
                              ? format(new Date(selectedCustomer.customer_since), 'MMM yyyy')
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedCustomer.dietary_preferences && selectedCustomer.dietary_preferences.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Dietary Preferences</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCustomer.dietary_preferences.map((pref, idx) => (
                            <Badge key={idx} variant="outline">{pref}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCustomer.allergies && selectedCustomer.allergies.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCustomer.allergies.map((allergy, idx) => (
                            <Badge key={idx} className="bg-red-100 text-red-800">{allergy}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCustomer.favorite_items && selectedCustomer.favorite_items.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Favorite Items ({selectedCustomer.favorite_items.length})
                        </p>
                        <div className="space-y-1">
                          {selectedCustomer.favorite_items.slice(0, 5).map((fav, idx) => (
                            <p key={idx} className="text-sm text-slate-600">{fav.menu_item_name}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCustomer.delivery_addresses && selectedCustomer.delivery_addresses.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          Saved Addresses ({selectedCustomer.delivery_addresses.length})
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Recent Orders</p>
                      {customerOrders.length === 0 ? (
                        <p className="text-sm text-slate-500">No orders yet</p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="p-2 bg-slate-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-mono text-slate-600">#{order.id.slice(-6)}</p>
                                  <p className="text-xs text-slate-500">
                                    {format(new Date(order.created_date), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-emerald-600">${order.total_amount.toFixed(2)}</p>
                                  <Badge className="text-xs">{order.status}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Select a customer to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}