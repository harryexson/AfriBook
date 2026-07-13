import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, X, ChefHat } from "lucide-react";

export default function AiUpsellSuggestions({ cartItems, restaurantId, restaurantName, onAddItem }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const [added, setAdded] = useState(new Set());
  const fetched = useRef(false);

  useEffect(() => {
    if (!cartItems?.length || fetched.current) return;
    fetched.current = true;
    fetchSuggestions();
  }, [cartItems]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch menu items from the same restaurant to use as the suggestion pool
      const menuItems = await base44.entities.MenuItem.filter({ restaurant_id: restaurantId, available: true });

      const cartNames = cartItems.map(i => i.name).join(", ");
      const menuSummary = menuItems
        .filter(m => !cartItems.find(c => c.name === m.name))
        .slice(0, 40)
        .map(m => `${m.name} ($${m.price}) [${m.category}]`)
        .join(", ");

      if (!menuSummary) { setLoading(false); return; }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart restaurant upselling assistant for ${restaurantName}.

A customer's cart contains: ${cartNames}.

Available menu items (not already in cart): ${menuSummary}

Suggest 2-3 complementary items that would pair well with what the customer already has. Prioritize drinks, appetizers, or sides that enhance the meal. Be concise and compelling.

Return JSON with this exact structure:
{
  "suggestions": [
    {
      "name": "exact item name from the menu",
      "reason": "short 1-sentence reason why it pairs well (max 10 words)"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Match suggestions back to actual menu items to get price/id
      const matched = (result?.suggestions || [])
        .map(s => {
          const found = menuItems.find(m =>
            m.name.toLowerCase().trim() === s.name.toLowerCase().trim()
          );
          return found ? { ...found, upsell_reason: s.reason } : null;
        })
        .filter(Boolean)
        .slice(0, 3);

      setSuggestions(matched);
    } catch (e) {
      console.error("Upsell fetch failed", e);
    }
    setLoading(false);
  };

  const handleAdd = (item) => {
    onAddItem({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
      category: item.category,
    });
    setAdded(prev => new Set([...prev, item.id]));
  };

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  if (!loading && visible.length === 0) return null;

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-800 text-base">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          You might also enjoy
          <Badge className="ml-auto bg-emerald-600 text-white text-xs">AI Picks</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 py-2">
            <ChefHat className="w-5 h-5 animate-bounce text-emerald-500" />
            <span className="text-sm">Finding perfect pairings...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-sm"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                    <span className="text-emerald-700 font-bold text-sm flex-shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.upsell_reason}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {added.has(item.id) ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">Added ✓</Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3"
                      onClick={() => handleAdd(item)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => handleDismiss(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}