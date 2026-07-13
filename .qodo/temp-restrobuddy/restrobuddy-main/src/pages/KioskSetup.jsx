import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tablet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  Settings,
  Lock,
  AlertCircle,
  Monitor,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KioskSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [checklist, setChecklist] = useState({});

  const steps = [
    {
      id: 0,
      title: "Choose Your Tablet",
      description: "Select the right hardware for your kiosk",
      icon: Tablet,
      content: {
        items: [
          "iPad 10.2\" (9th Gen) - Best overall, $329",
          "Samsung Galaxy Tab A8 - Best Android, $229",
          "Amazon Fire HD 10 - Budget option, $139",
          "Lenovo Tab M10 Plus - Alternative budget, $179",
          "Consider kiosk stand or wall mount",
          "Screen size: 10\" minimum recommended",
          "Choose WiFi-only (cellular not needed)"
        ],
        tips: [
          "iPad: Most reliable, best for high-traffic",
          "Android: More flexible, good value",
          "Fire HD: Budget-friendly, requires Google Play sideload",
          "Buy from retailer with good return policy"
        ]
      }
    },
    {
      id: 1,
      title: "Unbox & Charge Tablet",
      description: "Prepare your kiosk tablet",
      icon: Package,
      content: {
        items: [
          "Carefully unbox the tablet",
          "Locate charging cable and adapter",
          "Connect charger to tablet and power outlet",
          "Charge to 100% before setup (2-4 hours)",
          "While charging, plan your kiosk location",
          "Ensure WiFi is available at kiosk location",
          "Remove any screen protectors or films"
        ],
        tips: [
          "iPad: Lightning cable, 20W adapter recommended",
          "Android: USB-C cable, fast charging supported",
          "Keep original packaging for warranty",
          "Register device with manufacturer for support"
        ]
      }
    },
    {
      id: 2,
      title: "Initial Tablet Setup",
      description: "Complete device first-time setup",
      icon: Settings,
      content: {
        items: [
          "Power on tablet (press and hold power button)",
          "Select language and region",
          "Connect to your WiFi network",
          "Skip sign-in to Apple/Google/Amazon account (or create one)",
          "Agree to terms and conditions",
          "Set up device passcode (you'll disable later)",
          "Skip Face ID / Fingerprint setup",
          "Complete setup wizard"
        ],
        tips: [
          "Write down any passcodes you create",
          "Use strong WiFi password",
          "Skip optional features (Siri, Assistant, etc.)",
          "Don't add payment methods"
        ]
      }
    },
    {
      id: 3,
      title: "Install Kiosk Browser",
      description: "Set up Chrome or Safari",
      icon: Monitor,
      content: {
        items: [
          "iPad: Safari is pre-installed, open it",
          "Android: Open Google Play Store",
          "Android: Search for 'Chrome' and install",
          "Fire HD: Sideload Google Play Store first",
          "Fire HD: Then install Chrome from Play Store",
          "Open the browser app",
          "Navigate to your RESTROBUDDY URL",
          "Bookmark the order page"
        ],
        tips: [
          "Chrome works best on Android",
          "Safari works best on iPad",
          "Fire HD: Google Play sideload tutorial online",
          "Test web app loads correctly"
        ]
      }
    },
    {
      id: 4,
      title: "Configure Display Settings",
      description: "Optimize screen for kiosk use",
      icon: Settings,
      content: {
        items: [
          "Go to Settings > Display",
          "Set brightness to 80-100%",
          "Set auto-lock to 'Never' or '30 minutes'",
          "iPad: Settings > Display & Brightness > Auto-Lock > Never",
          "Android: Settings > Display > Screen timeout > 30 minutes",
          "Disable auto-rotate (lock to portrait or landscape)",
          "Adjust text size if needed for customers"
        ],
        tips: [
          "High brightness = more visible in bright areas",
          "Never auto-lock prevents screen from sleeping",
          "Portrait mode better for menu scrolling",
          "Landscape mode better for large menu grids"
        ]
      }
    },
    {
      id: 5,
      title: "Enable Guided Access / Kiosk Mode",
      description: "Lock tablet to single app",
      icon: Lock,
      content: {
        items: [
          "iPad: Settings > Accessibility > Guided Access",
          "iPad: Enable Guided Access",
          "iPad: Set passcode for Guided Access",
          "Android: Settings > Security > Screen pinning",
          "Android: Enable 'Ask for PIN before unpinning'",
          "Open RESTROBUDDY in browser",
          "iPad: Triple-click side button to start Guided Access",
          "Android: Tap Overview > Pin app icon"
        ],
        tips: [
          "Guided Access locks iPad to current app",
          "Screen pinning locks Android to current app",
          "Remember the exit passcode!",
          "Test exiting and re-entering kiosk mode"
        ]
      }
    },
    {
      id: 6,
      title: "Configure Kiosk Stand",
      description: "Mount tablet securely",
      icon: Shield,
      content: {
        items: [
          "Choose stand type: countertop, floor, or wall-mount",
          "Popular: CTA Digital Security Stand ($149)",
          "Assemble stand per manufacturer instructions",
          "Insert tablet into secure enclosure",
          "Tighten security screws with included key",
          "Route charging cable through stand",
          "Adjust stand height and angle",
          "Test stand stability - push and shake gently"
        ],
        tips: [
          "Security stands have locks to prevent theft",
          "Floor stands good for open areas",
          "Countertop stands good for reception",
          "Wall mounts good for limited space",
          "Keep security key in safe place"
        ]
      }
    },
    {
      id: 7,
      title: "Position Kiosk",
      description: "Place in optimal location",
      icon: Tablet,
      content: {
        items: [
          "Choose high-traffic, visible location",
          "Near entrance for easy customer access",
          "Avoid direct sunlight on screen",
          "Ensure power outlet nearby",
          "Keep WiFi router within 50 feet",
          "Position at comfortable height (42-48 inches)",
          "Leave space for queue line behind",
          "Post clear signage: 'Order Here'"
        ],
        tips: [
          "Near entrance = more usage",
          "Eye level = easier to use",
          "Test WiFi signal strength at location",
          "Consider ADA accessibility requirements"
        ]
      }
    },
    {
      id: 8,
      title: "Test Customer Experience",
      description: "Verify kiosk works correctly",
      icon: CheckCircle,
      content: {
        items: [
          "Open RESTROBUDDY order page",
          "Test browsing menu categories",
          "Test adding items to cart",
          "Test increasing/decreasing quantities",
          "Test special instructions",
          "Test checkout flow",
          "Test payment (if integrated)",
          "Verify order appears in Kitchen Display",
          "Test receipt printing (if configured)"
        ],
        tips: [
          "Walk through as if you're a customer",
          "Time the full ordering process",
          "Test with multiple simultaneous users",
          "Check order accuracy in kitchen"
        ]
      }
    }
  ];

  const handleCheckItem = (stepId, itemIndex) => {
    const key = `${stepId}-${itemIndex}`;
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCompleteStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((completedSteps.length) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl("SetupGuides")}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup Guides
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Kiosk Configuration</h1>
          <p className="text-slate-600">Tablet setup and self-service kiosk mode configuration</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-6 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center min-w-[60px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    completedSteps.includes(index) 
                      ? 'bg-purple-500 text-white' 
                      : index === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {completedSteps.includes(index) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <StepIcon className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-1">{currentStepData.title}</CardTitle>
                <p className="text-purple-100">{currentStepData.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {/* Instructions Checklist */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Instructions:</h3>
              <div className="space-y-3">
                {currentStepData.content.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Checkbox
                      checked={checklist[`${currentStep}-${index}`] || false}
                      onCheckedChange={() => handleCheckItem(currentStep, index)}
                      className="mt-1"
                    />
                    <label className="flex-1 text-slate-700 cursor-pointer">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {currentStepData.content.tips && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-amber-900 mb-3">💡 Pro Tips:</h4>
                    <ul className="space-y-2">
                      {currentStepData.content.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-amber-800">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Link to={createPageUrl("KioskMode")}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Launch Kiosk Mode
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleCompleteStep}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Completion Badge */}
        {completedSteps.length === steps.length && (
          <Card className="mt-8 bg-gradient-to-r from-purple-500 to-purple-600 border-0 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Kiosk Setup Complete! 🎉</h3>
              <p className="mb-6">Your self-service kiosk is now ready for customers</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to={createPageUrl("KioskMode")}>
                  <Button variant="secondary" size="lg">
                    Launch Kiosk Mode
                  </Button>
                </Link>
                <Link to={createPageUrl("OrderMenu")}>
                  <Button variant="secondary" size="lg">
                    Test Customer View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}