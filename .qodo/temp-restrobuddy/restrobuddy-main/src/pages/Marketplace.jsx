import React, { useState, useEffect } from "react";
import { Restaurant } from "@/entities/Restaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Search, Star, Clock, Filter, ChevronRight, 
  Utensils, TrendingUp, Award, Phone, X, SlidersHorizontal, Leaf, Navigation, Map, List
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Marketplace() {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedDietaryOptions, setSelectedDietaryOptions] = useState([]);
  const [prepTimeRange, setPrepTimeRange] = useState([0, 60]);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortBy, setSortBy] = useState("featured");
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    loadRestaurants();
    getUserLocation();

    // Real-time sync: subscribe to restaurant changes
    const unsubscribe = Restaurant.subscribe((event) => {
      if (event.type === "create" && event.data?.marketplace_enabled && event.data?.status === "active") {
        setRestaurants(prev => [event.data, ...prev]);
      } else if (event.type === "update") {
        setRestaurants(prev => prev.map(r => r.id === event.id ? { ...r, ...event.data } : r)
          .filter(r => r.marketplace_enabled && r.status === "active"));
      } else if (event.type === "delete") {
        setRestaurants(prev => prev.filter(r => r.id !== event.id));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterAndSortRestaurants();
  }, [restaurants, searchQuery, selectedCuisines, selectedPriceRanges, selectedDietaryOptions, prepTimeRange, minRating, maxDistance, sortBy, userLocation]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const allRestaurants = await Restaurant.filter({ 
        marketplace_enabled: true,
        status: "active"
      });
      setRestaurants(allRestaurants);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error("Error loading restaurants:", error);
      setRestaurants([]);
    }
    setIsLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filterAndSortRestaurants = () => {
    let filtered = [...restaurants];

    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine_type?.some(c => c?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.tags?.some(t => t?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCuisines.length > 0) {
      filtered = filtered.filter(r => 
        r.cuisine_type?.some(c => selectedCuisines.includes(c))
      );
    }

    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(r => 
        selectedPriceRanges.includes(r.price_range)
      );
    }

    if (selectedDietaryOptions.length > 0) {
      filtered = filtered.filter(r => 
        selectedDietaryOptions.every(option => r.dietary_options?.includes(option))
      );
    }

    filtered = filtered.filter(r => 
      r.average_prep_time >= prepTimeRange[0] && r.average_prep_time <= prepTimeRange[1]
    );

    if (minRating > 0) {
      filtered = filtered.filter(r => (r.rating || 0) >= minRating);
    }

    if (userLocation) {
      filtered = filtered.map(r => {
        if (r.location?.lat && r.location?.lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            r.location.lat,
            r.location.lng
          );
          return { ...r, distance };
        }
        return { ...r, distance: null };
      });

      if (maxDistance < 50) {
        filtered = filtered.filter(r => r.distance !== null && r.distance <= maxDistance);
      }
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "featured":
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating || 0) - (a.rating || 0);
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "popularity":
          return (b.total_orders || 0) - (a.total_orders || 0);
        case "distance":
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        case "prep_time":
          return (a.average_prep_time || 0) - (b.average_prep_time || 0);
        case "name":
          return (a.business_name || "").localeCompare(b.business_name || "");
        default:
          return 0;
      }
    });

    setFilteredRestaurants(filtered);
  };

  const cuisineTypes = ["American", "Italian", "Mexican", "Chinese", "Japanese", "Indian", "Thai", "Mediterranean", "French", "Korean", "Vietnamese", "Greek", "West African", "East African", "Southern African", "Caribbean", "Jamaican", "North African"];
  const priceRanges = ["$", "$$", "$$$", "$$$$"];
  const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten-free", label: "Gluten-Free" },
    { value: "halal", label: "Halal" },
    { value: "kosher", label: "Kosher" },
    { value: "dairy-free", label: "Dairy-Free" },
    { value: "nut-free", label: "Nut-Free" }
  ];

  const toggleCuisine = (cuisine) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
  };

  const togglePriceRange = (price) => {
    setSelectedPriceRanges(prev => 
      prev.includes(price) ? prev.filter(p => p !== price) : [...prev, price]
    );
  };

  const toggleDietaryOption = (option) => {
    setSelectedDietaryOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCuisines([]);
    setSelectedPriceRanges([]);
    setSelectedDietaryOptions([]);
    setPrepTimeRange([0, 60]);
    setMinRating(0);
    setMaxDistance(50);
  };

  const activeFiltersCount = selectedCuisines.length + selectedPriceRanges.length + selectedDietaryOptions.length + (minRating > 0 ? 1 : 0) + (prepTimeRange[0] > 0 || prepTimeRange[1] < 60 ? 1 : 0) + (maxDistance < 50 ? 1 : 0);

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-bold mb-3 block">Cuisine Type</Label>
        <div className="space-y-2">
          {cuisineTypes.map(cuisine => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={`cuisine-${cuisine}`}
                checked={selectedCuisines.includes(cuisine)}
                onCheckedChange={() => toggleCuisine(cuisine)}
              />
              <label
                htmlFor={`cuisine-${cuisine}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {cuisine}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-bold mb-3 block">Price Range</Label>
        <div className="flex gap-2">
          {priceRanges.map(price => (
            <Button
              key={price}
              variant={selectedPriceRanges.includes(price) ? "default" : "outline"}
              onClick={() => togglePriceRange(price)}
              className={selectedPriceRanges.includes(price) ? "bg-emerald-600" : ""}
            >
              {price}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-bold mb-3 block">Dietary Options</Label>
        <div className="space-y-2">
          {dietaryOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`diet-${option.value}`}
                checked={selectedDietaryOptions.includes(option.value)}
                onCheckedChange={() => toggleDietaryOption(option.value)}
              />
              <label
                htmlFor={`diet-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-bold mb-3 block">
          Preparation Time: {prepTimeRange[0]}-{prepTimeRange[1]} min
        </Label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={prepTimeRange[0]}
            onChange={(e) => setPrepTimeRange([parseInt(e.target.value), prepTimeRange[1]])}
            className="w-full"
          />
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={prepTimeRange[1]}
            onChange={(e) => setPrepTimeRange([prepTimeRange[0], parseInt(e.target.value)])}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-bold mb-3 block">Minimum Rating</Label>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 3.5, 4, 4.5].map(rating => (
            <Button
              key={rating}
              variant={minRating === rating ? "default" : "outline"}
              onClick={() => setMinRating(rating)}
              className={`flex items-center gap-1 ${minRating === rating ? "bg-emerald-600" : ""}`}
            >
              <Star className="w-4 h-4" />
              {rating === 0 ? "All" : rating}
            </Button>
          ))}
        </div>
      </div>

      {userLocation && (
        <div>
          <Label className="text-base font-bold mb-3 block">
            Distance: {maxDistance === 50 ? "Any" : `${maxDistance} miles`}
          </Label>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 mi</span>
            <span>50 mi</span>
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && (
        <Button
          onClick={clearAllFilters}
          variant="outline"
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">Restaurant Marketplace</h1>
            <p className="text-base sm:text-xl text-emerald-100 mb-2">
              Discover amazing restaurants powered by RESTROBUDDY
            </p>
            <p className="text-emerald-200 text-sm sm:text-base">
              Order now • SMS ordering • Pick up in-store
            </p>
            {lastRefreshed && (
              <p className="text-emerald-300 text-xs mt-2">
                Live data · Last updated {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
              <Input
                placeholder="Search restaurants, cuisines, or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 text-lg rounded-full border-0 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-emerald-600">{activeFiltersCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your restaurant search
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterSection />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Sort by:</span>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              {userLocation && <SelectItem value="distance">Nearest</SelectItem>}
              <SelectItem value="prep_time">Fastest Prep</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {selectedCuisines.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCuisines.map(cuisine => (
                <Badge key={cuisine} variant="secondary" className="gap-1">
                  {cuisine}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleCuisine(cuisine)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {selectedPriceRanges.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedPriceRanges.map(price => (
                <Badge key={price} variant="secondary" className="gap-1">
                  {price}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => togglePriceRange(price)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {selectedDietaryOptions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDietaryOptions.map(option => (
                <Badge key={option} variant="secondary" className="gap-1 bg-green-100 text-green-800">
                  <Leaf className="w-3 h-3" />
                  {option}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleDietaryOption(option)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </span>
            <Tabs value={viewMode} onValueChange={setViewMode} className="ml-2">
              <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                  <List className="w-4 h-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="hidden md:block w-80 flex-shrink-0">
            <Card className="border-0 shadow-xl sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-emerald-600">{activeFiltersCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterSection />
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-20">
                <Utensils className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-xl mb-2">No restaurants found</p>
                <p className="text-slate-400 mb-6">Try adjusting your filters</p>
                {activeFiltersCount > 0 && (
                  <Button onClick={clearAllFilters} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : viewMode === "map" ? (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="h-[600px] relative">
                  {userLocation ? (
                    <MapContainer
                      center={[userLocation.lat, userLocation.lng]}
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      />
                      {filteredRestaurants
                        .filter(r => r.location?.lat && r.location?.lng)
                        .map(restaurant => (
                          <Marker
                            key={restaurant.id}
                            position={[restaurant.location.lat, restaurant.location.lng]}
                          >
                            <Popup>
                              <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1">{restaurant.business_name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{restaurant.price_range || "$$"}</Badge>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-semibold">{(restaurant.rating || 0).toFixed(1)}</span>
                                  </div>
                                </div>
                                {restaurant.distance && (
                                  <p className="text-sm text-slate-600 mb-2">
                                    <Navigation className="w-3 h-3 inline mr-1" />
                                    {restaurant.distance.toFixed(1)} miles away
                                  </p>
                                )}
                                <Button
                                  asChild
                                  size="sm"
                                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Link to={`${createPageUrl("MarketplaceRestaurant")}?id=${restaurant.id}`}>
                                    View Menu
                                  </Link>
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                    </MapContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100">
                      <div className="text-center">
                        <Navigation className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-semibold mb-2">Enable location access</p>
                        <p className="text-sm text-slate-500">Allow location to see restaurants on the map</p>
                        <Button onClick={getUserLocation} className="mt-4">
                          Enable Location
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {filteredRestaurants.map(restaurant => (
                  <Card key={restaurant.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <div className="relative h-40 sm:h-48">
                      {restaurant.banner_url ? (
                        <img
                          src={restaurant.banner_url}
                          alt={restaurant.business_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <Utensils className="w-20 h-20 text-emerald-600" />
                        </div>
                      )}
                      {restaurant.featured && (
                        <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {restaurant.logo_url && (
                        <div className="absolute bottom-3 left-3 w-16 h-16 bg-white rounded-xl shadow-xl border-2 border-white overflow-hidden">
                          <img src={restaurant.logo_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-2xl font-bold text-slate-900">{restaurant.business_name}</h3>
                          <Badge variant="outline" className="text-lg font-bold">
                            {restaurant.price_range || "$$"}
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                          {restaurant.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {restaurant.cuisine_type?.slice(0, 3).map(cuisine => (
                            <Badge key={cuisine} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                          {restaurant.dietary_options?.slice(0, 2).map(option => (
                            <Badge key={option} className="text-xs bg-green-100 text-green-800">
                              <Leaf className="w-3 h-3 mr-1" />
                              {option}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold">{(restaurant.rating || 0).toFixed(1)}</span>
                            <span className="text-slate-400">({restaurant.total_reviews || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{restaurant.average_prep_time || 20} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{restaurant.total_orders || 0} orders</span>
                          </div>
                          {restaurant.distance && (
                            <div className="flex items-center gap-1">
                              <Navigation className="w-4 h-4" />
                              <span>{restaurant.distance.toFixed(1)} mi</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Link to={`${createPageUrl("MarketplaceRestaurant")}?id=${restaurant.id}`}>
                            Order Now
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                        {restaurant.phone && (
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                          >
                            <a href={`tel:${restaurant.phone}`}>
                              <Phone className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Want to list your restaurant?
          </h2>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Join RESTROBUDDY's marketplace and reach thousands of customers. 
            Only 10-15% commission on sales. Full system included.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-12 py-6 rounded-full"
          >
            <Link to={createPageUrl("Pricing")}>
              Get Started Today
              <ChevronRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}