import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Store,
  Clock,
  Utensils,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { Employee } from "@/entities/Employee";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import OnboardingStep1 from "../components/onboarding/OnboardingStep1";
import OnboardingStep2 from "../components/onboarding/OnboardingStep2";
import OnboardingStep3 from "../components/onboarding/OnboardingStep3";
import OnboardingStep4 from "../components/onboarding/OnboardingStep4";
import OnboardingStep5 from "../components/onboarding/OnboardingStep5";
import OnboardingComplete from "../components/onboarding/OnboardingComplete";

const STEPS = [
  { id: 1, title: "Restaurant Info", icon: Store, description: "Basic details about your restaurant" },
  { id: 2, title: "Location & Hours", icon: Clock, description: "Where and when you operate" },
  { id: 3, title: "Menu Setup", icon: Utensils, description: "Add your menu items" },
  { id: 4, title: "Team Setup", icon: Users, description: "Invite your staff members" },
  { id: 5, title: "Preferences", icon: Sparkles, description: "Customize your settings" }
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    business_name: "",
    slug: "",
    description: "",
    cuisine_type: [],
    price_range: "$$",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
    banner_url: "",
    
    // Step 2: Location & Hours
    address: {
      street: "",
      city: "",
      state: "",
      zip: ""
    },
    operating_hours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "22:00", closed: false },
      saturday: { open: "10:00", close: "22:00", closed: false },
      sunday: { open: "10:00", close: "20:00", closed: false }
    },
    average_prep_time: 20,
    min_order_amount: 0,
    
    // Step 3: Menu (handled separately)
    menuItems: [],
    
    // Step 4: Team
    teamMembers: [],
    
    // Step 5: Preferences
    dietary_options: [],
    marketplace_enabled: true,
    enable_loyalty: false,
    enable_reservations: false,
    enable_delivery: false
  });

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if restaurant already exists
      const restaurants = await Restaurant.filter({ owner_email: currentUser.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        // Pre-fill form with existing data
        setFormData(prev => ({
          ...prev,
          ...restaurants[0],
          email: restaurants[0].email || currentUser.email
        }));
        
        // Check onboarding status
        if (restaurants[0].status === 'active') {
          // Already completed onboarding
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
      } else {
        setFormData(prev => ({
          ...prev,
          email: currentUser.email
        }));
      }
    } catch (error) {
      console.error("Error initializing:", error);
    }
    setIsLoading(false);
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Save progress at each step
      if (currentStep === 1) {
        await saveRestaurantBasics();
      } else if (currentStep === 2) {
        await saveLocationHours();
      } else if (currentStep === 3) {
        await saveMenuItems();
      } else if (currentStep === 4) {
        await saveTeamMembers();
      } else if (currentStep === 5) {
        await savePreferences();
        setCurrentStep(6); // Complete
        setIsSaving(false);
        return;
      }

      setCurrentStep(prev => prev + 1);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save. Please try again.");
    }
    setIsSaving(false);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const saveRestaurantBasics = async () => {
    // Generate unique slug
    let slug = formData.slug || formData.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
    
    // Check for uniqueness and append number if needed
    const existingRestaurants = await Restaurant.list();
    const existingSlugs = existingRestaurants
      .filter(r => r.id !== restaurant?.id)
      .map(r => r.slug);
    
    let counter = 1;
    let uniqueSlug = slug;
    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    const restaurantData = {
      business_name: formData.business_name,
      slug: uniqueSlug,
      description: formData.description,
      cuisine_type: formData.cuisine_type,
      price_range: formData.price_range,
      phone: formData.phone,
      logo_url: formData.logo_url,
      banner_url: formData.banner_url,
      owner_email: user.email,
      status: 'pending_approval'
    };

    if (restaurant) {
      await Restaurant.update(restaurant.id, restaurantData);
    } else {
      const newRestaurant = await Restaurant.create(restaurantData);
      setRestaurant(newRestaurant);
      
      // Create trial subscription for new restaurant
      const urlParams = new URLSearchParams(window.location.search);
      const selectedPlan = urlParams.get('plan') || 'starter';
      const billingCycle = urlParams.get('billing') || 'monthly';
      
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
        restaurant_id: newRestaurant.id,
        restaurant_name: formData.business_name,
        owner_email: user.email,
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
    }
  };

  const saveLocationHours = async () => {
    if (!restaurant) return;

    await Restaurant.update(restaurant.id, {
      address: formData.address,
      location: formData.location,
      operating_hours: formData.operating_hours,
      average_prep_time: formData.average_prep_time,
      min_order_amount: formData.min_order_amount
    });
  };

  const saveMenuItems = async () => {
    if (!restaurant) return;

    for (const item of formData.menuItems) {
      if (!item.id) {
        await MenuItem.create({
          ...item,
          restaurant_id: restaurant.id
        });
      }
    }
  };

  const saveTeamMembers = async () => {
    for (const member of formData.teamMembers) {
      if (!member.id) {
        await Employee.create({
          full_name: member.full_name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          hourly_rate: member.hourly_rate || 15,
          status: 'invited'
        });
      }
    }
  };

  const savePreferences = async () => {
    if (!restaurant) return;

    await Restaurant.update(restaurant.id, {
      dietary_options: formData.dietary_options,
      marketplace_enabled: formData.marketplace_enabled,
      status: 'active'
    });

    // Create loyalty program if enabled
    if (formData.enable_loyalty) {
      await LoyaltyProgram.create({
        restaurant_id: restaurant.id,
        program_name: `${formData.business_name} Rewards`,
        status: 'active',
        points_per_dollar: 10
      });
    }
  };

  const progress = ((currentStep - 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 6) {
    return <OnboardingComplete restaurant={restaurant} formData={formData} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome to RESTROBUDDY! 🎉</h1>
          <p className="text-slate-600">Let's get your restaurant set up in just a few minutes</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-slate-500">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-col items-center min-w-20">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-200' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${
                  isActive ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <OnboardingStep1 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <OnboardingStep2 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <OnboardingStep3 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <OnboardingStep4 formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 5 && (
              <OnboardingStep5 formData={formData} updateFormData={updateFormData} />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSaving}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  'Saving...'
                ) : currentStep === STEPS.length ? (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("AdminDashboard"))}
            className="text-slate-500"
          >
            Skip for now, I'll set up later
          </Button>
        </div>
      </div>
    </div>
  );
}