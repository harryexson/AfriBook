
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Printer,
  Tablet,
  Monitor,
  Smartphone,
  Wifi,
  Bluetooth,
  Usb,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Search,
  Download,
  Star,
  ShoppingCart,
  Package
} from "lucide-react";

export default function HardwareCompatibility() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const thermalPrinters = [
    {
      name: "MUNBYN ITPP129",
      category: "Receipt Printer",
      price: "$79.99",
      connectivity: ["Bluetooth", "USB"],
      specs: {
        width: "80mm (3.15 inch)",
        speed: "90mm/s",
        resolution: "203 DPI",
        paperRoll: "80mm x 60mm",
        battery: "Built-in 2000mAh",
        compatibility: "iOS, Android, Windows"
      },
      pros: [
        "Excellent Bluetooth range (30ft)",
        "Fast printing speed",
        "Portable with battery",
        "Auto-cutter included",
        "Works with Square, Clover, Toast"
      ],
      cons: [
        "Bluetooth setup can be tricky initially",
        "Battery life ~8-10 hours"
      ],
      recommended: "Best for mobile/kiosk setups",
      buyLink: "https://www.amazon.com/dp/B0B5QZXW8F",
      rating: 4.3,
      tested: true,
      supported: true
    },
    {
      name: "Rongta RPP320",
      category: "Receipt Printer",
      price: "$69.99",
      connectivity: ["Bluetooth", "USB"],
      specs: {
        width: "80mm",
        speed: "80mm/s",
        resolution: "203 DPI",
        paperRoll: "80mm x 50mm",
        battery: "2600mAh",
        compatibility: "iOS, Android, Windows"
      },
      pros: [
        "Very affordable",
        "Reliable Bluetooth",
        "Good battery life",
        "ESC/POS compatible",
        "Lightweight and portable"
      ],
      cons: [
        "Slightly slower than competitors",
        "Basic paper quality"
      ],
      recommended: "Budget-friendly option",
      buyLink: "https://www.amazon.com/dp/B08R3QZXW9",
      rating: 4.2,
      tested: true,
      supported: true
    },
    {
      name: "Star Micronics mPOP",
      category: "Receipt Printer + Cash Drawer",
      price: "$399.00",
      connectivity: ["Bluetooth", "USB"],
      specs: {
        width: "58mm",
        speed: "100mm/s",
        resolution: "203 DPI",
        paperRoll: "58mm x 50mm",
        battery: "None (AC powered)",
        compatibility: "iOS, Android, Windows",
        extras: "Integrated cash drawer"
      },
      pros: [
        "All-in-one solution",
        "Professional quality",
        "Apple certified",
        "Reliable and durable",
        "Great for countertops"
      ],
      cons: [
        "Expensive",
        "Requires power outlet",
        "Smaller paper width"
      ],
      recommended: "Premium counter solution",
      buyLink: "https://www.starmicronics.com/mpop",
      rating: 4.7,
      tested: false,
      supported: false
    },
    {
      name: "Epson TM-M30",
      category: "Receipt Printer",
      price: "$249.00",
      connectivity: ["Bluetooth", "USB", "Ethernet"],
      specs: {
        width: "80mm",
        speed: "200mm/s",
        resolution: "203 DPI",
        paperRoll: "80mm x 83mm",
        battery: "None",
        compatibility: "iOS, Android, Windows, Linux"
      },
      pros: [
        "Very fast printing",
        "Multiple connectivity options",
        "Compact cube design",
        "Reliable brand",
        "ESC/POS and Star emulation"
      ],
      cons: [
        "Higher price point",
        "Requires power"
      ],
      recommended: "High-volume restaurants",
      buyLink: "https://www.epson.com/tm-m30",
      rating: 4.6,
      tested: false,
      supported: false
    }
  ];

  const labelPrinters = [
    {
      name: "RONGTA Smart Label Printer R22",
      category: "Label Printer",
      price: "$49.99",
      connectivity: ["Bluetooth"],
      specs: {
        width: "50mm (2 inch)",
        speed: "50mm/s",
        resolution: "203 DPI",
        labelSize: "20-50mm wide",
        battery: "Built-in 1200mAh",
        compatibility: "iOS, Android, Windows",
        protocol: "ESC/POS compatible"
      },
      pros: [
        "Very affordable",
        "Compact and portable",
        "Perfect for kitchen labels",
        "Good battery life",
        "ESC/POS protocol support",
        "Direct Web Bluetooth compatible"
      ],
      cons: [
        "Smaller print width",
        "Label rolls cost more than receipt paper"
      ],
      recommended: "Kitchen order labels, product labels",
      buyLink: "https://www.amazon.com/dp/B0BK6QZXW9",
      rating: 4.4,
      tested: true,
      supported: true,
      driverSupport: "Built-in Web Bluetooth + ESC/POS"
    },
    {
      name: "Inkwon Portable Wireless Label Printer B21",
      category: "Label Printer",
      price: "$39.99",
      connectivity: ["Bluetooth"],
      specs: {
        width: "50mm (2 inch)",
        speed: "45mm/s",
        resolution: "203 DPI",
        labelSize: "20-50mm wide",
        battery: "Built-in 1000mAh",
        compatibility: "iOS, Android, Windows",
        protocol: "ESC/POS compatible"
      },
      pros: [
        "Most affordable option",
        "Ultra-portable",
        "Easy Bluetooth pairing",
        "Good for quick labels",
        "ESC/POS support",
        "Web Bluetooth ready"
      ],
      cons: [
        "Smaller battery",
        "Basic build quality"
      ],
      recommended: "Budget label printing, order tickets",
      buyLink: "https://www.amazon.com/dp/B09XYZ1234",
      rating: 4.2,
      tested: true,
      supported: true,
      driverSupport: "Built-in Web Bluetooth + ESC/POS"
    },
    {
      name: "Jadens JD23 Mini Thermal Printer",
      category: "Label Printer",
      price: "$45.99",
      connectivity: ["Bluetooth"],
      specs: {
        width: "50mm (2 inch)",
        speed: "50mm/s",
        resolution: "203 DPI",
        labelSize: "20-50mm wide",
        battery: "Built-in 1500mAh",
        compatibility: "iOS, Android, Windows",
        protocol: "ESC/POS compatible"
      },
      pros: [
        "Good battery capacity",
        "Reliable Bluetooth",
        "Fast printing",
        "Durable construction",
        "ESC/POS protocol",
        "Web Bluetooth compatible"
      ],
      cons: [
        "Slightly higher price than Inkwon",
        "Label rolls proprietary"
      ],
      recommended: "Kitchen tickets, shipping labels",
      buyLink: "https://www.amazon.com/dp/B0CDEF5678",
      rating: 4.5,
      tested: true,
      supported: true,
      driverSupport: "Built-in Web Bluetooth + ESC/POS"
    }
  ];

  const kioskTablets = [
    {
      name: "Amazon Fire HD 10",
      category: "Kiosk Tablet",
      price: "$139.99",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "10.1 inch (1920x1200)",
        storage: "32GB or 64GB",
        ram: "3GB",
        battery: "Up to 12 hours",
        os: "Fire OS (Android-based)",
        camera: "5MP front + 5MP rear"
      },
      pros: [
        "Very affordable",
        "Good battery life",
        "Decent performance",
        "Can run web apps via Silk browser",
        "Durable for daily use"
      ],
      cons: [
        "Limited to Amazon app store (can sideload)",
        "Not as powerful as iPad",
        "Requires Google Play sideload for some apps"
      ],
      recommended: "Budget kiosk option",
      buyLink: "https://www.amazon.com/dp/B08F5Z3RK5",
      rating: 4.4,
      mounting: "VESA mount compatible with adapters",
      tested: true
    },
    {
      name: "Samsung Galaxy Tab A8",
      category: "Kiosk Tablet",
      price: "$229.99",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "10.5 inch (1920x1200)",
        storage: "32GB/64GB/128GB",
        ram: "3GB or 4GB",
        battery: "7,040 mAh (up to 13 hours)",
        os: "Android 11",
        camera: "5MP front + 8MP rear"
      },
      pros: [
        "Full Android OS",
        "Good build quality",
        "Excellent screen",
        "Long battery life",
        "Google Play Store access",
        "Multiple mounting options available"
      ],
      cons: [
        "Mid-range processor",
        "No stylus support"
      ],
      recommended: "Best Android kiosk tablet",
      buyLink: "https://www.samsung.com/us/tablets/galaxy-tab-a/",
      rating: 4.5,
      mounting: "Compatible with standard tablet mounts",
      tested: true
    },
    {
      name: "iPad 10.2\" (9th Gen)",
      category: "Kiosk Tablet",
      price: "$329.00",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "10.2 inch Retina (2160x1620)",
        storage: "64GB or 256GB",
        ram: "3GB",
        battery: "Up to 10 hours",
        os: "iPadOS",
        camera: "12MP front + 8MP rear"
      },
      pros: [
        "Excellent performance",
        "High-quality display",
        "Reliable and secure",
        "Great app ecosystem",
        "Professional appearance",
        "Easy to manage (MDM support)"
      ],
      cons: [
        "Higher cost",
        "Proprietary accessories"
      ],
      recommended: "Premium kiosk solution",
      buyLink: "https://www.apple.com/ipad-10.2/",
      rating: 4.8,
      mounting: "Square Stand, CTA Security mounts available",
      tested: true
    },
    {
      name: "Lenovo Tab M10 Plus",
      category: "Kiosk Tablet",
      price: "$179.99",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "10.3 inch (1920x1200)",
        storage: "32GB/64GB/128GB",
        ram: "4GB",
        battery: "5,000 mAh",
        os: "Android 10",
        camera: "5MP front + 8MP rear"
      },
      pros: [
        "Affordable",
        "Good performance",
        "Metal build quality",
        "Expandable storage",
        "Kids mode available"
      ],
      cons: [
        "Average battery life",
        "Basic cameras"
      ],
      recommended: "Budget-friendly option",
      buyLink: "https://www.lenovo.com/tablets",
      rating: 4.3,
      mounting: "Standard VESA compatible",
      tested: false
    }
  ];

  const counterTablets = [
    {
      name: "iPad Mini 6",
      category: "Counter Tablet",
      price: "$499.00",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "8.3 inch Liquid Retina (2266x1488)",
        storage: "64GB or 256GB",
        ram: "4GB",
        battery: "Up to 10 hours",
        os: "iPadOS",
        processor: "A15 Bionic"
      },
      pros: [
        "Compact and portable",
        "Powerful processor",
        "Excellent display",
        "Apple Pencil 2 support",
        "Perfect for server stations",
        "Touch ID"
      ],
      cons: [
        "Premium price",
        "Smaller screen"
      ],
      recommended: "Best for server/staff use",
      buyLink: "https://www.apple.com/ipad-mini/",
      rating: 4.8,
      mounting: "Counter stands and wall mounts available",
      tested: true
    },
    {
      name: "Samsung Galaxy Tab S6 Lite",
      category: "Counter Tablet",
      price: "$349.99",
      connectivity: ["WiFi", "Bluetooth"],
      specs: {
        screen: "10.4 inch (2000x1200)",
        storage: "64GB or 128GB",
        ram: "4GB",
        battery: "7,040 mAh",
        os: "Android 12",
        extras: "S Pen included"
      },
      pros: [
        "Includes stylus",
        "Great for signatures",
        "Good battery life",
        "Affordable price",
        "Expandable storage"
      ],
      cons: [
        "Mid-range processor",
        "Plastic back"
      ],
      recommended: "Budget staff tablet",
      buyLink: "https://www.samsung.com/us/tablets/",
      rating: 4.5,
      mounting: "Standard tablet mounts",
      tested: true
    },
    {
      name: "Microsoft Surface Go 3",
      category: "Counter Tablet",
      price: "$399.99",
      connectivity: ["WiFi", "Bluetooth", "USB-C"],
      specs: {
        screen: "10.5 inch PixelSense (1920x1280)",
        storage: "64GB or 128GB",
        ram: "4GB or 8GB",
        battery: "Up to 11 hours",
        os: "Windows 11",
        processor: "Intel Pentium Gold or Core i3"
      },
      pros: [
        "Full Windows OS",
        "Desktop software compatibility",
        "Kickstand included",
        "USB-C port",
        "Professional appearance"
      ],
      cons: [
        "Type Cover sold separately",
        "More expensive with accessories"
      ],
      recommended: "Windows-based POS systems",
      buyLink: "https://www.microsoft.com/surface/go",
      rating: 4.4,
      mounting: "VESA compatible with adapters",
      tested: false
    }
  ];

  const kitchenDisplays = [
    {
      name: "ASUS VT229H 21.5\" Touch Monitor",
      category: "Kitchen Display",
      price: "$199.99",
      connectivity: ["HDMI", "VGA", "USB"],
      specs: {
        screen: "21.5 inch IPS (1920x1080)",
        touch: "10-point multi-touch",
        brightness: "250 nits",
        response: "5ms",
        mounting: "VESA 100x100mm",
        warranty: "3 years"
      },
      pros: [
        "Affordable touchscreen",
        "Good viewing angles",
        "Anti-glare coating",
        "Reliable touch response",
        "Easy to clean surface",
        "VESA mountable"
      ],
      cons: [
        "Requires PC/Mini PC",
        "Average brightness for bright kitchens"
      ],
      recommended: "Budget kitchen display",
      buyLink: "https://www.amazon.com/dp/B07YYRF6X8",
      rating: 4.5,
      tested: true
    },
    {
      name: "Dell P2418HT 24\" Touch Monitor",
      category: "Kitchen Display",
      price: "$349.99",
      connectivity: ["HDMI", "DisplayPort", "USB"],
      specs: {
        screen: "24 inch IPS (1920x1080)",
        touch: "10-point multi-touch",
        brightness: "250 nits",
        response: "6ms",
        mounting: "VESA 100x100mm",
        warranty: "3 years"
      },
      pros: [
        "Business-grade quality",
        "Durable touch panel",
        "Height adjustable stand",
        "Multiple input options",
        "Dell reliability"
      ],
      cons: [
        "Higher price",
        "Requires PC"
      ],
      recommended: "Professional kitchen display",
      buyLink: "https://www.dell.com/monitors",
      rating: 4.6,
      tested: true
    },
    {
      name: "Acer T232HL 23\" Touch Monitor",
      category: "Kitchen Display",
      price: "$249.99",
      connectivity: ["HDMI", "DVI", "USB"],
      specs: {
        screen: "23 inch IPS (1920x1080)",
        touch: "10-point multi-touch",
        brightness: "250 nits",
        response: "5ms",
        mounting: "VESA 100x100mm",
        warranty: "3 years"
      },
      pros: [
        "Good value",
        "Responsive touch",
        "Tilting stand",
        "Energy efficient",
        "Easy setup"
      ],
      cons: [
        "Stand not very adjustable",
        "Average brightness"
      ],
      recommended: "Mid-range option",
      buyLink: "https://www.amazon.com/dp/B00UDIZA7S",
      rating: 4.3,
      tested: false
    },
    {
      name: "Planar Helium PCT2235 22\" Touch Monitor",
      category: "Kitchen Display",
      price: "$399.99",
      connectivity: ["HDMI", "DisplayPort", "VGA", "USB"],
      specs: {
        screen: "22 inch IPS (1920x1080)",
        touch: "Projected capacitive (10-point)",
        brightness: "250 nits",
        response: "14ms",
        mounting: "VESA 100x100mm",
        warranty: "3 years",
        rating: "IP65 front bezel (water/dust resistant)"
      },
      pros: [
        "Industrial-grade",
        "Water and dust resistant front",
        "Perfect for kitchen environment",
        "Durable construction",
        "Works with gloves",
        "Easy to clean"
      ],
      cons: [
        "Higher price",
        "Slower response time"
      ],
      recommended: "Best for harsh kitchen environments",
      buyLink: "https://www.planar.com/products/touch-screen-monitors/",
      rating: 4.7,
      tested: false
    },
    {
      name: "ViewSonic TD2230 22\" Touch Monitor",
      category: "Kitchen Display",
      price: "$279.99",
      connectivity: ["HDMI", "VGA", "USB"],
      specs: {
        screen: "22 inch IPS (1920x1080)",
        touch: "10-point optical touch",
        brightness: "250 nits",
        response: "5ms",
        mounting: "VESA 100x100mm",
        warranty: "3 years"
      },
      pros: [
        "Reliable optical touch",
        "Good color accuracy",
        "Flicker-free",
        "Blue light filter",
        "Affordable"
      ],
      cons: [
        "Basic stand",
        "Touch can be sensitive to ambient light"
      ],
      recommended: "Good all-around choice",
      buyLink: "https://www.viewsonic.com/us/td2230.html",
      rating: 4.4,
      tested: false
    }
  ];

  const miniPCs = [
    {
      name: "Beelink Mini S12 Pro",
      category: "Mini PC for Displays",
      price: "$169.99",
      connectivity: ["WiFi", "Bluetooth", "Ethernet", "USB 3.0"],
      specs: {
        processor: "Intel N100 (4-core, up to 3.4GHz)",
        ram: "16GB DDR4",
        storage: "500GB SSD",
        os: "Windows 11 Pro",
        ports: "2x HDMI, 4x USB 3.0, Ethernet, Audio"
      },
      pros: [
        "Very affordable",
        "Low power consumption",
        "Fanless design (silent)",
        "Compact size",
        "Enough power for POS apps",
        "Dual HDMI output"
      ],
      cons: [
        "Limited upgradeability",
        "Basic graphics"
      ],
      recommended: "Best budget PC for kitchen displays",
      buyLink: "https://www.amazon.com/dp/B0BQRFZ8YZ",
      rating: 4.5,
      tested: true
    },
    {
      name: "Intel NUC 11",
      category: "Mini PC for Displays",
      price: "$399.99",
      connectivity: ["WiFi 6", "Bluetooth 5.2", "Ethernet", "Thunderbolt 4"],
      specs: {
        processor: "Intel Core i3-1115G4 (2-core, up to 4.1GHz)",
        ram: "8GB DDR4 (expandable to 64GB)",
        storage: "256GB NVMe SSD",
        os: "Windows 11",
        ports: "HDMI, Thunderbolt 4, 4x USB 3.1"
      },
      pros: [
        "Powerful performance",
        "Compact design",
        "Reliable Intel brand",
        "Expandable",
        "Thunderbolt 4 support",
        "Quiet operation"
      ],
      cons: [
        "Higher price",
        "May need RAM/storage upgrade"
      ],
      recommended: "Premium mini PC solution",
      buyLink: "https://www.intel.com/nuc",
      rating: 4.7,
      tested: false
    },
    {
      name: "Raspberry Pi 4 Model B (8GB)",
      category: "Mini PC for Displays",
      price: "$75.00",
      connectivity: ["WiFi", "Bluetooth 5.0", "Ethernet", "USB 3.0"],
      specs: {
        processor: "Broadcom BCM2711 (4-core, 1.5GHz)",
        ram: "8GB LPDDR4",
        storage: "MicroSD card (32GB+ recommended)",
        os: "Raspberry Pi OS, Ubuntu, or others",
        ports: "2x micro-HDMI, 2x USB 3.0, 2x USB 2.0"
      },
      pros: [
        "Very cheap",
        "Low power",
        "Great for web-based apps",
        "Large community support",
        "Educational/DIY friendly"
      ],
      cons: [
        "Requires technical setup",
        "Limited processing power",
        "Need case, power supply, storage separately"
      ],
      recommended: "DIY/tech-savvy users only",
      buyLink: "https://www.raspberrypi.com/products/raspberry-pi-4-model-b/",
      rating: 4.4,
      tested: true
    }
  ];

  const accessories = [
    {
      name: "CTA Digital Security Kiosk Stand",
      category: "Tablet Mount",
      price: "$149.99",
      compatibility: "iPad 10.2\", iPad Air, iPad Pro",
      features: [
        "Secure enclosure with lock",
        "Adjustable height",
        "Cable management",
        "Anti-theft design",
        "Weighted base"
      ]
    },
    {
      name: "Arkon Heavy Duty Tablet Mount",
      category: "Counter Mount",
      price: "$79.99",
      compatibility: "Universal (7-13 inch tablets)",
      features: [
        "Adjustable arm",
        "360° rotation",
        "C-clamp base",
        "Cable clips included",
        "Sturdy construction"
      ]
    },
    {
      name: "Square Stand for iPad",
      category: "POS Stand",
      price: "$169.00",
      compatibility: "iPad models",
      features: [
        "Card reader built-in",
        "Swivel base",
        "Cable management",
        "Professional appearance",
        "Square integration"
      ]
    },
    {
      name: "Thermal Paper Rolls (50 pack)",
      category: "Consumables",
      price: "$29.99",
      specifications: "80mm x 50mm, BPA-free",
      features: [
        "Compatible with most 80mm printers",
        "BPA-free paper",
        "50 rolls per pack",
        "Bright white paper",
        "Long-lasting prints"
      ]
    }
  ];

  const allHardware = [
    ...thermalPrinters.map(item => ({...item, category: "Thermal Printers"})),
    ...labelPrinters.map(item => ({...item, category: "Label Printers"})),
    ...kioskTablets.map(item => ({...item, category: "Kiosk Tablets"})),
    ...counterTablets.map(item => ({...item, category: "Counter Tablets"})),
    ...kitchenDisplays.map(item => ({...item, category: "Kitchen Displays"})),
    ...miniPCs.map(item => ({...item, category: "Mini PCs"})),
  ];

  const filteredHardware = allHardware.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
                           item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const HardwareCard = ({ item }) => (
    <Card className="border-2 hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{item.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{item.category}</Badge>
              {item.tested && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Tested
                </Badge>
              )}
              {item.supported && (
                <Badge className="bg-blue-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Driver Support
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-600">{item.price}</div>
            {item.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">{item.rating}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Connectivity */}
        {item.connectivity && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Connectivity:</p>
            <div className="flex flex-wrap gap-2">
              {item.connectivity.map((conn, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1">
                  {conn === "Bluetooth" && <Bluetooth className="w-3 h-3" />}
                  {conn === "WiFi" && <Wifi className="w-3 h-3" />}
                  {conn === "USB" && <Usb className="w-3 h-3" />}
                  {conn}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Specs */}
        {item.specs && (
          <div className="mb-4 bg-slate-50 rounded p-3">
            <p className="text-sm font-semibold text-slate-700 mb-2">Specifications:</p>
            <div className="text-xs space-y-1">
              {Object.entries(item.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.driverSupport && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded p-3">
            <p className="text-sm font-semibold text-emerald-900 mb-1">🔌 Driver Support:</p>
            <p className="text-sm text-emerald-800">{item.driverSupport}</p>
          </div>
        )}

        {/* Pros */}
        {item.pros && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-green-700 mb-2">✓ Pros:</p>
            <ul className="text-xs space-y-1">
              {item.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons */}
        {item.cons && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-amber-700 mb-2">⚠ Cons:</p>
            <ul className="text-xs space-y-1">
              {item.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended */}
        {item.recommended && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-semibold text-blue-900 mb-1">💡 Recommended Use:</p>
            <p className="text-sm text-blue-800">{item.recommended}</p>
          </div>
        )}

        {/* Buy Link */}
        {item.buyLink && (
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <a href={item.buyLink} target="_blank" rel="noopener noreferrer">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Product
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-10 h-10 text-emerald-600" />
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Hardware Compatibility Guide</h1>
              <p className="text-slate-600">Tested and recommended hardware for RESTROBUDDY</p>
            </div>
          </div>
          
          <Badge className="bg-red-600 text-white">
            🔒 Internal Use Only - Sales, Support, Development Teams
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{thermalPrinters.length}</div>
                  <div className="text-blue-100 text-sm">Receipt Printers</div>
                </div>
                <Printer className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{labelPrinters.length}</div>
                  <div className="text-emerald-100 text-sm">Label Printers</div>
                </div>
                <Printer className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{kioskTablets.length + counterTablets.length}</div>
                  <div className="text-purple-100 text-sm">Tablets</div>
                </div>
                <Tablet className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{kitchenDisplays.length}</div>
                  <div className="text-green-100 text-sm">Kitchen Displays</div>
                </div>
                <Monitor className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{miniPCs.length}</div>
                  <div className="text-amber-100 text-sm">Mini PCs</div>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hardware..."
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="thermal">Thermal Printers</option>
            <option value="label">Label Printers</option>
            <option value="kiosk">Kiosk Tablets</option>
            <option value="counter">Counter Tablets</option>
            <option value="kitchen">Kitchen Displays</option>
            <option value="mini">Mini PCs</option>
          </select>
        </div>

        <Tabs defaultValue="printers" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl">
            <TabsTrigger value="printers">
              <Printer className="w-4 h-4 mr-2" />
              Receipt Printers
            </TabsTrigger>
            <TabsTrigger value="labels">
              <Printer className="w-4 h-4 mr-2" />
              Label Printers
            </TabsTrigger>
            <TabsTrigger value="kiosk">
              <Tablet className="w-4 h-4 mr-2" />
              Kiosk Tablets
            </TabsTrigger>
            <TabsTrigger value="counter">
              <Smartphone className="w-4 h-4 mr-2" />
              Counter Tablets
            </TabsTrigger>
            <TabsTrigger value="kitchen">
              <Monitor className="w-4 h-4 mr-2" />
              Kitchen Displays
            </TabsTrigger>
            <TabsTrigger value="mini">
              <Package className="w-4 h-4 mr-2" />
              Mini PCs
            </TabsTrigger>
            <TabsTrigger value="accessories">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Accessories
            </TabsTrigger>
          </TabsList>

          {/* Thermal Printers Tab */}
          <TabsContent value="printers">
            <div className="grid md:grid-cols-2 gap-6">
              {thermalPrinters.map((printer, idx) => (
                <HardwareCard key={idx} item={printer} />
              ))}
            </div>
          </TabsContent>

          {/* Label Printers Tab - NEW */}
          <TabsContent value="labels">
            <div className="grid md:grid-cols-2 gap-6">
              {labelPrinters.map((printer, idx) => (
                <HardwareCard key={idx} item={printer} />
              ))}
            </div>

            <Card className="mt-8 bg-emerald-50 border-emerald-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-emerald-900 mb-3">🔌 Built-in Driver Support:</h3>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li>• <strong>Web Bluetooth API:</strong> Connect directly from browser - no app install needed</li>
                  <li>• <strong>ESC/POS Protocol:</strong> Industry-standard thermal printer commands</li>
                  <li>• <strong>One-Click Pairing:</strong> Simple Bluetooth connection from Printer Setup page</li>
                  <li>• <strong>Works on any device:</strong> Desktop, tablet, or phone with Bluetooth</li>
                  <li>• <strong>Label Templates:</strong> Pre-configured formats for kitchen tickets, order labels</li>
                  <li>• <strong>Test Print Function:</strong> Verify printer before use</li>
                  <li>• <strong>Auto-reconnect:</strong> Remembers paired printers</li>
                </ul>
                <div className="mt-4 p-3 bg-white rounded border border-emerald-300">
                  <p className="text-sm font-semibold text-emerald-900 mb-2">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-600">Kitchen Order Tickets</Badge>
                    <Badge className="bg-emerald-600">Product Labels</Badge>
                    <Badge className="bg-emerald-600">Shipping Labels</Badge>
                    <Badge className="bg-emerald-600">Quick Receipts</Badge>
                    <Badge className="bg-emerald-600">Table Numbers</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kiosk Tablets Tab */}
          <TabsContent value="kiosk">
            <div className="grid md:grid-cols-2 gap-6">
              {kioskTablets.map((tablet, idx) => (
                <HardwareCard key={idx} item={tablet} />
              ))}
            </div>
          </TabsContent>

          {/* Counter Tablets Tab */}
          <TabsContent value="counter">
            <div className="grid md:grid-cols-2 gap-6">
              {counterTablets.map((tablet, idx) => (
                <HardwareCard key={idx} item={tablet} />
              ))}
            </div>
          </TabsContent>

          {/* Kitchen Displays Tab */}
          <TabsContent value="kitchen">
            <div className="grid md:grid-cols-2 gap-6">
              {kitchenDisplays.map((display, idx) => (
                <HardwareCard key={idx} item={display} />
              ))}
            </div>

            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-900 mb-3">💡 Kitchen Display Setup Notes:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• All touchscreen monitors require a Mini PC or computer to function</li>
                  <li>• For web-based displays, a low-cost Mini PC (like Beelink) is sufficient</li>
                  <li>• Consider IP65-rated displays for wet/greasy kitchen environments</li>
                  <li>• VESA mounting (100x100mm) is standard for all listed displays</li>
                  <li>• Recommended: Mount at eye level for kitchen staff (4-5 ft high)</li>
                  <li>• Use cable management to protect from kitchen hazards</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mini PCs Tab */}
          <TabsContent value="mini">
            <div className="grid md:grid-cols-2 gap-6">
              {miniPCs.map((pc, idx) => (
                <HardwareCard key={idx} item={pc} />
              ))}
            </div>

            <Card className="mt-8 bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 mb-3">🖥️ Mini PC Use Cases:</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li><strong>Kitchen Displays:</strong> Beelink Mini S12 Pro is perfect (affordable, silent, enough power)</li>
                  <li><strong>Back Office:</strong> Intel NUC 11 for running reports, management software</li>
                  <li><strong>Multiple Displays:</strong> Beelink supports dual HDMI (2 kitchen displays)</li>
                  <li><strong>Tech DIY:</strong> Raspberry Pi 4 for browser-based KDS only (requires setup knowledge)</li>
                  <li><strong>Mounting:</strong> All mini PCs can be VESA-mounted behind displays</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accessories Tab */}
          <TabsContent value="accessories">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessories.map((accessory, idx) => (
                <Card key={idx} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{accessory.name}</CardTitle>
                    <Badge variant="outline">{accessory.category}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 mb-4">
                      {accessory.price}
                    </div>
                    
                    {accessory.compatibility && (
                      <p className="text-sm text-slate-600 mb-3">
                        <strong>Compatibility:</strong> {accessory.compatibility}
                      </p>
                    )}

                    {accessory.specifications && (
                      <p className="text-sm text-slate-600 mb-3">
                        <strong>Specifications:</strong> {accessory.specifications}
                      </p>
                    )}

                    {accessory.features && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Features:</p>
                        <ul className="text-xs space-y-1">
                          {accessory.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Setup Guides */}
        <Card className="mt-8 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <Download className="w-6 h-6" />
              Setup Guides & Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-2">📄 Receipt Printer Setup</h4>
                <p className="text-sm text-slate-600 mb-3">Step-by-step guide for Bluetooth printer pairing</p>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-2">🖥️ Kitchen Display Setup</h4>
                <p className="text-sm text-slate-600 mb-3">Complete guide for touchscreen KDS installation</p>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-bold text-slate-900 mb-2">📱 Kiosk Configuration</h4>
                <p className="text-sm text-slate-600 mb-3">Tablet setup and kiosk mode configuration</p>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
