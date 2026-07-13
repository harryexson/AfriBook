import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Save, CheckCircle } from "lucide-react";
import { SmsNotificationPreference } from "@/entities/SmsNotificationPreference";

export default function NotificationPreferences({ user }) {
  const [preferences, setPreferences] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const prefs = await SmsNotificationPreference.filter({ user_email: user.email });
      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        // Create default preferences
        const newPref = await SmsNotificationPreference.create({
          user_email: user.email,
          phone: user.phone || "",
          order_updates: true,
          promotional: true,
          reservation_reminders: true,
          loyalty_rewards: true,
          opted_out_completely: false
        });
        setPreferences(newPref);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await SmsNotificationPreference.update(preferences.id, preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    }
    setSaving(false);
  };

  const updatePreference = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
  };

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            SMS Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Order Updates</Label>
              <p className="text-sm text-slate-600">Get notified when your order is ready or out for delivery</p>
            </div>
            <Switch
              checked={preferences.order_updates}
              onCheckedChange={(checked) => updatePreference("order_updates", checked)}
              disabled={preferences.opted_out_completely}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Promotional Messages</Label>
              <p className="text-sm text-slate-600">Receive special offers and promotions</p>
            </div>
            <Switch
              checked={preferences.promotional}
              onCheckedChange={(checked) => updatePreference("promotional", checked)}
              disabled={preferences.opted_out_completely}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Reservation Reminders</Label>
              <p className="text-sm text-slate-600">Get reminded about your upcoming reservations</p>
            </div>
            <Switch
              checked={preferences.reservation_reminders}
              onCheckedChange={(checked) => updatePreference("reservation_reminders", checked)}
              disabled={preferences.opted_out_completely}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Loyalty Rewards</Label>
              <p className="text-sm text-slate-600">Updates about your loyalty points and rewards</p>
            </div>
            <Switch
              checked={preferences.loyalty_rewards}
              onCheckedChange={(checked) => updatePreference("loyalty_rewards", checked)}
              disabled={preferences.opted_out_completely}
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div>
                <Label className="text-base font-semibold text-red-700">Opt Out of All SMS</Label>
                <p className="text-sm text-red-600">Stop receiving all SMS communications</p>
              </div>
              <Switch
                checked={preferences.opted_out_completely}
                onCheckedChange={(checked) => updatePreference("opted_out_completely", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <Bell className="w-4 h-4 inline mr-2" />
              Email notifications are always enabled for order confirmations and account security.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? "Saving..." : saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}