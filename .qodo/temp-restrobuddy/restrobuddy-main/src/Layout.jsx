import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ChefHat,
  LayoutDashboard,
  Receipt,
  MessageSquare,
  Settings,
  Package,
  Users,
  TrendingUp,
  Star,
  Utensils,
  Clock,
  LogOut,
  User as UserIcon,
  Store,
  Code,
  Award,
  ClipboardList,
  Tag,
  MapPin,
  Monitor,
  DollarSign,
  Printer,
  Bell,
  Wifi,
  Calendar,
  Truck
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import SEOHead from "@/components/seo/SEOHead";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Employee } from "@/entities/Employee";
import { Restaurant } from "@/entities/Restaurant";
import { Subscription } from "@/entities/Subscription";

// Customer-facing navigation (limited access for restaurant customers)
const customerNavigationItems = [
  {
    title: "Browse Restaurants",
    url: createPageUrl("Marketplace"),
    icon: Store,
  },
  {
    title: "Order History",
    url: createPageUrl("OrderHistory"),
    icon: Clock,
  },
  {
    title: "Group Orders",
    url: createPageUrl("MyGroupOrders"),
    icon: Users,
  },
  {
    title: "Create Group Order",
    url: createPageUrl("CreateGroupOrder"),
    icon: Users,
  },
  {
    title: "Favorites",
    url: createPageUrl("CustomerPortal") + "?tab=favorites",
    icon: Star,
  },
  {
    title: "Loyalty & Rewards",
    url: createPageUrl("CustomerLoyalty"),
    icon: Award,
  },
  {
    title: "Notifications",
    url: createPageUrl("NotificationCenter"),
    icon: Bell,
  },
  {
    title: "Customer Messages",
    url: createPageUrl("CustomerCommunication"),
    icon: MessageSquare,
  },
  {
    title: "Subscription Plans",
    url: createPageUrl("SubscriptionPlans"),
    icon: Calendar,
  },
  {
    title: "Delivery Batching",
    url: createPageUrl("DeliveryBatching"),
    icon: Truck,
  },
  {
    title: "Delivery Analytics",
    url: createPageUrl("DeliveryAnalytics"),
    icon: TrendingUp,
  },
  {
      title: "My Profile",
      url: createPageUrl("CustomerProfile"),
      icon: UserIcon,
    },
    {
      title: "Browse Subscriptions",
      url: createPageUrl("BrowseSubscriptions"),
      icon: Calendar,
    },
    {
      title: "My Subscriptions",
      url: createPageUrl("MySubscriptions"),
      icon: Calendar,
    },
];

// Restaurant Owner/Manager navigation - for running their restaurant
const restaurantOwnerNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: createPageUrl("KitchenDisplay"),
    icon: ChefHat,
  },
  {
    title: "POS Terminal",
    url: createPageUrl("POSTerminal"),
    icon: DollarSign,
  },
  {
    title: "Menu Management",
    url: createPageUrl("OrderMenu"),
    icon: Utensils,
  },
  {
    title: "Inventory",
    url: createPageUrl("InventoryManagement"),
    icon: Package,
  },
  {
    title: "Table Management",
    url: createPageUrl("TableManagement"),
    icon: MapPin,
  },
  {
    title: "Reservations",
    url: createPageUrl("ReservationManagement"),
    icon: Clock,
  },
  {
    title: "Staff Management",
    url: createPageUrl("StaffManagement"),
    icon: Users,
  },
  {
    title: "Shift Scheduling",
    url: createPageUrl("ShiftScheduling"),
    icon: Clock,
  },
  {
    title: "Promotions",
    url: createPageUrl("PromotionManagement"),
    icon: Tag,
  },
  {
    title: "Loyalty Program",
    url: createPageUrl("LoyaltyProgramSetup"),
    icon: Award,
  },
  {
    title: "Reviews",
    url: createPageUrl("ReviewManagement"),
    icon: MessageSquare,
  },
  {
    title: "Sales Reports",
    url: createPageUrl("SalesReports"),
    icon: TrendingUp,
  },
  {
    title: "Expense Management",
    url: createPageUrl("ExpenseManagement"),
    icon: Receipt,
  },
  {
    title: "Analytics",
    url: createPageUrl("AdvancedReports"),
    icon: TrendingUp,
    },
    {
    title: "Customer Messages",
    url: createPageUrl("CustomerCommunication"),
    icon: MessageSquare,
    },
  {
    title: "Display Content",
    url: createPageUrl("DisplayContentManager"),
    icon: Monitor,
  },
  {
    title: "Printer Setup",
    url: createPageUrl("PrinterSetup"),
    icon: Printer,
  },
  {
    title: "Devices",
    url: createPageUrl("PrinterSetup") + "?tab=manage",
    icon: Wifi,
  },
  {
    title: "Delivery Zones",
    url: createPageUrl("DeliveryZoneManager"),
    icon: MapPin,
  },
  {
    title: "Restaurant Settings",
    url: createPageUrl("RestaurantSettings"),
    icon: Settings,
  },
];

// Restaurant Staff navigation - limited access for employees
const restaurantStaffNavigationItems = [
  {
    title: "Kitchen Display",
    url: createPageUrl("KitchenDisplay"),
    icon: ChefHat,
  },
  {
    title: "POS Terminal",
    url: createPageUrl("POSTerminal"),
    icon: DollarSign,
  },
  {
    title: "My Tasks",
    url: createPageUrl("StaffTasks"),
    icon: ClipboardList,
  },
  {
    title: "Time Clock",
    url: createPageUrl("TimeClock"),
    icon: Clock,
  },
  {
    title: "Inventory",
    url: createPageUrl("InventoryManagement"),
    icon: Package,
  },
];

// Developer-only navigation - STRICT ACCESS CONTROL
const developerNavigationItems = [
  {
    title: "Developer Dashboard",
    url: createPageUrl("DeveloperBackoffice"),
    icon: Code,
  },
  {
    title: "All Restaurants",
    url: createPageUrl("BackofficeSubscriptions"),
    icon: Store,
  },
  {
    title: "All Subscriptions",
    url: createPageUrl("BackofficeSubscriptions"),
    icon: DollarSign,
  },
  {
    title: "Customer Support",
    url: createPageUrl("BackofficeCustomerSupport"),
    icon: MessageSquare,
  },
  {
    title: "Platform Staff",
    url: createPageUrl("BackofficeStaff"),
    icon: Users,
  },
  {
    title: "Accounting",
    url: createPageUrl("BackofficeAccounting"),
    icon: DollarSign,
  },
  {
    title: "Competitive Intel",
    url: createPageUrl("BackofficeCompetitive"),
    icon: TrendingUp,
  },
  {
    title: "Hardware Guide",
    url: createPageUrl("HardwareCompatibility"),
    icon: Monitor,
  },
  {
    title: "System Settings",
    url: createPageUrl("SystemSettings"),
    icon: Settings,
  },
  {
    title: "Platform Settings",
    url: createPageUrl("BackofficeSettings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const user = await base44.auth.me();
        if (!mounted) return;
        
        setCurrentUser(user);

        try {
          const emps = await Employee.filter({ email: user.email });
          if (mounted && emps.length > 0) {
            setEmployee(emps[0]);
          }
        } catch (e) {
          console.log("No employee");
        }

        // Check if user is a restaurant owner
        try {
          const restaurants = await Restaurant.filter({ owner_email: user.email });
          if (mounted && restaurants.length > 0) {
            setRestaurant(restaurants[0]);
            
            // Get subscription status
            const subs = await Subscription.filter({ owner_email: user.email });
            if (subs.length > 0) {
              const sub = subs[0];
              
              // Check if trial has expired
              if (sub.status === 'trial' && sub.trial_end_date) {
                const trialEnd = new Date(sub.trial_end_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (today > trialEnd) {
                  // Trial expired - update status
                  await Subscription.update(sub.id, { status: 'trial_expired' });
                  sub.status = 'trial_expired';
                }
              }
              
              if (mounted) {
                setSubscription(sub);
              }
            }
          }
        } catch (e) {
          console.log("No restaurant");
        }
      } catch (e) {
        if (!mounted) return;
        setCurrentUser(null);
        setEmployee(null);
        setRestaurant(null);
        setSubscription(null);
      }
      
      if (mounted) {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const getUserRole = () => {
    if (!currentUser) return "customer";
    // CRITICAL: Developer-only access (harryxson@hotmail.com)
    if (currentUser.email === "harryxson@hotmail.com" || currentUser.email === "harryexson@hotmail.com") return "developer";
    // Restaurant owners/managers
    if (restaurant && subscription) return "manager";
    if (employee?.role === "manager") return "manager";
    if (employee) return "staff";
    return "customer";
  };

  const isRestaurantOwner = () => {
    return restaurant && subscription;
  };

  const isTrialExpired = () => {
    return subscription?.status === 'trial_expired';
  };

  const hasActiveSubscription = () => {
    return subscription && ['active', 'trial'].includes(subscription.status);
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    const role = getUserRole();
    
    // Developer - ONLY for harryxson@hotmail.com
    if (role === "developer") {
      return developerNavigationItems;
    }
    
    // Regular customers - limited navigation for ordering food
    if (role === "customer") {
      return customerNavigationItems;
    }
    
    // Restaurant staff - limited to their daily tasks
    if (role === "staff") {
      return restaurantStaffNavigationItems;
    }
    
    // Restaurant owners/managers - full restaurant management
    if (role === "manager") {
      return restaurantOwnerNavigationItems;
    }
    
    return customerNavigationItems;
  };

  // Get the portal label based on user role
  const getPortalLabel = () => {
    const role = getUserRole();
    if (role === "developer") return "Developer Back Office";
    if (role === "customer") return "Customer Portal";
    if (role === "staff") return "Staff Portal";
    if (role === "manager") return "Restaurant Management";
    return "Portal";
  };

  const marketingPages = ["Home", "Features", "About", "Pricing", "Contact", "Careers", "Blog", "HelpCenter", "Documentation", "Support"];
  const publicPages = ["Home", "Features", "About", "Pricing", "ScreenShare", "KioskMode", "GroupOrderSelect", "Contact", "Careers", "Blog", "HelpCenter", "Documentation", "Support"];
  const onboardingPages = ["RestaurantOnboarding", "OnboardingWizard"];
  const subscriptionPages = ["SubscriptionRequired", "ChoosePlan"];
  
  const isMarketing = marketingPages.includes(currentPageName);
  const isPublic = publicPages.includes(currentPageName);
  const isOnboarding = onboardingPages.includes(currentPageName);
  const isSubscriptionPage = subscriptionPages.includes(currentPageName);
  const isAuth = !!currentUser;

  // If restaurant owner with expired trial, redirect to subscription page
  // (except if already on subscription-related pages or marketing pages)
  if (isAuth && isRestaurantOwner() && isTrialExpired() && !isSubscriptionPage && !isMarketing && !isOnboarding && !["AdminDashboard", "KitchenDisplay", "OrderMenu", "RestaurantSettings"].includes(currentPageName)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="Logo"
                className="h-10 w-10"
              />
              <h2 className="font-bold">RESTROBUDDY</h2>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Your Trial Has Ended</h1>
            <p className="text-lg text-slate-600 mb-8">
              Your {subscription?.trial_days || 14}-day free trial for <strong>{restaurant?.business_name}</strong> has expired. 
              Subscribe now to continue using RESTROBUDDY and keep all your data.
            </p>
            <div className="space-y-4">
              <Link to={createPageUrl("Pricing")}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
                  Choose a Plan
                </Button>
              </Link>
              <p className="text-sm text-slate-500">
                Questions? <Link to={createPageUrl("Contact")} className="text-emerald-600 hover:underline">Contact our sales team</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get the appropriate dashboard URL based on user role
  const getDashboardUrl = () => {
    const role = getUserRole();
    if (role === "developer") return createPageUrl("DeveloperBackoffice");
    if (role === "manager" || role === "staff") return createPageUrl("AdminDashboard");
    if (role === "customer") return createPageUrl("Marketplace");
    return createPageUrl("Marketplace");
  };

  // Marketing pages - allow both authenticated and unauthenticated users to view
  if (isMarketing) {
    return (
      <div className="min-h-screen bg-white">
        <SEOHead />
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="Logo"
                className="h-12 w-12"
              />
              <h2 className="font-bold text-xl">RESTROBUDDY</h2>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to={createPageUrl("Home")}>Home</Link>
              <Link to={createPageUrl("Features")}>Features</Link>
              <Link to={createPageUrl("Pricing")}>Pricing</Link>
              <Link to={createPageUrl("About")}>About</Link>
              <Link to={createPageUrl("CompetitiveComparison")}>Why RestroBuddy?</Link>
              {isAuth ? (
                <Button asChild>
                  <Link to={getDashboardUrl()}>Go to Dashboard</Link>
                </Button>
              ) : (
                <Button onClick={() => base44.auth.redirectToLogin(createPageUrl("Marketplace"))}>
                  Login
                </Button>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  // Onboarding pages - full screen without sidebar
  if (isOnboarding && isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="Logo"
                className="h-10 w-10"
              />
              <h2 className="font-bold">RESTROBUDDY</h2>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  // Public pages without auth
  if (isPublic && !isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="Logo"
                className="h-10 w-10"
              />
              <h2 className="font-bold">RESTROBUDDY</h2>
            </Link>
            <Button
              onClick={() => base44.auth.redirectToLogin(createPageUrl("AdminDashboard"))}
              variant="outline"
              size="sm"
            >
              Login
            </Button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  // Require auth
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to RESTROBUDDY</h2>
          <p className="text-slate-600 mb-8">Please log in to continue</p>
          <Button
            onClick={() => base44.auth.redirectToLogin(createPageUrl("AdminDashboard"))}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  // Authenticated - show sidebar
  const userRole = getUserRole();
  const navigationItems = getNavigationItems();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                alt="Logo"
                className="w-12 h-12"
              />
              <div>
                <h2 className="font-bold text-xl">RESTROBUDDY</h2>
                <p className="text-xs text-slate-500 capitalize">{userRole} Portal</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel>
                {getPortalLabel()}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {currentUser?.full_name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {currentUser?.full_name || currentUser?.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">{userRole}</p>
              </div>
              {userRole === "customer" && <NotificationBell />}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1">
          <header className="bg-white border-b px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">RESTROBUDDY</h1>
            </div>
          </header>
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}