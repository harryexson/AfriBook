import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AIPricingAssistant({ formData, onApplyPricing }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pricingRecommendation, setPricingRecommendation] = useState(null);

  const analyzePricing = async () => {
    if (!formData.business_name || !formData.cuisine_type?.length || !formData.address?.city) {
      alert("Please complete restaurant details first (name, cuisine, location)");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze pricing strategy for a ${formData.cuisine_type.join(' and ')} restaurant named "${formData.business_name}" in ${formData.address.city}, ${formData.address.state}.

        Current price range: ${formData.price_range}
        Average prep time: ${formData.average_prep_time} minutes
        
        Provide:
        1. Recommended pricing tiers (budget, standard, premium)
        2. Suggested average order value targets
        3. Menu item pricing ranges for different categories
        4. Competitive positioning advice
        5. Value optimization tips
        
        Consider local market, cuisine type, and operational efficiency.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_price_range: { type: "string" },
            pricing_tiers: {
              type: "object",
              properties: {
                budget: { 
                  type: "object",
                  properties: {
                    range: { type: "string" },
                    description: { type: "string" }
                  }
                },
                standard: {
                  type: "object",
                  properties: {
                    range: { type: "string" },
                    description: { type: "string" }
                  }
                },
                premium: {
                  type: "object",
                  properties: {
                    range: { type: "string" },
                    description: { type: "string" }
                  }
                }
              }
            },
            target_average_order: { type: "number" },
            category_pricing: {
              type: "object",
              properties: {
                appetizers: { type: "string" },
                entrees: { type: "string" },
                sides: { type: "string" },
                desserts: { type: "string" },
                beverages: { type: "string" }
              }
            },
            competitive_positioning: { type: "string" },
            tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setPricingRecommendation(result);
    } catch (error) {
      console.error("Pricing analysis failed:", error);
      alert("Failed to analyze pricing. Please try again.");
    }
    setIsAnalyzing(false);
  };

  const applyRecommendation = () => {
    if (pricingRecommendation?.recommended_price_range) {
      onApplyPricing(pricingRecommendation);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          AI Pricing Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pricingRecommendation ? (
          <div className="text-center py-6">
            <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="text-slate-700 mb-4">
              Get AI-powered pricing recommendations based on your cuisine, location, and market analysis
            </p>
            <Button
              onClick={analyzePricing}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Market...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Pricing Strategy
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recommended Price Range */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600">Recommended</Badge>
                <span className="font-bold text-2xl">{pricingRecommendation.recommended_price_range}</span>
              </div>
              <p className="text-sm text-slate-600">{pricingRecommendation.competitive_positioning}</p>
            </div>

            {/* Target Average Order */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold">Target Average Order</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">
                ${pricingRecommendation.target_average_order?.toFixed(2)}
              </span>
            </div>

            {/* Pricing Tiers */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Pricing Tiers</h4>
              {Object.entries(pricingRecommendation.pricing_tiers || {}).map(([tier, data]) => (
                <div key={tier} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{tier}</span>
                    <Badge variant="outline">{data.range}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{data.description}</p>
                </div>
              ))}
            </div>

            {/* Category Pricing */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Category Pricing Guide</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(pricingRecommendation.category_pricing || {}).map(([category, range]) => (
                  <div key={category} className="bg-white rounded-lg p-2 border text-center">
                    <div className="text-xs text-slate-500 capitalize">{category}</div>
                    <div className="font-semibold text-sm">{range}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">💡 Optimization Tips</h4>
              <ul className="space-y-2">
                {pricingRecommendation.tips?.map((tip, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-purple-600">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={applyRecommendation}
                className="flex-1 bg-purple-600"
              >
                Apply Recommendations
              </Button>
              <Button
                variant="outline"
                onClick={() => setPricingRecommendation(null)}
              >
                Reanalyze
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}