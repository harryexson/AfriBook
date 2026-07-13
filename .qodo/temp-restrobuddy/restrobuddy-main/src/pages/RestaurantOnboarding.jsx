import React, { useState, useEffect } from "react";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { Subscription } from "@/entities/Subscription";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Store,
  Utensils,
  Clock,
  MapPin,
  Plus,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STEPS = [
  { id: 1, title: "Restaurant Details", icon: Store },
  { id: 2, title: "Menu Items", icon: Utensils },
  { id: 3, title: "Operating Hours", icon: Clock },
  { id: 4, title: "Delivery Zones", icon: MapPin }
];

export default function RestaurantOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  // Step 1: Restaurant Details
  const [restaurantData, setRestaurantData] = useState({
    business_name: "",
    slug: "",
    description: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: ""
    },
    location: {
      lat: null,
      lng: null
    },
    cuisine_type: [],
    price_range: "$$",
    dietary_options: [],
    logo_url: "",
    banner_url: "",
    average_prep_time: 25,
    min_order_amount: 0
  });

  // Step 2: Menu Items
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    category: "entrees",
    price: 0,
    image_url: "",
    keyword: "",
    preparation_time: 15
  });

  // Step 3: Operating Hours
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: "09:00", close: "21:00", closed: false },
    tuesday: { open: "09:00", close: "21:00", closed: false },
    wednesday: { open: "09:00", close: "21:00", closed: false },
    thursday: { open: "09:00", close: "21:00", closed: false },
    friday: { open: "09:00", close: "22:00", closed: false },
    saturday: { open: "10:00", close: "22:00", closed: false },
    sunday: { open: "10:00", close: "20:00", closed: false }
  });

  // Step 4: Delivery Zones
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(30);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const cuisineOptions = [
    "American", "Italian", "Mexican", "Chinese", "Japanese", "Indian",
    "Thai", "Mediterranean", "French", "Korean", "Vietnamese", "Greek"
  ];

  const dietaryOptions = [
    "vegetarian", "vegan", "gluten-free", "halal", "kosher", "dairy-free", "nut-free"
  ];

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleRestaurantChange = (field, value) => {
    setRestaurantData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'business_name') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleAddressChange = (field, value) => {
    setRestaurantData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const toggleCuisine = (cuisine) => {
    setRestaurantData(prev => ({
      ...prev,
      cuisine_type: prev.cuisine_type.includes(cuisine)
        ? prev.cuisine_type.filter(c => c !== cuisine)
        : [...prev.cuisine_type, cuisine]
    }));
  };

  const toggleDietaryOption = (option) => {
    setRestaurantData(prev => ({
      ...prev,
      dietary_options: prev.dietary_options.includes(option)
        ? prev.dietary_options.filter(o => o !== option)
        : [...prev.dietary_options, option]
    }));
  };

  const handleAddMenuItem = () => {
    if (!newMenuItem.name || !newMenuItem.price) {
      setError("Please fill in menu item name and price");
      return;
    }

    setMenuItems(prev => [...prev, { ...newMenuItem, id: Date.now() }]);
    setNewMenuItem({
      name: "",
      description: "",
      category: "entrees",
      price: 0,
      image_url: "",
      keyword: "",
      preparation_time: 15
    });
    setError(null);
  };

  const handleRemoveMenuItem = (id) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDayToggle = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!restaurantData.business_name || !restaurantData.description) {
          setError("Please fill in restaurant name and description");
          return false;
        }
        if (restaurantData.cuisine_type.length === 0) {
          setError("Please select at least one cuisine type");
          return false;
        }
        if (!restaurantData.phone) {
          setError("Please enter a contact phone number");
          return false;
        }
        break;
      case 2:
        if (menuItems.length === 0) {
          setError("Please add at least one menu item");
          return false;
        }
        break;
      case 3:
        const hasOpenDay = Object.values(operatingHours).some(day => !day.closed);
        if (!hasOpenDay) {
          setError("Your restaurant must be open at least one day per week");
          return false;
        }
        break;
      case 4:
        if (deliveryRadius <= 0) {
          setError("Please set a delivery radius");
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === 1) {
      // Save restaurant on step 1
      await saveRestaurant();
    }

    if (currentStep === 2 && restaurantId) {
      // Save menu items on step 2
      await saveMenuItems();
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveRestaurant = async () => {
    setIsSubmitting(true);
    try {
      // Get plan from URL params if available
      const urlParams = new URLSearchParams(window.location.search);
      const selectedPlan = urlParams.get('plan') || 'starter';
      const billingCycle = urlParams.get('billing') || 'monthly';

      // Generate unique slug
      let slug = restaurantData.slug || restaurantData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
      
      // Check for uniqueness
      const existingRestaurants = await Restaurant.list();
      const existingSlugs = existingRestaurants.map(r => r.slug);
      
      let counter = 1;
      let uniqueSlug = slug;
      while (existingSlugs.includes(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const restaurant = await Restaurant.create({
        ...restaurantData,
        slug: uniqueSlug,
        owner_email: currentUser.email,
        marketplace_enabled: false,
        status: "pending_approval",
        rating: 0,
        total_reviews: 0,
        total_orders: 0,
        featured: false,
        commission_rate: 0.125,
        subscription_plan: selectedPlan
      });
      setRestaurantId(restaurant.id);

      // Create subscription with trial period
      const trialDays = 14;
      const today = new Date();
      const trialEndDate = new Date(today);
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      const planPrices = {
        starter: { monthly: 99, annual: 950 },
        professional: { monthly: 299, annual: 2868 },
        enterprise: { monthly: 599, annual: 5748 }
      };

      await Subscription.create({
        restaurant_id: restaurant.id,
        restaurant_name: restaurantData.business_name,
        owner_email: currentUser.email,
        plan: selectedPlan,
        billing_cycle: billingCycle,
        status: "trial",
        monthly_price: planPrices[selectedPlan]?.monthly || 99,
        annual_price: planPrices[selectedPlan]?.annual || 950,
        marketplace_commission_rate: selectedPlan === 'enterprise' ? 0.10 : selectedPlan === 'professional' ? 0.125 : 0.15,
        start_date: today.toISOString().split('T')[0],
        trial_end_date: trialEndDate.toISOString().split('T')[0],
        trial_days: trialDays,
        mrr: billingCycle === 'monthly' ? planPrices[selectedPlan]?.monthly : Math.round(planPrices[selectedPlan]?.annual / 12),
        is_restaurant_owner: true
      });

      setError(null);
    } catch (error) {
      console.error("Error saving restaurant:", error);
      setError("Failed to save restaurant details. Please try again.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveMenuItems = async () => {
    setIsSubmitting(true);
    try {
      for (const item of menuItems) {
        const { id, ...itemData } = item;
        await MenuItem.create({
          ...itemData,
          restaurant_id: restaurantId,
          available: true
        });
      }
      setError(null);
    } catch (error) {
      console.error("Error saving menu items:", error);
      setError("Failed to save menu items. Please try again.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Update restaurant with operating hours and delivery info
      await Restaurant.update(restaurantId, {
        operating_hours: operatingHours
      });

      // Show success and redirect
      navigate(createPageUrl("RestaurantSettings"));
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome to RESTROBUDDY Marketplace
          </h1>
          <p className="text-lg text-slate-600">
            Let's set up your restaurant in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      step.id < currentStep
                        ? "bg-green-600 text-white"
                        : step.id === currentStep
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-center">{step.title}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      step.id < currentStep ? "bg-green-600" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "w-6 h-6" })}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {STEPS.length}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Step 1: Restaurant Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Restaurant Name *</Label>
                    <Input
                      value={restaurantData.business_name}
                      onChange={(e) => handleRestaurantChange('business_name', e.target.value)}
                      placeholder="e.g., Joe's Pizza"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>URL Slug *</Label>
                    <Input
                      value={restaurantData.slug}
                      onChange={(e) => handleRestaurantChange('slug', e.target.value)}
                      placeholder="e.g., joes-pizza"
                      className="mt-2 font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Your restaurant URL: restrobuddy.com/{restaurantData.slug || 'your-slug'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={restaurantData.description}
                    onChange={(e) => handleRestaurantChange('description', e.target.value)}
                    placeholder="Tell customers about your restaurant..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      type="tel"
                      value={restaurantData.phone}
                      onChange={(e) => handleRestaurantChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Price Range *</Label>
                    <Select
                      value={restaurantData.price_range}
                      onValueChange={(value) => handleRestaurantChange('price_range', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">$ - Budget Friendly</SelectItem>
                        <SelectItem value="$$">$$ - Moderate</SelectItem>
                        <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                        <SelectItem value="$$$$">$$$$ - Fine Dining</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Cuisine Types * (Select all that apply)</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                    {cuisineOptions.map(cuisine => (
                      <div key={cuisine} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cuisine-${cuisine}`}
                          checked={restaurantData.cuisine_type.includes(cuisine)}
                          onCheckedChange={() => toggleCuisine(cuisine)}
                        />
                        <label
                          htmlFor={`cuisine-${cuisine}`}
                          className="text-sm cursor-pointer"
                        >
                          {cuisine}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Dietary Options (Optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {dietaryOptions.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`diet-${option}`}
                          checked={restaurantData.dietary_options.includes(option)}
                          onCheckedChange={() => toggleDietaryOption(option)}
                        />
                        <label
                          htmlFor={`diet-${option}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {option.replace('-', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Average Prep Time (minutes)</Label>
                    <Input
                      type="number"
                      value={restaurantData.average_prep_time}
                      onChange={(e) => handleRestaurantChange('average_prep_time', parseInt(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Minimum Order Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={restaurantData.min_order_amount}
                      onChange={(e) => handleRestaurantChange('min_order_amount', parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <Input
                      placeholder="Street Address"
                      value={restaurantData.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                    />
                    <Input
                      placeholder="City"
                      value={restaurantData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                    />
                    <Input
                      placeholder="State"
                      value={restaurantData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                    />
                    <Input
                      placeholder="ZIP Code"
                      value={restaurantData.address.zip}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Menu Items */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Add at least one menu item to continue. You can add more items later from your dashboard.
                  </AlertDescription>
                </Alert>

                <Card className="bg-slate-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Add Menu Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Item Name *</Label>
                        <Input
                          value={newMenuItem.name}
                          onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                          placeholder="e.g., Margherita Pizza"
                        />
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Select
                          value={newMenuItem.category}
                          onValueChange={(value) => setNewMenuItem({...newMenuItem, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appetizers">Appetizers</SelectItem>
                            <SelectItem value="entrees">Entrées</SelectItem>
                            <SelectItem value="sides">Sides</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newMenuItem.description}
                        onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                        placeholder="Describe the dish..."
                        rows={2}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Price ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newMenuItem.price}
                          onChange={(e) => setNewMenuItem({...newMenuItem, price: parseFloat(e.target.value)})}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Prep Time (min)</Label>
                        <Input
                          type="number"
                          value={newMenuItem.preparation_time}
                          onChange={(e) => setNewMenuItem({...newMenuItem, preparation_time: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label>SMS Keyword</Label>
                        <Input
                          value={newMenuItem.keyword}
                          onChange={(e) => setNewMenuItem({...newMenuItem, keyword: e.target.value.toUpperCase()})}
                          placeholder="PIZZA"
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <Button onClick={handleAddMenuItem} className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </CardContent>
                </Card>

                {menuItems.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4">Added Items ({menuItems.length})</h3>
                    <div className="space-y-3">
                      {menuItems.map(item => (
                        <Card key={item.id}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-slate-600">
                                {item.category} • ${item.price.toFixed(2)}
                                {item.keyword && ` • Keyword: ${item.keyword}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMenuItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Operating Hours */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Set your restaurant's operating hours. You can update these anytime from your settings.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {Object.entries(operatingHours).map(([day, hours]) => (
                    <Card key={day}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={!hours.closed}
                                onCheckedChange={() => handleDayToggle(day)}
                              />
                              <label className="font-semibold capitalize">
                                {day}
                              </label>
                            </div>
                          </div>

                          {!hours.closed ? (
                            <div className="flex items-center gap-4 flex-1">
                              <div>
                                <Label className="text-xs">Open</Label>
                                <Input
                                  type="time"
                                  value={hours.open}
                                  onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              <span className="text-slate-400">to</span>
                              <div>
                                <Label className="text-xs">Close</Label>
                                <Input
                                  type="time"
                                  value={hours.close}
                                  onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Delivery Zones */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Define your delivery area. RESTROBUDDY integrates with 1M+ drivers through our delivery network.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delivery Radius</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label>Maximum Delivery Distance (miles)</Label>
                      <Input
                        type="number"
                        value={deliveryRadius}
                        onChange={(e) => setDeliveryRadius(parseFloat(e.target.value))}
                        className="mt-2"
                        min="1"
                        max="25"
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        Orders within {deliveryRadius} miles of your location
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Delivery Fee</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label>Base Delivery Fee ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(parseFloat(e.target.value))}
                        className="mt-2"
                        min="0"
                      />
                      <p className="text-sm text-slate-500 mt-2">
                        Charged per delivery (can be $0)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Free Delivery Threshold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label>Minimum Order for Free Delivery ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value))}
                      className="mt-2"
                      min="0"
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Orders above ${freeDeliveryThreshold.toFixed(2)} get free delivery
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Ready to Launch!
                    </h3>
                    <p className="text-slate-700 mb-4">
                      Your restaurant setup is almost complete. After you finish, our team will review your 
                      application and activate your marketplace listing within 24-48 hours.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span>Commission: {(restaurantData.commission_rate || 0.125) * 100}% per order</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span>Monthly subscription: Starting at $299</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span>No long-term contracts</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <span>Cancel anytime</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="px-8"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 px-8"
            >
              {isSubmitting ? 'Saving...' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 px-8"
            >
              {isSubmitting ? 'Completing...' : 'Complete Setup'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}