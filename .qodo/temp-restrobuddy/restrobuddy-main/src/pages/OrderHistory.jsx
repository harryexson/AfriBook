import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Order } from "@/entities/Order";
import { GroupOrder } from "@/entities/GroupOrder";
import { MenuItem } from "@/entities/MenuItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, ShoppingBag, Users, ChevronRight, RefreshCw, Eye, Package } from "lucide-react";
import { toast } from "sonner";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterType, setFilterType] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadOrders();

    // Real-time sync for order status updates
    const unsubscribeOrders = Order.subscribe((event) => {
      if (event.type === "update") {
        setAllOrders(prev => prev.map(o =>
          o.id === event.id && o.orderType === "order"
            ? { ...o, ...event.data, displayStatus: event.data.status ?? o.displayStatus }
            : o
        ));
      }
    });

    const unsubscribeGroup = GroupOrder.subscribe((event) => {
      if (event.type === "update") {
        setAllOrders(prev => prev.map(o =>
          o.id === event.id && o.orderType === "group_order"
            ? { ...o, ...event.data, displayStatus: event.data.status ?? o.displayStatus }
            : o
        ));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeGroup();
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [allOrders, sortBy, filterType]);

  const loadOrders = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load regular orders
      const userOrders = await Order.filter({ customer_email: user.email });

      // Load group orders where user is organizer
      const groupOrders = await GroupOrder.filter({ organizer_email: user.email });

      // Combine and format
      const combined = [
        ...userOrders.map(o => ({
          ...o,
          orderType: 'order',
          displayName: o.customer_name,
          displayDate: o.created_date,
          displayStatus: o.status
        })),
        ...groupOrders.map(go => ({
          ...go,
          orderType: 'group_order',
          displayName: go.title,
          displayDate: go.created_date,
          displayStatus: go.status,
          restaurantName: go.restaurant_name
        }))
      ];

      setAllOrders(combined);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setIsLoading(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...allOrders];

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(o => o.orderType === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.displayDate);
      const dateB = new Date(b.displayDate);

      if (sortBy === "date-desc") {
        return dateB - dateA;
      } else if (sortBy === "date-asc") {
        return dateA - dateB;
      } else if (sortBy === "amount-desc") {
        return (b.total_amount || 0) - (a.total_amount || 0);
      } else if (sortBy === "amount-asc") {
        return (a.total_amount || 0) - (b.total_amount || 0);
      }
      return 0;
    });

    setFilteredOrders(filtered);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      preparing: "bg-purple-100 text-purple-700",
      ready: "bg-green-100 text-green-700",
      out_for_delivery: "bg-cyan-100 text-cyan-700",
      delivered: "bg-emerald-100 text-emerald-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
      collecting: "bg-blue-100 text-blue-700",
      closed: "bg-amber-100 text-amber-700",
      submitted: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleViewFullDetails = (order) => {
    if (order.orderType === 'order') {
      navigate(createPageUrl("OrderStatus"), { state: { orderId: order.id } });
    } else if (order.orderType === 'group_order') {
      navigate(createPageUrl("ManageGroupOrder") + `?id=${order.id}`);
    }
  };

  const handleReorder = async (order) => {
    if (order.orderType !== 'order' || !order.items) {
      toast.error("Cannot reorder this type of order");
      return;
    }

    setReordering(true);
    try {
      // Verify items still exist and are available
      const itemIds = order.items.map(item => item.menu_item_id);
      const menuItems = await MenuItem.list();
      const availableItems = menuItems.filter(mi => 
        itemIds.includes(mi.id) && mi.available
      );

      // Map order items to cart format
      const cartItems = order.items
        .filter(item => availableItems.find(mi => mi.id === item.menu_item_id))
        .map(item => {
          const menuItem = availableItems.find(mi => mi.id === item.menu_item_id);
          return {
            id: Date.now().toString() + Math.random(),
            menu_item_id: item.menu_item_id,
            name: item.name,
            price: menuItem?.price || item.price,
            image_url: menuItem?.image_url,
            quantity: item.quantity,
            customizations: {},
            modifiers: item.modifiers || [],
            special_instructions: item.special_instructions || "",
            total_price: menuItem?.price || item.price
          };
        });

      if (cartItems.length === 0) {
        toast.error("Items are no longer available");
        setReordering(false);
        return;
      }

      if (cartItems.length < order.items.length) {
        toast.info(`${order.items.length - cartItems.length} item(s) no longer available`);
      }

      // Navigate to menu with pre-filled cart
      navigate(createPageUrl("OrderMenu"), { state: { cart: cartItems } });
      toast.success("Items added to cart!");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to reorder");
    }
    setReordering(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">Order History</h1>
            <p className="text-slate-600 text-sm sm:text-base">View all your past orders and group orders</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Filter by Type
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="order">Regular Orders</SelectItem>
                    <SelectItem value="group_order">Group Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Sort by
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Highest Amount</SelectItem>
                    <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Orders Found</h3>
              <p className="text-slate-600 mb-6">
                {filterType === "all"
                  ? "You haven't placed any orders yet."
                  : `You have no ${filterType === "order" ? "regular" : "group"} orders.`}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("OrderMenu"))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Place an Order
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOrderClick(order)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {order.orderType === "group_order" ? (
                          <Users className="w-5 h-5 text-purple-600" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        )}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {order.displayName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {order.orderType === "group_order" ? "Group Order" : "Regular Order"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-3">
                        <div>
                          <p className="text-sm text-slate-600">Restaurant</p>
                          <p className="font-medium text-slate-900">
                            {order.restaurant_name || "Restaurant"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Date</p>
                          <p className="font-medium text-slate-900 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(order.displayDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Amount</p>
                          <p className="font-medium text-slate-900">
                            ${(order.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Status</p>
                          <Badge className={getStatusBadgeColor(order.displayStatus)}>
                            {order.displayStatus}
                          </Badge>
                        </div>
                      </div>

                      {order.orderType === "group_order" && (
                        <div className="mt-3 text-sm text-slate-600">
                          Party Members: {order.party_members?.length || 0}
                        </div>
                      )}

                      {order.orderType === "order" && order.items && (
                        <div className="mt-3 text-sm text-slate-600">
                          <Package className="w-4 h-4 inline mr-1" />
                          {order.items.length} item(s)
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {order.orderType === "order" && order.items && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorder(order);
                            }}
                            disabled={reordering}
                          >
                            <RefreshCw className={`w-4 h-4 mr-1 ${reordering ? 'animate-spin' : ''}`} />
                            Reorder
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">Order ID</p>
                  <p className="font-semibold">#{selectedOrder.id.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.displayDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <Badge className={getStatusBadgeColor(selectedOrder.displayStatus)}>
                    {selectedOrder.displayStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="font-bold text-emerald-600">
                    ${(selectedOrder.total_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedOrder.orderType === "order" && selectedOrder.items && (
                <div>
                  <h4 className="font-semibold mb-3">Items Ordered</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                          {item.special_instructions && (
                            <p className="text-xs text-amber-600 mt-1">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-emerald-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.delivery_type && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Delivery Type</p>
                  <p className="font-semibold capitalize">{selectedOrder.delivery_type}</p>
                </div>
              )}

              {selectedOrder.delivery_address && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Delivery Address</p>
                  <p className="text-sm">
                    {selectedOrder.delivery_address.street}<br />
                    {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state} {selectedOrder.delivery_address.zip}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                {selectedOrder.orderType === "order" && selectedOrder.items && (
                  <Button
                    onClick={() => {
                      handleReorder(selectedOrder);
                      setShowDetails(false);
                    }}
                    disabled={reordering}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${reordering ? 'animate-spin' : ''}`} />
                    Reorder
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleViewFullDetails(selectedOrder);
                    setShowDetails(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}