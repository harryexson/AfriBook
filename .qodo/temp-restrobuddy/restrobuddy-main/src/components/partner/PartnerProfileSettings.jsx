import React, { useState } from "react";
import { Restaurant } from "@/entities/Restaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Store, Clock, MapPin, Save, Utensils
} from "lucide-react";

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cuisineTypes = ['American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian', 'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Greek', 'Spanish', 'BBQ', 'Seafood', 'Pizza', 'Burgers', 'Sushi', 'Healthy', 'Vegan'];
const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free'];

export default function PartnerProfileSettings({ restaurant, onRefresh }) {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: restaurant.business_name || "",
    description: restaurant.description || "",
    phone: restaurant.phone || "",
    logo_url: restaurant.logo_url || "",
    banner_url: restaurant.banner_url || "",
    cuisine_type: restaurant.cuisine_type || [],
    dietary_options: restaurant.dietary_options || [],
    price_range: restaurant.price_range || "$$",
    average_prep_time: restaurant.average_prep_time || 20,
    min_order_amount: restaurant.min_order_amount || 0,
    marketplace_enabled: restaurant.marketplace_enabled !== false,
    address: restaurant.address || { street: "", city: "", state: "", zip: "" },
    operating_hours: restaurant.operating_hours || daysOfWeek.reduce((acc, day) => {
      acc[day] = { open: "09:00", close: "21:00", closed: false };
      return acc;
    }, {})
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Restaurant.update(restaurant.id, formData);
      alert("Settings saved successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
    setIsSaving(false);
  };

  const toggleCuisine = (cuisine) => {
    const current = formData.cuisine_type || [];
    if (current.includes(cuisine)) {
      setFormData({ ...formData, cuisine_type: current.filter(c => c !== cuisine) });
    } else {
      setFormData({ ...formData, cuisine_type: [...current, cuisine] });
    }
  };

  const toggleDietary = (option) => {
    const current = formData.dietary_options || [];
    if (current.includes(option)) {
      setFormData({ ...formData, dietary_options: current.filter(d => d !== option) });
    } else {
      setFormData({ ...formData, dietary_options: [...current, option] });
    }
  };

  const updateHours = (day, field, value) => {
    setFormData({
      ...formData,
      operating_hours: {
        ...formData.operating_hours,
        [day]: {
          ...formData.operating_hours[day],
          [field]: value
        }
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Restaurant Settings</h2>
          <p className="text-slate-600">Manage your restaurant profile and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
          <TabsTrigger value="general" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Store className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="location" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Location
          </TabsTrigger>
          <TabsTrigger value="cuisine" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Utensils className="w-4 h-4 mr-2" />
            Cuisine
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Tell customers about your restaurant..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://..."
                    className="mt-1"
                  />
                  {formData.logo_url && (
                    <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Banner Image URL</Label>
                  <Input
                    value={formData.banner_url}
                    onChange={(e) => setFormData({...formData, banner_url: e.target.value})}
                    placeholder="https://..."
                    className="mt-1"
                  />
                  {formData.banner_url && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden bg-slate-100">
                      <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label>Price Range</Label>
                  <select
                    value={formData.price_range}
                    onChange={(e) => setFormData({...formData, price_range: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="$">$ - Budget</option>
                    <option value="$$">$$ - Moderate</option>
                    <option value="$$$">$$$ - Upscale</option>
                    <option value="$$$$">$$$$ - Fine Dining</option>
                  </select>
                </div>
                <div>
                  <Label>Avg Prep Time (mins)</Label>
                  <Input
                    type="number"
                    min="5"
                    value={formData.average_prep_time}
                    onChange={(e) => setFormData({...formData, average_prep_time: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Min Order Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({...formData, min_order_amount: parseFloat(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Marketplace Listing</p>
                  <p className="text-sm text-slate-600">Show your restaurant in the marketplace</p>
                </div>
                <Switch
                  checked={formData.marketplace_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, marketplace_enabled: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map(day => (
                <div key={day} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <div className="w-28">
                    <span className="font-medium capitalize">{day}</span>
                  </div>
                  <Switch
                    checked={!formData.operating_hours[day]?.closed}
                    onCheckedChange={(checked) => updateHours(day, 'closed', !checked)}
                  />
                  {!formData.operating_hours[day]?.closed ? (
                    <>
                      <Input
                        type="time"
                        value={formData.operating_hours[day]?.open || "09:00"}
                        onChange={(e) => updateHours(day, 'open', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-slate-600">to</span>
                      <Input
                        type="time"
                        value={formData.operating_hours[day]?.close || "21:00"}
                        onChange={(e) => updateHours(day, 'close', e.target.value)}
                        className="w-32"
                      />
                    </>
                  ) : (
                    <span className="text-slate-500">Closed</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Restaurant Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Street Address</Label>
                <Input
                  value={formData.address.street}
                  onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                  className="mt-1"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.address.city}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.address.state}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={formData.address.zip}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, zip: e.target.value}})}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cuisine Tab */}
        <TabsContent value="cuisine">
          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Cuisine Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cuisineTypes.map(cuisine => (
                    <Badge
                      key={cuisine}
                      variant={formData.cuisine_type?.includes(cuisine) ? "default" : "outline"}
                      className={`cursor-pointer ${formData.cuisine_type?.includes(cuisine) ? 'bg-emerald-600' : ''}`}
                      onClick={() => toggleCuisine(cuisine)}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Dietary Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(option => (
                    <Badge
                      key={option}
                      variant={formData.dietary_options?.includes(option) ? "default" : "outline"}
                      className={`cursor-pointer capitalize ${formData.dietary_options?.includes(option) ? 'bg-purple-600' : ''}`}
                      onClick={() => toggleDietary(option)}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}