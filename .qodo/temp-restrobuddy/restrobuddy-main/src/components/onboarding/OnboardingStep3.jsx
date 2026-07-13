import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Plus, Trash2, Upload, X, Sparkles, Loader2, Check, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MenuImportDialog from "@/components/menu/MenuImportDialog";

const CATEGORIES = ['appetizers', 'entrees', 'sides', 'desserts', 'beverages'];

export default function OnboardingStep3({ formData, updateFormData }) {
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'entrees',
    price: '',
    image_url: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const generateMenuItems = async () => {
    const cuisineTypes = formData.cuisine_type || [];
    const priceRange = formData.price_range || '$$';

    if (cuisineTypes.length === 0) {
      alert("Please select cuisine types in Step 1 first");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 8-10 popular menu items for a ${cuisineTypes.join(' and ')} restaurant with price range ${priceRange}.

        Include a mix of:
        - 2-3 appetizers
        - 4-5 entrees/main dishes
        - 1-2 sides
        - 1-2 desserts

        For each item provide:
        - Authentic name (make it sound delicious)
        - Brief appetizing description (1 sentence)
        - Appropriate price for ${priceRange} range ($ = $8-15, $$ = $15-30, $$$ = $30-60, $$$$ = $60+)
        - Category (appetizers, entrees, sides, desserts, beverages)

        Make them authentic and popular for this cuisine type.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  price: { type: "number" }
                }
              }
            }
          }
        }
      });

      const aiItems = result.items.map(item => ({
        ...item,
        available: true,
        image_url: ''
      }));

      updateFormData({
        menuItems: [...formData.menuItems, ...aiItems]
      });

      setShowAiSuggestions(true);
      setTimeout(() => setShowAiSuggestions(false), 5000);
    } catch (error) {
      console.error("AI generation failed:", error);
      alert("Failed to generate menu items. Please try again.");
    }
    setIsGenerating(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewItem(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const addItem = () => {
    if (!newItem.name || !newItem.price) return;

    updateFormData({
      menuItems: [
        ...formData.menuItems,
        { ...newItem, price: parseFloat(newItem.price), available: true }
      ]
    });

    setNewItem({
      name: '',
      description: '',
      category: 'entrees',
      price: '',
      image_url: ''
    });
  };

  const removeItem = (index) => {
    updateFormData({
      menuItems: formData.menuItems.filter((_, i) => i !== index)
    });
  };

  const getItemsByCategory = (category) => {
    return formData.menuItems.filter(item => item.category === category);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Utensils className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Set Up Your Menu</h2>
        <p className="text-slate-600 mt-2">Add items manually, import from a restaurant website, or let AI generate items</p>
        
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            size="lg"
            className="border-2"
          >
            <Download className="w-5 h-5 mr-2" />
            Import from URL
          </Button>
          <Button
            onClick={generateMenuItems}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI is crafting your menu...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Menu with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {showAiSuggestions && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>AI menu items added!</strong> Review them below and adjust as needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Item Form */}
      <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Menu Item
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Margherita Pizza"
                className="mt-1 bg-white"
              />
            </div>

            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                placeholder="12.99"
                step="0.01"
                min="0"
                className="mt-1 bg-white"
              />
            </div>

            <div>
              <Label>Category</Label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Image</Label>
              <div className="mt-1">
                {newItem.image_url ? (
                  <div className="flex items-center gap-2">
                    <img src={newItem.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewItem({ ...newItem, image_url: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="px-3 py-2 border rounded-lg bg-white text-sm text-slate-500 hover:border-emerald-400">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload image
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Fresh tomatoes, mozzarella, basil..."
                className="mt-1 bg-white"
              />
            </div>
          </div>

          <Button
            onClick={addItem}
            disabled={!newItem.name || !newItem.price}
            className="mt-4 bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Menu Items List */}
      {formData.menuItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">
            Your Menu ({formData.menuItems.length} items)
          </h3>

          {CATEGORIES.map(category => {
            const items = getItemsByCategory(category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const globalIndex = formData.menuItems.findIndex(i => i === item);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-sm text-slate-500">{item.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(globalIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formData.menuItems.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No menu items added yet</p>
          <p className="text-sm">Add at least a few items to help customers discover your food</p>
        </div>
      )}

      <MenuImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        restaurantId={null}
        onSuccess={(data) => {
          if (data.items) {
            updateFormData({
              menuItems: [...formData.menuItems, ...data.items]
            });
            alert(`✅ Successfully imported ${data.items.length} menu items!`);
          }
        }}
      />
    </div>
  );
}