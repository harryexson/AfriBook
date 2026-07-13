import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Settings,
  Bell,
  Volume2,
  Navigation,
  Zap,
  Moon,
  Sun,
  Globe,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';

export default function DriverSettings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      ride_requests: true,
      earnings_updates: true,
      promotional_offers: false,
      sound_enabled: true,
      vibration_enabled: true,
      notification_volume: 80
    },
    preferences: {
      auto_accept_rides: false,
      preferred_distance: 10,
      max_passengers: 4,
      accept_pool_rides: true,
      accept_xl_rides: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '06:00'
    },
    navigation: {
      preferred_maps: 'google',
      avoid_tolls: false,
      avoid_highways: false,
      voice_guidance: true
    },
    display: {
      theme: 'system',
      language: 'en',
      units: 'metric'
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load settings from user preferences
      if (currentUser.driver_info?.preferences) {
        setSettings(currentUser.driver_info.preferences);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({
        driver_info: {
          ...user.driver_info,
          preferences: settings
        }
      });
      
      toast.success('Settings saved successfully!');
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (category, key, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <Toaster richColors />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Driver Settings
            </h1>
            <p className="text-gray-600 mt-2">Customize your driving experience</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage how you receive ride requests and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Ride Request Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when new rides are available</p>
                  </div>
                  <Switch
                    checked={settings.notifications.ride_requests}
                    onCheckedChange={(checked) => updateSettings('notifications', 'ride_requests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Sound Alerts</Label>
                    <p className="text-sm text-gray-500">Play sound for ride requests</p>
                  </div>
                  <Switch
                    checked={settings.notifications.sound_enabled}
                    onCheckedChange={(checked) => updateSettings('notifications', 'sound_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Vibration</Label>
                    <p className="text-sm text-gray-500">Vibrate on new ride requests</p>
                  </div>
                  <Switch
                    checked={settings.notifications.vibration_enabled}
                    onCheckedChange={(checked) => updateSettings('notifications', 'vibration_enabled', checked)}
                  />
                </div>

                {settings.notifications.sound_enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Notification Volume
                      </Label>
                      <span className="text-sm font-medium">{settings.notifications.notification_volume}%</span>
                    </div>
                    <Slider
                      value={[settings.notifications.notification_volume]}
                      onValueChange={([value]) => updateSettings('notifications', 'notification_volume', value)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Earnings Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about payout status</p>
                  </div>
                  <Switch
                    checked={settings.notifications.earnings_updates}
                    onCheckedChange={(checked) => updateSettings('notifications', 'earnings_updates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Promotional Offers</Label>
                    <p className="text-sm text-gray-500">Receive tips and special offers</p>
                  </div>
                  <Switch
                    checked={settings.notifications.promotional_offers}
                    onCheckedChange={(checked) => updateSettings('notifications', 'promotional_offers', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ride Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Ride Preferences
                </CardTitle>
                <CardDescription>Control which rides you want to accept</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Maximum Pickup Distance</Label>
                  <Select
                    value={settings.preferences.preferred_distance.toString()}
                    onValueChange={(value) => updateSettings('preferences', 'preferred_distance', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Within 5 km</SelectItem>
                      <SelectItem value="10">Within 10 km</SelectItem>
                      <SelectItem value="15">Within 15 km</SelectItem>
                      <SelectItem value="20">Within 20 km</SelectItem>
                      <SelectItem value="50">Any distance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Pool Rides</Label>
                    <p className="text-sm text-gray-500">Accept rides with multiple passengers</p>
                  </div>
                  <Switch
                    checked={settings.preferences.accept_pool_rides}
                    onCheckedChange={(checked) => updateSettings('preferences', 'accept_pool_rides', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">XL Rides</Label>
                    <p className="text-sm text-gray-500">Accept rides requiring larger vehicles</p>
                  </div>
                  <Switch
                    checked={settings.preferences.accept_xl_rides}
                    onCheckedChange={(checked) => updateSettings('preferences', 'accept_xl_rides', checked)}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <Label className="text-base">Quiet Hours</Label>
                      <p className="text-sm text-gray-500">Pause ride requests during these hours</p>
                    </div>
                    <Switch
                      checked={settings.preferences.quiet_hours_enabled}
                      onCheckedChange={(checked) => updateSettings('preferences', 'quiet_hours_enabled', checked)}
                    />
                  </div>
                  
                  {settings.preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <input
                          type="time"
                          value={settings.preferences.quiet_hours_start}
                          onChange={(e) => updateSettings('preferences', 'quiet_hours_start', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <input
                          type="time"
                          value={settings.preferences.quiet_hours_end}
                          onChange={(e) => updateSettings('preferences', 'quiet_hours_end', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Navigation
                </CardTitle>
                <CardDescription>Configure navigation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Preferred Maps App</Label>
                  <Select
                    value={settings.navigation.preferred_maps}
                    onValueChange={(value) => updateSettings('navigation', 'preferred_maps', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Maps</SelectItem>
                      <SelectItem value="apple">Apple Maps</SelectItem>
                      <SelectItem value="waze">Waze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Avoid Tolls</Label>
                    <p className="text-sm text-gray-500">Route around toll roads when possible</p>
                  </div>
                  <Switch
                    checked={settings.navigation.avoid_tolls}
                    onCheckedChange={(checked) => updateSettings('navigation', 'avoid_tolls', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Avoid Highways</Label>
                    <p className="text-sm text-gray-500">Prefer local roads over highways</p>
                  </div>
                  <Switch
                    checked={settings.navigation.avoid_highways}
                    onCheckedChange={(checked) => updateSettings('navigation', 'avoid_highways', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Voice Guidance</Label>
                    <p className="text-sm text-gray-500">Turn-by-turn voice instructions</p>
                  </div>
                  <Switch
                    checked={settings.navigation.voice_guidance}
                    onCheckedChange={(checked) => updateSettings('navigation', 'voice_guidance', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Display & Language
                </CardTitle>
                <CardDescription>Customize app appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.display.theme}
                    onValueChange={(value) => updateSettings('display', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Distance Units</Label>
                  <Select
                    value={settings.display.units}
                    onValueChange={(value) => updateSettings('display', 'units', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Kilometers (km)</SelectItem>
                      <SelectItem value="imperial">Miles (mi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}