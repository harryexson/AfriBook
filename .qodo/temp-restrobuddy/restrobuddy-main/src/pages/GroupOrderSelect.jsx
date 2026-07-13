import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GroupOrder } from "@/entities/GroupOrder";
import { MenuItem } from "@/entities/MenuItem";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  Store,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  AlertCircle,
  User,
  ChevronDown
} from "lucide-react";
import ItemCustomizer from "@/components/grouporder/ItemCustomizer";

const categories = [
  { value: "all", label: "All Items" },
  { value: "appetizers", label: "Appetizers" },
  { value: "entrees", label: "Entrées" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" }
];

export default function GroupOrderSelect() {
  const navigate = useNavigate();
  const [groupOrder, setGroupOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [member, setMember] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGroupOrder();
  }, []);

  const loadGroupOrder = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const memberId = urlParams.get("memberId");

      if (!token || !memberId) {
        setError("Invalid invitation link");
        setIsLoading(false);
        return;
      }

      // Find group order by share link
      const orders = await GroupOrder.filter({});
      const order = orders.find(o => o.share_link?.includes(token));

      if (!order) {
        setError("Group order not found or has expired");
        setIsLoading(false);
        return;
      }

      // Find the member
      const foundMember = order.party_members?.find(m => m.id === memberId);
      if (!foundMember) {
        setError("You are not part of this group order");
        setIsLoading(false);
        return;
      }

      // Check if already submitted
      if (foundMember.status === "submitted") {
        setIsSubmitted(true);
        setCart(foundMember.items || []);
      }

      // Check deadline
      if (new Date(order.deadline) < new Date() && order.status === "collecting") {
        setError("The deadline for this group order has passed");
        setIsLoading(false);
        return;
      }

      // Check order status - allow users to view/edit if order is collecting or closed
      if (!["collecting", "closed"].includes(order.status)) {
        setError("This group order is no longer accepting selections");
        setIsLoading(false);
        return;
      }

      setGroupOrder(order);
      setMember(foundMember);

      // Subscribe to real-time updates
      const unsubscribe = GroupOrder.subscribe((event) => {
        if (event.data.id === order.id && (event.type === 'update' || event.type === 'create')) {
          setGroupOrder(event.data);
        }
      });

      // Load menu items for the restaurant from marketplace
      let items = await MenuItem.filter({ restaurant_id: order.restaurant_id, available: true });
      
      // If no items found with restaurant_id, try to find the restaurant and load its menu
      if (items.length === 0 && order.restaurant_id) {
        try {
          const restaurants = await Restaurant.filter({ id: order.restaurant_id });
          if (restaurants.length > 0 && restaurants[0].marketplace_enabled) {
            // Restaurant exists in marketplace, menu might just be empty
            items = [];
          }
        } catch (e) {
          console.log("Could not verify restaurant");
        }
      }
      
      setMenuItems(items);

      // Update member status to viewed
      if (foundMember.status === "pending") {
        const updatedMembers = order.party_members.map(m =>
          m.id === memberId ? { ...m, status: "viewed" } : m
        );
        await GroupOrder.update(order.id, { party_members: updatedMembers });
      }

    } catch (err) {
      console.error("Error loading group order:", err);
      setError("Failed to load group order");
    }
    setIsLoading(false);
  };

  const filteredItems = menuItems.filter(item =>
    activeCategory === "all" || item.category === activeCategory
  );

  const addToCart = (customizedItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === customizedItem.menu_item_id);
      if (existing) {
        return prev.map(item =>
          item.menu_item_id === customizedItem.menu_item_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        menu_item_id: customizedItem.menu_item_id,
        name: customizedItem.name,
        price: customizedItem.price,
        quantity: 1,
        customizations: customizedItem.customizations || {}
      }];
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menu_item_id !== menuItemId);
    });
  };

  const getCartQuantity = (menuItemId) => {
    const item = cart.find(item => item.menu_item_id === menuItemId);
    return item ? item.quantity : 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + ((item.customizations?.total_price || item.price) * item.quantity), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert("Please select at least one item");
      return;
    }

    setIsSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const memberId = urlParams.get("memberId");

      const updatedMembers = groupOrder.party_members.map(m =>
        m.id === memberId
          ? {
              ...m,
              status: "submitted",
              items: cart.map(item => ({
                menu_item_id: item.menu_item_id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                customizations: item.customizations,
                added_by: member.email,
                added_by_name: member.name,
                added_at: new Date().toISOString()
              })),
              subtotal: subtotal,
              submitted_at: new Date().toISOString()
            }
          : m
      );

      // Calculate new totals
      const newSubtotal = updatedMembers.reduce((sum, m) => sum + (m.subtotal || 0), 0);
      const tax = newSubtotal * 0.08;
      const totalItemsCount = updatedMembers.reduce((sum, m) => {
        return sum + (m.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
      }, 0);

      await GroupOrder.update(groupOrder.id, {
        party_members: updatedMembers,
        subtotal: newSubtotal,
        tax: tax,
        total_amount: newSubtotal + tax,
        total_items_count: totalItemsCount,
        activity_log: [
          ...(groupOrder.activity_log || []),
          {
            timestamp: new Date().toISOString(),
            action: "member_submitted",
            user_name: member.name,
            user_email: member.email,
            details: `${member.name} submitted their selection (${cart.length} items, $${subtotal.toFixed(2)})`
          }
        ]
      });

      // Notify the organizer by email
      try {
        await base44.integrations.Core.SendEmail({
          to: groupOrder.organizer_email,
          subject: `👍 ${member.name} submitted their order for "${groupOrder.title}"`,
          body: `Hi ${groupOrder.organizer_name},\n\n${member.name} just submitted their selection for the group order "${groupOrder.title}"!\n\nThey ordered ${cart.length} item(s) totaling $${subtotal.toFixed(2)}.\n\nLog in to RESTROBUDDY to see the full order status and submit when everyone is ready.\n\nRESTROBUDDY`
        });
      } catch (e) {
        console.error('Failed to notify organizer:', e);
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting selection:", err);
      alert("Failed to submit your selection. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops!</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selection Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Your food selection has been submitted to the group order.
              {groupOrder?.organizer_name} will submit the final order once everyone has made their selections.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold mb-3">Your Selection:</h3>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                <span>Your Total:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
            
            {groupOrder?.status === "collecting" && (
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full mb-4"
              >
                Edit My Selection
              </Button>
            )}
            
            <p className="text-sm text-slate-500">
              You can close this page now. You'll receive a confirmation email when the order is submitted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{groupOrder?.title}</h1>
                <p className="text-sm text-slate-600">{groupOrder?.restaurant_name}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-slate-500">
                    👥 {groupOrder?.party_members?.filter(m => m.status === 'submitted').length || 0} / {groupOrder?.party_members?.length || 0} submitted
                  </span>
                  <span className="text-xs text-slate-500">
                    🍔 {groupOrder?.total_items_count || 0} items total
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span>Ordering as <strong>{member?.name}</strong></span>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="w-3 h-3" />
                Deadline: {new Date(groupOrder?.deadline).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="w-full justify-start bg-white p-2 rounded-xl shadow overflow-x-auto flex-nowrap">
                {categories.map(cat => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white whitespace-nowrap"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const quantity = getCartQuantity(item.id);
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                        <span className="font-bold text-purple-600">${item.price?.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                      
                      {quantity > 0 ? (
                        <div className="flex items-center justify-center gap-4 bg-purple-50 rounded-lg p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => addToCart(item)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => addToCart({ menu_item_id: item.id, name: item.name, price: item.price })}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                          <ItemCustomizer
                            item={item}
                            onCustomize={(customized) => {
                              addToCart(customized);
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No items available in this category</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Your Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Add items to your selection</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="border-b pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${((item.customizations?.total_price || item.price) * item.quantity).toFixed(2)}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 text-xs p-0 h-auto"
                              onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        {item.customizations && (
                          <div className="text-xs text-slate-600 space-y-1">
                            {Object.entries(item.customizations.variations || {}).length > 0 && (
                              <p>Variations: {Object.entries(item.customizations.variations).map(([k, v]) => `${v}`).join(", ")}</p>
                            )}
                            {item.customizations.add_ons?.length > 0 && (
                              <p>Add-ons: {item.customizations.add_ons.join(", ")}</p>
                            )}
                            {item.customizations.special_instructions && (
                              <p className="italic">Note: {item.customizations.special_instructions}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="text-sm font-medium text-slate-700">Special Instructions</label>
                      <Textarea
                        placeholder="Any allergies or special requests..."
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold mb-4">
                        <span>Your Total</span>
                        <span className="text-purple-600">${subtotal.toFixed(2)}</span>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || cart.length === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6"
                      >
                        {isSubmitting ? "Submitting..." : "Submit My Selection"}
                      </Button>

                      <p className="text-xs text-center text-slate-500 mt-3">
                        {groupOrder?.organizer_name} will pay for the entire order
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}