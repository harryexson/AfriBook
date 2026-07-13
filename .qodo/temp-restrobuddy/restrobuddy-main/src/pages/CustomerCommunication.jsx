import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageSquare, Users, Search } from "lucide-react";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { Order } from "@/entities/Order";
import CustomerNotificationPanel from "@/components/notifications/CustomerNotificationPanel";
import BulkNotificationPanel from "@/components/notifications/BulkNotificationPanel";

export default function CustomerCommunication() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCustomers(
        customers.filter(c =>
          (c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.phone?.includes(searchQuery))
        )
      );
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Get loyalty members
      const loyaltyMembers = await LoyaltyMember.list();
      
      // Get recent orders to extract customer info
      const recentOrders = await Order.list("-created_date", 200);
      
      // Combine and deduplicate
      const customerMap = new Map();
      
      loyaltyMembers.forEach(member => {
        customerMap.set(member.email || member.phone, {
          id: member.id,
          customer_name: member.customer_name,
          email: member.email,
          phone: member.phone,
          source: 'loyalty'
        });
      });

      recentOrders.forEach(order => {
        const key = order.customer_email || order.customer_phone;
        if (key && !customerMap.has(key)) {
          customerMap.set(key, {
            id: order.id,
            customer_name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            source: 'orders'
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error loading customers:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Customer Communication</h1>
          <p className="text-slate-600">Send emails and SMS to your customers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Customers</p>
                  <p className="text-3xl font-bold">{customers.length}</p>
                </div>
                <Users className="w-10 h-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">With Email</p>
                  <p className="text-3xl font-bold">
                    {customers.filter(c => c.email).length}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">With Phone</p>
                  <p className="text-3xl font-bold">
                    {customers.filter(c => c.phone).length}
                  </p>
                </div>
                <MessageSquare className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Send Messages</CardTitle>
              <Button
                onClick={() => setShowBulkPanel(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Bulk Send
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{customer.customer_name}</p>
                    <div className="flex gap-4 text-sm text-slate-600 mt-1">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    Contact
                  </Button>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600">No customers found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Contact Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Contact Customer</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerNotificationPanel
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Send Dialog */}
      <Dialog open={showBulkPanel} onOpenChange={setShowBulkPanel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Message Send</DialogTitle>
          </DialogHeader>
          <BulkNotificationPanel customers={customers} />
        </DialogContent>
      </Dialog>
    </div>
  );
}