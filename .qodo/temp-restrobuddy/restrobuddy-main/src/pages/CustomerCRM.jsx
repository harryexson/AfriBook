import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  Star,
  TrendingUp,
  Gift,
  DollarSign,
  Calendar,
  Download
} from "lucide-react";
import { Order } from "@/entities/Order";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import CustomerDetailView from "../components/crm/CustomerDetailView";
import SendPromotionDialog from "../components/crm/SendPromotionDialog";
import { format } from "date-fns";

export default function CustomerCRM() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    vipCustomers: 0,
    averageOrderValue: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, selectedSegment, customers]);

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      // Load all orders
      const allOrders = await Order.list("-created_date", 500);
      
      // Load loyalty members
      const loyaltyMembers = await LoyaltyMember.list();
      
      // Group orders by customer phone/email
      const customerMap = new Map();
      
      allOrders.forEach(order => {
        const customerId = order.customer_email || order.customer_phone;
        if (!customerId) return;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: order.customer_name || 'Unknown',
            email: order.customer_email,
            phone: order.customer_phone,
            orders: [],
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: null,
            averageOrderValue: 0,
            loyaltyInfo: null
          });
        }
        
        const customer = customerMap.get(customerId);
        customer.orders.push(order);
        customer.totalSpent += order.total_amount || 0;
        customer.orderCount++;
        
        if (!customer.lastOrderDate || new Date(order.created_date) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.created_date;
        }
      });

      // Add loyalty info
      loyaltyMembers.forEach(member => {
        const customerId = member.email || member.phone;
        if (customerMap.has(customerId)) {
          const customer = customerMap.get(customerId);
          customer.loyaltyInfo = member;
        }
      });

      // Calculate average order value and sort
      const customersArray = Array.from(customerMap.values()).map(customer => ({
        ...customer,
        averageOrderValue: customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0,
        lastOrderDaysAgo: customer.lastOrderDate ? Math.floor((Date.now() - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24)) : null
      })).sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomers(customersArray);

      // Calculate stats
      const activeCustomers = customersArray.filter(c => c.lastOrderDaysAgo !== null && c.lastOrderDaysAgo <= 30).length;
      const vipCustomers = customersArray.filter(c => c.loyaltyInfo?.tier === 'gold' || c.loyaltyInfo?.tier === 'platinum').length;
      const totalRevenue = customersArray.reduce((sum, c) => sum + c.totalSpent, 0);
      const avgOrderValue = customersArray.length > 0 
        ? customersArray.reduce((sum, c) => sum + c.averageOrderValue, 0) / customersArray.length 
        : 0;

      setStats({
        totalCustomers: customersArray.length,
        activeCustomers,
        vipCustomers,
        averageOrderValue: avgOrderValue,
        totalRevenue
      });

    } catch (error) {
      console.error("Error loading customer data:", error);
    }
    setIsLoading(false);
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
      );
    }

    // Segment filter
    switch (selectedSegment) {
      case 'vip':
        filtered = filtered.filter(c => c.loyaltyInfo?.tier === 'gold' || c.loyaltyInfo?.tier === 'platinum');
        break;
      case 'active':
        filtered = filtered.filter(c => c.lastOrderDaysAgo !== null && c.lastOrderDaysAgo <= 30);
        break;
      case 'inactive':
        filtered = filtered.filter(c => c.lastOrderDaysAgo !== null && c.lastOrderDaysAgo > 90);
        break;
      case 'high_value':
        filtered = filtered.filter(c => c.totalSpent > 500);
        break;
    }

    setFilteredCustomers(filtered);
  };

  const exportCustomerData = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Avg Order', 'Last Order', 'Loyalty Tier'].join(','),
      ...filteredCustomers.map(c => [
        c.name,
        c.email || '',
        c.phone || '',
        c.orderCount,
        c.totalSpent.toFixed(2),
        c.averageOrderValue.toFixed(2),
        c.lastOrderDate ? format(new Date(c.lastOrderDate), 'yyyy-MM-dd') : '',
        c.loyaltyInfo?.tier || 'none'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Customer CRM</h1>
            <p className="text-slate-600">Manage customer relationships and track engagement</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportCustomerData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setShowPromotionDialog(true)} className="bg-emerald-600">
              <Gift className="w-4 h-4 mr-2" />
              Send Promotion
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.totalCustomers}</div>
              <div className="text-sm opacity-90">Total Customers</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.activeCustomers}</div>
              <div className="text-sm opacity-90">Active (30 days)</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <Star className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.vipCustomers}</div>
              <div className="text-sm opacity-90">VIP Members</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">${stats.averageOrderValue.toFixed(0)}</div>
              <div className="text-sm opacity-90">Avg Order Value</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <DollarSign className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">${stats.totalRevenue.toFixed(0)}</div>
              <div className="text-sm opacity-90">Total Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Tabs value={selectedSegment} onValueChange={setSelectedSegment}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="vip">VIP</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  <TabsTrigger value="high_value">High Value</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-slate-200" />
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredCustomers.map(customer => (
              <Card 
                key={customer.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{customer.name}</h3>
                      <div className="flex flex-col gap-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {customer.loyaltyInfo && (
                      <Badge className={`
                        ${customer.loyaltyInfo.tier === 'platinum' ? 'bg-purple-500' :
                          customer.loyaltyInfo.tier === 'gold' ? 'bg-amber-500' :
                          customer.loyaltyInfo.tier === 'silver' ? 'bg-slate-400' :
                          'bg-amber-700'}
                      `}>
                        {customer.loyaltyInfo.tier}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{customer.orderCount}</div>
                      <div className="text-xs text-slate-600">Orders</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">${customer.totalSpent.toFixed(0)}</div>
                      <div className="text-xs text-slate-600">Total Spent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">${customer.averageOrderValue.toFixed(0)}</div>
                      <div className="text-xs text-slate-600">Avg Order</div>
                    </div>
                  </div>

                  {customer.lastOrderDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      Last order: {customer.lastOrderDaysAgo} days ago
                    </div>
                  )}

                  {customer.loyaltyInfo && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Loyalty Points:</span>
                        <span className="font-bold text-amber-600">{customer.loyaltyInfo.points_balance}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <CustomerDetailView
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onRefresh={loadCustomerData}
          />
        )}

        {/* Send Promotion Dialog */}
        {showPromotionDialog && (
          <SendPromotionDialog
            customers={filteredCustomers}
            onClose={() => setShowPromotionDialog(false)}
            onSuccess={loadCustomerData}
          />
        )}
      </div>
    </div>
  );
}