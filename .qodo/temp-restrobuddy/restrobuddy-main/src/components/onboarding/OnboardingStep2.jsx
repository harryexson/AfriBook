import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MapPin, Clock, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OnboardingStep2({ formData, updateFormData }) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const updateAddress = (field, value) => {
    updateFormData({
      address: { ...formData.address, [field]: value }
    });
  };

  const geocodeAddress = async () => {
    const { street, city, state, zip } = formData.address || {};
    if (!street || !city || !state) {
      alert("Please enter at least street, city, and state");
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${street}, ${city}, ${state} ${zip || ''}`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Get the GPS coordinates (latitude and longitude) for this address: "${fullAddress}". Return only the coordinates as numbers.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" }
          }
        }
      });

      if (result.lat && result.lng) {
        updateFormData({ location: { lat: result.lat, lng: result.lng } });
      } else {
        alert("Could not find coordinates for this address");
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      alert("Failed to fetch coordinates. Please try again.");
    }
    setIsGeocoding(false);
  };

  const updateHours = (day, field, value) => {
    updateFormData({
      operating_hours: {
        ...formData.operating_hours,
        [day]: { ...formData.operating_hours[day], [field]: value }
      }
    });
  };

  const copyHoursToAll = (sourceDay) => {
    const sourceHours = formData.operating_hours[sourceDay];
    const newHours = {};
    DAYS.forEach(day => {
      newHours[day] = { ...sourceHours };
    });
    updateFormData({ operating_hours: newHours });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Location & Operating Hours</h2>
        <p className="text-slate-600 mt-2">Help customers find you and know when you're open</p>
      </div>

      {/* Address */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Restaurant Address
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Street Address *</Label>
            <Input
              value={formData.address?.street || ''}
              onChange={(e) => updateAddress('street', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>City *</Label>
              <Input
                value={formData.address?.city || ''}
                onChange={(e) => updateAddress('city', e.target.value)}
                placeholder="New York"
                className="mt-1"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={formData.address?.state || ''}
                onChange={(e) => updateAddress('state', e.target.value)}
                placeholder="NY"
                className="mt-1"
              />
            </div>
            <div>
              <Label>ZIP Code *</Label>
              <Input
                value={formData.address?.zip || ''}
                onChange={(e) => updateAddress('zip', e.target.value)}
                placeholder="10001"
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={geocodeAddress}
              disabled={isGeocoding}
              className="gap-2"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching coordinates...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Get GPS Coordinates
                </>
              )}
            </Button>
            {formData.location?.lat && formData.location?.lng && (
              <p className="text-sm text-green-600">
                ✓ Location: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Operating Hours
          </h3>
        </div>

        <div className="space-y-3">
          {DAYS.map((day, idx) => (
            <div key={day} className="flex items-center gap-4 p-3 bg-white rounded-lg">
              <div className="w-28 font-medium text-slate-700">{DAY_LABELS[idx]}</div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={!formData.operating_hours?.[day]?.closed}
                  onCheckedChange={(checked) => updateHours(day, 'closed', !checked)}
                />
                <span className="text-sm text-slate-500">
                  {formData.operating_hours?.[day]?.closed ? 'Closed' : 'Open'}
                </span>
              </div>

              {!formData.operating_hours?.[day]?.closed && (
                <>
                  <Input
                    type="time"
                    value={formData.operating_hours?.[day]?.open || '09:00'}
                    onChange={(e) => updateHours(day, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-slate-500">to</span>
                  <Input
                    type="time"
                    value={formData.operating_hours?.[day]?.close || '21:00'}
                    onChange={(e) => updateHours(day, 'close', e.target.value)}
                    className="w-32"
                  />
                </>
              )}

              {idx === 0 && (
                <button
                  onClick={() => copyHoursToAll('monday')}
                  className="text-xs text-emerald-600 hover:underline ml-auto"
                >
                  Copy to all days
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>Average Prep Time (minutes)</Label>
          <Input
            type="number"
            value={formData.average_prep_time}
            onChange={(e) => updateFormData({ average_prep_time: parseInt(e.target.value) || 20 })}
            min="5"
            max="120"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">How long orders typically take to prepare</p>
        </div>

        <div>
          <Label>Minimum Order Amount ($)</Label>
          <Input
            type="number"
            value={formData.min_order_amount}
            onChange={(e) => updateFormData({ min_order_amount: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.50"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Set to 0 for no minimum</p>
        </div>
      </div>
    </div>
  );
}