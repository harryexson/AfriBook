import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Printer,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Bluetooth,
  Battery,
  Settings,
  Zap,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReceiptPrinterSetup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [checklist, setChecklist] = useState({});

  const steps = [
    {
      id: 0,
      title: "Before You Begin",
      description: "Make sure you have everything ready",
      icon: Settings,
      content: {
        items: [
          "Bluetooth thermal printer (RONGTA, Inkwon, or Jadens)",
          "USB charging cable (usually included)",
          "Thermal paper rolls (50mm width recommended)",
          "Computer or tablet with Chrome/Edge browser",
          "Bluetooth enabled on your device"
        ],
        tips: [
          "Charge your printer fully before first use",
          "Keep the printer within 30 feet of your device",
          "Make sure no other device is connected to the printer"
        ]
      }
    },
    {
      id: 1,
      title: "Unbox & Charge Printer",
      description: "Set up your thermal printer hardware",
      icon: Battery,
      content: {
        items: [
          "Carefully remove printer from packaging",
          "Locate the USB charging cable",
          "Connect USB cable to printer charging port",
          "Plug into power adapter or USB power source",
          "Wait for charging indicator light (usually red/orange)",
          "Charge for 2-3 hours for full battery"
        ],
        tips: [
          "Red light = Charging, Green light = Fully charged",
          "You can use the printer while charging",
          "Battery lasts 8-12 hours on full charge"
        ]
      }
    },
    {
      id: 2,
      title: "Load Thermal Paper",
      description: "Install paper roll correctly",
      icon: Printer,
      content: {
        items: [
          "Open the printer cover (usually on top)",
          "Remove any protective materials",
          "Take a thermal paper roll (50mm width)",
          "Insert roll with paper feeding from bottom",
          "Pull out 2-3 inches of paper through the slot",
          "Close the printer cover firmly until it clicks"
        ],
        tips: [
          "Thermal paper is shiny on one side - that's the print side",
          "Make sure paper feeds smoothly without resistance",
          "Trim the paper edge straight if needed"
        ]
      }
    },
    {
      id: 3,
      title: "Power On Printer",
      description: "Turn on and verify printer is working",
      icon: Zap,
      content: {
        items: [
          "Locate the power button (usually on side or top)",
          "Press and hold power button for 2-3 seconds",
          "Wait for indicator lights to turn on",
          "Printer should beep or print a startup message",
          "Blue flashing light means Bluetooth is ready",
          "If no lights, ensure printer is charged"
        ],
        tips: [
          "Blue blinking = Bluetooth pairing mode",
          "Solid blue = Bluetooth connected",
          "Red blinking = Low battery or paper jam"
        ]
      }
    },
    {
      id: 4,
      title: "Enable Bluetooth on Device",
      description: "Prepare your computer/tablet for pairing",
      icon: Bluetooth,
      content: {
        items: [
          "Open Chrome, Edge, or Opera browser",
          "Go to device Bluetooth settings",
          "Turn on Bluetooth if not already enabled",
          "Make sure Bluetooth is discoverable",
          "Close other apps that might use Bluetooth",
          "Keep device within 10 feet of printer"
        ],
        tips: [
          "Web Bluetooth works in Chrome, Edge, and Opera",
          "Safari and Firefox do not support Web Bluetooth",
          "You don't need to pair in system settings first"
        ]
      }
    },
    {
      id: 5,
      title: "Open Printer Setup Page",
      description: "Navigate to RESTROBUDDY printer setup",
      icon: Settings,
      content: {
        items: [
          "Log into RESTROBUDDY admin dashboard",
          "Click on 'Printer Setup' in the sidebar",
          "You'll see the Bluetooth connection page",
          "Make sure printer is powered on nearby",
          "Click the big 'Scan for Printers' button",
          "Browser will ask for Bluetooth permission - click 'Allow'"
        ],
        tips: [
          "First time may ask for site permissions",
          "Make sure popup blockers are disabled",
          "Keep the setup page open during pairing"
        ]
      }
    },
    {
      id: 6,
      title: "Pair Bluetooth Printer",
      description: "Connect printer to RESTROBUDDY",
      icon: Bluetooth,
      content: {
        items: [
          "A Bluetooth device selector will appear",
          "Look for your printer name (RONGTA, Inkwon, Jadens)",
          "Click on your printer name in the list",
          "Click 'Pair' or 'Connect' button",
          "Wait for connection confirmation",
          "You should see 'Connected' status with green badge"
        ],
        tips: [
          "Printer may show as 'Unknown Device' - that's okay",
          "If printer doesn't appear, press power button to wake it",
          "Try moving printer closer if connection fails"
        ]
      }
    },
    {
      id: 7,
      title: "Test Print",
      description: "Verify printer is working correctly",
      icon: CheckCircle,
      content: {
        items: [
          "On the Printer Setup page, find your connected printer",
          "Click the 'Test Print' button",
          "Choose a label template (Kitchen Ticket recommended)",
          "Wait 2-3 seconds for print to start",
          "Printer should print a sample ticket",
          "Verify text is clear and properly aligned"
        ],
        tips: [
          "If nothing prints, check paper is loaded correctly",
          "Faint print = low battery or old paper",
          "If successful, your printer is ready to use!"
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Receipt Printer Setup</h1>
          <p className="text-slate-600">Step-by-step guide for Bluetooth thermal printer pairing</p>
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
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    completedSteps.includes(index) 
                      ? 'bg-emerald-500 text-white' 
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
                  <span className="text-xs text-slate-600 text-center hidden md:block max-w-[80px]">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <StepIcon className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-1">{currentStepData.title}</CardTitle>
                <p className="text-blue-100">{currentStepData.description}</p>
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
            <Link to={createPageUrl("PrinterSetup")}>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                Go to Printer Setup
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleCompleteStep}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Completion Badge */}
        {completedSteps.length === steps.length && (
          <Card className="mt-8 bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Setup Complete! 🎉</h3>
              <p className="mb-6">Your receipt printer is now ready to use in RESTROBUDDY</p>
              <div className="flex gap-4 justify-center">
                <Link to={createPageUrl("PrinterSetup")}>
                  <Button variant="secondary" size="lg">
                    Test Your Printer
                  </Button>
                </Link>
                <Link to={createPageUrl("KitchenDisplay")}>
                  <Button variant="secondary" size="lg">
                    Go to Kitchen Display
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