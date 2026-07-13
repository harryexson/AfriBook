/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import APIManagement from './pages/APIManagement';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdvancedReports from './pages/AdvancedReports';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import BackofficeAccounting from './pages/BackofficeAccounting';
import BackofficeCompetitive from './pages/BackofficeCompetitive';
import BackofficeCustomerSupport from './pages/BackofficeCustomerSupport';
import BackofficeRestaurants from './pages/BackofficeRestaurants';
import BackofficeSettings from './pages/BackofficeSettings';
import BackofficeStaff from './pages/BackofficeStaff';
import BackofficeSubscriptions from './pages/BackofficeSubscriptions';
import Blog from './pages/Blog';
import BrowseSubscriptions from './pages/BrowseSubscriptions';
import Careers from './pages/Careers';
import Checkout from './pages/Checkout';
import CompetitiveBattleCard from './pages/CompetitiveBattleCard';
import CompetitiveComparison from './pages/CompetitiveComparison';
import Contact from './pages/Contact';
import CreateGroupOrder from './pages/CreateGroupOrder';
import CustomerCRM from './pages/CustomerCRM';
import CustomerCommunication from './pages/CustomerCommunication';
import CustomerInsights from './pages/CustomerInsights';
import CustomerLoyalty from './pages/CustomerLoyalty';
import CustomerOrderPage from './pages/CustomerOrderPage';
import CustomerPortal from './pages/CustomerPortal';
import CustomerProfile from './pages/CustomerProfile';
import DeliveryAnalytics from './pages/DeliveryAnalytics';
import DeliveryBatching from './pages/DeliveryBatching';
import DeliveryIntegration from './pages/DeliveryIntegration';
import DeliveryZoneManager from './pages/DeliveryZoneManager';
import DeveloperBackoffice from './pages/DeveloperBackoffice';
import DisplayContentManager from './pages/DisplayContentManager';
import DisplayContentViewer from './pages/DisplayContentViewer';
import Documentation from './pages/Documentation';
import EmployeeManagement from './pages/EmployeeManagement';
import Features from './pages/Features';
import GroupOrderSelect from './pages/GroupOrderSelect';
import HardwareCompatibility from './pages/HardwareCompatibility';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import ImportData from './pages/ImportData';
import InventoryManagement from './pages/InventoryManagement';
import KioskLogin from './pages/KioskLogin';
import KioskMode from './pages/KioskMode';
import KioskSetup from './pages/KioskSetup';
import KioskSetupGuide from './pages/KioskSetupGuide';
import KitchenDisplay from './pages/KitchenDisplay';
import KitchenDisplaySetup from './pages/KitchenDisplaySetup';
import Layout from './pages/Layout';
import LeaveReview from './pages/LeaveReview';
import LoyaltyManagement from './pages/LoyaltyManagement';
import LoyaltyProgram from './pages/LoyaltyProgram';
import LoyaltyProgramSetup from './pages/LoyaltyProgramSetup';
import ManageGroupOrder from './pages/ManageGroupOrder';
import Marketplace from './pages/Marketplace';
import MarketplaceCheckout from './pages/MarketplaceCheckout';
import MarketplaceOrderStatus from './pages/MarketplaceOrderStatus';
import MarketplaceRestaurant from './pages/MarketplaceRestaurant';
import MenuManagement from './pages/MenuManagement';
import MyGroupOrders from './pages/MyGroupOrders';
import MyOrders from './pages/MyOrders';
import MySubscriptions from './pages/MySubscriptions';
import NotificationCenter from './pages/NotificationCenter';
import NotificationSettings from './pages/NotificationSettings';
import OnboardingWizard from './pages/OnboardingWizard';
import OrderHistory from './pages/OrderHistory';
import OrderMenu from './pages/OrderMenu';
import OrderStatus from './pages/OrderStatus';
import POSTerminal from './pages/POSTerminal';
import PayrollManagement from './pages/PayrollManagement';
import Pricing from './pages/Pricing';
import PricingStrategy from './pages/PricingStrategy';
import PrinterSetup from './pages/PrinterSetup';
import PromotionManagement from './pages/PromotionManagement';
import PublicOrder from './pages/PublicOrder';
import QuickOrder from './pages/QuickOrder';
import ReceiptPrinterSetup from './pages/ReceiptPrinterSetup';
import ReservationManagement from './pages/ReservationManagement';
import RestaurantOnboarding from './pages/RestaurantOnboarding';
import RestaurantPartnerPortal from './pages/RestaurantPartnerPortal';
import RestaurantSettings from './pages/RestaurantSettings';
import ReviewManagement from './pages/ReviewManagement';
import SalesReports from './pages/SalesReports';
import ScreenShare from './pages/ScreenShare';
import SetupGuides from './pages/SetupGuides';
import ShiftScheduling from './pages/ShiftScheduling';
import SmsNotificationSettings from './pages/SmsNotificationSettings';
import SmsOrderingGuide from './pages/SmsOrderingGuide';
import StaffManagement from './pages/StaffManagement';
import StaffTasks from './pages/StaffTasks';
import StrategicPositioning from './pages/StrategicPositioning';
import StripeSetup from './pages/StripeSetup';
import StripeSetupGuide from './pages/StripeSetupGuide';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import Support from './pages/Support';
import SystemSettings from './pages/SystemSettings';
import TableManagement from './pages/TableManagement';
import TestGroupOrder from './pages/TestGroupOrder';
import TimeClock from './pages/TimeClock';
import VerificationHelp from './pages/VerificationHelp';
import ExpenseManagement from './pages/ExpenseManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIManagement": APIManagement,
    "About": About,
    "AdminDashboard": AdminDashboard,
    "AdvancedReports": AdvancedReports,
    "AnalyticsDashboard": AnalyticsDashboard,
    "BackofficeAccounting": BackofficeAccounting,
    "BackofficeCompetitive": BackofficeCompetitive,
    "BackofficeCustomerSupport": BackofficeCustomerSupport,
    "BackofficeRestaurants": BackofficeRestaurants,
    "BackofficeSettings": BackofficeSettings,
    "BackofficeStaff": BackofficeStaff,
    "BackofficeSubscriptions": BackofficeSubscriptions,
    "Blog": Blog,
    "BrowseSubscriptions": BrowseSubscriptions,
    "Careers": Careers,
    "Checkout": Checkout,
    "CompetitiveBattleCard": CompetitiveBattleCard,
    "CompetitiveComparison": CompetitiveComparison,
    "Contact": Contact,
    "CreateGroupOrder": CreateGroupOrder,
    "CustomerCRM": CustomerCRM,
    "CustomerCommunication": CustomerCommunication,
    "CustomerInsights": CustomerInsights,
    "CustomerLoyalty": CustomerLoyalty,
    "CustomerOrderPage": CustomerOrderPage,
    "CustomerPortal": CustomerPortal,
    "CustomerProfile": CustomerProfile,
    "DeliveryAnalytics": DeliveryAnalytics,
    "DeliveryBatching": DeliveryBatching,
    "DeliveryIntegration": DeliveryIntegration,
    "DeliveryZoneManager": DeliveryZoneManager,
    "DeveloperBackoffice": DeveloperBackoffice,
    "DisplayContentManager": DisplayContentManager,
    "DisplayContentViewer": DisplayContentViewer,
    "Documentation": Documentation,
    "EmployeeManagement": EmployeeManagement,
    "Features": Features,
    "GroupOrderSelect": GroupOrderSelect,
    "HardwareCompatibility": HardwareCompatibility,
    "HelpCenter": HelpCenter,
    "Home": Home,
    "ImportData": ImportData,
    "InventoryManagement": InventoryManagement,
    "KioskLogin": KioskLogin,
    "KioskMode": KioskMode,
    "KioskSetup": KioskSetup,
    "KioskSetupGuide": KioskSetupGuide,
    "KitchenDisplay": KitchenDisplay,
    "KitchenDisplaySetup": KitchenDisplaySetup,
    "Layout": Layout,
    "LeaveReview": LeaveReview,
    "LoyaltyManagement": LoyaltyManagement,
    "LoyaltyProgram": LoyaltyProgram,
    "LoyaltyProgramSetup": LoyaltyProgramSetup,
    "ManageGroupOrder": ManageGroupOrder,
    "Marketplace": Marketplace,
    "MarketplaceCheckout": MarketplaceCheckout,
    "MarketplaceOrderStatus": MarketplaceOrderStatus,
    "MarketplaceRestaurant": MarketplaceRestaurant,
    "MenuManagement": MenuManagement,
    "MyGroupOrders": MyGroupOrders,
    "MyOrders": MyOrders,
    "MySubscriptions": MySubscriptions,
    "NotificationCenter": NotificationCenter,
    "NotificationSettings": NotificationSettings,
    "OnboardingWizard": OnboardingWizard,
    "OrderHistory": OrderHistory,
    "OrderMenu": OrderMenu,
    "OrderStatus": OrderStatus,
    "POSTerminal": POSTerminal,
    "PayrollManagement": PayrollManagement,
    "Pricing": Pricing,
    "PricingStrategy": PricingStrategy,
    "PrinterSetup": PrinterSetup,
    "PromotionManagement": PromotionManagement,
    "PublicOrder": PublicOrder,
    "QuickOrder": QuickOrder,
    "ReceiptPrinterSetup": ReceiptPrinterSetup,
    "ReservationManagement": ReservationManagement,
    "RestaurantOnboarding": RestaurantOnboarding,
    "RestaurantPartnerPortal": RestaurantPartnerPortal,
    "RestaurantSettings": RestaurantSettings,
    "ReviewManagement": ReviewManagement,
    "SalesReports": SalesReports,
    "ScreenShare": ScreenShare,
    "SetupGuides": SetupGuides,
    "ShiftScheduling": ShiftScheduling,
    "SmsNotificationSettings": SmsNotificationSettings,
    "SmsOrderingGuide": SmsOrderingGuide,
    "StaffManagement": StaffManagement,
    "StaffTasks": StaffTasks,
    "StrategicPositioning": StrategicPositioning,
    "StripeSetup": StripeSetup,
    "StripeSetupGuide": StripeSetupGuide,
    "SubscriptionPlans": SubscriptionPlans,
    "SubscriptionSuccess": SubscriptionSuccess,
    "Support": Support,
    "SystemSettings": SystemSettings,
    "TableManagement": TableManagement,
    "TestGroupOrder": TestGroupOrder,
    "TimeClock": TimeClock,
    "VerificationHelp": VerificationHelp,
    "ExpenseManagement": ExpenseManagement,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};