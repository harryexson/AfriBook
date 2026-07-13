import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { 
  User as UserIcon,
  Phone,
  Mail,
  Star,
  Shield,
  Edit,
  Save,
  X,
  Sparkles,
  Utensils,
  MapPin,
  CreditCard,
  Car,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import FoodPreferencesCard from "../components/profile/FoodPreferencesCard";
import SavedAddressesCard from "../components/profile/SavedAddressesCard";
import PaymentMethodsCard from "../components/profile/PaymentMethodsCard";
import FavoriteRestaurantsCard from "../components/profile/FavoriteRestaurantsCard";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rideStats, setRideStats] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setEditedUser({ ...currentUser });

      // Load ride statistics
      const rides = await base44.entities.Ride.filter({ rider_id: currentUser.id }, '-created_date', 500);
      const completedRides = rides.filter(r => r.status === 'completed');
      const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare?.total_fare || 0), 0);
      const totalDistance = completedRides.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      const totalTime = completedRides.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);

      setRideStats({
        totalRides: completedRides.length,
        totalSpent,
        totalDistance,
        totalTime,
        favoriteRideType: getMostCommon(completedRides.map(r => r.ride_type))
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMostCommon = (arr) => {
    if (!arr.length) return 'standard';
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'standard';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe(editedUser);
      setUser(editedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user data:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const updateFoodPreferences = (prefs) => {
    setEditedUser({ ...editedUser, food_preferences: prefs });
  };

  const updateSavedAddresses = (addresses) => {
    setEditedUser({ ...editedUser, saved_addresses: addresses });
  };

  const updatePaymentMethods = (methods) => {
    setEditedUser({ ...editedUser, payment_methods: methods });
  };

  const updateFavoriteRestaurants = (ids) => {
    setEditedUser({
      ...editedUser,
      food_preferences: {
        ...editedUser?.food_preferences,
        favorite_restaurants: ids
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user?.full_name || 'User'}
                    </h2>
                    <Badge className="bg-blue-100 text-blue-800 capitalize">
                      {user?.user_type || 'rider'}
                    </Badge>
                    {user?.is_prime_member && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Prime
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </div>
                    {user?.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {user.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {user?.average_rating?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Ride Statistics */}
        {rideStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{rideStats.totalRides}</p>
                  <p className="text-sm text-blue-700">Total Rides</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">${rideStats.totalSpent.toFixed(0)}</p>
                  <p className="text-sm text-green-700">Total Spent</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900">{rideStats.totalDistance.toFixed(0)} km</p>
                  <p className="text-sm text-purple-700">Distance Traveled</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-900">{Math.round(rideStats.totalTime / 60)}h</p>
                  <p className="text-sm text-orange-700">Time on Road</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Profile Details */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="food">
              <Utensils className="w-4 h-4 mr-1 hidden sm:inline" />
              Food
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="w-4 h-4 mr-1 hidden sm:inline" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="w-4 h-4 mr-1 hidden sm:inline" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser?.full_name || ''}
                        onChange={(e) => setEditedUser({...editedUser, full_name: e.target.value})}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        value={editedUser?.phone || ''}
                        onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{user?.phone || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <p className="text-gray-500 py-2">{user?.email} (cannot be changed)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <Badge className="bg-blue-100 text-blue-800 capitalize">
                      {user?.user_type || 'rider'}
                    </Badge>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedUser?.emergency_contact?.name || ''}
                          onChange={(e) => setEditedUser({
                            ...editedUser, 
                            emergency_contact: {
                              ...editedUser?.emergency_contact,
                              name: e.target.value
                            }
                          })}
                          placeholder="Emergency contact name"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {user?.emergency_contact?.name || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedUser?.emergency_contact?.phone || ''}
                          onChange={(e) => setEditedUser({
                            ...editedUser, 
                            emergency_contact: {
                              ...editedUser?.emergency_contact,
                              phone: e.target.value
                            }
                          })}
                          placeholder="Emergency contact phone"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {user?.emergency_contact?.phone || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Account Verified</h4>
                    <p className="text-sm text-gray-600">Your account has been verified</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                
                {user?.is_prime_member && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-purple-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4"/>Prime Member
                      </h4>
                      <p className="text-sm text-purple-700">You have access to priority support and exclusive benefits.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food Preferences */}
          <TabsContent value="food" className="space-y-6">
            <FoodPreferencesCard
              preferences={isEditing ? editedUser?.food_preferences : user?.food_preferences}
              isEditing={isEditing}
              onChange={updateFoodPreferences}
            />
            <FavoriteRestaurantsCard
              favoriteIds={isEditing ? editedUser?.food_preferences?.favorite_restaurants : user?.food_preferences?.favorite_restaurants}
              isEditing={isEditing}
              onChange={updateFavoriteRestaurants}
            />
          </TabsContent>

          {/* Saved Addresses */}
          <TabsContent value="addresses" className="space-y-6">
            <SavedAddressesCard
              addresses={isEditing ? editedUser?.saved_addresses : user?.saved_addresses}
              isEditing={isEditing}
              onChange={updateSavedAddresses}
            />
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentMethodsCard
              methods={isEditing ? editedUser?.payment_methods : user?.payment_methods}
              isEditing={isEditing}
              onChange={updatePaymentMethods}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}