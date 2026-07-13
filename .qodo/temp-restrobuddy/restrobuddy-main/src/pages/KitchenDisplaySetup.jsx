import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Monitor,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  Wifi,
  Settings,
  AlertCircle,
  Cable,
  Power
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KitchenDisplaySetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [checklist, setChecklist] = useState({});

  const steps = [
    {
      id: 0,
      title: "Equipment Checklist",
      description: "Gather all necessary hardware",
      icon: Package,
      content: {
        items: [
          "Touchscreen monitor (21-24 inch recommended)",
          "Mini PC (Beelink Mini S12 Pro or Intel NUC recommended)",
          "HDMI cable",
          "Power cables for monitor and Mini PC",
          "VESA wall mount (100x100mm) or stand",
          "Ethernet cable (optional, for wired connection)",
          "Keyboard and mouse for initial setup"
        ],
        tips: [
          "Choose a touchscreen monitor rated for commercial use",
          "Consider IP65-rated monitors for wet kitchen environments",
          "Mini PC can be VESA-mounted behind the monitor",
          "Mount at eye level (4-5 feet) for kitchen staff"
        ]
      }
    },
    {
      id: 1,
      title: "Choose Installation Location",
      description: "Select the best spot for your KDS",
      icon: Monitor,
      content: {
        items: [
          "Choose location visible to kitchen staff",
          "Ensure power outlet is nearby (within 6 feet)",
          "Check WiFi signal strength in the area",
          "Consider distance from prep stations",
          "Avoid direct sunlight on screen",
          "Keep away from excessive heat sources (stoves, ovens)",
          "Ensure adequate space for cable management"
        ],
        tips: [
          "Best location: Between prep line and expo station",
          "Multiple displays? Place one per station (grill, fry, salad)",
          "Leave 2-3 inches clearance around monitor for ventilation",
          "Consider staff workflow and traffic patterns"
        ]
      }
    },
    {
      id: 2,
      title: "Mount the Monitor",
      description: "Install touchscreen display securely",
      icon: Settings,
      content: {
        items: [
          "Locate VESA mounting holes on back of monitor (100x100mm)",
          "Attach VESA mount bracket to monitor using included screws",
          "Mark wall mounting position with pencil",
          "Use stud finder to locate wall studs",
          "Drill pilot holes and install wall anchors if needed",
          "Mount wall bracket securely with appropriate screws",
          "Hang monitor on wall bracket and ensure it's level",
          "Tighten all adjustment screws"
        ],
        tips: [
          "Use lag bolts into studs for maximum strength",
          "Wall anchors rated for 50+ lbs if no studs available",
          "Height: 4-5 feet from floor to center of screen",
          "Slight downward tilt (10-15°) reduces glare"
        ]
      }
    },
    {
      id: 3,
      title: "Install Mini PC",
      description: "Set up the computer behind display",
      icon: Package,
      content: {
        items: [
          "Locate VESA mounting holes on back of monitor",
          "Attach Mini PC VESA mount adapter",
          "Secure Mini PC to back of monitor",
          "Ensure Mini PC vents are not blocked",
          "Route cables neatly using cable clips",
          "Leave access to Mini PC ports for maintenance",
          "Secure all cables with velcro straps"
        ],
        tips: [
          "Position Mini PC for easy access to USB ports",
          "Keep vents clear for proper cooling",
          "Use cable clips to prevent cable strain",
          "Label cables for easy troubleshooting"
        ]
      }
    },
    {
      id: 4,
      title: "Connect Cables",
      description: "Wire everything together",
      icon: Cable,
      content: {
        items: [
          "Connect HDMI cable from Mini PC to monitor",
          "Plug monitor power cable into outlet",
          "Plug Mini PC power cable into outlet",
          "Connect ethernet cable to Mini PC (if using wired)",
          "Connect keyboard and mouse to Mini PC USB ports",
          "Use cable management clips to organize wires",
          "Ensure no cables are stretched or pinched"
        ],
        tips: [
          "Use high-quality HDMI cables to prevent display issues",
          "Wired ethernet provides more stable connection than WiFi",
          "Keep power cables away from data cables to reduce interference",
          "Take photos of cable connections for future reference"
        ]
      }
    },
    {
      id: 5,
      title: "Power On & Initial Boot",
      description: "Start up the system",
      icon: Power,
      content: {
        items: [
          "Press power button on monitor",
          "Press power button on Mini PC",
          "Wait for Windows/Linux to boot (30-60 seconds)",
          "Complete initial Windows setup wizard",
          "Set computer name (e.g., 'Kitchen-Display-1')",
          "Create admin user account",
          "Skip Microsoft account sign-in if prompted"
        ],
        tips: [
          "Choose a strong password and write it down securely",
          "Set power settings to 'Never sleep' or 'Never turn off display'",
          "Disable Windows updates during business hours",
          "Note down the computer name for remote support"
        ]
      }
    },
    {
      id: 6,
      title: "Connect to Internet",
      description: "Set up network connectivity",
      icon: Wifi,
      content: {
        items: [
          "Open Windows Settings > Network & Internet",
          "For WiFi: Select your restaurant's network",
          "Enter WiFi password",
          "Wait for connection confirmation",
          "Open browser to test internet connection",
          "Bookmark RESTROBUDDY Kitchen Display URL",
          "Test loading the Kitchen Display page"
        ],
        tips: [
          "Wired ethernet is more reliable than WiFi",
          "Keep WiFi password in secure location",
          "2.4GHz WiFi has better range, 5GHz has faster speed",
          "Test internet speed - minimum 5 Mbps recommended"
        ]
      }
    },
    {
      id: 7,
      title: "Configure Display Settings",
      description: "Optimize screen for kitchen use",
      icon: Settings,
      content: {
        items: [
          "Right-click desktop > Display settings",
          "Set resolution to native (usually 1920x1080)",
          "Set brightness to 80-100% for kitchen visibility",
          "Enable 'Night light' to reduce blue light if desired",
          "Set screen orientation to Landscape",
          "Adjust scaling to 100% (125% if text too small)",
          "Test touchscreen - tap corners and center"
        ],
        tips: [
          "Higher brightness = more visible in bright kitchens",
          "Keep desktop clean - remove unnecessary icons",
          "Set solid color background (avoid busy images)",
          "Test touchscreen with wet finger to simulate use"
        ]
      }
    },
    {
      id: 8,
      title: "Set Up Kitchen Display App",
      description: "Configure RESTROBUDDY KDS",
      icon: Monitor,
      content: {
        items: [
          "Open Chrome browser (install if needed)",
          "Go to your RESTROBUDDY dashboard",
          "Navigate to Kitchen Display page",
          "Log in with staff account",
          "Click 'Full Screen' or press F11",
          "Bookmark the Kitchen Display page",
          "Set browser to open KDS on startup",
          "Test order notifications and sounds"
        ],
        tips: [
          "Use Chrome for best performance",
          "Enable desktop notifications for new orders",
          "Set volume to audible level for order alerts",
          "Create desktop shortcut for quick access"
        ]
      }
    },
    {
      id: 9,
      title: "Final Testing & Training",
      description: "Verify everything works correctly",
      icon: CheckCircle,
      content: {
        items: [
          "Create a test order from POS or order page",
          "Verify order appears on kitchen display",
          "Test touchscreen - mark order as preparing",
          "Test marking order as ready",
          "Test marking order as completed",
          "Verify order status updates correctly",
          "Test with multiple simultaneous orders",
          "Train kitchen staff on using the display"
        ],
        tips: [
          "Run through full workflow with staff present",
          "Create quick reference guide and post near display",
          "Test during slow period first",
          "Have backup plan if display goes offline"
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Kitchen Display Setup</h1>
          <p className="text-slate-600">Complete guide for touchscreen KDS installation</p>
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
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-6 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center min-w-[60px]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    completedSteps.includes(index) 
                      ? 'bg-green-500 text-white' 
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
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <StepIcon className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-1">{currentStepData.title}</CardTitle>
                <p className="text-green-100">{currentStepData.description}</p>
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
            <Link to={createPageUrl("KitchenDisplay")}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Open Kitchen Display
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleCompleteStep}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Completion Badge */}
        {completedSteps.length === steps.length && (
          <Card className="mt-8 bg-gradient-to-r from-green-500 to-green-600 border-0 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Setup Complete! 🎉</h3>
              <p className="mb-6">Your Kitchen Display System is now ready for production use</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to={createPageUrl("KitchenDisplay")}>
                  <Button variant="secondary" size="lg">
                    Open Kitchen Display
                  </Button>
                </Link>
                <Link to={createPageUrl("OrderMenu")}>
                  <Button variant="secondary" size="lg">
                    Create Test Order
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