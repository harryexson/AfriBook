
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tablet, Settings, CheckCircle, AlertCircle } from "lucide-react";

export default function KioskSetupGuide() {
  const setupSteps = [
    {
      title: "Get Your Hardware",
      description: "You'll need a tablet or iPad. Any modern device works!",
      items: [
        "iPad (2018 or newer) - Recommended",
        "Samsung Galaxy Tab (2019+)",
        "Amazon Fire HD 10 (Budget option)",
        "Any tablet with web browser and touch screen"
      ]
    },
    {
      title: "Position Your Kiosk",
      description: "Place it where customers can easily access it",
      items: [
        "Near entrance or counter",
        "At standing height (42-48 inches)",
        "Good lighting (avoid glare)",
        "Stable surface or tablet stand"
      ]
    },
    {
      title: "Connect to WiFi",
      description: "Ensure stable internet connection",
      items: [
        "Connect tablet to your WiFi",
        "Test connection speed (minimum 5 Mbps)",
        "Consider backup cellular data",
        "Restart tablet if connection drops"
      ]
    },
    {
      title: "Open Kiosk Mode",
      description: "Navigate to your kiosk URL",
      items: [
        `Open browser on tablet`,
        `Go to: ${window.location.origin}/KioskMode`, // Changed from /kiosk-mode
        "Bookmark the page",
        "Enable full-screen mode (F11 on most browsers)"
      ]
    },
    {
      title: "Configure Browser",
      description: "Optimize for kiosk experience",
      items: [
        "Enable 'Stay Awake' mode (Settings → Display)",
        "Disable browser notifications",
        "Clear cache regularly",
        "Turn off auto-updates during business hours"
      ]
    },
    {
      title: "Test & Go Live",
      description: "Make sure everything works smoothly",
      items: [
        "Place a test order",
        "Verify order appears in kitchen display",
        "Check payment processing",
        "Train staff on troubleshooting"
      ]
    }
  ];

  const recommendedHardware = [
    {
      name: "iPad 10.2\" (Budget)",
      price: "$329",
      pros: ["Reliable", "Long battery life", "Great support"],
      bestFor: "Most restaurants"
    },
    {
      name: "iPad Pro 11\" (Premium)",
      price: "$799",
      pros: ["Fastest", "Best display", "Professional look"],
      bestFor: "High-end establishments"
    },
    {
      name: "Samsung Galaxy Tab S9",
      price: "$799",
      pros: ["Android flexibility", "Great screen", "S-Pen included"],
      bestFor: "Android preference"
    },
    {
      name: "Amazon Fire HD 10",
      price: "$149",
      pros: ["Most affordable", "Good enough", "Easy to replace"],
      bestFor: "Budget-conscious"
    }
  ];

  const accessories = [
    { name: "Tablet Stand", price: "$30-100", essential: true },
    { name: "Screen Protector", price: "$10-20", essential: true },
    { name: "Tablet Case", price: "$20-50", essential: false },
    { name: "Card Reader (Square)", price: "$49", essential: false },
    { name: "Receipt Printer", price: "$200-400", essential: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <Tablet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Kiosk Setup Guide
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Turn any tablet into a self-service ordering kiosk in under 10 minutes
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-0 shadow-2xl mb-12 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              Quick Start (5 Minutes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-lg">Grab any tablet/iPad you own</p>
                  <p className="text-slate-600">No special hardware needed</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-lg">Open browser & go to kiosk URL</p>
                  <code className="bg-slate-100 px-3 py-1 rounded text-sm mt-1 block">
                    {window.location.origin}/KioskMode {/* Changed from /kiosk-mode */}
                  </code>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-lg">Place it on your counter</p>
                  <p className="text-slate-600">Done! Customers can start ordering</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Detailed Setup Steps */}
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Detailed Setup</h2>
        <div className="space-y-6 mb-12">
          {setupSteps.map((step, idx) => (
            <Card key={idx} className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{step.title}</CardTitle>
                    <p className="text-slate-600 text-sm">{step.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 pl-16">
                  {step.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hardware Recommendations */}
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Recommended Hardware</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {recommendedHardware.map((device, idx) => (
            <Card key={idx} className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <Badge className="bg-emerald-600 text-white text-lg px-3 py-1">
                    {device.price}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-600 mb-1">Pros:</p>
                    <ul className="space-y-1">
                      {device.pros.map((pro, proIdx) => (
                        <li key={proIdx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm">
                      <span className="font-semibold text-slate-700">Best for:</span>{" "}
                      <span className="text-slate-600">{device.bestFor}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Accessories */}
        <Card className="border-0 shadow-xl mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Recommended Accessories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessories.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {item.essential && (
                      <Badge className="bg-red-600 text-white">Essential</Badge>
                    )}
                    <span className="font-semibold text-slate-900">{item.name}</span>
                  </div>
                  <span className="text-emerald-600 font-bold">{item.price}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips & Troubleshooting */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Mount tablet at 45° angle for best viewing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Add signage: "Order Here" or "Touch to Start"
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Keep screen clean with microfiber cloth
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">
                    Restart tablet once per day (during slow hours)
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <p className="font-semibold text-sm text-slate-900">Screen froze?</p>
                  <p className="text-xs text-slate-600">Hold power button 10 seconds to restart</p>
                </li>
                <li>
                  <p className="font-semibold text-sm text-slate-900">Orders not sending?</p>
                  <p className="text-xs text-slate-600">Check WiFi connection, refresh page</p>
                </li>
                <li>
                  <p className="font-semibold text-sm text-slate-900">Screen too dim?</p>
                  <p className="text-xs text-slate-600">Settings → Display → Brightness (100%)</p>
                </li>
                <li>
                  <p className="font-semibold text-sm text-slate-900">Touch not responsive?</p>
                  <p className="text-xs text-slate-600">Clean screen, restart tablet</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
