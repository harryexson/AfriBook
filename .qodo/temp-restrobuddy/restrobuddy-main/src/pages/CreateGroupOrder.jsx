import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Restaurant } from "@/entities/Restaurant";
import { GroupOrder } from "@/entities/GroupOrder";
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
  Users,
  Plus,
  Trash2,
  Store,
  Send,
  UserPlus,
  PartyPopper
} from "lucide-react";

export default function CreateGroupOrder() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const prefilledRestaurantId = urlParams.get("restaurantId") || "";

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    restaurant_id: prefilledRestaurantId,
    title: "",
    deadline: "",
    pickup_time: "",
    min_participants: "",
    max_participants: "",
    delivery_type: "pickup",
    delivery_address: { street: "", city: "", state: "", zip: "", instructions: "" },
    notes: "",
    party_members: [{ id: crypto.randomUUID(), name: "", email: "" }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [user, restaurantList] = await Promise.all([
        base44.auth.me(),
        Restaurant.list()
      ]);
      setCurrentUser(user);
      // Show ALL restaurants for group ordering (not just marketplace-enabled)
      setRestaurants(restaurantList);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const addPartyMember = () => {
    setFormData(prev => ({
      ...prev,
      party_members: [...prev.party_members, { id: crypto.randomUUID(), name: "", email: "" }]
    }));
  };

  const removePartyMember = (index) => {
    if (formData.party_members.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      party_members: prev.party_members.filter((_, i) => i !== index)
    }));
  };

  const updatePartyMember = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      party_members: prev.party_members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.restaurant_id || !formData.title || !formData.deadline) {
      alert("Please fill in all required fields");
      return;
    }

    const validMembers = formData.party_members.filter(m => m.name && m.email);
    if (validMembers.length === 0) {
      alert("Please add at least one party member with name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      const restaurant = restaurants.find(r => r.id === formData.restaurant_id);
      const shareLink = `${window.location.origin}${createPageUrl("GroupOrderSelect")}?token=${crypto.randomUUID()}`;
      
      const groupOrder = await GroupOrder.create({
        restaurant_id: formData.restaurant_id,
        restaurant_name: restaurant?.business_name || "",
        organizer_name: currentUser?.full_name || "",
        organizer_email: currentUser?.email || "",
        title: formData.title,
        min_participants: formData.min_participants ? parseInt(formData.min_participants) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        deadline: formData.deadline,
        pickup_time: formData.pickup_time || null,
        delivery_type: formData.delivery_type,
        delivery_address: formData.delivery_type === "delivery" ? formData.delivery_address : null,
        notes: formData.notes,
        party_members: validMembers.map(m => ({
          ...m,
          status: "pending",
          items: [],
          subtotal: 0
        })),
        status: "collecting",
        subtotal: 0,
        total_items_count: 0,
        total_amount: 0,
        share_link: shareLink,
        activity_log: [{
          timestamp: new Date().toISOString(),
          action: "created",
          user_name: currentUser?.full_name || "",
          user_email: currentUser?.email || "",
          details: `Group order "${formData.title}" created with ${validMembers.length} invited members`
        }]
      });

      // Send invitation emails directly to each member with their personal link
      const deadlineStr = new Date(formData.deadline).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
      const emailPromises = validMembers.map(member => {
        const memberLink = `${shareLink}&memberId=${member.id}`;
        const deliveryLine = formData.delivery_type === "delivery"
          ? `🚚 Delivery to: ${formData.delivery_address.street}, ${formData.delivery_address.city}`
          : `🏪 Pickup from: ${restaurant?.business_name}`;
        const body = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️  GROUP ORDER INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi ${member.name},

${currentUser?.full_name || "Someone"} has invited you to join a group order!

┌─────────────────────────────┐
  📋  ${formData.title}
  🏪  ${restaurant?.business_name}
  ${deliveryLine}
  ⏰  Deadline: ${deadlineStr}
└─────────────────────────────┘

HOW IT WORKS:
1️⃣  Click your personal link below
2️⃣  Browse the full menu & add your items
3️⃣  Submit before the deadline
4️⃣  The organizer places one combined order

👉  ADD YOUR ORDER:
${memberLink}

${formData.notes ? `📝 Note from organizer: "${formData.notes}"\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Questions? Contact ${currentUser?.full_name || "the organizer"}.
RESTROBUDDY — Smarter Restaurant Ordering`;
        return base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `🍽️ ${currentUser?.full_name || "Someone"} invited you to a group order at ${restaurant?.business_name}`,
          body
        }).catch(e => console.error(`Failed to send invite to ${member.email}:`, e));
      });

      await Promise.all(emailPromises);

      navigate(createPageUrl("ManageGroupOrder") + `?id=${groupOrder.id}`);
    } catch (error) {
      console.error("Error creating group order:", error);
      alert("Failed to create group order. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create Group Order</h1>
              <p className="text-slate-600">Invite your party to order together</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Details */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-purple-600" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Order Title *</Label>
                <Input
                  placeholder="e.g., Team Lunch, Birthday Party, Office Meeting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Select Restaurant *</Label>
                <Select
                  value={formData.restaurant_id}
                  onValueChange={(value) => setFormData({ ...formData, restaurant_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a restaurant from marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                   {restaurants.length === 0 ? (
                     <div className="p-4 text-center text-slate-500 text-sm">
                       No restaurants available
                     </div>
                   ) : (
                     restaurants.map(restaurant => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            <span>{restaurant.business_name}</span>
                            {restaurant.cuisine_type?.length > 0 && (
                              <span className="text-xs text-slate-500">
                                ({restaurant.cuisine_type.slice(0, 2).join(", ")})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose any restaurant to create a group order
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Selection Deadline *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">When members must submit by</p>
                </div>
                <div>
                  <Label>Pickup/Delivery Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.pickup_time}
                    onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Participants (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 5"
                    value={formData.min_participants}
                    onChange={(e) => setFormData({ ...formData, min_participants: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum people required
                  </p>
                </div>
                <div>
                  <Label>Maximum Participants (Optional)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 20"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maximum people allowed
                  </p>
                </div>
              </div>

              <div>
                <Label>Order Type</Label>
                <Select
                  value={formData.delivery_type}
                  onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">🏪 Pickup</SelectItem>
                    <SelectItem value="delivery">🚚 Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.delivery_type === "delivery" && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900">Delivery Address</h4>
                  <Input
                    placeholder="Street Address"
                    value={formData.delivery_address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      delivery_address: { ...formData.delivery_address, street: e.target.value }
                    })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="City"
                      value={formData.delivery_address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, city: e.target.value }
                      })}
                    />
                    <Input
                      placeholder="State"
                      value={formData.delivery_address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, state: e.target.value }
                      })}
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    value={formData.delivery_address.zip}
                    onChange={(e) => setFormData({
                      ...formData,
                      delivery_address: { ...formData.delivery_address, zip: e.target.value }
                    })}
                  />
                  <Textarea
                    placeholder="Delivery Instructions (gate code, apartment number, etc.)"
                    value={formData.delivery_address.instructions}
                    onChange={(e) => setFormData({
                      ...formData,
                      delivery_address: { ...formData.delivery_address, instructions: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              )}

              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any special instructions or notes for the group..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Party Members */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  Party Members
                </CardTitle>
                <Badge className="bg-purple-100 text-purple-800">
                  {formData.party_members.filter(m => m.name && m.email).length} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.party_members.map((member, index) => (
                <div key={member.id} className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={member.name}
                        onChange={(e) => updatePartyMember(index, "name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={member.email}
                        onChange={(e) => updatePartyMember(index, "email", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePartyMember(index)}
                    disabled={formData.party_members.length <= 1}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addPartyMember}
                className="w-full border-dashed border-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Member
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? (
                <>Sending Invitations...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create & Send Invitations
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}