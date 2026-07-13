import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerProfile } from "@/entities/CustomerProfile";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Order } from "@/entities/Order";
import { MenuItem } from "@/entities/MenuItem";
import { Restaurant } from "@/entities/Restaurant";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  User, Heart, MapPin, Bell, Star, TrendingUp, 
  ShoppingBag, Edit, Save, Plus, X, Home as HomeIcon, 
  Briefcase, MapPinned, Utensils, Clock, DollarSign, Award, Gift, Sparkles, Trophy, Crown, ArrowRight
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [pointsTransactions, setPointsTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    street: "",
    apt_suite: "",
    city: "",
    state: "",
    zip: "",
    delivery_instructions: "",
    is_default: false
  });

  const tierInfo = {
    bronze: { name: "Bronze", color: "from-amber-700 to-amber-600", icon: Award },
    silver: { name: "Silver", color: "from-slate-400 to-slate-500", icon: Star },
    gold: { name: "Gold", color: "from-yellow-500 to-yellow-600", icon: Trophy },
    platinum: { name: "Platinum", color: "from-purple-500 to-purple-600", icon: Crown }
  };

  const addressIcon = {
    "Home": HomeIcon,
    "Work": Briefcase,
    "Other": MapPinned
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let profiles = await CustomerProfile.filter({ user_email: currentUser.email });
      let customerProfile;

      if (profiles.length === 0) {
        customerProfile = await CustomerProfile.create({
          user_email: currentUser.email,
          full_name: currentUser.full_name,
          phone: currentUser.phone || "",
          customer_since: new Date().toISOString().split('T')[0]
        });
      } else {
        customerProfile = profiles[0];
      }

      setProfile(customerProfile);
      setEditedProfile(customerProfile);

      try {
        const members = await LoyaltyMember.filter({ email: currentUser.email });
        if (members.length > 0) {
          setLoyaltyMember(members[0]);
          
          const transactions = await PointsTransaction.filter(
            { loyalty_member_id: members[0].id },
            "-created_date",
            10
          );
          setPointsTransactions(transactions);
        }
      } catch (err) {
        console.log("No loyalty member found");
      }

      const [marketplaceOrders, regularOrders] = await Promise.all([
        MarketplaceOrder.filter({ customer_email: currentUser.email }, "-created_date", 50),
        currentUser.phone ? Order.filter({ customer_phone: currentUser.phone }, "-created_date", 50) : Promise.resolve([])
      ]);

      const allOrders = [...marketplaceOrders, ...regularOrders]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setOrders(allOrders);

      const totalSpent = allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = allOrders.length > 0 ? totalSpent / allOrders.length : 0;
      
      if (profiles.length > 0 && allOrders.length > 0) {
        await CustomerProfile.update(customerProfile.id, {
          total_orders: allOrders.length,
          total_spent: totalSpent,
          average_order_value: avgOrderValue,
          last_order_date: allOrders[0].created_date.split('T')[0]
        });
      }

      if (customerProfile.favorite_items && customerProfile.favorite_items.length > 0) {
        const itemIds = customerProfile.favorite_items.map(f => f.menu_item_id);
        const menuItems = await MenuItem.list();
        const favItems = menuItems.filter(item => itemIds.includes(item.id));
        
        const restaurantIds = [...new Set(favItems.map(item => item.restaurant_id).filter(Boolean))];
        const restaurants = await Restaurant.list();
        const restaurantMap = new Map(restaurants.map(r => [r.id, r]));
        
        const enrichedFavorites = favItems.map(item => ({
          ...item,
          restaurant: restaurantMap.get(item.restaurant_id)
        }));
        
        setFavoriteItems(enrichedFavorites);
      }

    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await CustomerProfile.update(profile.id, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }
    setIsSaving(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedAddresses = [...(editedProfile.delivery_addresses || []), newAddress];
    
    if (updatedAddresses.length === 1) {
      updatedAddresses[0].is_default = true;
    }

    setEditedProfile({ ...editedProfile, delivery_addresses: updatedAddresses });
    setNewAddress({
      label: "Home",
      street: "",
      apt_suite: "",
      city: "",
      state: "",
      zip: "",
      delivery_instructions: "",
      is_default: false
    });
    setShowAddressDialog(false);
  };

  const handleRemoveAddress = (index) => {
    const updatedAddresses = editedProfile.delivery_addresses.filter((_, i) => i !== index);
    setEditedProfile({ ...editedProfile, delivery_addresses: updatedAddresses });
  };

  const handleSetDefaultAddress = (index) => {
    const updatedAddresses = editedProfile.delivery_addresses.map((addr, i) => ({
      ...addr,
      is_default: i === index
    }));
    setEditedProfile({ ...editedProfile, delivery_addresses: updatedAddresses });
  };

  const handleRemoveFavorite = async (menuItemId) => {
    const updatedFavorites = profile.favorite_items.filter(f => f.menu_item_id !== menuItemId);
    await CustomerProfile.update(profile.id, { favorite_items: updatedFavorites });
    setProfile({ ...profile, favorite_items: updatedFavorites });
    setFavoriteItems(favoriteItems.filter(item => item.id !== menuItemId));
  };

  const handleOrderAgain = (order) => {
    if (order.restaurant_id) {
      navigate(createPageUrl(`MarketplaceRestaurant?id=${order.restaurant_id}`));
    } else {
      navigate(createPageUrl("OrderMenu"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const currentTierInfo = loyaltyMember ? tierInfo[loyaltyMember.tier] : null;
  const TierIcon = currentTierInfo ? currentTierInfo.icon : Award;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">My Profile</h1>
            <p className="text-slate-600">Manage your account and preferences</p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            Back
          </Button>
        </div>

        {loyaltyMember && currentTierInfo && (
          <Card 
            className={`border-0 shadow-2xl bg-gradient-to-br ${currentTierInfo.color} text-white mb-8 cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => navigate(createPageUrl("LoyaltyProgram"))}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <TierIcon className="w-12 h-12" />
                  <div>
                    <p className="text-sm text-white/80 mb-1">Loyalty Program</p>
                    <h3 className="text-2xl font-bold">{currentTierInfo.name} Member</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{loyaltyMember.points_balance} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{loyaltyMember.visit_count} orders</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Button variant="ghost" className="text-white hover:bg-white/20">
                    View Rewards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{profile?.total_orders || 0}</p>
              {profile?.last_order_date && (
                <p className="text-sm text-emerald-100 mt-2">
                  Last: {format(new Date(profile.last_order_date), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${(profile?.total_spent || 0).toFixed(2)}</p>
              {profile?.average_order_value > 0 && (
                <p className="text-sm text-blue-100 mt-2">
                  Avg: ${profile.average_order_value.toFixed(2)} per order
                </p>
              )}
            </CardContent>
          </Card>

          {loyaltyMember && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Loyalty Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{loyaltyMember.points_balance}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30">
                    <TierIcon className="w-3 h-3 mr-1" />
                    {currentTierInfo.name} Tier
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="profile" className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger value="profile" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            {loyaltyMember && (
              <TabsTrigger value="loyalty" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Gift className="w-4 h-4 mr-2" />
                Loyalty
              </TabsTrigger>
            )}
            <TabsTrigger value="favorites" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => { setIsEditing(false); setEditedProfile(profile); }} variant="outline">
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={isEditing ? editedProfile.full_name : profile.full_name}
                      onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={isEditing ? editedProfile.phone : profile.phone}
                      onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="mt-2 bg-slate-100" />
                    <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label>Member Since</Label>
                    <Input 
                      value={profile.customer_since ? format(new Date(profile.customer_since), 'MMMM d, yyyy') : 'N/A'} 
                      disabled 
                      className="mt-2 bg-slate-100" 
                    />
                  </div>

                  {isEditing && (
                    <>
                      <div className="md:col-span-2">
                        <Label htmlFor="dietary">Dietary Preferences</Label>
                        <Input
                          id="dietary"
                          value={(editedProfile.dietary_preferences || []).join(', ')}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile, 
                            dietary_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="e.g., Vegetarian, Vegan, Gluten-Free"
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="allergies">Allergies</Label>
                        <Input
                          id="allergies"
                          value={(editedProfile.allergies || []).join(', ')}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile, 
                            allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="e.g., Peanuts, Shellfish, Dairy"
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
                      </div>
                    </>
                  )}

                  {!isEditing && profile.dietary_preferences && profile.dietary_preferences.length > 0 && (
                    <div className="md:col-span-2">
                      <Label>Dietary Preferences</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.dietary_preferences.map((pref, idx) => (
                          <Badge key={idx} variant="outline">{pref}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isEditing && profile.allergies && profile.allergies.length > 0 && (
                    <div className="md:col-span-2">
                      <Label>Allergies</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.allergies.map((allergy, idx) => (
                          <Badge key={idx} className="bg-red-100 text-red-800">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {loyaltyMember && (
            <TabsContent value="loyalty">
              <div className="space-y-6">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Gift className="w-6 h-6 text-emerald-600" />
                      Loyalty Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                        <Star className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                        <div className="text-4xl font-bold text-emerald-600 mb-2">
                          {loyaltyMember.points_balance}
                        </div>
                        <p className="text-slate-600">Available Points</p>
                      </div>
                      
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                        <TierIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {currentTierInfo.name}
                        </div>
                        <p className="text-slate-600">Current Tier</p>
                      </div>

                      <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                        <DollarSign className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                        <div className="text-4xl font-bold text-amber-600 mb-2">
                          ${loyaltyMember.lifetime_spend?.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-slate-600">Lifetime Spend</p>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <Button 
                        onClick={() => navigate(createPageUrl("LoyaltyProgram"))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6"
                      >
                        <Gift className="w-5 h-5 mr-2" />
                        View All Rewards & Benefits
                      </Button>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Recent Points Activity
                      </h3>
                      {pointsTransactions.length === 0 ? (
                        <p className="text-slate-600 text-center py-8">No points activity yet</p>
                      ) : (
                        <div className="space-y-2">
                          {pointsTransactions.map(transaction => (
                            <div key={transaction.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {transaction.transaction_type === 'earned' && (
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                )}
                                {transaction.transaction_type === 'redeemed' && (
                                  <Gift className="w-5 h-5 text-purple-600" />
                                )}
                                {transaction.transaction_type === 'bonus' && (
                                  <Sparkles className="w-5 h-5 text-amber-600" />
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {transaction.description || transaction.transaction_type}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {format(new Date(transaction.created_date), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className={`text-xl font-bold ${
                                transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          <TabsContent value="favorites">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Favorite Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">No favorites yet</p>
                    <p className="text-slate-600 mb-6">Start adding your favorite items from restaurants</p>
                    <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-emerald-600 hover:bg-emerald-700">
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteItems.map(item => (
                      <Card key={item.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-slate-100">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Utensils className="w-12 h-12 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                          {item.restaurant && (
                            <p className="text-sm text-slate-600 mb-2">{item.restaurant.business_name}</p>
                          )}
                          <p className="text-emerald-600 font-bold mb-3">${item.price.toFixed(2)}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => item.restaurant_id && navigate(createPageUrl(`MarketplaceRestaurant?id=${item.restaurant_id}`))}
                            >
                              Order Again
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFavorite(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                    Delivery Addresses
                  </CardTitle>
                  <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Label</Label>
                          <Select value={newAddress.label} onValueChange={(value) => setNewAddress({...newAddress, label: value})}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Street Address *</Label>
                          <Input
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            placeholder="123 Main St"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Apt/Suite</Label>
                          <Input
                            value={newAddress.apt_suite}
                            onChange={(e) => setNewAddress({...newAddress, apt_suite: e.target.value})}
                            placeholder="Apt 4B"
                            className="mt-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>City *</Label>
                            <Input
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>State *</Label>
                            <Input
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              placeholder="CA"
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Zip Code *</Label>
                          <Input
                            value={newAddress.zip}
                            onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                            placeholder="90210"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Delivery Instructions</Label>
                          <Textarea
                            value={newAddress.delivery_instructions}
                            onChange={(e) => setNewAddress({...newAddress, delivery_instructions: e.target.value})}
                            placeholder="e.g., Ring doorbell, Leave at door"
                            className="mt-2"
                          />
                        </div>
                        <Button onClick={handleAddAddress} className="w-full bg-emerald-600 hover:bg-emerald-700">
                          Save Address
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {(!editedProfile.delivery_addresses || editedProfile.delivery_addresses.length === 0) ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">No addresses saved</p>
                    <p className="text-slate-600 mb-6">Add your delivery addresses for faster checkout</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {editedProfile.delivery_addresses.map((addr, idx) => {
                      const IconComponent = addressIcon[addr.label];
                      return (
                        <Card key={idx} className={`border-2 ${addr.is_default ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                {IconComponent && <IconComponent className="w-4 h-4" />}
                                <span className="font-bold">{addr.label}</span>
                              </div>
                              <div className="flex gap-1">
                                {!addr.is_default && isEditing && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSetDefaultAddress(idx)}
                                  >
                                    Set Default
                                  </Button>
                                )}
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveAddress(idx)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {addr.is_default && (
                              <Badge className="bg-emerald-600 text-white mb-2">Default</Badge>
                            )}
                            <p className="text-sm text-slate-700">{addr.street}</p>
                            {addr.apt_suite && <p className="text-sm text-slate-700">{addr.apt_suite}</p>}
                            <p className="text-sm text-slate-700">
                              {addr.city}, {addr.state} {addr.zip}
                            </p>
                            {addr.delivery_instructions && (
                              <p className="text-xs text-slate-500 mt-2 italic">"{addr.delivery_instructions}"</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                {isEditing && editedProfile.delivery_addresses && editedProfile.delivery_addresses.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Clock className="w-6 h-6 text-blue-600" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">No orders yet</p>
                    <p className="text-slate-600 mb-6">Start ordering from amazing restaurants</p>
                    <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-emerald-600 hover:bg-emerald-700">
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map(order => (
                      <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-lg">#{order.id.slice(-6)}</p>
                              <p className="text-sm text-slate-600">
                                {format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}
                              </p>
                              {order.restaurant_name && (
                                <p className="text-sm text-emerald-600 font-semibold mt-1">
                                  {order.restaurant_name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge className={
                                order.status === 'completed' ? 'bg-green-500' :
                                order.status === 'ready' ? 'bg-blue-500' :
                                order.status === 'preparing' ? 'bg-purple-500' :
                                'bg-slate-500'
                              }>
                                {order.status}
                              </Badge>
                              <p className="font-bold text-xl text-emerald-600 mt-2">
                                ${order.total_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 mb-3">
                            {order.items && order.items.slice(0, 3).map((item, idx) => (
                              <p key={idx} className="text-sm text-slate-700">
                                {item.quantity}x {item.name}
                              </p>
                            ))}
                            {order.items && order.items.length > 3 && (
                              <p className="text-xs text-slate-500">+{order.items.length - 3} more items</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleOrderAgain(order)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Order Again
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bell className="w-6 h-6 text-purple-600" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">SMS Notifications</p>
                      <p className="text-sm text-slate-600">Receive order updates via text message</p>
                    </div>
                    <Switch
                      checked={editedProfile.notification_preferences?.sms_notifications !== false}
                      onCheckedChange={(checked) => setEditedProfile({
                        ...editedProfile,
                        notification_preferences: {
                          ...(editedProfile.notification_preferences || {}),
                          sms_notifications: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">Email Notifications</p>
                      <p className="text-sm text-slate-600">Receive order confirmations and receipts via email</p>
                    </div>
                    <Switch
                      checked={editedProfile.notification_preferences?.email_notifications !== false}
                      onCheckedChange={(checked) => setEditedProfile({
                        ...editedProfile,
                        notification_preferences: {
                          ...(editedProfile.notification_preferences || {}),
                          email_notifications: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">Order Updates</p>
                      <p className="text-sm text-slate-600">Get notified when your order status changes</p>
                    </div>
                    <Switch
                      checked={editedProfile.notification_preferences?.order_updates !== false}
                      onCheckedChange={(checked) => setEditedProfile({
                        ...editedProfile,
                        notification_preferences: {
                          ...(editedProfile.notification_preferences || {}),
                          order_updates: checked
                        }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">Promotional Offers</p>
                      <p className="text-sm text-slate-600">Receive special deals and promotions</p>
                    </div>
                    <Switch
                      checked={editedProfile.notification_preferences?.promotional_offers === true}
                      onCheckedChange={(checked) => setEditedProfile({
                        ...editedProfile,
                        notification_preferences: {
                          ...(editedProfile.notification_preferences || {}),
                          promotional_offers: checked
                        }
                      })}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}