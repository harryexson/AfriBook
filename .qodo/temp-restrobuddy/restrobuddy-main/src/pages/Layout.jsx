import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ShoppingBag,
  ChefHat,
  BarChart3,
  Users,
  Package,
  Settings,
  Menu,
  LogOut,
  User,
  Store,
  Receipt,
  Cast,
  Clock,
  DollarSign,
  MapPin,
  Truck,
  FileUp,
  Award,
  TrendingUp,
  Code
} from "lucide-react";

const navigationItems = [
  // Customer-facing items
  {
    title: "Marketplace",
    url: createPageUrl("Marketplace"),
    icon: Store,
    roles: ["customer", "admin", "manager", "staff"],
    permission: null
  },
  {
    title: "My Orders",
    url: createPageUrl("MyOrders"),
    icon: Receipt,
    roles: ["customer", "admin", "manager", "staff"],
    permission: null
  },
  
  // Restaurant management items (NOT for customers)
  {
    title: "Order Now",
    url: createPageUrl("OrderMenu"),
    icon: ShoppingBag,
    roles: ["admin", "manager", "staff"],
    permission: null
  },
  {
    title: "Kitchen Display",
    url: createPageUrl("KitchenDisplay"),
    icon: ChefHat,
    roles: ["admin", "manager", "staff"],
    permission: null
  },
  {
    title: "Screen Share",
    url: createPageUrl("ScreenShare"),
    icon: Cast,
    roles: ["admin", "manager", "staff"],
    permission: null
  },
  {
    title: "Kiosk Login",
    url: createPageUrl("KioskLogin"),
    icon: Settings,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: BarChart3,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Reports",
    url: createPageUrl("AdvancedReports"),
    icon: TrendingUp,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Menu Management",
    url: createPageUrl("RestaurantSettings"),
    icon: Settings,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Inventory",
    url: createPageUrl("InventoryManagement"),
    icon: Package,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Employees",
    url: createPageUrl("EmployeeManagement"),
    icon: Users,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Time Clock",
    url: createPageUrl("TimeClock"),
    icon: Clock,
    roles: ["admin", "manager", "staff"],
    permission: null
  },
  {
    title: "Payroll",
    url: createPageUrl("PayrollManagement"),
    icon: DollarSign,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Loyalty Program",
    url: createPageUrl("LoyaltyProgram"),
    icon: Award,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Tables",
    url: createPageUrl("TableManagement"),
    icon: MapPin,
    roles: ["admin", "manager", "staff"],
    permission: null
  },
  {
    title: "Delivery",
    url: createPageUrl("DeliveryIntegration"),
    icon: Truck,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Import Data",
    url: createPageUrl("ImportData"),
    icon: FileUp,
    roles: ["admin", "manager"],
    permission: null
  },
  {
    title: "Developer Backoffice",
    url: createPageUrl("DeveloperBackoffice"),
    icon: Code,
    roles: ["admin"],
    permission: null
  }
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const userRole = user?.role || "customer";

  const filteredNavItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="px-7">
                <Link
                  to={createPageUrl("Home")}
                  className="flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                    RESTROBUDDY
                  </span>
                </Link>
              </div>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col space-y-2">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-900"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to={createPageUrl("Home")}
            className="flex items-center space-x-2"
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              RESTROBUDDY
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                      {user.full_name?.charAt(0) || "U"}
                    </div>
                    <span className="hidden md:inline-block">{user.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Role: {user.role}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container py-8 px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent mb-4">
                RESTROBUDDY
              </h3>
              <p className="text-sm text-slate-600">
                Complete restaurant management solution for modern businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl("Features")} className="text-slate-600 hover:text-emerald-600">Features</Link></li>
                <li><Link to={createPageUrl("Pricing")} className="text-slate-600 hover:text-emerald-600">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={createPageUrl("About")} className="text-slate-600 hover:text-emerald-600">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 hover:text-emerald-600">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-600 hover:text-emerald-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} RESTROBUDDY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}