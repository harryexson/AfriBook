import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Phone, Upload, X, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CUISINE_OPTIONS = [
  "American", "Italian", "Mexican", "Chinese", "Japanese", "Indian",
  "Thai", "Mediterranean", "French", "Korean", "Vietnamese", "Greek",
  "Caribbean", "Middle Eastern", "BBQ", "Seafood", "Pizza", "Burgers",
  "Sushi", "Vegetarian", "Vegan", "Fast Food", "Fine Dining", "Cafe"
];

export default function OnboardingStep1({ formData, updateFormData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const generateDescription = async () => {
    if (!formData.business_name || formData.cuisine_type?.length === 0) {
      alert("Please enter restaurant name and select at least one cuisine type first");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a compelling, appetizing restaurant description for a ${formData.cuisine_type.join(', ')} restaurant named "${formData.business_name}". 
        Price range: ${formData.price_range}
        
        Requirements:
        - 2-3 sentences maximum
        - Highlight unique aspects and atmosphere
        - Focus on what makes it special
        - Be enticing for customers
        - Professional and inviting tone`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            tagline: { type: "string" }
          }
        }
      });

      setAiSuggestion(result);
      updateFormData({ description: result.description });
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("Failed to generate description. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateFormData({ logo_url: file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateFormData({ banner_url: file_url });
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const toggleCuisine = (cuisine) => {
    const current = formData.cuisine_type || [];
    if (current.includes(cuisine)) {
      updateFormData({ cuisine_type: current.filter(c => c !== cuisine) });
    } else {
      updateFormData({ cuisine_type: [...current, cuisine] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your restaurant</h2>
        <p className="text-slate-600 mt-2">This information will appear on your public profile</p>
      </div>

      {/* Logo & Banner */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>Restaurant Logo</Label>
          <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
            {formData.logo_url ? (
              <div className="relative inline-block">
                <img src={formData.logo_url} alt="Logo" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={() => updateFormData({ logo_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-600">Click to upload logo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>
        </div>

        <div>
          <Label>Banner Image</Label>
          <div className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
            {formData.banner_url ? (
              <div className="relative inline-block">
                <img src={formData.banner_url} alt="Banner" className="w-full h-24 object-cover rounded-lg" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6"
                  onClick={() => updateFormData({ banner_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm text-slate-600">Click to upload banner</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Name */}
      <div>
        <Label>Restaurant Name *</Label>
        <Input
          value={formData.business_name}
          onChange={(e) => updateFormData({ business_name: e.target.value })}
          placeholder="e.g., Joe's Pizza Palace"
          className="mt-1"
        />
      </div>

      {/* Description with AI */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Description</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={generateDescription}
            disabled={isGenerating || !formData.business_name || formData.cuisine_type?.length === 0}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Generate
              </>
            )}
          </Button>
        </div>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Tell customers what makes your restaurant special..."
          className="w-full mt-1 px-3 py-2 border rounded-lg resize-none h-24"
        />
        {aiSuggestion?.tagline && (
          <Alert className="mt-2 bg-purple-50 border-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>AI Tagline:</strong> {aiSuggestion.tagline}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label>Phone Number *</Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="pl-10"
          />
        </div>
      </div>

      {/* Cuisine Types */}
      <div>
        <Label>Cuisine Types</Label>
        <p className="text-sm text-slate-500 mb-3">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map(cuisine => (
            <Badge
              key={cuisine}
              variant={formData.cuisine_type?.includes(cuisine) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${
                formData.cuisine_type?.includes(cuisine) 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'hover:border-emerald-400'
              }`}
              onClick={() => toggleCuisine(cuisine)}
            >
              {cuisine}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label>Price Range</Label>
        <div className="flex gap-2 mt-2">
          {['$', '$$', '$$$', '$$$$'].map(price => (
            <Button
              key={price}
              variant={formData.price_range === price ? "default" : "outline"}
              onClick={() => updateFormData({ price_range: price })}
              className={formData.price_range === price ? 'bg-emerald-600' : ''}
            >
              {price}
            </Button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          $ = Under $15 • $$ = $15-30 • $$$ = $30-60 • $$$$ = $60+
        </p>
      </div>
    </div>
  );
}