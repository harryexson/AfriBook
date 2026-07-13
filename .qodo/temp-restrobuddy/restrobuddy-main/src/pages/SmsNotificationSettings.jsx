import React, { useState, useEffect } from "react";
import { SmsOptOut } from "@/entities/SmsOptOut";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Bell,
  BellOff,
  Phone,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Clock
} from "lucide-react";

export default function SmsNotificationSettings() {
  const [user, setUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [optOutRecord, setOptOutRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    reservationConfirmations: true,
    reservationReminders: true,
    waitlistUpdates: true,
    tableReadyAlerts: true,
    promotionalOffers: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Try to get phone from user profile or customer profile
      let phone = currentUser.phone || "";
      
      if (!phone) {
        // Check if they have a customer profile
        try {
          const profiles = await base44.entities.CustomerProfile.filter({ 
            user_email: currentUser.email 
          });
          if (profiles.length > 0) {
            phone = profiles[0].phone || "";
          }
        } catch (error) {
          console.log("No customer profile found");
        }
      }

      setPhoneNumber(phone);

      if (phone) {
        // Check opt-out status
        const optOuts = await SmsOptOut.filter({ phone_number: phone });
        if (optOuts.length > 0) {
          setOptOutRecord(optOuts[0]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleOptIn = async () => {
    if (!phoneNumber) {
      alert("Please enter your phone number");
      return;
    }

    setIsSaving(true);
    try {
      if (optOutRecord) {
        // Update existing record
        await SmsOptOut.update(optOutRecord.id, {
          opted_out: false,
          opt_in_date: new Date().toISOString()
        });
      } else {
        // Create new record (opted in)
        await SmsOptOut.create({
          phone_number: phoneNumber,
          opted_out: false,
          opt_in_date: new Date().toISOString()
        });
      }

      alert("You're now opted in to SMS notifications!");
      await loadData();
    } catch (error) {
      console.error("Error opting in:", error);
      alert("Failed to update preferences");
    }
    setIsSaving(false);
  };

  const handleOptOut = async () => {
    if (!confirm("Are you sure you want to opt out of all SMS notifications?")) return;

    setIsSaving(true);
    try {
      if (optOutRecord) {
        // Update existing record
        await SmsOptOut.update(optOutRecord.id, {
          opted_out: true,
          opt_out_date: new Date().toISOString()
        });
      } else {
        // Create new record (opted out)
        await SmsOptOut.create({
          phone_number: phoneNumber,
          opted_out: true,
          opt_out_date: new Date().toISOString()
        });
      }

      alert("You've been opted out of SMS notifications.");
      await loadData();
    } catch (error) {
      console.error("Error opting out:", error);
      alert("Failed to update preferences");
    }
    setIsSaving(false);
  };

  const isOptedOut = optOutRecord?.opted_out ?? false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SMS Notification Settings</h1>
          <p className="text-slate-600">Manage how you receive text message updates</p>
        </div>

        {/* Status Card */}
        <Card className={`border-0 shadow-xl mb-8 ${isOptedOut ? 'bg-red-50' : 'bg-green-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isOptedOut ? 'bg-red-600' : 'bg-green-600'
              }`}>
                {isOptedOut ? (
                  <BellOff className="w-8 h-8 text-white" />
                ) : (
                  <Bell className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-2xl font-bold ${isOptedOut ? 'text-red-900' : 'text-green-900'}`}>
                  {isOptedOut ? 'SMS Notifications Disabled' : 'SMS Notifications Enabled'}
                </h3>
                <p className={`${isOptedOut ? 'text-red-700' : 'text-green-700'}`}>
                  {isOptedOut 
                    ? 'You will not receive any text message notifications'
                    : 'You will receive text message updates for reservations and waitlist'}
                </p>
              </div>
              <Badge className={isOptedOut ? 'bg-red-600' : 'bg-green-600'}>
                {isOptedOut ? 'Opted Out' : 'Opted In'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Phone Number Card */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-600" />
              Phone Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Your Phone Number</Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-2">
                We'll send SMS notifications to this number
              </p>
            </div>

            <div className="flex gap-3">
              {isOptedOut ? (
                <Button 
                  onClick={handleOptIn} 
                  disabled={isSaving || !phoneNumber}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Opt In to SMS Notifications'}
                </Button>
              ) : (
                <Button 
                  onClick={handleOptOut} 
                  disabled={isSaving}
                  variant="outline"
                  className="text-red-600 flex-1"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Opt Out of SMS Notifications'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Notification Types
            </CardTitle>
            <p className="text-sm text-slate-600">
              {isOptedOut ? 'Opt in to receive these notifications' : 'You will receive these notifications'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg ${isOptedOut ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold">Reservation Confirmations</p>
                  <p className="text-sm text-slate-600">Instant confirmation when you book</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg ${isOptedOut ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-semibold">Reservation Reminders</p>
                  <p className="text-sm text-slate-600">24 hours and 1 hour before your reservation</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg ${isOptedOut ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold">Waitlist Updates</p>
                  <p className="text-sm text-slate-600">Position updates and queue status</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div className={`flex items-center justify-between p-4 bg-slate-50 rounded-lg ${isOptedOut ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold">Table Ready Alerts</p>
                  <p className="text-sm text-slate-600">Immediate notification when your table is ready</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-2">How SMS Notifications Work</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Standard message and data rates may apply</li>
                  <li>• Reply STOP at any time to opt out</li>
                  <li>• Reply YES to opt back in after opting out</li>
                  <li>• Messages come from our restaurant phone number</li>
                  <li>• We never share your phone number with third parties</li>
                  <li>• You can manage preferences anytime from this page</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}