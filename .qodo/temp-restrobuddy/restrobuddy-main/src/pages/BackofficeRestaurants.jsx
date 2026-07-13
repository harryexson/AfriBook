import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store, ArrowLeft, MapPin, Star, DollarSign,
  CheckCircle, XCircle, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function BackofficeRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRestaurants();
  }, [restaurants, subscriptions, searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Verify developer access
      const user = await base44.auth.me();
      const isDeveloper = user.role === "admin" ||
                          user.email === "harryxson@hotmail.com" ||
                          user.email === "harryexson@hotmail.com" ||
                          user.email === "developer@restrobuddy.com" ||
                          user.email.endsWith("@restrobuddy.com");
      
      if (!isDeveloper) {
        alert("Access denied. Developer-only area.");
        window.location.href = "/";
        return;
      }
      
      // Load ALL restaurants using service role
      const allRestaurants = await base44.asServiceRole.entities.Restaurant.list("-created_date");
      console.log("Raw restaurants loaded:", allRestaurants);
      setRestaurants(allRestaurants);
      
      // Load ALL subscriptions
      const allSubs = await base44.asServiceRole.entities.Subscription.list();
      console.log("Raw subscriptions loaded:", allSubs);
      setSubscriptions(allSubs);
      
      console.log(`Loaded ${allRestaurants.length} restaurants and ${allSubs.length} subscriptions`);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const filterRestaurants = () => {
    let filtered = [...restaurants];

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Enrich with subscription data
    const enriched = filtered.map(restaurant => {
      const subscription = subscriptions.find(s => s.restaurant_id === restaurant.id);
      return { ...restaurant, subscription };
    });

    setFilteredRestaurants(enriched);
  };

  const getStatusBadge = (restaurant) => {
    if (restaurant.subscription) {
      const sub = restaurant.subscription;
      switch (sub.status) {
        case "active":
          return <Badge className="bg-green-100 text-green-800">Active Subscription</Badge>;
        case "trial":
          return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
        case "trial_expired":
          return <Badge className="bg-amber-100 text-amber-800">Trial Expired</Badge>;
        case "past_due":
          return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
        case "cancelled":
          return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
        default:
          return <Badge className="bg-slate-100 text-slate-800">{sub.status}</Badge>;
      }
    }
    return <Badge className="bg-slate-100 text-slate-600">No Subscription</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-emerald-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Store className="w-8 h-8" />
            All Restaurants
          </h1>
          <p className="text-emerald-100 mt-1">Manage all restaurants on the platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Restaurants</p>
                  <p className="text-2xl font-bold text-slate-900">{restaurants.length}</p>
                </div>
                <Store className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">With Active Subscription</p>
                  <p className="text-2xl font-bold text-green-600">
                    {restaurants.filter(r => {
                      const sub = subscriptions.find(s => s.restaurant_id === r.id);
                      return sub && sub.status === 'active';
                    }).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Trial</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {restaurants.filter(r => {
                      const sub = subscriptions.find(s => s.restaurant_id === r.id);
                      return sub && sub.status === 'trial';
                    }).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">No Subscription</p>
                  <p className="text-2xl font-bold text-slate-600">
                    {restaurants.filter(r => !subscriptions.find(s => s.restaurant_id === r.id)).length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-xl mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="Search by restaurant name or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Restaurants Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>All Restaurants ({filteredRestaurants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-900 mb-2">No Restaurants Found</p>
                <p className="text-slate-600">
                  {searchQuery ? "Try a different search query" : "No restaurants have been created yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Marketplace</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription Plan</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRestaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {restaurant.logo_url && (
                              <img 
                                src={restaurant.logo_url} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{restaurant.business_name}</p>
                              {restaurant.slug && (
                                <p className="text-xs text-slate-500">/{restaurant.slug}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{restaurant.owner_email}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {restaurant.address?.city || "N/A"}, {restaurant.address?.state || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {restaurant.marketplace_enabled ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Listed
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600">
                              Not Listed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-semibold">{restaurant.rating?.toFixed(1) || "0.0"}</span>
                            <span className="text-xs text-slate-500">({restaurant.total_reviews || 0})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(restaurant)}
                        </TableCell>
                        <TableCell>
                          {restaurant.subscription ? (
                            <div>
                              <Badge className="bg-indigo-100 text-indigo-800 mb-1">
                                {restaurant.subscription.plan}
                              </Badge>
                              <p className="text-xs text-slate-500">
                                ${restaurant.subscription.mrr || 0}/mo
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">No plan</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {restaurant.created_date ? format(new Date(restaurant.created_date), "MMM d, yyyy") : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}