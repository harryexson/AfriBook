import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const prefs = await base44.entities.NotificationPreferences.filter({
        user_email: currentUser.email
      });

      if (prefs.length > 0) {
        setPreferences(prefs[0]);
      } else {
        // Create default preferences
        const newPrefs = await base44.entities.NotificationPreferences.create({
          user_email: currentUser.email,
          welcome_emails: true,
          payment_confirmations: true,
          payment_failures: true,
          renewal_reminders: true,
          subscription_updates: true
        });
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field) => {
    try {
      setSaving(true);
      const updated = {
        ...preferences,
        [field]: !preferences[field]
      };

      await base44.entities.NotificationPreferences.update(preferences.id, {
        [field]: !preferences[field]
      });

      setPreferences(updated);
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const notificationTypes = [
    {
      id: 'welcome_emails',
      title: 'Welcome Emails',
      description: 'Receive a welcome email when you start a new subscription',
      icon: Mail
    },
    {
      id: 'payment_confirmations',
      title: 'Payment Confirmations',
      description: 'Get notified when payments are processed successfully',
      icon: CheckCircle2
    },
    {
      id: 'payment_failures',
      title: 'Payment Failures',
      description: 'Receive alerts when payment processing fails (recommended)',
      icon: Bell
    },
    {
      id: 'renewal_reminders',
      title: 'Renewal Reminders',
      description: 'Get notified when your subscription renews',
      icon: Bell
    },
    {
      id: 'subscription_updates',
      title: 'Subscription Updates',
      description: 'Receive notifications about subscription changes',
      icon: Mail
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Notification Settings</h1>
        <p className="text-slate-600">
          Manage your email notification preferences for your RESTROBUDDY subscription
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <AlertDescription className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which email notifications you'd like to receive at <strong>{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.id} className="flex items-start justify-between py-4 border-b last:border-0">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{type.title}</h3>
                    <p className="text-sm text-slate-600">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.[type.id] || false}
                  onCheckedChange={() => handleToggle(type.id)}
                  disabled={saving}
                  className="ml-4"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> We recommend keeping payment failure notifications enabled to stay informed about any billing issues.
        </p>
      </div>
    </div>
  );
}