import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Monitor,
  Tablet,
  ArrowRight,
  CheckCircle,
  Clock,
  Star,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SetupGuides() {
  const guides = [
    {
      id: "receipt-printer",
      title: "Receipt Printer Setup",
      description: "Step-by-step guide for Bluetooth thermal printer pairing",
      icon: Printer,
      difficulty: "Easy",
      time: "10-15 minutes",
      popular: true,
      color: "from-blue-500 to-blue-600",
      steps: 8,
      url: createPageUrl("ReceiptPrinterSetup")
    },
    {
      id: "kitchen-display",
      title: "Kitchen Display Setup",
      description: "Complete guide for touchscreen KDS installation",
      icon: Monitor,
      difficulty: "Medium",
      time: "30-45 minutes",
      popular: true,
      color: "from-green-500 to-green-600",
      steps: 10,
      url: createPageUrl("KitchenDisplaySetup")
    },
    {
      id: "kiosk",
      title: "Kiosk Configuration",
      description: "Tablet setup and self-service kiosk mode configuration",
      icon: Tablet,
      difficulty: "Medium",
      time: "20-30 minutes",
      popular: false,
      color: "from-purple-500 to-purple-600",
      steps: 9,
      url: createPageUrl("KioskSetup")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Setup Guides & Resources</h1>
          <p className="text-slate-600">Step-by-step installation wizards for RESTROBUDDY hardware</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">3</div>
                  <div className="text-sm text-blue-700">Setup Guides</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">Easy</div>
                  <div className="text-sm text-green-700">Interactive Wizards</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">15min</div>
                  <div className="text-sm text-purple-700">Average Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Guides */}
        <div className="grid md:grid-cols-1 gap-6">
          {guides.map((guide) => {
            const IconComponent = guide.icon;
            return (
              <Card key={guide.id} className="border-2 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${guide.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-10 h-10 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl font-bold text-slate-900">{guide.title}</h3>
                            {guide.popular && (
                              <Badge className="bg-amber-500">
                                <Star className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 mb-4">{guide.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${
                            guide.difficulty === 'Easy' ? 'border-green-500 text-green-700' :
                            'border-amber-500 text-amber-700'
                          }`}>
                            {guide.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{guide.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>{guide.steps} steps</span>
                        </div>
                      </div>

                      <Link to={guide.url}>
                        <Button className={`bg-gradient-to-r ${guide.color} text-white hover:opacity-90`}>
                          Start Setup Wizard
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Resources */}
        <Card className="mt-8 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">📞 Support Team</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Our technical support team is available to help you through setup.
                </p>
                <Button variant="outline" size="sm">Contact Support</Button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">📚 Documentation</h4>
                <p className="text-sm text-slate-600 mb-3">
                  Browse our complete hardware documentation and troubleshooting guides.
                </p>
                <Button variant="outline" size="sm">View Docs</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}