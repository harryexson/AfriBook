import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X,
  Mail,
  Phone,
  ShoppingBag,
  Star,
  Gift,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { PersonalizedOffer } from "@/entities/PersonalizedOffer";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function CustomerDetailView({ customer, onClose, onRefresh }) {
  const [offers, setOffers] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [sendingPromo, setSendingPromo] = useState(false);

  useEffect(() => {
    loadOffers();
  }, [customer]);

  const loadOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const customerOffers = await PersonalizedOffer.filter({
        customer_email: customer.email || customer.phone
      });
      setOffers(customerOffers);
    } catch (error) {
      console.error("Error loading offers:", error);
    }
    setIsLoadingOffers(false);
  };

  const sendQuickPromo = async (type) => {
    setSendingPromo(true);
    try {
      let title, description, discount;
      
      switch (type) {
        case 'birthday':
          title = "🎂 Happy Birthday!";
          description = "Enjoy a special birthday discount on us!";
          discount = 20;
          break;
        case 'winback':
          title = "We Miss You!";
          description = "Come back and enjoy this exclusive discount";
          discount = 15;
          break;
        case 'thankyou':
          title = "Thank You!";
          description = "Thanks for being a loyal customer";
          discount = 10;
          break;
      }

      const offer = await PersonalizedOffer.create({
        customer_email: customer.email,
        loyalty_member_id: customer.loyaltyInfo?.id,
        offer_type: 'discount',
        title,
        description,
        discount_value: discount,
        discount_type: 'percentage',
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 1,
        status: 'active',
        trigger_reason: type
      });

      // Send SMS notification if phone available
      let smsSent = false;
      if (customer.phone) {
        try {
          await base44.functions.invoke('sendSms', {
            to: customer.phone,
            message: `Hi ${customer.name}! ${title} ${description} Use code: ${type.toUpperCase()} for ${discount}% off your next order!`
          });
          smsSent = true;
        } catch (e) {
          console.log('SMS failed');
        }
      }

      // Create in-app notification
      await Notification.create({
        customer_email: customer.email,
        customer_phone: customer.phone,
        title,
        message: `${description} Enjoy ${discount}% off your next order!`,
        type: 'offer',
        priority: 'medium',
        status: 'unread',
        action_url: createPageUrl('CustomerLoyalty'),
        action_label: 'View Offer',
        related_offer_id: offer.id,
        icon: 'gift',
        sms_sent: smsSent,
        sms_sent_at: smsSent ? new Date().toISOString() : null
      });

      alert('Promotion sent successfully!');
      loadOffers();
      onRefresh();
    } catch (error) {
      console.error("Error sending promo:", error);
      alert('Failed to send promotion');
    }
    setSendingPromo(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-slate-100 text-slate-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const recentOrders = customer.orders.slice(0, 10);

  // Calculate customer insights
  const favoriteItems = {};
  customer.orders.forEach(order => {
    order.items?.forEach(item => {
      favoriteItems[item.name] = (favoriteItems[item.name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(favoriteItems)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-auto">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{customer.name}</CardTitle>
              <div className="flex flex-col gap-2">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </div>
                )}
              </div>
            </div>
            {customer.loyaltyInfo && (
              <Badge className={`text-lg py-2 px-4 ${
                customer.loyaltyInfo.tier === 'platinum' ? 'bg-purple-500' :
                customer.loyaltyInfo.tier === 'gold' ? 'bg-amber-500' :
                customer.loyaltyInfo.tier === 'silver' ? 'bg-slate-400' :
                'bg-amber-700'
              }`}>
                {customer.loyaltyInfo.tier} Member
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="text-white hover:bg-emerald-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{customer.orderCount}</div>
                <div className="text-sm text-blue-700">Total Orders</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">${customer.totalSpent.toFixed(0)}</div>
                <div className="text-sm text-green-700">Total Spent</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">${customer.averageOrderValue.toFixed(0)}</div>
                <div className="text-sm text-purple-700">Avg Order</div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{customer.loyaltyInfo?.points_balance || 0}</div>
                <div className="text-sm text-amber-700">Loyalty Points</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => sendQuickPromo('birthday')} 
                disabled={sendingPromo}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                Birthday Offer
              </Button>
              <Button 
                onClick={() => sendQuickPromo('thankyou')} 
                disabled={sendingPromo}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Star className="w-4 h-4 mr-2" />
                Thank You Offer
              </Button>
              {customer.lastOrderDaysAgo > 60 && (
                <Button 
                  onClick={() => sendQuickPromo('winback')} 
                  disabled={sendingPromo}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Win-Back Offer
                </Button>
              )}
              {customer.phone && (
                <Button 
                  variant="outline"
                  onClick={async () => {
                    await base44.functions.invoke('sendSms', {
                      to: customer.phone,
                      message: `Hi ${customer.name}! Thanks for being a valued customer. Visit us today!`
                    });
                    alert('SMS sent!');
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="offers">Offers & Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-4">
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Card key={order.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900">Order #{order.id.slice(-6)}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            {format(new Date(order.created_date), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-600">${order.total_amount?.toFixed(2)}</div>
                          <div className="text-xs text-slate-600">{order.items?.length || 0} items</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="text-sm text-slate-700">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-4">
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Favorite Items</h3>
                  {topItems.length > 0 ? (
                    <div className="space-y-3">
                      {topItems.map(([item, count], idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-slate-900">{item}</span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800">
                            Ordered {count}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No preference data yet</p>
                  )}

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-3">Customer Insights</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Order Frequency</p>
                        <p className="text-lg font-bold text-slate-900">
                          {customer.orderCount > 0 && customer.orders.length > 1
                            ? `Every ${Math.round((new Date(customer.orders[0].created_date) - new Date(customer.orders[customer.orders.length - 1].created_date)) / (customer.orderCount * 24 * 60 * 60 * 1000))} days`
                            : 'Not enough data'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Preferred Order Type</p>
                        <p className="text-lg font-bold text-slate-900">
                          {customer.orders.filter(o => o.delivery_type === 'delivery').length > customer.orders.length / 2 ? 'Delivery' : 'Pickup'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers" className="mt-4">
              <div className="space-y-3">
                {isLoadingOffers ? (
                  <p className="text-slate-500 text-center py-8">Loading offers...</p>
                ) : offers.length === 0 ? (
                  <Card className="border-2">
                    <CardContent className="p-8 text-center">
                      <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No active offers</p>
                      <p className="text-sm text-slate-400 mt-1">Send a quick offer using the buttons above</p>
                    </CardContent>
                  </Card>
                ) : (
                  offers.map((offer) => (
                    <Card key={offer.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">{offer.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{offer.description}</p>
                          </div>
                          <Badge className={
                            offer.status === 'active' ? 'bg-green-100 text-green-800' :
                            offer.status === 'redeemed' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }>
                            {offer.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-emerald-600">
                            {offer.discount_type === 'percentage' ? `${offer.discount_value}% off` : `$${offer.discount_value} off`}
                          </span>
                          <span className="text-slate-600">
                            Valid until {format(new Date(offer.valid_until), 'MMM d, yyyy')}
                          </span>
                        </div>

                        {offer.usage_count > 0 && (
                          <div className="mt-2 text-xs text-slate-600">
                            Used {offer.usage_count} of {offer.usage_limit} times
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}